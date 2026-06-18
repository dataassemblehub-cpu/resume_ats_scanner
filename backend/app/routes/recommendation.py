from fastapi import APIRouter, Depends, HTTPException
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.gemini_recommendation_service import GeminiRecommendationService
from app.services.ai_recommendation_service import AIRecommendationService

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# Singleton service instance
recommendation_service = GeminiRecommendationService()

def get_recommendation_service() -> AIRecommendationService:
    """
    Dependency injector for AIRecommendationService.
    """
    return recommendation_service

@router.post(
    "/recommendation", 
    response_model=RecommendationResponse,
    summary="Generate AI recommendations using Gemini",
    description="Generates qualitative recommendations and resume improvement bullet suggestions by analyzing the resume, JD, and pre-calculated deterministic ATS scores."
)
async def generate_recommendation(
    request: RecommendationRequest,
    service: AIRecommendationService = Depends(get_recommendation_service)
):
    try:
        results = await service.generate_recommendations(
            request.resume_text,
            request.jd_text,
            request.ats_results
        )
        return results
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
