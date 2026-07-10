from sqlalchemy import Column, String, DateTime, Text, text, func, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.models.base import Base

class ContactStatus(str, enum.Enum):
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    SPAM = "SPAM"

class ContactCategory(str, enum.Enum):
    GENERAL = "General Question"
    BUG = "Bug Report"
    FEATURE = "Feature Request"
    BUSINESS = "Business Inquiry"
    FEEDBACK = "Feedback"

class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4, 
        server_default=text("gen_random_uuid()")
    )
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    category = Column(SQLEnum(ContactCategory), default=ContactCategory.GENERAL, nullable=False)
    subject = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(SQLEnum(ContactStatus), default=ContactStatus.NEW, nullable=False)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    source_page = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
