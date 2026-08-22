import os
import boto3
import uuid
import PyPDF2
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, Document, DocumentVersion, User
from ai_engine import ask_sop_bot # Make sure this is imported!

documents_bp = Blueprint('documents', __name__)

# Set up the AWS connection
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

@documents_bp.route('/upload_sop', methods=['POST'])
@jwt_required()
def upload_sop():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Extract metadata sent from the frontend
    document_number = request.form.get('document_number') # e.g., SOP-001
    title = request.form.get('title')
    version = request.form.get('version')
    reviewer_id = request.form.get('reviewer_id')
    
    if not document_number or not version:
        return jsonify({"error": "Document number and version are required"}), 400

    try:
        # --- 1. EXTRACT TEXT FOR AI PARSING ---
        file.seek(0)
        pdf_reader = PyPDF2.PdfReader(file)
        parsed_content = {}
        for page_num in range(len(pdf_reader.pages)):
            page_text = pdf_reader.pages[page_num].extract_text()
            if page_text:
                parsed_content[str(page_num + 1)] = page_text
        
        # Reset the file pointer so it can be uploaded to S3!
        file.seek(0)

        # --- 2. UPLOAD TO AWS S3 ---
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

        current_user_id = get_jwt_identity()

        # --- 3. DATABASE SAVING ---
        doc = Document.query.filter_by(document_number=document_number).first()
        
        if not doc:
            if not title:
                return jsonify({"error": "Title is required for a completely new document"}), 400
            doc = Document(document_number=document_number, title=title)
            db.session.add(doc)
            db.session.flush() 

        new_version = DocumentVersion(
            version_number=version,
            file_key=s3_key,
            status='Draft', 
            document_id=doc.id,
            uploader_id=current_user_id,
            reviewer_id=reviewer_id,
            parsed_content=parsed_content # <-- SAVING THE EXTRACTED TEXT HERE!
        )
        
        db.session.add(new_version)
        db.session.commit()

        return jsonify({
            "message": "Document uploaded and parsed successfully.", 
            "document_number": doc.document_number,
            "version": new_version.version_number
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Upload Error: {e}")
        return jsonify({"error": "An error occurred during upload."}), 500


@documents_bp.route('/view_document/<int:version_id>', methods=['GET'])
@jwt_required()
def view_document(version_id):
    """Generates a temporary, secure link to view the PDF."""
    version = db.get_or_404(DocumentVersion, version_id)
    
    try:
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': os.getenv('AWS_S3_BUCKET_NAME'),
                'Key': version.file_key
            },
            ExpiresIn=3600
        )
        return jsonify({"url": presigned_url}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@documents_bp.route('/approve_document/<int:version_id>', methods=['PUT'])
@jwt_required()
def approve_document(version_id):
    """Approves a draft and obsoletes the previous version."""
    version_to_approve = db.get_or_404(DocumentVersion, version_id)
    
    if version_to_approve.status == 'Authorized':
        return jsonify({"message": "Document is already authorized"}), 400

    try:
        doc_id = version_to_approve.document_id
        
        old_authorized_versions = DocumentVersion.query.filter_by(
            document_id=doc_id, 
            status='Authorized'
        ).all()
        
        for old_ver in old_authorized_versions:
            old_ver.status = 'Obsolete'
        
        version_to_approve.status = 'Authorized'
        
        db.session.commit()
        
        return jsonify({
            "message": f"Version {version_to_approve.version_number} authorized successfully",
            "document_id": doc_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@documents_bp.route('/documents', methods=['GET'])
@jwt_required()
def get_documents():
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
    """Fetches a list of users who can be assigned as reviewers."""
    reviewers = User.query.all() 
    results = [{"id": r.id, "username": r.username} for r in reviewers]
    return jsonify(results), 200


# ==========================================
# NEW: AI CHAT ENDPOINT
# ==========================================
@documents_bp.route('/sops/<int:version_id>/chat', methods=['POST'])
@jwt_required()
def chat_with_sop(version_id):
    # Retrieve the specific document version
    doc_version = db.get_or_404(DocumentVersion, version_id)
    
    data = request.get_json()
    question = data.get('question')

    if not question:
        return jsonify({"error": "Question is required."}), 400
        
    # Safety check in case they click "Ask AI" on an old document uploaded before we added this feature
    if not doc_version.parsed_content:
        return jsonify({"error": "This document was uploaded before AI parsing was enabled. Please re-upload it."}), 400

    # Pass the stored JSON text directly to Gemini
    ai_response = ask_sop_bot(doc_version.parsed_content, question)

    if not ai_response:
        return jsonify({"error": "AI failed to respond."}), 500

    return jsonify({"answer": ai_response}), 200