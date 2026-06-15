from fastapi import APIRouter, File, UploadFile, Depends
from app.schemas.resume import ResumeUploadResponse
from app.services.supabase_service import SupabaseService
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resume", tags=["Resumes"])

# Initialize Supabase service dependency
supabase_service = SupabaseService()

def get_resume_service() -> ResumeService:
    """
    Dependency injector for ResumeService.
    """
    return ResumeService(supabase_service)

@router.post(
    "/upload", 
    response_model=ResumeUploadResponse, 
    summary="Upload and parse a resume",
    description="Uploads a PDF or DOCX resume, parses the text, extracts contact information (name, email, phone), and saves the details."
)
async def upload_resume(
    file: UploadFile = File(..., description="The resume file to parse (PDF or DOCX)."),
    resume_service: ResumeService = Depends(get_resume_service)
):
    return await resume_service.process_and_save_resume(file)
