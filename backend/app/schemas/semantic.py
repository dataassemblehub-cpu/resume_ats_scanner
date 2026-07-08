from pydantic import BaseModel
from typing import List, Optional

class SemanticAnalysisRequest(BaseModel):
    scan_id: Optional[str] = None
    resume_text: str
    jd_text: str

class SemanticAnalysisResponse(BaseModel):
    similarity: float
    semantic_score: float
