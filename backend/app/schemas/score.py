from pydantic import BaseModel

class ScoreRequest(BaseModel):
    resume_text: str
    jd_text: str

class ScoreResponse(BaseModel):
    skills: int
    experience: int
    projects: int
    education: int
    overall: int
