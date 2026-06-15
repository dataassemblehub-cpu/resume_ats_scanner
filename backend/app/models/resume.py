from sqlalchemy import Column, String, DateTime, Text, ForeignKey, text, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4, 
        server_default=text("gen_random_uuid()")
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    file_name = Column(String(255), nullable=False)
    file_url = Column(Text, nullable=True)
    parsed_text = Column(Text, nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
