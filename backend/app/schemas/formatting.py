from pydantic import BaseModel
from typing import List

class FormattingAnalysisRequest(BaseModel):
    resume_text: str

class FormattingAnalysisResponse(BaseModel):
    issues: List[str]
    warnings: List[str]
    recommendations: List[str]
