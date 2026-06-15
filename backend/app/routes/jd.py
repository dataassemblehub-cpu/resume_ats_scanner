from fastapi import APIRouter, Depends
from app.schemas.jd import JDParseRequest, JDParseResponse
from app.services.jd_parser_service import JDParserService

router = APIRouter(prefix="/jd", tags=["Job Descriptions"])

# Singleton instance of parser service
jd_service = JDParserService()

def get_jd_service() -> JDParserService:
    """
    Dependency injector for JDParserService.
    """
    return jd_service

@router.post(
    "/parse", 
    response_model=JDParseResponse,
    summary="Parse a job description",
    description="Accepts raw job description text and extracts structural information like title, skills, tools, education, years of experience, and responsibilities using spaCy NLP."
)
async def parse_job_description(
    request: JDParseRequest,
    service: JDParserService = Depends(get_jd_service)
):
    return await service.parse_jd(request.description)
