from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Equipment
from datetime import datetime

equipment_bp = Blueprint('equipment', __name__)

@equipment_bp.route('/equipment', methods=['GET'])
@jwt_required()
def get_all_equipment():
    """Fetch all equipment and return their calibration status."""
    equipments = Equipment.query.all()
    
    results = []
    for eq in equipments:
        results.append({
            "id": eq.id,
            "name": eq.name,
            "serial_number": eq.serial_number,
            "location": eq.location,
            "last_calibration_date": eq.last_calibration_date.strftime("%Y-%m-%d"),
            "next_calibration_date": eq.next_calibration_date.strftime("%Y-%m-%d"),
            "status": eq.status,
            "added_by": eq.added_by.username if eq.added_by else "Unknown"
        })
        
    return jsonify(results), 200

@equipment_bp.route('/equipment', methods=['POST'])
@jwt_required()
def add_equipment():
    """Add a new piece of equipment to the calibration list."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('name') or not data.get('serial_number') or not data.get('last_calibration_date') or not data.get('next_calibration_date'):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        new_eq = Equipment(
            name=data['name'],
            serial_number=data['serial_number'],
            location=data.get('location', 'General Lab'),
            last_calibration_date=datetime.strptime(data['last_calibration_date'], "%Y-%m-%d").date(),
            next_calibration_date=datetime.strptime(data['next_calibration_date'], "%Y-%m-%d").date(),
            status='Active',
            added_by_id=current_user_id
        )
        
        db.session.add(new_eq)
        db.session.commit()
        
        return jsonify({"message": "Equipment added successfully!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to add equipment. Serial number might already exist."}), 500