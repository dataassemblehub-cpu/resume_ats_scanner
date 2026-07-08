import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.keyword import KeywordAnalysisRequest, KeywordAnalysisResponse
from app.services.keyword_service import KeywordAnalyzerService

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# Singleton service instance
analyzer_service = KeywordAnalyzerService(top_n=15)

def get_keyword_service() -> KeywordAnalyzerService:
    """
    Dependency injector for KeywordAnalyzerService.
    """
    return analyzer_service

@router.post(
    "/keywords", 
    response_model=KeywordAnalysisResponse,
    summary="Compare resume keywords against Job Description",
    description="Identifies top TF-IDF keywords in the Job Description, scans for matches in the Resume, and returns matched/missing terms, coverage percentage, and word counts."
)
async def analyze_keywords(
    request: KeywordAnalysisRequest,
    service: KeywordAnalyzerService = Depends(get_keyword_service)
):
    try:
        if request.scan_id:
            logger.info(f"Processing scan {request.scan_id} in /analyze/keywords")
        return await service.analyze_keywords(request.resume_text, request.jd_text)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

