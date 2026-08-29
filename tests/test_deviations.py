import pytest
from unittest.mock import patch, MagicMock
from models import db, Deviation, User

@patch('routes.deviations.assess_deviation')
def test_assess_deviation_route(mock_assess, client, qa_token, app):
    # Mock the AI returning a structured FMEA assessment
    mock_ai_data = MagicMock()
    mock_ai_data.Root_Cause_Category = "Human Error"
    mock_ai_data.Required_Action = "Retraining"
    mock_ai_data.RPN = 15
    mock_ai_data.QA_Narrative_Summary = "Operator error during gowning."
    mock_assess.return_value = mock_ai_data

    with app.app_context():
        user = User(username='qa_submitter', role='qa_user')
        user.set_password('dummy_password')
        db.session.add(user)
        db.session.commit()
        submitter_id = user.id

    response = client.post('/assess_deviation', 
        headers={'Authorization': f'Bearer {qa_token}'},
        json={
            'submitter_id': submitter_id,
            'deviation_text': 'Torn glove noticed after 5 minutes.'
        }
    )
    
    assert response.status_code == 201
    assert response.get_json()['assessment']['rpn'] == 15
    assert response.get_json()['assessment']['root_cause_category'] == "Human Error"

def test_close_deviation(client, qa_token, app):
    with app.app_context():
        dev = Deviation(submitter_id=1, original_deviation_text="Test dev", status="Open")
        db.session.add(dev)
        db.session.commit()
        dev_id = dev.id

    response = client.put(f'/deviations/{dev_id}/close', headers={'Authorization': f'Bearer {qa_token}'})
    
    assert response.status_code == 200
    assert response.get_json()['message'] == "Deviation marked as completed."

@patch('routes.deviations.generate_ai_investigation')
def test_trigger_ai_investigation(mock_ai_investigation, client, qa_token, app):
    # Mock the AI 5-Whys generator
    mock_result = MagicMock()
    mock_result.Five_Whys = ["Why 1", "Why 2"]
    mock_result.Root_Cause_Analysis = "Systemic failure."
    mock_result.CAPA_Summary = "Update SOP."
    mock_ai_investigation.return_value = mock_result

    with app.app_context():
        dev = Deviation(submitter_id=1, original_deviation_text="Test dev", status="Under Investigation")
        db.session.add(dev)
        db.session.commit()
        dev_id = dev.id

    response = client.post(f'/deviations/{dev_id}/ai_investigate', headers={'Authorization': f'Bearer {qa_token}'})
    
    assert response.status_code == 200
    assert "Systemic failure" in response.get_json()['root_cause']