from pydantic import BaseModel

class SemanticAnalysisRequest(BaseModel):
    resume_text: str
    jd_text: str

class SemanticAnalysisResponse(BaseModel):
    similarity: float
    semantic_score: float
