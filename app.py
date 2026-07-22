import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# --- Load Environment Variables ---
load_dotenv() # This reads the .env file and loads the variables into the system

app = Flask(__name__)

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
    
    # AI Generated Fields
    root_cause_category = db.Column(db.String(50), nullable=True)
    recommended_action = db.Column(db.String(50), nullable=True)
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
def assess_deviation():
    data = request.get_json()
    
    submitter_id = data.get('submitter_id')
    deviation_text = data.get('deviation_text')

    if not submitter_id or not deviation_text:
        return jsonify({"error": "Missing submitter_id or deviation_text"}), 400

    try:
        # 1. Call Gemini for the assessment
        prompt = f"Analyze this manufacturing deviation as a Quality Assurance AI. Deviation: '{deviation_text}'"
        
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=QAAiAssessment,
                temperature=0.1 # Low temperature for more deterministic, professional QA output
            ),
        )
        
        # Parse the structured JSON response
        ai_data = response.parsed
        
        # 2. Create and save the Deviation record
        new_deviation = Deviation(
            submitter_id=submitter_id,
            original_deviation_text=deviation_text,
            root_cause_category=ai_data.root_cause_category,
            recommended_action=ai_data.recommended_action,
            rpn=ai_data.rpn,
            qa_narrative=ai_data.qa_narrative
        )
        
        db.session.add(new_deviation)
        db.session.flush() # Flushes to get the new_deviation.id without permanently committing yet

        # 3. Create and save the Audit Trail entry
        # This aligns the MVP directly with the strict electronic record tracking required by 21 CFR Part 11
        audit_entry = AuditLog(
            user_id=submitter_id,
            action='CREATE_DEVIATION',
            table_affected='deviations',
            record_id=new_deviation.id,
            details=f"Deviation logged and assessed. Assigned RPN: {ai_data.rpn}, Action: {ai_data.recommended_action}"
        )
        db.session.add(audit_entry)
        
        # Commit both the deviation and the audit log transaction at once
        db.session.commit()

        return jsonify({
            "message": "Deviation logged and assessed successfully",
            "deviation_id": new_deviation.id,
            "assessment": {
                "root_cause_category": ai_data.root_cause_category,
                "recommended_action": ai_data.recommended_action,
                "rpn": ai_data.rpn,
                "qa_narrative": ai_data.qa_narrative
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Automatically creates missing tables (like audit_logs) before the app starts
    with app.app_context():
        db.create_all()
        
    # Start the Flask development server
    app.run(debug=True)