from models import db, User

def test_get_deviations_without_token(client):
    """
    Protocol: Verify that an anonymous user cannot view deviations.
    """
    # 1. ACT: Try to fetch deviations without sending an Authorization header
    response = client.get('/deviations')

    # 2. ASSERT: The system must block the request with a 401 Unauthorized error
    assert response.status_code == 401
    
    data = response.get_json()
    assert data["msg"] == "Missing Authorization Header"


  

def test_assess_deviation_success(client, monkeypatch):
    """
    Protocol: Verify that an authenticated user can submit a deviation 
    and successfully receive an AI assessment and database record.
    """
    # 1. ARRANGE: Create a test user and log in to get a valid token
    user = User(username="qa_engineer", role="qa_user")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()

    login_response = client.post('/login', json={
        "username": "qa_engineer",
        "password": "password123"
    })
    token = login_response.get_json()["access_token"]

    # Create a mock object that mimics the structure of your Pydantic AI output
    class MockAiData:
        Root_Cause_Category = "Equipment Failure"
        Required_Action = "Investigate"
        RPN = 150
        QA_Narrative_Summary = "Mocked 5 Whys analysis for unit testing."

    # Intercept the assess_deviation function call and return our mock data instead
    import routes.deviations as deviations_module
    monkeypatch.setattr(deviations_module, "assess_deviation", lambda text, criteria: MockAiData())

    # 2. ACT: Send the deviation payload with the Authorization header
    payload = {
        "submitter_id": "1",
        "deviation_text": "Freezer temperature spiked to -10°C during overnight storage."
    }
    
    response = client.post('/assess_deviation', 
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )

    # 3. ASSERT: Verify the response code and data structure
    assert response.status_code == 201
    data = response.get_json()
    
    assert data["message"] == "Deviation logged and assessed successfully"
    assert data["assessment"]["root_cause_category"] == "Equipment Failure"
    assert data["assessment"]["rpn"] == 150