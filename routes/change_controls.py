from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, ChangeControl, ChangeTask
from ai_engine import assess_change_control

cc_bp = Blueprint('change_controls', __name__)

@cc_bp.route('/assess_change', methods=['POST'])
@jwt_required()
def assess_change():
    data = request.get_json()
    
    title = data.get('title', '')
    current_state = data.get('current_state', '')
    proposed_state = data.get('proposed_state', '')
    justification = data.get('justification', '')

    if not all([title, current_state, proposed_state, justification]):
        return jsonify({"error": "All fields are required for a complete assessment."}), 400

    try:
        assessment = assess_change_control(title, current_state, proposed_state, justification)
        
        if assessment:
            return jsonify({"assessment": assessment.model_dump()}), 200
        else:
            return jsonify({"error": "AI assessment returned empty."}), 500
            
    except Exception as e:
        print(f"AI Assessment Error: {e}")
        return jsonify({"error": "Failed to generate AI assessment"}), 500

@cc_bp.route('/change_controls', methods=['POST'])
@jwt_required()
def create_change_control():
    data = request.get_json()
    
    try:
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
        db.session.flush() 

        tasks_data = data.get('tasks', [])
        for task_item in tasks_data:
            new_task = ChangeTask(
                change_control_id=new_cc.id,
                domain=task_item.get('Domain', 'General'),
                task_description=task_item.get('Task_Description', '')
            )
            db.session.add(new_task)

        db.session.commit()
        return jsonify({"message": "Change Control submitted successfully", "id": new_cc.id}), 201

    except Exception as e:
        db.session.rollback() 
        print(f"Database Error: {e}")
        return jsonify({"error": "Failed to save Change Control"}), 500
    
@cc_bp.route('/change_controls', methods=['GET'])
@jwt_required()
def get_change_controls():
    ccs = ChangeControl.query.order_by(ChangeControl.id.desc()).all()
    result = []
    
    for cc in ccs:
        # Fetch the associated tasks for the Execution Tasks tab
        tasks = ChangeTask.query.filter_by(change_control_id=cc.id).all()
        tasks_list = [{"Domain": t.domain, "Task_Description": t.task_description} for t in tasks]
        
        result.append({
            "id": cc.id,
            "title": cc.title,
            "classification": cc.classification,
            "status": cc.status,
            "initiator_id": cc.initiator_id,
            "created_at": cc.created_at.strftime('%Y-%m-%d %H:%M') if cc.created_at else "N/A",
            
            # --- NEW FIELDS FOR THE MODAL ---
            "current_state": getattr(cc, 'current_state', ''),
            "proposed_state": getattr(cc, 'proposed_state', ''),
            "justification": getattr(cc, 'justification', ''),
            "classification_rationale": getattr(cc, 'ai_impact_summary', ''), # Mapping this based on your POST route
            "suggested_tasks": tasks_list
        })
    return jsonify(result), 200

# ==========================================
# NEW ENDPOINT: UPDATE CHANGE CONTROL
# ==========================================
@cc_bp.route('/change_controls/<int:id>', methods=['PUT'])
@jwt_required()
def update_change_control(id):
    cc = ChangeControl.query.get_or_404(id)
    data = request.get_json()

    if 'title' in data:
        cc.title = data['title']
    if 'current_state' in data:
        cc.current_state = data['current_state']
    if 'proposed_state' in data:
        cc.proposed_state = data['proposed_state']
    if 'justification' in data:
        cc.justification = data['justification']

    db.session.commit()
    return jsonify({"message": "Change Control updated successfully"}), 200