from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, InventoryItem
from datetime import datetime

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/inventory', methods=['GET'])
@jwt_required()
def get_inventory():
    """Fetch all inventory items."""
    items = InventoryItem.query.all()
    
    results = []
    for item in items:
        results.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "lot_number": item.lot_number,
            "quantity": item.quantity,
            "unit": item.unit,
            "expiration_date": item.expiration_date.strftime("%Y-%m-%d"),
            "status": item.status,
            "added_by": item.added_by.username if item.added_by else "Unknown"
        })
        
    return jsonify(results), 200

@inventory_bp.route('/inventory', methods=['POST'])
@jwt_required()
def add_inventory():
    """Receive new reagents or consumables into the warehouse."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Basic validation
    required_fields = ['name', 'category', 'lot_number', 'quantity', 'unit', 'expiration_date']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        new_item = InventoryItem(
            name=data['name'],
            category=data['category'],
            lot_number=data['lot_number'],
            quantity=int(data['quantity']),
            unit=data['unit'],
            expiration_date=datetime.strptime(data['expiration_date'], "%Y-%m-%d").date(),
            status=data.get('status', 'Quarantine'), # By default, new GMP items often start in Quarantine
            added_by_id=current_user_id
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        return jsonify({"message": "Inventory logged successfully!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to add inventory item."}), 500