from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class RecommendationRequest(BaseModel):
    resume_text: str
    jd_text: str
    ats_results: Dict[str, Any]
    resume_id: Optional[str] = None

class RecommendationResponse(BaseModel):
    status: str = "success"  # "success" or "unavailable"
    message: Optional[str] = None
    resume_summary: Optional[str] = None
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    missing_skills: Optional[List[str]] = None
    ats_improvements: Optional[List[str]] = None
    recruiter_improvements: Optional[List[str]] = None
    suggested_bullet_points: Optional[List[str]] = None
    resume_improvements: Optional[List[str]] = None
    ats_recommendations: Optional[List[str]] = None
