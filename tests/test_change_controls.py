import pytest
from unittest.mock import patch, MagicMock
from models import db, ChangeControl, ChangeTask, User

@patch('routes.change_controls.assess_change_control')
def test_assess_change_route(mock_assess, client, qa_token):
    # Mock the AI returning a structured Pydantic model
    mock_ai_data = MagicMock()
    mock_ai_data.model_dump.return_value = {
        "Risk_Level": "Moderate",
        "Regulatory_Impact": "Update SOP required",
        "Recommended_Tasks": [{"Domain": "Quality", "Task_Description": "Revise SOP"}]
    }
    mock_assess.return_value = mock_ai_data

    response = client.post('/assess_change', 
        headers={'Authorization': f'Bearer {qa_token}'},
        json={
            'title': 'Update Centrifuge Speed',
            'current_state': '5000 RPM',
            'proposed_state': '6000 RPM',
            'justification': 'Faster processing'
        }
    )
    
    assert response.status_code == 200
    assert response.get_json()['assessment']['Risk_Level'] == "Moderate"

def test_create_change_control(client, admin_token, app):
    with app.app_context():
        user = User(username='initiator', role='qa_user')
        user.set_password('dummy')
        db.session.add(user)
        db.session.commit()
        initiator_id = user.id

    response = client.post('/change_controls', 
        headers={'Authorization': f'Bearer {admin_token}'},
        json={
            'initiator_id': initiator_id,
            'title': 'Test CC',
            'current_state': 'A',
            'proposed_state': 'B',
            'justification': 'Because',
            'classification': 'Major',
            'classification_rationale': 'AI said so',
            'tasks': [{'Domain': 'QA', 'Task_Description': 'Do QA stuff'}]
        }
    )
    assert response.status_code == 201
    assert "submitted successfully" in response.get_json()['message']

def test_update_change_control(client, qa_token, app):
    with app.app_context():
        cc = ChangeControl(
            initiator_id=1, title="Old Title", current_state="A", 
            proposed_state="B", justification="C", status="In Review"
        )
        db.session.add(cc)
        db.session.commit()
        cc_id = cc.id

    response = client.put(f'/change_controls/{cc_id}', 
        headers={'Authorization': f'Bearer {qa_token}'},
        json={'title': 'New Title'}
    )
    
    assert response.status_code == 200
    
    with app.app_context():
        updated_cc = ChangeControl.query.get(cc_id)
        assert updated_cc.title == 'New Title'