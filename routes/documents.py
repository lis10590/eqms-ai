import os
import boto3
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import uuid
from models import db, Document, DocumentVersion

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
    
    if not document_number or not version:
        return jsonify({"error": "Document number and version are required"}), 400

    try:
        # Create a unique file name for S3
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = secure_filename(file.filename)
        s3_key = f"sops/{unique_id}_{safe_filename}"
        
        bucket_name = os.getenv('AWS_S3_BUCKET_NAME')

        # Upload the physical file to AWS S3
        s3_client.upload_fileobj(
            file,
            bucket_name,
            s3_key,
            ExtraArgs={"ContentType": file.content_type}
        )

        current_user_id = get_jwt_identity()

        # 1. Check if the Parent Document already exists
        doc = Document.query.filter_by(document_number=document_number).first()
        
        # 2. If it is a brand new SOP, create the Parent record first
        if not doc:
            if not title:
                return jsonify({"error": "Title is required for a completely new document"}), 400
            doc = Document(document_number=document_number, title=title)
            db.session.add(doc)
            db.session.flush() # Flushes to DB to generate the doc.id without fully committing yet

        # 3. Create the Child DocumentVersion record
        new_version = DocumentVersion(
            version_number=version,
            file_key=s3_key,
            status='Draft', # All new uploads start in Draft status for review
            document_id=doc.id,
            uploader_id=current_user_id
        )
        
        db.session.add(new_version)
        db.session.commit()

        return jsonify({
            "message": "Document uploaded successfully and set to Draft", 
            "document_number": doc.document_number,
            "version": new_version.version_number
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@documents_bp.route('/view_document/<int:version_id>', methods=['GET'])
@jwt_required()
def view_document(version_id):
    """Generates a temporary, secure link to view the PDF."""
    version = db.get_or_404(DocumentVersion, version_id)
    
    try:
        # Generate a secure link that expires in 1 hour (3600 seconds)
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
        # 1. Find the parent document ID
        doc_id = version_to_approve.document_id
        
        # 2. Find any currently Authorized versions of this document and make them Obsolete
        old_authorized_versions = DocumentVersion.query.filter_by(
            document_id=doc_id, 
            status='Authorized'
        ).all()
        
        for old_ver in old_authorized_versions:
            old_ver.status = 'Obsolete'
        
        # 3. Authorize the new version
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
    """Fetches documents, filtered by status if provided."""
    status_filter = request.args.get('status') # e.g., ?status=Authorized
    
    query = DocumentVersion.query
    if status_filter:
        query = query.filter_by(status=status_filter)
        
    versions = query.all()
    
    results = []
    for v in versions:
        results.append({
            "version_id": v.id,
            "document_number": v.document.document_number,
            "title": v.document.title,
            "version": v.version_number,
            "status": v.status,
            "uploaded_at": v.uploaded_at.strftime("%Y-%m-%d %H:%M")
        })
        
    return jsonify(results), 200