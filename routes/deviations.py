from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Deviation, AuditLog
from ai_engine import assess_deviation

deviations_bp = Blueprint('deviations', __name__)

@deviations_bp.route('/assess_deviation', methods=['POST'])
@jwt_required()
def assess_deviation_route():
    data = request.get_json()
    submitter_id = data.get('submitter_id')
    deviation_text = data.get('deviation_text')

    if not submitter_id or not deviation_text:
        return jsonify({"error": "Missing submitter_id or deviation_text"}), 400

    try:
        fmea_criteria = """
        Severity: 1=Negligible, 2=Minor, 3=Moderate, 4=Major (impacts product quality/viability), 5=Critical.
        Occurrence: 1=Rare, 2=Unlikely, 3=Possible (isolated incidents), 4=Likely, 5=Almost Certain.
        Detection: 1=Immediate, 2=Delayed but caught by secondary system, 3=Caught by manual check, 4=Poor, 5=Undetectable.
        """

        ai_data = assess_deviation(deviation_text, fmea_criteria)

        if not ai_data:
             return jsonify({"error": "AI assessment failed to return valid data"}), 500

        new_deviation = Deviation(
            submitter_id=submitter_id,
            original_deviation_text=deviation_text,
            root_cause_category=ai_data.Root_Cause_Category, 
            required_action=ai_data.Required_Action,
            rpn=ai_data.RPN,
            qa_narrative=ai_data.QA_Narrative_Summary
        )
        
        db.session.add(new_deviation)
        db.session.flush() 

        audit_entry = AuditLog(
            user_id=submitter_id,
            action='CREATE_DEVIATION',
            table_affected='deviations',
            record_id=new_deviation.id,
            details=f"Deviation logged and assessed. Assigned RPN: {ai_data.RPN}, Action: {ai_data.Required_Action}"
        )
        db.session.add(audit_entry)
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

@deviations_bp.route('/deviations', methods=['GET'])
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

@deviations_bp.route('/deviations/<int:id>', methods=['PUT'])
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