from pydantic import BaseModel
from typing import List

from typing import Optional
class FormattingAnalysisRequest(BaseModel):
    scan_id: Optional[str] = None
    resume_text: str

class FormattingAnalysisResponse(BaseModel):
    issues: List[str]
    warnings: List[str]
    recommendations: List[str]
