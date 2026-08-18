from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Deviation, AuditLog
from ai_engine import assess_deviation, generate_ai_investigation
from datetime import datetime


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
            qa_narrative=ai_data.QA_Narrative_Summary,
            status='Open' # Explicitly setting initial status
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
            # Create a short title for the frontend table by truncating the text
            "title": dev.original_deviation_text[:40] + "..." if len(dev.original_deviation_text) > 40 else dev.original_deviation_text,
            "submitter_id": dev.submitter_id,
            "root_cause_category": dev.root_cause_category, 
            "rpn": dev.rpn,
            "created_at": dev.timestamp.isoformat() if dev.timestamp else None,
            "deviation_text": dev.original_deviation_text,
            "required_action": dev.required_action,
            "qa_narrative": dev.qa_narrative,
            
            # --- NEW LIFECYCLE DATA FOR THE FRONTEND MODAL ---
            "status": dev.status,
            "root_cause": dev.investigation_root_cause,
            "capa": dev.capa,
            "closed_at": dev.closed_at.isoformat() if dev.closed_at else None
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
        # BUG FIX: changed from deviation.deviation_text to match your model
        deviation.original_deviation_text = data['deviation_text']

    db.session.commit()
    return jsonify({"message": "Deviation updated successfully"}), 200


# ==========================================
# NEW ENDPOINTS FOR INVESTIGATION MODULE
# ==========================================

@deviations_bp.route('/deviations/<int:deviation_id>/close', methods=['PUT'])
@jwt_required()
def close_deviation(deviation_id):
    deviation = Deviation.query.get_or_404(deviation_id)
        
    deviation.status = 'Completed'
    deviation.closed_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'Deviation marked as completed.'}), 200


@deviations_bp.route('/deviations/<int:deviation_id>/investigate', methods=['POST'])
@jwt_required()
def investigate_deviation(deviation_id):
    deviation = Deviation.query.get_or_404(deviation_id)
        
    # Prevent reopening completed deviations
    if deviation.status == 'Completed':
        return jsonify({'error': 'Cannot investigate a closed deviation.'}), 400
        
    deviation.status = 'Under Investigation'
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'Investigation formally initiated.'}), 200


@deviations_bp.route('/deviations/<int:deviation_id>/investigation', methods=['PUT'])
@jwt_required()
def save_investigation_data(deviation_id):
    deviation = Deviation.query.get_or_404(deviation_id)
        
    if deviation.status == 'Completed':
        return jsonify({'error': 'Record is locked.'}), 403

    data = request.get_json()
    
    # Map the incoming React data to the database columns
    if 'root_cause' in data:
        deviation.investigation_root_cause = data['root_cause']
    if 'capa' in data:
        deviation.capa = data['capa']
    
    db.session.commit()
    return jsonify({'success': True, 'message': 'Investigation data saved.'}), 200



@deviations_bp.route('/deviations/<int:deviation_id>/ai_investigate', methods=['POST'])
@jwt_required()
def trigger_ai_investigation(deviation_id):
    deviation = Deviation.query.get_or_404(deviation_id)
    
    if deviation.status == 'Completed':
        return jsonify({'error': 'Cannot run AI investigation on a closed deviation.'}), 400

    # Run AI Investigation Engine
    ai_result = generate_ai_investigation(
        deviation_text=deviation.original_deviation_text,
        category=deviation.root_cause_category or "",
        qa_narrative=deviation.qa_narrative or ""
    )

    if not ai_result:
        return jsonify({'error': 'AI engine failed to generate investigation.'}), 500

    # Format 5 Whys into the root cause text
    five_whys_formatted = "\n".join([f"Why {i+1}: {why}" for i, why in enumerate(ai_result.Five_Whys)])
    full_root_cause = f"5 Whys Analysis:\n{five_whys_formatted}\n\nConclusion:\n{ai_result.Root_Cause_Analysis}"

    return jsonify({
        'success': True,
        'root_cause': full_root_cause,
        'capa': ai_result.CAPA_Summary
    }), 200