from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime,timezone

# Initialize SQLAlchemy without attaching it to the app yet
db = SQLAlchemy()

# --- Database Models ---

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='qa_user')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Deviation(db.Model):
    __tablename__ = 'deviations'

    id = db.Column(db.Integer, primary_key=True)
    submitter_id = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)
    original_deviation_text = db.Column(db.Text, nullable=False)
    root_cause_category = db.Column(db.String(50), nullable=True)
    required_action = db.Column(db.String(50), nullable=True)
    rpn = db.Column(db.Integer, nullable=True)
    qa_narrative = db.Column(db.Text, nullable=True)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)
    user_id = db.Column(db.String(100), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    table_affected = db.Column(db.String(50), nullable=False)
    record_id = db.Column(db.Integer, nullable=False)
    details = db.Column(db.Text, nullable=True)

class ChangeControl(db.Model):
    __tablename__ = 'change_controls'

    id = db.Column(db.Integer, primary_key=True)
    initiator_id = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    # Core Data
    title = db.Column(db.String(200), nullable=False)
    current_state = db.Column(db.Text, nullable=False)
    proposed_state = db.Column(db.Text, nullable=False)
    justification = db.Column(db.Text, nullable=False)

    # AI Evaluation & QA Triage
    classification = db.Column(db.String(50)) # Minor, Major, Critical
    ai_impact_summary = db.Column(db.Text)
    status = db.Column(db.String(50), default='Draft') # Draft, In Review, Approved, Closed

    # Relationships
    tasks = db.relationship('ChangeTask', backref='change_control', lazy=True, cascade="all, delete-orphan")

class ChangeTask(db.Model):
    __tablename__ = 'change_tasks'

    id = db.Column(db.Integer, primary_key=True)
    change_control_id = db.Column(db.Integer, db.ForeignKey('change_controls.id'), nullable=False)
    task_description = db.Column(db.Text, nullable=False)
    domain = db.Column(db.String(100)) # e.g., Documentation, Validation, Training
    is_completed = db.Column(db.Boolean, default=False)


class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    document_number = db.Column(db.String(50), unique=True, nullable=False) # e.g., "SOP-001"
    title = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Establish relationship to all versions of this document
    versions = db.relationship('DocumentVersion', backref='document', lazy=True, cascade="all, delete-orphan")


class DocumentVersion(db.Model):
    __tablename__ = 'document_versions'
    
    id = db.Column(db.Integer, primary_key=True)
    version_number = db.Column(db.String(50), nullable=False) # e.g., "v1.0"
    file_key = db.Column(db.String(255), nullable=False) # S3 file path
    
    # Status lifecycle: 'Draft', 'In Review', 'Authorized', 'Obsolete'
    status = db.Column(db.String(50), default='Draft', nullable=False) 
    
    # Foreign Keys
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'), nullable=False)
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship to the user who uploaded it
    uploader = db.relationship(
        'User', 
        foreign_keys='DocumentVersion.uploader_id', 
        backref='uploaded_versions'
    )
    
    reviewer = db.relationship(
        'User', 
        foreign_keys='DocumentVersion.reviewer_id', 
        backref='assigned_reviews'
    )

class Equipment(db.Model):
    __tablename__ = 'equipment'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    serial_number = db.Column(db.String(100), unique=True, nullable=False)
    location = db.Column(db.String(100), nullable=True)
    
    # Store dates to calculate when the next calibration is due
    last_calibration_date = db.Column(db.Date, nullable=False)
    next_calibration_date = db.Column(db.Date, nullable=False)
    
    status = db.Column(db.String(50), default='Active', nullable=False) # e.g., 'Active', 'Out of Service'
    
    added_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship to know who added it
    added_by = db.relationship('User', foreign_keys=[added_by_id])


class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False) # e.g., 'Reagent', 'Consumable'
    lot_number = db.Column(db.String(100), nullable=False)
    
    quantity = db.Column(db.Integer, nullable=False, default=0)
    unit = db.Column(db.String(50), nullable=False) # e.g., 'mL', 'boxes', 'vials'
    
    expiration_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), default='Released', nullable=False) # e.g., 'Quarantine', 'Released', 'Expired'
    
    added_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Explicit relationship mapping to avoid AmbiguousForeignKeysError
    added_by = db.relationship(
        'User', 
        foreign_keys='InventoryItem.added_by_id', 
        backref='added_inventory'
    )