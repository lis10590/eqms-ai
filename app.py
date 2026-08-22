import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
import click

# --- Import db and Models ---
from models import db, User

# --- Import Blueprints from routes folder ---
from routes.auth import auth_bp
from routes.deviations import deviations_bp
from routes.change_controls import cc_bp
from routes.documents import documents_bp
from routes.equipment import equipment_bp
from routes.inventory import inventory_bp
from routes.trainings import trainings_bp
from routes.sop_chat import sop_bp

# --- Load Environment Variables ---
load_dotenv() 

app = Flask(__name__)
CORS(app)

# --- Database Configuration ---
db_password = os.getenv("DB_PASSWORD")

# Try to load a test database URL first; if it's missing, default to your real PostgreSQL DB
default_db = f'postgresql://postgres:{db_password}@localhost/eqms_db'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("TEST_DATABASE_URL", default_db)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Link db to the app and initialize Flask-Migrate
db.init_app(app)
migrate = Migrate(app, db)

# --- Initialize JWT ---
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback_secret")
jwt = JWTManager(app)

# --- Register Blueprints (This attaches your routes to the app) ---
app.register_blueprint(auth_bp)
app.register_blueprint(deviations_bp)
app.register_blueprint(cc_bp)
app.register_blueprint(documents_bp)
app.register_blueprint(equipment_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(trainings_bp)
app.register_blueprint(sop_bp)
# --- CLI Command to Create Initial Admin ---
@app.cli.command("create-admin")
@click.argument("username")
@click.argument("password")
def create_admin(username, password):
    """Run `flask create-admin <username> <password>` to seed an admin."""
    if User.query.filter_by(username=username).first():
        print(f"Error: User {username} already exists.")
        return

    admin = User(username=username, role='admin')
    admin.set_password(password)
    
    db.session.add(admin)
    db.session.commit()
    print(f"Success! Admin '{username}' created successfully.")

if __name__ == '__main__':
    app.run(debug=True)