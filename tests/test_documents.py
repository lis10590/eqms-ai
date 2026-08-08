import io
from models import db, User, Document, DocumentVersion

def test_upload_sop_success(client, monkeypatch):
    """
    Protocol: Verify an authenticated user can upload a new Document PDF.
    Mocks AWS S3 to prevent live network calls during testing.
    """
    # 1. ARRANGE: Create user and log in
    user = User(username="doc_control", role="qa_user")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()

    login_res = client.post('/login', json={"username": "doc_control", "password": "password123"})
    token = login_res.get_json()["access_token"]

    # Intercept the AWS S3 upload call so pytest doesn't hit live AWS
    import routes.documents as docs_module
    monkeypatch.setattr(
        docs_module.s3_client, 
        "upload_fileobj", 
        lambda Fileobj, Bucket, Key, ExtraArgs=None: None
    )

    # Create a simulated PDF file in memory
    fake_pdf = (io.BytesIO(b"%PDF-1.4 fake pdf binary data"), "test_gowning_sop.pdf")

    # The new payload requires document_number
    payload = {
        "document_number": "SOP-001",
        "title": "Cleanroom Gowning Procedure",
        "version": "v1.0",
        "file": fake_pdf
    }

    # 2. ACT: Send a multipart/form-data POST request
    response = client.post(
        '/upload_sop',
        data=payload,
        headers={"Authorization": f"Bearer {token}"},
        content_type='multipart/form-data'
    )

    # 3. ASSERT: Check API response
    assert response.status_code == 201
    res_data = response.get_json()
    assert "successfully" in res_data["message"]
    assert res_data["document_number"] == "SOP-001"
    assert res_data["version"] == "v1.0"

    # 4. ASSERT: Verify Parent Document saved in PostgreSQL
    doc = db.session.query(Document).filter_by(document_number="SOP-001").first()
    assert doc is not None
    assert doc.title == "Cleanroom Gowning Procedure"

    # 5. ASSERT: Verify Child DocumentVersion saved and set to Draft
    doc_version = db.session.query(DocumentVersion).filter_by(document_id=doc.id).first()
    assert doc_version is not None
    assert doc_version.version_number == "v1.0"
    assert doc_version.status == "Draft"

def test_approve_document_lifecycle(client):
    """
    Protocol: Verify approving a draft authorizes it and obsoletes the older version.
    """
    # 1. ARRANGE: Create user, document, and two versions
    user = User(username="manager", role="qa_manager")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()

    login_res = client.post('/login', json={"username": "manager", "password": "password123"})
    token = login_res.get_json()["access_token"]

    doc = Document(document_number="SOP-002", title="Equipment Calibration")
    db.session.add(doc)
    db.session.commit()

    # Create v1.0 (Currently Authorized)
    v1 = DocumentVersion(version_number="v1.0", file_key="sops/fake1.pdf", status="Authorized", document_id=doc.id, uploader_id=user.id)
    # Create v2.0 (New Draft waiting for approval)
    v2 = DocumentVersion(version_number="v2.0", file_key="sops/fake2.pdf", status="Draft", document_id=doc.id, uploader_id=user.id)
    
    db.session.add_all([v1, v2])
    db.session.commit()

    # 2. ACT: Approve v2.0
    response = client.put(
        f'/approve_document/{v2.id}',
        headers={"Authorization": f"Bearer {token}"}
    )

    # 3. ASSERT: Check response and database state
    assert response.status_code == 200
    
    # Refresh objects from database
    db.session.refresh(v1)
    db.session.refresh(v2)
    
    assert v2.status == "Authorized"
    assert v1.status == "Obsolete"


def test_view_document_url(client, monkeypatch):
    """
    Protocol: Verify the system generates a secure presigned AWS URL.
    """
    # 1. ARRANGE
    user = User(username="viewer", role="qa_user")
    user.set_password("pass")
    db.session.add(user)
    db.session.commit()

    token = client.post('/login', json={"username": "viewer", "password": "pass"}).get_json()["access_token"]

    doc = Document(document_number="SOP-003", title="Lab Safety")
    db.session.add(doc)
    db.session.commit()

    v1 = DocumentVersion(version_number="v1.0", file_key="sops/safety.pdf", status="Authorized", document_id=doc.id, uploader_id=user.id)
    db.session.add(v1)
    db.session.commit()

    # Mock AWS boto3 presigned URL generation
    import routes.documents as docs_module
    monkeypatch.setattr(
        docs_module.s3_client, 
        "generate_presigned_url", 
        lambda ClientMethod, Params, ExpiresIn: "https://mock-aws-secure-link.com/safety.pdf"
    )

    # 2. ACT
    response = client.get(
        f'/view_document/{v1.id}',
        headers={"Authorization": f"Bearer {token}"}
    )

    # 3. ASSERT
    assert response.status_code == 200
    assert response.get_json()["url"] == "https://mock-aws-secure-link.com/safety.pdf"


def test_get_documents_list(client):
    """
    Protocol: Verify the system fetches documents and filters correctly by status.
    """
    # 1. ARRANGE
    user = User(username="list_tester", role="qa_user")
    user.set_password("pass")
    db.session.add(user)
    db.session.commit()

    token = client.post('/login', json={"username": "list_tester", "password": "pass"}).get_json()["access_token"]

    doc = Document(document_number="SOP-004", title="Data Integrity")
    db.session.add(doc)
    db.session.commit()

    v1 = DocumentVersion(version_number="v1.0", file_key="sops/data1.pdf", status="Obsolete", document_id=doc.id, uploader_id=user.id)
    v2 = DocumentVersion(version_number="v2.0", file_key="sops/data2.pdf", status="Authorized", document_id=doc.id, uploader_id=user.id)
    db.session.add_all([v1, v2])
    db.session.commit()

    # 2. ACT: Get all Authorized documents
    response = client.get(
        '/documents?status=Authorized',
        headers={"Authorization": f"Bearer {token}"}
    )

    # 3. ASSERT
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["status"] == "Authorized"
    assert data[0]["version"] == "v2.0"