from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.contact import ContactCategory, ContactStatus
from typing import Optional
from datetime import datetime
import uuid

class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Name of the sender")
    email: EmailStr = Field(..., description="Email of the sender")
    category: ContactCategory = Field(default=ContactCategory.GENERAL, description="Category of the inquiry")
    subject: str = Field(..., min_length=5, max_length=150, description="Subject of the message")
    message: str = Field(..., min_length=20, max_length=3000, description="Body of the message")
    source_page: Optional[str] = Field(None, max_length=255, description="Page where the form was submitted")

class ContactMessageResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    category: ContactCategory
    subject: str
    status: ContactStatus
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
