from models import db, User, ChangeControl, ChangeTask

def test_create_change_control_with_tasks(client):
    """
    Protocol: Verify that submitting a finalized Change Control successfully
    saves both the parent record and all associated tasks to the database.
    """
    # 1. ARRANGE: Create a test user and log in to get a valid token
    user = User(username="cc_initiator", role="qa_user")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()

    login_res = client.post('/login', json={"username": "cc_initiator", "password": "password123"})
    token = login_res.get_json()["access_token"]

    # 2. ACT: Send a payload simulating the final step of your frontend Modal
    payload = {
        "initiator_id": str(user.id),
        "title": "Modify Incubator #3 Temperature Setpoints",
        "current_state": "Triggers critical alarm at ±0.5°C for 5 minutes.",
        "proposed_state": "Trigger critical alarm at ±0.5°C for 15 minutes.",
        "justification": "Reduce nuisance alarms during cell feeding.",
        "classification": "Minor",
        "classification_rationale": "Does not impact product viability based on current validation.",
        "tasks": [
            {"Domain": "Equipment", "Task_Description": "Update monitoring software parameters."},
            {"Domain": "Documentation", "Task_Description": "Revise environmental monitoring SOP."}
        ]
    }
    
    response = client.post('/change_controls', 
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )

    # 3. ASSERT API RESPONSE: Verify the system responded with a success code
    assert response.status_code == 201
    data = response.get_json()
    assert "id" in data
    
    cc_id = data["id"]

    # 4. ASSERT DB TRANSACTIONS: Query the database to prove the data actually saved
    
    # Verify the parent record exists
    saved_cc = db.session.get(ChangeControl, cc_id)
    assert saved_cc is not None
    assert saved_cc.title == "Modify Incubator #3 Temperature Setpoints"
    assert saved_cc.classification == "Minor"
    
    # Verify the child records (Tasks) were linked correctly
    saved_tasks = ChangeTask.query.filter_by(change_control_id=cc_id).all()
    
    # The payload had 2 tasks, so the database should have exactly 2 tasks
    assert len(saved_tasks) == 2
    assert saved_tasks[0].domain == "Equipment"
    assert saved_tasks[1].domain == "Documentation"