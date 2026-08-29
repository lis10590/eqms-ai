import pytest
from unittest.mock import patch
from models import db, TrainingRecord, User, Document, DocumentVersion

def test_assign_training_as_admin(client, admin_token, app):
    with app.app_context():
        employee = User(username='employee1', role='operator')
        employee.set_password('dummy_password')
        db.session.add(employee)
        db.session.commit()
        emp_id = employee.id

    response = client.post('/trainings', 
        headers={'Authorization': f'Bearer {admin_token}'},
        json={
            'employee_id': emp_id,
            'training_type': 'Self-Reading',
            'title': 'Gowning SOP',
            'document_id': 'SOP-001'
        }
    )
    assert response.status_code == 201
    assert response.get_json()['message'] == "Training assigned successfully"

@patch('routes.trainings.s3_client.generate_presigned_url')
def test_view_sop_by_number(mock_s3, client, qa_token, app):
    # Setup mock S3 response
    mock_s3.return_value = "https://mock-aws-s3-url.com/file.pdf"
    
    with app.app_context():
        doc = Document(document_number='SOP-999', title='Test SOP')
        db.session.add(doc)
        db.session.flush()
        version = DocumentVersion(version_number='1.0', file_key='test.pdf', status='Authorized', document_id=doc.id, uploader_id=1)
        db.session.add(version)
        db.session.commit()

    response = client.get('/trainings/view_sop/SOP-999', headers={'Authorization': f'Bearer {qa_token}'})
    
    assert response.status_code == 200
    assert response.get_json()['url'] == "https://mock-aws-s3-url.com/file.pdf"

@patch('routes.trainings.generate_sop_quiz')
def test_get_or_create_quiz(mock_ai_quiz, client, qa_token, app):
    # Setup mock AI response
    mock_ai_quiz.return_value = [
        {"question": "Test Q", "options": ["A", "B"], "correct_index": 0, "explanation": "Test"}
    ]
    
    with app.app_context():
        doc = Document(document_number='SOP-888', title='AI SOP')
        db.session.add(doc)
        db.session.flush()
        version = DocumentVersion(version_number='1.0', file_key='test.pdf', status='Authorized', document_id=doc.id, uploader_id=1, parsed_content={"1": "Text"})
        db.session.add(version)
        
        training = TrainingRecord(employee_id=1, training_type='Self-Reading', title='Test', document_id='SOP-888')
        db.session.add(training)
        db.session.commit()
        training_id = training.id

    response = client.get(f'/trainings/{training_id}/quiz', headers={'Authorization': f'Bearer {qa_token}'})
    
    assert response.status_code == 200
    assert len(response.get_json()['questions']) == 1