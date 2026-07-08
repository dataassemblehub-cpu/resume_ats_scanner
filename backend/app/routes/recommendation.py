from fastapi import APIRouter, Depends, HTTPException, Header
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.gemini_recommendation_service import GeminiRecommendationService
from app.services.ai_recommendation_service import AIRecommendationService
from app.utils.auth_helper import get_current_user
from app.services.entitlement_service import EntitlementService
from app.services.supabase_service import SupabaseService

router = APIRouter(prefix="/analyze", tags=["Analysis"])
recommendation_service = GeminiRecommendationService()
supabase_service = SupabaseService()

def get_recommendation_service() -> AIRecommendationService:
    return recommendation_service

async def get_current_user_optional(authorization: str | None = Header(None)) -> dict | None:
    """
    Optional helper that resolves the user if credentials are valid, 
    otherwise returns None without throwing a 401 exception.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await get_current_user(authorization)
    except Exception:
        return None

@router.post(
    "/recommendation", 
    response_model=RecommendationResponse,
    summary="Generate AI recommendations using Gemini",
    description="Generates qualitative recommendations and resume improvement bullet suggestions by analyzing the resume, JD, and pre-calculated deterministic ATS scores."
)
async def generate_recommendation(
    request: RecommendationRequest,
    user: dict | None = Depends(get_current_user_optional),
    service: AIRecommendationService = Depends(get_recommendation_service)
):
    if not user:
        return {
            "status": "unavailable",
            "message": "Please sign in or create a free account to unlock AI-powered recommendations and tailored resume bullet suggestions.",
            "resume_summary": None,
            "strengths": [],
            "weaknesses": [],
            "missing_skills": [],
            "ats_improvements": [],
            "recruiter_improvements": [],
            "suggested_bullet_points": [],
            "resume_improvements": [],
            "ats_recommendations": []
        }

    # Fetch user data to verify AI generation quota
    fresh_user = supabase_service.get_user_by_uuid(user["id"])
    if not fresh_user:
        raise HTTPException(status_code=404, detail="User profile not found.")

    # 1. Dual-Level Quota verification: Check if cached recommendations exist first
    if request.resume_id:
        db_record = supabase_service.get_resume_recommendations(request.resume_id)
        if db_record and db_record.get("jd_text") == request.jd_text and db_record.get("recommendations"):
            # Cache hit: call service which returns stored recommendations
            results = await service.generate_recommendations(
                request.resume_text,
                request.jd_text,
                request.ats_results,
                request.resume_id
            )
            return results

    # 2. No cache hit: verify user has entitlements to generate AI recommendations
    if not EntitlementService.can_generate_ai(fresh_user):
        raise HTTPException(
            status_code=403,
            detail="Free AI recommendations quota exhausted. Please upgrade to Premium."
        )

    try:
        results = await service.generate_recommendations(
            request.resume_text,
            request.jd_text,
            request.ats_results,
            request.resume_id
        )
        
        # 3. Quota consumption: Increment AI generation counter on success
        if results and results.get("status") == "success":
            supabase_service.increment_ai_generation_count(user["id"])
            
        return results
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
