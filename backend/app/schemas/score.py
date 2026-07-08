from pydantic import BaseModel
from typing import Dict, Optional

class ScoreRequest(BaseModel):
    scan_id: Optional[str] = None
    resume_text: str
    jd_text: str

class ScoreResponse(BaseModel):
    skills: int
    experience: int
    projects: int
    education: int
    overall: int
