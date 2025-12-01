from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime, Text, JSON, create_engine
from sqlalchemy.orm import relationship, sessionmaker, declarative_base
from datetime import datetime

from pathlib import Path
import os

# Get absolute path to suppliers database
# database.py is in D:\B2B3\backend\database.py
# suppliers.db is in D:\B2B3\backend\suppliers.db
DATABASE_FILE = "suppliers.db"
CURRENT_DIR = Path(__file__).parent  # This is D:\B2B3\backend
SUPPLIERS_DB_PATH = CURRENT_DIR / DATABASE_FILE

print(f"📂 Current directory: {CURRENT_DIR}")
print(f"📄 Database file: {DATABASE_FILE}")
print(f"🛤️ Database path: {SUPPLIERS_DB_PATH}")

print(f"🔍 Looking for database at: {SUPPLIERS_DB_PATH.absolute()}")

# Ensure the database file exists
if not SUPPLIERS_DB_PATH.exists():
    print(f"❌ ERROR: Database not found at {SUPPLIERS_DB_PATH}")
    print(f"📁 Current directory: {CURRENT_DIR}")
    print(f"📋 Files in directory:")
    for file in CURRENT_DIR.glob("*.db"):
        print(f"   - {file.name}")
    raise FileNotFoundError(f"Database not found: {SUPPLIERS_DB_PATH}")
else:
    db_size = SUPPLIERS_DB_PATH.stat().st_size / 1024
    print(f"✅ Found database: {SUPPLIERS_DB_PATH.name} ({db_size:.1f} KB)")

# Create absolute path URL (important: use absolute path)
URL_DATABASE = f"sqlite:///{SUPPLIERS_DB_PATH.absolute()}"

print(f"🔗 Database URL: {URL_DATABASE}")

engine = create_engine(URL_DATABASE, connect_args={"check_same_thread": False}, echo=False)  # Changed echo=False to reduce logs
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(String(50), unique=True, nullable=False, index=True)  # Added index for faster lookups
    name = Column(String(200), nullable=False)
    location = Column(String(100))
    
    # Contact Information
    email = Column(String(150))
    phone = Column(String(50))
    website = Column(String(200))
    contact_person = Column(String(100))
    
    # Pricing and Logistics
    price_per_unit = Column(Float)
    currency = Column(String(10), default="USD")  # Added currency field
    lead_time_days = Column(Integer)
    min_order_qty = Column(Float)  # Changed to Float to match Pydantic model
    
    # Reputation and Status
    reputation_score = Column(Float, default=5.0)
    active = Column(Boolean, default=True)
    
    # Source and Metadata
    source = Column(String(100))  # e.g., internal, alibaba, tradefair
    specialties = Column(Text)  # Changed to Text for longer content
    certifications = Column(Text)  # Changed to Text for longer content
    notes = Column(Text)  # Added notes field
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_contacted = Column(DateTime)

    # Relationships
    performances = relationship("SupplierPerformance", back_populates="supplier", cascade="all, delete-orphan")
    certification_list = relationship("Certification", back_populates="supplier", cascade="all, delete-orphan")
    fabric_type_list = relationship("FabricType", back_populates="supplier", cascade="all, delete-orphan")
    contact_history = relationship("ContactHistory", back_populates="supplier", cascade="all, delete-orphan")


class SupplierPerformance(Base):
    __tablename__ = "supplier_performance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(String(50), ForeignKey("suppliers.supplier_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Time Period
    year = Column(Integer)
    quarter = Column(Integer)  # Added quarter for more granular tracking
    
    # Performance Metrics
    avg_lead_time = Column(Float)
    reliability_score = Column(Float, default=5.0)
    avg_price = Column(Float)
    on_time_delivery_rate = Column(Float)  # 0-100%
    defect_rate = Column(Float)  # 0-100%
    
    # Additional Metrics
    total_orders = Column(Integer, default=0)
    successful_orders = Column(Integer, default=0)
    communication_score = Column(Float)  # 0-10
    quality_score = Column(Float)  # 0-10
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="performances")


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(String(50), ForeignKey("suppliers.supplier_id", ondelete="CASCADE"), nullable=False, index=True)
    
    certification_name = Column(String(100), nullable=False)
    issued_by = Column(String(150))
    issue_date = Column(DateTime)
    expiry_date = Column(DateTime)
    certificate_number = Column(String(100))
    verification_url = Column(String(300))
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="certification_list")


class FabricType(Base):
    __tablename__ = "fabric_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(String(50), ForeignKey("suppliers.supplier_id", ondelete="CASCADE"), nullable=False, index=True)
    
    fabric_name = Column(String(150), nullable=False)
    fabric_category = Column(String(100))  # e.g., cotton, polyester, blend
    gsm = Column(Integer)  # grams per square meter
    composition = Column(String(300))  # e.g., "80% cotton, 20% polyester"
    
    # Availability and Pricing
    available_colors = Column(Text)  # comma-separated
    min_order_qty = Column(Float)
    price_per_unit = Column(Float)
    lead_time_days = Column(Integer)
    
    # Specifications
    width_cm = Column(Float)
    weight_per_meter = Column(Float)
    finish_type = Column(String(100))  # e.g., dyed, printed, raw
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="fabric_type_list")


class ContactHistory(Base):
    """Track communication history with suppliers"""
    __tablename__ = "contact_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(String(50), ForeignKey("suppliers.supplier_id", ondelete="CASCADE"), nullable=False, index=True)
    
    contact_date = Column(DateTime, default=datetime.utcnow)
    contact_type = Column(String(50))  # email, phone, meeting, quote_request
    subject = Column(String(200))
    notes = Column(Text)
    outcome = Column(String(100))  # successful, pending, no_response
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="contact_history")

# Follow-Up Scheduling and Messaging

class FollowUpSchedule(Base):
    __tablename__ = "follow_up_schedules"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    schedule_id = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(String(50), ForeignKey("suppliers.supplier_id"), nullable=False)
    
    # Core scheduling
    delay_reason = Column(String(100))
    estimated_duration = Column(String(50))
    supplier_commitment_level = Column(String(50))
    next_follow_up_date = Column(DateTime, nullable=False)
    
    # Strategy
    follow_up_method = Column(String(50))  # email, phone, whatsapp
    initial_tone = Column(String(50))
    
    # Status tracking
    status = Column(String(50), default="active")  # active, completed, cancelled
    follow_ups_sent = Column(Integer, default=0)
    last_follow_up_date = Column(DateTime)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = relationship("FollowUpMessage", back_populates="schedule", cascade="all, delete-orphan")


class FollowUpMessage(Base):
    __tablename__ = "follow_up_messages"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(String(50), unique=True, nullable=False, index=True)
    schedule_id = Column(String(50), ForeignKey("follow_up_schedules.schedule_id"), nullable=False)
    
    # Message content
    message_type = Column(String(50))
    message_body = Column(Text, nullable=False)
    subject_line = Column(String(200))
    
    # Sending details
    planned_send_date = Column(DateTime, nullable=False)
    actual_send_date = Column(DateTime)
    channel = Column(String(50))  # email, phone, whatsapp
    
    # Status
    status = Column(String(50), default="pending")  # pending, sent, failed
    response_received = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    schedule = relationship("FollowUpSchedule", back_populates="messages")

from enum import Enum

class SupplierRequestStatus(Enum):
    """Status of supplier requests"""
    PENDING = "pending"
    RESPONDED = "responded"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class SupplierUser(Base):
    """Supplier user accounts for portal login"""
    __tablename__ = "supplier_users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(String(50), ForeignKey("suppliers.supplier_id"), nullable=False, index=True)
    
    # Authentication
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)  # Hashed password
    
    # Profile
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="supplier_representative")  # supplier_representative, manager, etc.
    phone = Column(String(50))
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime)
    
    # Relationships
    supplier = relationship("Supplier", backref="portal_users")
    requests = relationship("SupplierRequest", back_populates="assigned_to_user")


class SupplierRequest(Base):
    """Requests sent to suppliers requiring their response"""
    __tablename__ = "supplier_requests"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(100), unique=True, nullable=False, index=True)
    
    # Linking to conversation workflow
    thread_id = Column(String(100), nullable=False, index=True)  # From AgentState
    conversation_round = Column(Integer, default=1)  # Which negotiation round
    
    # Supplier details
    supplier_id = Column(String(50), ForeignKey("suppliers.supplier_id"), nullable=False, index=True)
    assigned_to_user_id = Column(Integer, ForeignKey("supplier_users.id"), nullable=True)
    
    # Request content
    request_type = Column(String(50), nullable=False)  # negotiation, clarification, quote_confirmation
    request_subject = Column(String(200), nullable=False)
    request_message = Column(Text, nullable=False)  # The message sent to supplier
    request_context = Column(JSON, nullable=True)  # Additional context (extracted params, quote details, etc.)
    
    # Status tracking
    status = Column(String(50), default=SupplierRequestStatus.PENDING.value, index=True)
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    
    # Response tracking
    supplier_response = Column(Text, nullable=True)  # Supplier's response text
    response_data = Column(JSON, nullable=True)  # Structured response data
    responded_at = Column(DateTime, nullable=True)
    
    # Deadlines
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=True)  # Optional deadline
    
    # Notifications
    notification_sent_at = Column(DateTime, nullable=True)
    reminder_sent_count = Column(Integer, default=0)
    last_reminder_at = Column(DateTime, nullable=True)
    
    # Metadata
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supplier = relationship("Supplier", backref="received_requests")
    assigned_to_user = relationship("SupplierUser", back_populates="requests")


class SupplierResponseHistory(Base):
    """Track all responses from suppliers"""
    __tablename__ = "supplier_response_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(100), ForeignKey("supplier_requests.request_id"), nullable=False, index=True)
    supplier_user_id = Column(Integer, ForeignKey("supplier_users.id"), nullable=False)
    
    # Response details
    response_text = Column(Text, nullable=False)
    response_data = Column(JSON, nullable=True)
    response_type = Column(String(50), nullable=False)  # accept, counteroffer, reject, clarification, delay
    
    # Metadata
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    request = relationship("SupplierRequest", backref="response_history")
    user = relationship("SupplierUser", backref="responses")


class WorkflowResumeTrigger(Base):
    """Track workflow resume triggers after supplier response"""
    __tablename__ = "workflow_resume_triggers"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    trigger_id = Column(String(100), unique=True, nullable=False)
    
    # Linking
    thread_id = Column(String(100), nullable=False, index=True)
    request_id = Column(String(100), ForeignKey("supplier_requests.request_id"), nullable=False)
    
    # Trigger details
    triggered_at = Column(DateTime, default=datetime.utcnow)
    trigger_type = Column(String(50), default="supplier_response")  # supplier_response, manual, scheduled
    
    # Resume status
    resume_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    resume_started_at = Column(DateTime, nullable=True)
    resume_completed_at = Column(DateTime, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Relationships
    request = relationship("SupplierRequest", backref="resume_triggers")


class SupplierNotification(Base):
    """Notifications sent to suppliers"""
    __tablename__ = "supplier_notifications"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(String(100), unique=True, nullable=False)
    
    supplier_user_id = Column(Integer, ForeignKey("supplier_users.id"), nullable=False, index=True)
    request_id = Column(String(100), ForeignKey("supplier_requests.request_id"), nullable=True)
    
    # Notification content
    notification_type = Column(String(50), nullable=False)  # new_request, reminder, urgent, general
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Delivery
    channel = Column(String(50), default="in_app")  # in_app, email, sms
    sent_at = Column(DateTime, default=datetime.utcnow)
    
    # Status
    read_at = Column(DateTime, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    
    # Relationships
    user = relationship("SupplierUser", backref="notifications")
    request = relationship("SupplierRequest", backref="notifications")


# Update your create_tables() function
def create_supplier_portal_tables():
    """Create all supplier portal tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Supplier portal tables created successfully!")


# Helper function to create all tables
def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully!")


# Helper function to drop all tables (use with caution!)
def drop_tables():
    """Drop all database tables - USE WITH CAUTION"""
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped!")


if __name__ == "__main__":
    # Create tables when script is run directly
    drop_tables() 
    create_tables()
    create_supplier_portal_tables()

    print("the storage used by database is ", os.path.getsize(SUPPLIERS_DB_PATH)/1024 , " KB") 