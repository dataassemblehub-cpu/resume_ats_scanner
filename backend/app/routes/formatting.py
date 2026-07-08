import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.formatting import FormattingAnalysisRequest, FormattingAnalysisResponse
from app.services.formatting_service import FormattingAnalyzerService

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# Singleton service instance
formatting_service = FormattingAnalyzerService()

def get_formatting_service() -> FormattingAnalyzerService:
    return formatting_service

@router.post(
    "/formatting",
    response_model=FormattingAnalysisResponse,
    summary="Analyze resume formatting and layout",
    description="Checks for potential ATS parsing blockers like tables, column structures, missing contact details, long paragraphs, or invalid section ordering."
)
async def analyze_formatting_route(
    request: FormattingAnalysisRequest,
    service: FormattingAnalyzerService = Depends(get_formatting_service)
):
    try:
        if request.scan_id:
            logger.info(f"Processing scan {request.scan_id} in /analyze/formatting")
        return await service.analyze_formatting(request.resume_text)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

