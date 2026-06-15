from pydantic import BaseModel

class ScoreRequest(BaseModel):
    resume_text: str
    jd_text: str

class ScoreBreakdown(BaseModel):
    keywords: float
    sections: float
    experience: float
    education: float
    formatting: float

class ScoreResponse(BaseModel):
    score: int
    breakdown: ScoreBreakdown
