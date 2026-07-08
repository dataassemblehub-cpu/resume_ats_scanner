import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.section import SectionRequest, SectionResponse
from app.analyzers.section_analyzer import SectionAnalyzer

router = APIRouter(prefix="/resume", tags=["Resumes"])

# Singleton section analyzer
analyzer_instance = SectionAnalyzer()

def get_section_analyzer() -> SectionAnalyzer:
    """
    Dependency injector for SectionAnalyzer.
    """
    return analyzer_instance

@router.post(
    "/sections", 
    response_model=SectionResponse,
    summary="Detect and segment resume sections",
    description="Accepts raw resume text and segments it into standard logical sections, returning presence checkboxes, offsets, and content snippets."
)
async def detect_sections(
    request: SectionRequest,
    analyzer: SectionAnalyzer = Depends(get_section_analyzer)
):
    try:
        if request.scan_id:
            logger.info(f"Processing scan {request.scan_id} in /resume/sections")
        return analyzer.analyze(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume sections: {str(e)}")

