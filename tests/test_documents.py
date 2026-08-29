import pytest
from unittest.mock import patch, MagicMock
from io import BytesIO
from models import db, Document, DocumentVersion

def test_create_document_shell(client, qa_token, app):
    response = client.post('/documents/create', 
        headers={'Authorization': f'Bearer {qa_token}'},
        json={'title': 'New Bioreactor SOP'}
    )
    
    assert response.status_code == 201
    assert response.get_json()['document_number'] == "SOP-0001"

@patch('routes.documents.s3_client.upload_fileobj')
@patch('routes.documents.PyPDF2.PdfReader')
def test_add_revision(mock_pdf_reader, mock_s3_upload, client, qa_token, app):
    # Mock PDF extraction
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Mock SOP Content"
    mock_pdf = MagicMock()
    mock_pdf.pages = [mock_page]
    mock_pdf_reader.return_value = mock_pdf
    
    with app.app_context():
        doc = Document(document_number='SOP-0001', title='Test SOP')
        db.session.add(doc)
        db.session.commit()
        doc_id = doc.id

    # Create a dummy file in memory
    data = {
        'file': (BytesIO(b"dummy pdf content"), 'test.pdf'),
        'version': '1.0',
        'change_reason': 'Initial draft'
    }

    response = client.post(f'/documents/{doc_id}/revisions', 
        headers={'Authorization': f'Bearer {qa_token}'},
        data=data,
        content_type='multipart/form-data'
    )
    
    assert response.status_code == 201
    assert mock_s3_upload.called
    assert mock_pdf_reader.called

def test_approve_document(client, admin_token, app):
    with app.app_context():
        doc = Document(document_number='SOP-0001', title='Test')
        db.session.add(doc)
        db.session.flush()
        version = DocumentVersion(version_number='1.0', file_key='test.pdf', status='Draft', document_id=doc.id, uploader_id=1)
        db.session.add(version)
        db.session.commit()
        ver_id = version.id

    response = client.put(f'/approve_document/{ver_id}', headers={'Authorization': f'Bearer {admin_token}'})
    
    assert response.status_code == 200
    assert "authorized successfully" in response.get_json()['message']