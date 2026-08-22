from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, TrainingRecord, User 

trainings_bp = Blueprint('trainings', __name__)

@trainings_bp.route('/trainings/users', methods=['GET'])
@jwt_required()
def get_users_for_training():
    users = User.query.all()
    result = [{"id": u.id, "name": u.username} for u in users] 
    return jsonify(result), 200

@trainings_bp.route('/trainings', methods=['POST'])
@jwt_required()
def log_training():
    data = request.get_json()
    try:
        new_training = TrainingRecord(
            employee_id=data.get('employee_id'),
            training_type=data.get('training_type'),
            title=data.get('title'),
            status='Open', # ALWAYS starts as Open now
            
            document_id=data.get('document_id'),
            classroom_date=data.get('classroom_date'),
            classroom_time=data.get('classroom_time'),
            trainer_name=data.get('trainer_name'),
            ojt_effectiveness=data.get('ojt_effectiveness')
        )
        db.session.add(new_training)
        db.session.commit()
        return jsonify({"message": "Training logged successfully", "id": new_training.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to log training"}), 500

@trainings_bp.route('/trainings', methods=['GET'])
@jwt_required()
def get_trainings():
    trainings = TrainingRecord.query.order_by(TrainingRecord.id.desc()).all()
    result = []
    for t in trainings:
        result.append({
            "id": t.id,
            "employee_id": t.employee_id,
            "employee_name": t.employee.username if t.employee else "Unknown User", 
            "training_type": t.training_type,
            "title": t.title,
            "status": t.status,
            
            # Additional details needed for the modal
            "document_id": getattr(t, 'document_id', ''),
            "classroom_date": getattr(t, 'classroom_date', ''),
            "classroom_time": getattr(t, 'classroom_time', ''),
            "trainer_name": getattr(t, 'trainer_name', ''),
            "ojt_effectiveness": getattr(t, 'ojt_effectiveness', ''),
            
            "created_at": t.created_at.strftime('%Y-%m-%d') if t.created_at else "N/A"
        })
    return jsonify(result), 200

# --- NEW: UPDATE ROUTE FOR THE MODAL ---
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

    db.session.commit()
    return jsonify({"message": "Training updated successfully"}), 200