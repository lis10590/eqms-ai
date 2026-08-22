from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, SOPDocument
from ai_engine import ask_sop_bot
import PyPDF2
import io
# import boto3 # Uncomment when you are ready to plug in your AWS credentials

sop_bp = Blueprint('sops', __name__)

@sop_bp.route('/sops/upload', methods=['POST'])
@jwt_required()
def upload_sop():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    title = request.form.get('title', file.filename)
    version = request.form.get('version', '1.0')

    # 1. OPTIONAL: Upload to AWS S3 here
    # s3 = boto3.client('s3', aws_access_key_id='...', aws_secret_access_key='...')
    # s3.upload_fileobj(file, 'your-bucket-name', file.filename)
    # s3_url = f"https://your-bucket-name.s3.amazonaws.com/{file.filename}"
    s3_url = "s3_placeholder_url"

    # 2. Extract Text Page-by-Page
    file.seek(0)
    pdf_reader = PyPDF2.PdfReader(file)
    parsed_content = {}
    
    for page_num in range(len(pdf_reader.pages)):
        page_text = pdf_reader.pages[page_num].extract_text()
        parsed_content[str(page_num + 1)] = page_text # Store as Page 1, Page 2, etc.

    # 3. Save to Database
    new_sop = SOPDocument(
        title=title,
        version=version,
        s3_url=s3_url,
        parsed_content=parsed_content
    )
    db.session.add(new_sop)
    db.session.commit()

    return jsonify({"message": "SOP Uploaded & Processed", "id": new_sop.id}), 201


@sop_bp.route('/sops/<int:sop_id>/chat', methods=['POST'])
@jwt_required()
def chat_with_sop(sop_id):
    sop = SOPDocument.query.get_or_404(sop_id)
    data = request.get_json()
    question = data.get('question')

    if not question:
        return jsonify({"error": "Question is required."}), 400

    # Pass the stored JSON text directly to Gemini
    ai_response = ask_sop_bot(sop.parsed_content, question)

    if not ai_response:
        return jsonify({"error": "AI failed to respond."}), 500

    return jsonify({"answer": ai_response}), 200