import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from ai_engine import assess_deviation, assess_change_control
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity,get_jwt
import click

# --- Import db and Models from models.py ---
from models import db, User, Deviation, AuditLog, ChangeControl, ChangeTask

# --- Load Environment Variables ---
load_dotenv() # This reads the .env file and loads the variables into the system

app = Flask(__name__)
CORS(app)

# --- Database Configuration ---
db_password = os.getenv("DB_PASSWORD")
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://postgres:{db_password}@localhost/eqms_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Link db to the app and initialize Flask-Migrate
db.init_app(app)
migrate = Migrate(app, db)

# --- Initialize JWT ---
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback_secret")
jwt = JWTManager(app)

# --- CLI Command to Create Initial Admin ---
@app.cli.command("create-admin")
@click.argument("username")
@click.argument("password")
def create_admin(username, password):
    """Run `flask create-admin <username> <password>` to seed an admin."""
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        print(f"Error: User {username} already exists.")
        return

    # Create the admin user
    admin = User(username=username, role='admin')
    admin.set_password(password)
    
    db.session.add(admin)
    db.session.commit()
    print(f"Success! Admin '{username}' created successfully.")

# --- Initialize Gemini API ---
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- Pydantic Schema for Structured AI Output ---
class QAAiAssessment(BaseModel):
    root_cause_category: str = Field(description="Strictly one of: 'Human Error', 'Equipment Failure', 'Process Gap', or 'Material Defect'")
    recommended_action: str = Field(description="Strictly one of: 'Close', 'Investigate', or 'CAPA' based on RPN")
    rpn: int = Field(description="Risk Priority Number calculated (1-1000) based on Severity, Occurrence, and Detection")
    qa_narrative: str = Field(description="A formal 5 Whys root cause analysis narrative suitable for a quality record")

# --- Routes ---

@app.route('/assess_deviation', methods=['POST'])
@jwt_required()
def assess_deviation_route():
    data = request.get_json()
    
    submitter_id = data.get('submitter_id')
    deviation_text = data.get('deviation_text')

    if not submitter_id or not deviation_text:
        return jsonify({"error": "Missing submitter_id or deviation_text"}), 400

    try:
        # 1. Define FMEA Criteria 
        fmea_criteria = """
        Severity: 1=Negligible, 2=Minor, 3=Moderate, 4=Major (impacts product quality/viability), 5=Critical.
        Occurrence: 1=Rare, 2=Unlikely, 3=Possible (isolated incidents), 4=Likely, 5=Almost Certain.
        Detection: 1=Immediate, 2=Delayed but caught by secondary system, 3=Caught by manual check, 4=Poor, 5=Undetectable.
        """

        # 2. Call the AI Engine (from ai_engine.py)
        ai_data = assess_deviation(deviation_text, fmea_criteria)

        if not ai_data:
             return jsonify({"error": "AI assessment failed to return valid data"}), 500

        # 3. Create and save the Deviation record
        new_deviation = Deviation(
            submitter_id=submitter_id,
            original_deviation_text=deviation_text,
            root_cause_category=ai_data.Root_Cause_Category, 
            required_action=ai_data.Required_Action,
            rpn=ai_data.RPN,
            qa_narrative=ai_data.QA_Narrative_Summary
        )
        
        db.session.add(new_deviation)
        db.session.flush() # Flushes to get the new_deviation.id without permanently committing yet

        # 4. Create and save the Audit Trail entry
        audit_entry = AuditLog(
            user_id=submitter_id,
            action='CREATE_DEVIATION',
            table_affected='deviations',
            record_id=new_deviation.id,
            details=f"Deviation logged and assessed. Assigned RPN: {ai_data.RPN}, Action: {ai_data.Required_Action}"
        )
        db.session.add(audit_entry)
        
        # 5. Commit both the deviation and the audit log transaction at once
        db.session.commit()

        return jsonify({
            "message": "Deviation logged and assessed successfully",
            "deviation_id": new_deviation.id,
            "assessment": {
                "root_cause_category": ai_data.Root_Cause_Category,
                "required_action": ai_data.Required_Action,
                "rpn": ai_data.RPN,
                "qa_narrative": ai_data.QA_Narrative_Summary
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/deviations', methods=['GET'])
@jwt_required()
def get_deviations():
    deviations = Deviation.query.order_by(Deviation.id.asc()).all()
    result = []
    for dev in deviations:
        result.append({
            "id": dev.id,
            "submitter_id": dev.submitter_id,
            "root_cause_category": dev.root_cause_category, 
            "rpn": dev.rpn,
            "created_at": dev.timestamp.isoformat(),
            "deviation_text": dev.original_deviation_text,
            "required_action": dev.required_action,
            "qa_narrative": dev.qa_narrative 
        })
    return jsonify(result), 200

@app.route('/deviations/<int:id>', methods=['PUT'])
@jwt_required()
def update_deviation(id):
    deviation = Deviation.query.get_or_404(id)
    data = request.get_json()

    if 'submitter_id' in data:
        deviation.submitter_id = data['submitter_id']
    if 'deviation_text' in data:
        deviation.deviation_text = data['deviation_text']

    db.session.commit()
    return jsonify({"message": "Deviation updated successfully"}), 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    # Find the user in PostgreSQL
    user = User.query.filter_by(username=username).first()

    # Check if user exists and password is correct
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    # Create the JWT token, embedding the user's role in the payload
    access_token = create_access_token(
        identity=str(user.id), 
        additional_claims={"role": user.role}
    )
    
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "role": user.role
    }), 200


@app.route('/register', methods=['POST'])
@jwt_required() # This forces the route to check for a valid token
def register_user():
    # Retrieve the extra data (claims) we packed into the token during login
    claims = get_jwt()
    
    # Block anyone who isn't an admin
    if claims.get("role") != 'admin':
        return jsonify({"error": "Admin privileges required"}), 403

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'qa_user') # Default to qa_user if none provided

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    # Create the new user
    new_user = User(username=username, role=role)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": f"User '{username}' created successfully"}), 201

@app.route('/assess_change', methods=['POST'])
@jwt_required()
def assess_change():
    """Takes the raw draft from the user and returns the AI assessment."""
    data = request.get_json()
    
    title = data.get('title', '')
    current_state = data.get('current_state', '')
    proposed_state = data.get('proposed_state', '')
    justification = data.get('justification', '')

    if not all([title, current_state, proposed_state, justification]):
        return jsonify({"error": "All fields are required for a complete assessment."}), 400

    try:
        # Call the AI engine
        assessment = assess_change_control(title, current_state, proposed_state, justification)
        
        if assessment:
            # Because assessment is a Pydantic object, we use .model_dump() to convert it to a dictionary
            return jsonify({"assessment": assessment.model_dump()}), 200
        else:
            return jsonify({"error": "AI assessment returned empty."}), 500
            
    except Exception as e:
        print(f"AI Assessment Error: {e}")
        return jsonify({"error": "Failed to generate AI assessment"}), 500

@app.route('/change_controls', methods=['POST'])
@jwt_required()
def create_change_control():
    """Saves the finalized Change Control and its associated tasks to the database."""
    data = request.get_json()
    
    try:
        # 1. Create the parent Change Control record
        new_cc = ChangeControl(
            initiator_id=data.get('initiator_id'),
            title=data.get('title'),
            current_state=data.get('current_state'),
            proposed_state=data.get('proposed_state'),
            justification=data.get('justification'),
            classification=data.get('classification'),
            ai_impact_summary=data.get('classification_rationale'),
            status='In Review'
        )
        
        db.session.add(new_cc)
        db.session.flush() # Flushes to the database to generate the new_cc.id without fully committing yet

        # 2. Loop through the AI-suggested tasks and save them to the ChangeTask table
        tasks_data = data.get('tasks', [])
        for task_item in tasks_data:
            new_task = ChangeTask(
                change_control_id=new_cc.id,
                # Matching the exact keys generated by your Pydantic model (Domain, Task_Description)
                domain=task_item.get('Domain', 'General'),
                task_description=task_item.get('Task_Description', '')
            )
            db.session.add(new_task)

        # 3. Commit the transaction
        db.session.commit()
        
        return jsonify({
            "message": "Change Control submitted successfully", 
            "id": new_cc.id
        }), 201

    except Exception as e:
        db.session.rollback() # Roll back the transaction if anything fails
        print(f"Database Error: {e}")
        return jsonify({"error": "Failed to save Change Control"}), 500
    
@app.route('/change_controls', methods=['GET'])
@jwt_required()
def get_change_controls():
    ccs = ChangeControl.query.order_by(ChangeControl.id.desc()).all()
    result = []
    for cc in ccs:
        result.append({
            "id": cc.id,
            "title": cc.title,
            "classification": cc.classification,
            "status": cc.status,
            "initiator_id": cc.initiator_id,
            "created_at": cc.created_at.strftime('%Y-%m-%d %H:%M') if cc.created_at else "N/A"
        })
    return jsonify(result), 200
    
if __name__ == '__main__':
    # Notice db.create_all() has been removed!
    # You will now manage tables entirely via terminal commands.
    app.run(debug=True)