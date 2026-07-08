from pydantic import BaseModel
from typing import List, Dict, Optional

class KeywordAnalysisRequest(BaseModel):
    scan_id: Optional[str] = None
    resume_text: str
    jd_text: str

class KeywordFrequencyDetails(BaseModel):
    resume: int
    jd: int

class KeywordAnalysisResponse(BaseModel):
    matched: List[str]
    missing: List[str]
    coverage_percentage: float
    keyword_frequency: Dict[str, KeywordFrequencyDetails]
