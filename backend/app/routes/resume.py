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

from app.utils.auth_helper import get_current_user_optional
from fastapi import APIRouter, File, UploadFile, Depends, Form

@router.post(
    "/upload", 
    response_model=ResumeUploadResponse, 
    summary="Upload and parse a resume",
    description="Uploads a PDF or DOCX resume, parses the text, extracts contact information (name, email, phone), and saves the details."
)
async def upload_resume(
    file: UploadFile = File(..., description="The resume file to parse (PDF or DOCX)."),
    jd_text: str | None = Form(None),
    resume_service: ResumeService = Depends(get_resume_service),
    user: dict | None = Depends(get_current_user_optional)
):
    print(f"UPLOAD RESUME CALLED! jd_text received: {jd_text is not None}, length: {len(jd_text) if jd_text else 0}")
    user_id = user["id"] if user else None
    return await resume_service.process_and_save_resume(file, user_id=user_id, jd_text=jd_text)

from fastapi import HTTPException
@router.post(
    "/{resume_id}/claim",
    summary="Claim an anonymous scan",
    description="Assigns an anonymous scan to the currently authenticated user."
)
async def claim_resume(
    resume_id: str,
    user: dict = Depends(get_current_user_optional)
):
    if not user:
        raise HTTPException(status_code=401, detail="Must be logged in to claim a scan.")
    try:
        supabase_service.claim_resume(resume_id, user["id"])
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
