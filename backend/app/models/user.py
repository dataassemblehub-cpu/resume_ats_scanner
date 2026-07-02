from sqlalchemy import Column, String, DateTime, Integer, text, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4, 
        server_default=text("gen_random_uuid()")
    )
    email = Column(String(255), unique=True, nullable=False)
    subscription_plan = Column(String(50), nullable=False, default="free", server_default="free")
    ai_generation_count = Column(Integer, nullable=False, default=0, server_default="0")
    last_ai_generation_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
