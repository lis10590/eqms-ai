import pytest
from unittest.mock import patch, MagicMock
from io import BytesIO
from models import db, SOPDocument

@patch('routes.sop_chat.PyPDF2.PdfReader')
def test_upload_sop(mock_pdf_reader, client, qa_token, app):
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "This is a mock SOP page content."
    mock_pdf = MagicMock()
    mock_pdf.pages = [mock_page]
    mock_pdf_reader.return_value = mock_pdf

    data = {
        'file': (BytesIO(b"fake pdf content"), 'test_sop.pdf'),
        'title': 'Test Gowning SOP',
        'version': '1.0'
    }

    # UPDATED URL HERE
    response = client.post('/direct_sops/upload', 
        headers={'Authorization': f'Bearer {qa_token}'},
        data=data,
        content_type='multipart/form-data'
    )

    assert response.status_code == 201
    assert "SOP Uploaded & Processed" in response.get_json()['message']

@patch('routes.sop_chat.ask_sop_bot')
def test_chat_with_sop(mock_ask_sop_bot, client, qa_token, app):
    mock_ask_sop_bot.return_value = "You must scrub for a minimum of 60 seconds."

    with app.app_context():
        new_sop = SOPDocument(
            title='Test SOP',
            version='2.0',
            s3_url='mock_url',
            parsed_content={"1": "Scrub for 60 seconds."}
        )
        db.session.add(new_sop)
        db.session.commit()
        sop_id = new_sop.id

    # UPDATED URL HERE
    response = client.post(f'/direct_sops/{sop_id}/chat',
        headers={'Authorization': f'Bearer {qa_token}'},
        json={'question': 'How long do I scrub my hands?'}
    )

    assert response.status_code == 200
    assert response.get_json()['answer'] == "You must scrub for a minimum of 60 seconds."

def test_chat_missing_question(client, qa_token, app):
    with app.app_context():
        new_sop = SOPDocument(
            title='Test SOP 2',
            version='1.0',
            s3_url='mock_url',
            parsed_content={"1": "Content"}
        )
        db.session.add(new_sop)
        db.session.commit()
        sop_id = new_sop.id

    # UPDATED URL HERE
    response = client.post(f'/direct_sops/{sop_id}/chat',
        headers={'Authorization': f'Bearer {qa_token}'},
        json={}  
    )

    assert response.status_code == 400
    assert "Question is required" in response.get_json()['error']