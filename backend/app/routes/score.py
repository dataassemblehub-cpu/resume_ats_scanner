import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.score import ScoreRequest, ScoreResponse
from app.services.score_service import ScoreService

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# Singleton service instance
scoring_service = ScoreService()

def get_score_service() -> ScoreService:
    """
    Dependency injector for ScoreService.
    """
    return scoring_service

@router.post(
    "/score", 
    response_model=ScoreResponse,
    summary="Calculate comprehensive ATS Score",
    description="Orchestrates resume section parsing, JD requirement parsing, and TF-IDF keyword extraction to calculate a final weighted score and detailed breakdown."
)
async def calculate_score(
    request: ScoreRequest,
    service: ScoreService = Depends(get_score_service)
):
    try:
        if request.scan_id:
            logger.info(f"Processing scan {request.scan_id} in /analyze/score")
        return await service.calculate_ats_score(request.resume_text, request.jd_text)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

