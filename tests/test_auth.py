from models import db, User

def test_login_missing_credentials(client):
    """
    Protocol: Verify that sending an empty login payload 
    results in a 400 Bad Request error.
    """
    
    # 1. ARRANGE: Set up the fake data (an empty payload)
    payload = {
        "username": "",
        "password": ""
    }
    
    # 2. ACT: Send a POST request to the /login route
    response = client.post('/login', json=payload)
    
    # 3. ASSERT: Verify the system responded correctly
    assert response.status_code == 400
    
    # Parse the JSON response and check the exact error message
    data = response.get_json()
    assert data["error"] == "Missing username or password"

  

def test_successful_login(client):
    """
    Protocol: Verify that valid credentials return a 200 OK and an access token.
    """
    # 1. ARRANGE: Create a fake user in the temporary database
    new_user = User(username="qa_auditor", role="qa_user")
    new_user.set_password("securepassword123")
    db.session.add(new_user)
    db.session.commit()

    # 2. ACT: Send the correct credentials to the login route
    payload = {
        "username": "qa_auditor",
        "password": "securepassword123"
    }
    response = client.post('/login', json=payload)

    # 3. ASSERT: Verify the response and token
    assert response.status_code == 200
    data = response.get_json()
    
    # Check that the token and role were actually generated and returned
    assert "access_token" in data
    assert data["role"] == "qa_user"

def test_non_admin_cannot_register_user(client):
    """
    Protocol: Verify that a standard user (non-admin) receives a 403 Forbidden 
    when attempting to register a new account.
    """
    # 1. ARRANGE: Create and log in as a standard user
    standard_user = User(username="standard_user", role="qa_user")
    standard_user.set_password("password")
    db.session.add(standard_user)
    db.session.commit()

    login_res = client.post('/login', json={"username": "standard_user", "password": "password"})
    token = login_res.get_json()["access_token"]

    # 2. ACT: Try to register a new account using the standard user's token
    register_payload = {
        "username": "hacker_account",
        "password": "badpassword123",
        "role": "admin"
    }
    
    response = client.post('/register', 
        json=register_payload,
        headers={"Authorization": f"Bearer {token}"}
    )

    # 3. ASSERT: The system must block this with a 403 status code
    assert response.status_code == 403
    
    data = response.get_json()
    assert data["error"] == "Admin privileges required"