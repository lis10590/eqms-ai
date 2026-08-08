import os
import pytest

# 1. Force the app to use SQLite BEFORE importing the app
os.environ["TEST_DATABASE_URL"] = "sqlite:///:memory:"

from app import app
from models import db

@pytest.fixture
def client():
    # 2. Configure the app for testing
    app.config['TESTING'] = True
    
    # 3. Create a test client to simulate frontend requests
    with app.test_client() as client:
        with app.app_context():
            # Build the temporary tables
            db.create_all() 
            
            # Yield hands control over to your test
            yield client    
            
            # Teardown: Destroy the temporary tables after the test finishes
            db.session.remove()
            db.drop_all()