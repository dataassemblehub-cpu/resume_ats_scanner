from fastapi import APIRouter, Depends, HTTPException, Query
from app.utils.auth_helper import get_current_user
from app.services.supabase_service import SupabaseService

router = APIRouter(prefix="/history", tags=["Scan History"])
supabase_service = SupabaseService()

@router.get(
    "",
    summary="Retrieve paginated scan history",
    description="Returns a paginated list of past ATS scans performed by the authenticated user."
)
async def get_history(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    user: dict = Depends(get_current_user)
):
    try:
        paginated_history = supabase_service.get_user_by_uuid(user["id"])
        if not paginated_history:
            raise HTTPException(status_code=404, detail="User record not found.")
            
        return supabase_service.get_user_history_paginated(user["id"], page, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/{resume_id}",
    summary="Retrieve detailed scan results",
    description="Loads full scan details (score, formatting, keywords, recommendations) for a specific historical upload."
)
async def get_history_detail(
    resume_id: str,
    user: dict = Depends(get_current_user)
):
    try:
        resume = supabase_service.get_resume_by_id(user["id"], resume_id)
        if not resume:
            raise HTTPException(
                status_code=404, 
                detail="Resume record not found or access unauthorized."
            )
            
        # Parse recommendations JSON if stored as string
        import json
        recs = resume.get("recommendations")
        if isinstance(recs, str):
            try:
                recs = json.loads(recs)
            except Exception:
                recs = None
                
        # Re-construct the structured response representing the scan
        # Note: formatting analysis needs to be mapped to the saved fields or we mock it.
        # To make it simple, we can fetch all fields.
        return {
            "resumeDetails": {
                "id": resume["id"],
                "name": resume.get("name"),
                "email": resume.get("email"),
                "phone": resume.get("phone"),
                "parsed_text": resume["parsed_text"]
            },
            "jd_text": resume.get("jd_text"),
            "recommendations": recs,
            "created_at": resume["created_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete(
    "/{resume_id}",
    summary="Delete a historical scan record",
    description="Deletes a past ATS scan from history after confirming user ownership."
)
async def delete_history_item(
    resume_id: str,
    user: dict = Depends(get_current_user)
):
    try:
        success = supabase_service.delete_history_by_id(user["id"], resume_id)
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="Resume record not found or access unauthorized."
            )
        return {"status": "success", "message": "Record successfully removed from scan history."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
