from fastapi import APIRouter, Depends, HTTPException
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

@router.post(
    "/recommendation", 
    response_model=RecommendationResponse,
    summary="Generate AI recommendations using Gemini",
    description="Generates qualitative recommendations and resume improvement bullet suggestions by analyzing the resume, JD, and pre-calculated deterministic ATS scores."
)
async def generate_recommendation(
    request: RecommendationRequest,
    user: dict = Depends(get_current_user),
    service: AIRecommendationService = Depends(get_recommendation_service)
):
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
