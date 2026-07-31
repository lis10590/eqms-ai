import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from ai_engine import assess_deviation
from dotenv import load_dotenv

# --- Load Environment Variables ---
load_dotenv() # This reads the .env file and loads the variables into the system

app = Flask(__name__)
CORS(app)

# --- Database Configuration ---

# Fetch the password from the environment
db_password = os.getenv("DB_PASSWORD")
# Update 'postgres' and 'password' with your actual pgAdmin credentials if they differ
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://postgres:{db_password}@localhost/eqms_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Initialize Gemini API ---
# Ensure your GEMINI_API_KEY is set in your environment variables
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- Pydantic Schema for Structured AI Output ---
class QAAiAssessment(BaseModel):
    root_cause_category: str = Field(description="Strictly one of: 'Human Error', 'Equipment Failure', 'Process Gap', or 'Material Defect'")
    recommended_action: str = Field(description="Strictly one of: 'Close', 'Investigate', or 'CAPA' based on RPN")
    rpn: int = Field(description="Risk Priority Number calculated (1-1000) based on Severity, Occurrence, and Detection")
    qa_narrative: str = Field(description="A formal 5 Whys root cause analysis narrative suitable for a quality record")

# --- Database Models ---

class Deviation(db.Model):
    __tablename__ = 'deviations'

    id = db.Column(db.Integer, primary_key=True)
    submitter_id = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)
    original_deviation_text = db.Column(db.Text, nullable=False)
    
    
    root_cause_category = db.Column(db.String(50), nullable=True)
    required_action = db.Column(db.String(50), nullable=True)
    rpn = db.Column(db.Integer, nullable=True)
    qa_narrative = db.Column(db.Text, nullable=True)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)
    user_id = db.Column(db.String(100), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    table_affected = db.Column(db.String(50), nullable=False)
    record_id = db.Column(db.Integer, nullable=False)
    details = db.Column(db.Text, nullable=True)

# --- Routes ---


@app.route('/assess_deviation', methods=['POST'])
def assess_deviation_route():
    data = request.get_json()
    
    submitter_id = data.get('submitter_id')
    deviation_text = data.get('deviation_text')

    if not submitter_id or not deviation_text:
        return jsonify({"error": "Missing submitter_id or deviation_text"}), 400

    try:
        # 1. Define FMEA Criteria (Can also be moved to a separate config file later)
        fmea_criteria = """
        Severity: 1=Negligible, 2=Minor, 3=Moderate, 4=Major (impacts product quality/viability), 5=Critical.
        Occurrence: 1=Rare, 2=Unlikely, 3=Possible (isolated incidents), 4=Likely, 5=Almost Certain.
        Detection: 1=Immediate, 2=Delayed but caught by secondary system, 3=Caught by manual check, 4=Poor, 5=Undetectable.
        """

        # 2. Call the AI Engine (from ai_engine.py)
        # מחזיר אובייקט Pydantic מובנה
        ai_data = assess_deviation(deviation_text, fmea_criteria)

        if not ai_data:
             return jsonify({"error": "AI assessment failed to return valid data"}), 500

        # 3. Create and save the Deviation record
        new_deviation = Deviation(
            submitter_id=submitter_id,
            original_deviation_text=deviation_text,
            root_cause_category=ai_data.Root_Cause_Category, # אותיות גדולות בהתאם לסכמה החדשה שלך
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
            
            
            # Add these missing fields to your JSON response!
            "deviation_text": dev.original_deviation_text,
            "required_action": dev.required_action,
            "qa_narrative": dev.qa_narrative 
        })
    return jsonify(result), 200
#edit deviation
@app.route('/deviations/<int:id>', methods=['PUT'])
def update_deviation(id):
    data = request.json
    
    # 1. Query your PostgreSQL database for the deviation by ID
    deviation = Deviation.query.get(id)
    
    # Always good practice to handle the case where the ID doesn't exist
    if not deviation:
        return jsonify({"error": "Deviation not found"}), 404
        
    # 2. Update the fields
    # Using data.get() safely updates the field if it was provided in the request, 
    # but keeps the existing database value if it wasn't.
    deviation.submitter_id = data.get('submitter_id', deviation.submitter_id)
    deviation.original_deviation_text = data.get('deviation_text', deviation.original_deviation_text)
    
    # 3. Commit the changes to PostgreSQL
    db.session.commit()
    
    return jsonify({"message": "Deviation updated successfully"}), 200
    
# Create tables if they don't exist
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # Automatically creates missing tables (like audit_logs) before the app starts
    with app.app_context():
        db.create_all()
        
    # Start the Flask development server
    app.run(debug=True)