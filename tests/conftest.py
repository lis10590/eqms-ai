import pytest
from flask import Flask
from models import db, User
from flask_jwt_extended import JWTManager, create_access_token
# Import your blueprints here
from routes.auth import auth_bp
from routes.trainings import trainings_bp
from routes.documents import documents_bp
from routes.deviations import deviations_bp
from routes.change_controls import cc_bp
from routes.equipment import equipment_bp
from routes.inventory import inventory_bp
from routes.sop_chat import sop_bp

@pytest.fixture
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    db.init_app(app)
    JWTManager(app)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(trainings_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(deviations_bp)
    app.register_blueprint(cc_bp)
    app.register_blueprint(equipment_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(sop_bp)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_token(app):
    with app.app_context():
        admin = User(username='admin_test', role='admin')
        admin.set_password('password123')
        db.session.add(admin)
        db.session.commit()
        return create_access_token(identity=str(admin.id), additional_claims={"role": "admin"})

@pytest.fixture
def qa_token(app):
    with app.app_context():
        qa = User(username='qa_test', role='qa_user')
        qa.set_password('password123')
        db.session.add(qa)
        db.session.commit()
        return create_access_token(identity=str(qa.id), additional_claims={"role": "qa_user"})