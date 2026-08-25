import os
import boto3
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, TrainingRecord, User, Document, DocumentVersion

trainings_bp = Blueprint('trainings', __name__)

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

# --- NEW: Get Current User Info for the Frontend ---
@trainings_bp.route('/trainings/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = db.get_or_404(User, user_id)
    return jsonify({"id": user.id, "role": user.role, "name": user.username}), 200

@trainings_bp.route('/trainings/users', methods=['GET'])
@jwt_required()
def get_users_for_training():
    users = User.query.all()
    result = [{"id": u.id, "name": u.username} for u in users] 
    return jsonify(result), 200

@trainings_bp.route('/trainings', methods=['POST'])
@jwt_required()
def log_training():
    current_user_id = get_jwt_identity()
    user = db.get_or_404(User, current_user_id)
    
    # ENFORCE ROLE RESTRICTION
    if user.role not in ['admin', 'qa_user']:
        return jsonify({"error": "Only Admins and QA can assign training."}), 403

    data = request.get_json()
    try:
        new_training = TrainingRecord(
            employee_id=data.get('employee_id'),
            training_type=data.get('training_type'),
            title=data.get('title'),
            status='Open', # Default is ALWAYS Open
            document_id=data.get('document_id'),
            classroom_date=data.get('classroom_date'),
            classroom_time=data.get('classroom_time'),
            trainer_name=data.get('trainer_name'),
            ojt_effectiveness=data.get('ojt_effectiveness')
        )
        db.session.add(new_training)
        db.session.commit()
        return jsonify({"message": "Training assigned successfully", "id": new_training.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to assign training"}), 500

@trainings_bp.route('/trainings', methods=['GET'])
@jwt_required()
def get_trainings():
    current_user_id = get_jwt_identity()
    user = db.get_or_404(User, current_user_id)
    
    if user.role in ['qa_user', 'admin']: 
        trainings = TrainingRecord.query.order_by(TrainingRecord.id.desc()).all()
    else:
        trainings = TrainingRecord.query.filter_by(employee_id=current_user_id).order_by(TrainingRecord.id.desc()).all()
        
    result = []
    for t in trainings:
        result.append({
            "id": t.id,
            "employee_id": t.employee_id,
            "employee_name": t.employee.username if t.employee else "Unknown User", 
            "training_type": t.training_type,
            "title": t.title,
            "status": t.status,
            "document_id": getattr(t, 'document_id', ''),
            "classroom_date": getattr(t, 'classroom_date', ''),
            "classroom_time": getattr(t, 'classroom_time', ''),
            "trainer_name": getattr(t, 'trainer_name', ''),
            "ojt_effectiveness": getattr(t, 'ojt_effectiveness', ''),
            "manual_approval_justification": getattr(t, 'manual_approval_justification', ''),
            "created_at": t.created_at.strftime('%Y-%m-%d') if t.created_at else "N/A"
        })
    return jsonify(result), 200

@trainings_bp.route('/trainings/<int:id>', methods=['PUT'])
@jwt_required()
def update_training(id):
    training = TrainingRecord.query.get_or_404(id)
    data = request.get_json()

    if 'status' in data:
        training.status = data['status']
    if 'document_id' in data:
        training.document_id = data['document_id']
    if 'classroom_date' in data:
        training.classroom_date = data['classroom_date']
    if 'classroom_time' in data:
        training.classroom_time = data['classroom_time']
    if 'trainer_name' in data:
        training.trainer_name = data['trainer_name']
    if 'ojt_effectiveness' in data:
        training.ojt_effectiveness = data['ojt_effectiveness']
    if 'manual_approval_justification' in data:
        training.manual_approval_justification = data['manual_approval_justification']

    db.session.commit()
    return jsonify({"message": "Training updated successfully"}), 200

@trainings_bp.route('/trainings/view_sop/<string:document_number>', methods=['GET'])
@jwt_required()
def view_sop_by_number(document_number):
    doc = Document.query.filter_by(document_number=document_number).first()
    if not doc:
        return jsonify({"error": f"Document {document_number} not found in the system."}), 404
        
    authorized_version = DocumentVersion.query.filter_by(document_id=doc.id, status='Authorized').first()
    if not authorized_version:
        return jsonify({"error": "No authorized version available for this SOP."}), 404

    try:
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': os.getenv('AWS_S3_BUCKET_NAME'), 'Key': authorized_version.file_key},
            ExpiresIn=3600
        )
        return jsonify({"url": presigned_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500