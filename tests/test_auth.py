import pytest
from models import User, db

def test_login_success(client, app):
    with app.app_context():
        user = User(username='lis_test', role='qa_user')
        user.set_password('securepass')
        db.session.add(user)
        db.session.commit()

    response = client.post('/login', json={
        'username': 'lis_test',
        'password': 'securepass'
    })
    
    assert response.status_code == 200
    assert 'access_token' in response.get_json()

def test_login_missing_credentials(client):
    response = client.post('/login', json={'username': 'lis_test'})
    assert response.status_code == 400
    assert response.get_json()['error'] == "Missing username or password"

def test_register_user_as_admin(client, admin_token):
    response = client.post('/register', 
        headers={'Authorization': f'Bearer {admin_token}'},
        json={
            'username': 'new_operator',
            'password': 'password123',
            'role': 'operator'
        }
    )
    assert response.status_code == 201

def test_register_user_as_qa_fails(client, qa_token):
    response = client.post('/register', 
        headers={'Authorization': f'Bearer {qa_token}'},
        json={
            'username': 'unauthorized_user',
            'password': 'password123'
        }
    )
    assert response.status_code == 403