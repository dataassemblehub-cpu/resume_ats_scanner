from fastapi import APIRouter, Depends, HTTPException
from app.schemas.semantic import SemanticAnalysisRequest, SemanticAnalysisResponse
from app.services.semantic_service import SemanticAnalyzerService

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# Instantiate the service dependency
semantic_service = SemanticAnalyzerService()

def get_semantic_service() -> SemanticAnalyzerService:
    return semantic_service

@router.post(
    "/semantic",
    response_model=SemanticAnalysisResponse,
    summary="Compute semantic similarity between resume and job description",
    description="Uses TF-IDF and cosine similarity metrics to evaluate terms similarity and text compatibility."
)
async def analyze_semantic(
    request: SemanticAnalysisRequest,
    service: SemanticAnalyzerService = Depends(get_semantic_service)
):
    try:
        return await service.analyze_semantic_similarity(
            resume_text=request.resume_text,
            jd_text=request.jd_text
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
