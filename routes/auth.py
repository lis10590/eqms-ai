from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    access_token = create_access_token(
        identity=str(user.id), 
        additional_claims={"role": user.role}
    )
    
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "role": user.role
    }), 200

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register_user():
    claims = get_jwt()
    
    if claims.get("role") != 'admin':
        return jsonify({"error": "Admin privileges required"}), 403

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'qa_user') 

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    new_user = User(username=username, role=role)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": f"User '{username}' created successfully"}), 201