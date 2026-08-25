import os
import boto3
import uuid
import PyPDF2
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, Document, DocumentVersion, User
from ai_engine import ask_sop_bot 

documents_bp = Blueprint('documents', __name__)

# Set up the AWS connection
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

# ==========================================
# 1. CREATE DOCUMENT SHELL (AUTO-NUMBERING)
# ==========================================
@documents_bp.route('/documents/create', methods=['POST'])
@jwt_required()
def create_document_shell():
    """Creates the Document Shell and auto-generates the SOP number."""
    data = request.get_json()
    title = data.get('title')
    
    if not title:
        return jsonify({"error": "Title is required"}), 400

    try:
        # Auto-numbering logic: Find highest SOP-XXXX and add 1
        last_doc = Document.query.filter(Document.document_number.ilike('SOP-%')).order_by(Document.document_number.desc()).first()
        
        if last_doc and '-' in last_doc.document_number:
            try:
                last_num = int(last_doc.document_number.split('-')[1])
                new_num = last_num + 1
            except ValueError:
                new_num = 1
        else:
            new_num = 1
            
        document_number = f"SOP-{new_num:04d}" 
        
        new_doc = Document(document_number=document_number, title=title)
        db.session.add(new_doc)
        db.session.commit()

        return jsonify({
            "message": "Document created", 
            "document_id": new_doc.id, 
            "document_number": new_doc.document_number,
            "title": new_doc.title
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==========================================
# 2. UPLOAD REVISION & EXTRACT AI TEXT
# ==========================================
@documents_bp.route('/documents/<int:document_id>/revisions', methods=['POST'])
@jwt_required()
def add_revision(document_id):
    """Uploads the PDF, extracts text, and creates a new Version (Revision)."""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    doc = db.get_or_404(Document, document_id)
    file = request.files['file']
    
    version = request.form.get('version', '1.0')
    reviewer_id = request.form.get('reviewer_id')
    change_reason = request.form.get('change_reason')

    try:
        # Extract Text for AI parsing
        file.seek(0)
        pdf_reader = PyPDF2.PdfReader(file)
        parsed_content = {}
        for page_num in range(len(pdf_reader.pages)):
            page_text = pdf_reader.pages[page_num].extract_text()
            if page_text:
                parsed_content[str(page_num + 1)] = page_text
        file.seek(0) # Reset file pointer for S3 upload

        # Upload to AWS S3
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = secure_filename(file.filename)
        s3_key = f"sops/{unique_id}_{safe_filename}"
        
        bucket_name = os.getenv('AWS_S3_BUCKET_NAME')
        s3_client.upload_fileobj(
            file, 
            bucket_name, 
            s3_key, 
            ExtraArgs={"ContentType": file.content_type}
        )

        # Save Revision to Database
        new_version = DocumentVersion(
            version_number=version,
            file_key=s3_key,
            status='Draft', 
            document_id=doc.id,
            uploader_id=get_jwt_identity(),
            reviewer_id=reviewer_id,
            change_reason=change_reason,
            parsed_content=parsed_content
        )
        
        db.session.add(new_version)
        db.session.commit()

        return jsonify({"message": "Revision added successfully"}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Revision Upload Error: {e}")
        return jsonify({"error": "An error occurred during upload."}), 500


# ==========================================
# 3. FETCH DOCUMENT HISTORY
# ==========================================
@documents_bp.route('/documents/<int:document_id>/revisions', methods=['GET'])
@jwt_required()
def get_document_history(document_id):
    """Fetches all past revisions for a specific document."""
    versions = DocumentVersion.query.filter_by(document_id=document_id).order_by(DocumentVersion.id.desc()).all()
    results = [{
        "version_id": v.id,
        "version": v.version_number,
        "status": v.status,
        "change_reason": v.change_reason,
        "uploaded_at": v.uploaded_at.strftime("%Y-%m-%d %H:%M") if v.uploaded_at else "N/A",
        "uploader": v.uploader.username if v.uploader else "Unknown"
    } for v in versions]
    return jsonify(results), 200


# ==========================================
# 4. VIEW & APPROVE LOGIC
# ==========================================
@documents_bp.route('/view_document/<int:version_id>', methods=['GET'])
@jwt_required()
def view_document(version_id):
    """Generates a temporary, secure link to view the PDF."""
    version = db.get_or_404(DocumentVersion, version_id)
    try:
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': os.getenv('AWS_S3_BUCKET_NAME'), 'Key': version.file_key},
            ExpiresIn=3600
        )
        return jsonify({"url": presigned_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@documents_bp.route('/approve_document/<int:version_id>', methods=['PUT'])
@jwt_required()
def approve_document(version_id):
    """Approves a draft and obsoletes the previous authorized version."""
    version_to_approve = db.get_or_404(DocumentVersion, version_id)
    
    if version_to_approve.status == 'Authorized':
        return jsonify({"message": "Document is already authorized"}), 400

    try:
        doc_id = version_to_approve.document_id
        old_authorized_versions = DocumentVersion.query.filter_by(document_id=doc_id, status='Authorized').all()
        
        for old_ver in old_authorized_versions:
            old_ver.status = 'Obsolete'
        
        version_to_approve.status = 'Authorized'
        db.session.commit()
        
        return jsonify({"message": f"Version {version_to_approve.version_number} authorized successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==========================================
# 5. FETCH DASHBOARD DOCUMENTS
# ==========================================
@documents_bp.route('/documents', methods=['GET'])
@jwt_required()
def get_documents():
    """Fetches the latest relevant versions for the dashboard view."""
    current_user_id = get_jwt_identity() 
    view_filter = request.args.get('view') 
    
    query = DocumentVersion.query
    
    if view_filter == 'my_reviews':
        query = query.filter_by(reviewer_id=current_user_id, status='Draft')
    elif view_filter == 'my_uploads':
        query = query.filter_by(uploader_id=current_user_id)
    else:
        query = query.filter_by(status='Authorized')
        
    versions = query.all()
    
    results = []
    for v in versions:
        results.append({
            "version_id": v.id,
            "parent_document_id": v.document_id, # CRITICAL: Required for editing history!
            "document_number": v.document.document_number,
            "title": v.document.title,
            "version": v.version_number,
            "status": v.status,
            "uploaded_at": v.uploaded_at.strftime("%Y-%m-%d %H:%M"),
            "reviewer": v.reviewer.username if v.reviewer else "Unassigned" 
        })
        
    return jsonify(results), 200


@documents_bp.route('/reviewers', methods=['GET'])
@jwt_required()
def get_reviewers():
    """Fetches a list of users for reviewer assignment."""
    reviewers = User.query.all() 
    results = [{"id": r.id, "username": r.username} for r in reviewers]
    return jsonify(results), 200


# ==========================================
# 6. AI COPILOT CHAT
# ==========================================
@documents_bp.route('/sops/<int:version_id>/chat', methods=['POST'])
@jwt_required()
def chat_with_sop(version_id):
    """Retrieves document text and prompts Gemini to answer the user's question."""
    doc_version = db.get_or_404(DocumentVersion, version_id)
    
    data = request.get_json()
    question = data.get('question')

    if not question:
        return jsonify({"error": "Question is required."}), 400
        
    if not doc_version.parsed_content:
        return jsonify({"error": "This document was uploaded before AI parsing was enabled. Please re-upload as a new revision."}), 400

    ai_response = ask_sop_bot(doc_version.parsed_content, question)

    if not ai_response:
        return jsonify({"error": "AI failed to respond."}), 500

    return jsonify({"answer": ai_response}), 200