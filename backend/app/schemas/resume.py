from pydantic import BaseModel
from uuid import UUID

class ResumeUploadResponse(BaseModel):
    id: UUID
    name: str | None
    email: str | None
    phone: str | None
    parsed_text: str

    class Config:
        from_attributes = True
