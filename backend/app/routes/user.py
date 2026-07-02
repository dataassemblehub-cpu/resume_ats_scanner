from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth_helper import get_current_user
from app.services.entitlement_service import EntitlementService
from app.services.supabase_service import SupabaseService
from app.config import settings

router = APIRouter(prefix="/user", tags=["User Profile"])
supabase_service = SupabaseService()

@router.get(
    "/profile",
    summary="Retrieve current user profile and entitlements",
    description="Returns authenticated user metadata and explicit entitlement flags."
)
async def get_profile(user: dict = Depends(get_current_user)):
    # Centralize feature entitlement checks
    entitlements = EntitlementService.get_entitlements(user)
    return {
        "id": user["id"],
        "email": user["email"],
        "subscription_plan": user["subscription_plan"],
        "ai_generation_count": user.get("ai_generation_count", 0),
        "last_ai_generation_at": user.get("last_ai_generation_at"),
        "entitlements": entitlements
    }

@router.get(
    "/usage",
    summary="Retrieve AI usage limits",
    description="Returns total lifetime recommendations generated and maximum allowed limits."
)
async def get_usage(user: dict = Depends(get_current_user)):
    limit = -1 if user["subscription_plan"] == "premium" else 1
    return {
        "plan": user["subscription_plan"],
        "ai_generation_count": user.get("ai_generation_count", 0),
        "limit": limit,
        "quota_exhausted": user["subscription_plan"] == "free" and user.get("ai_generation_count", 0) >= 1
    }

@router.post(
    "/upgrade",
    summary="Simulated account upgrade (development only)",
    description="Upgrades user subscription tier to premium. Permitted only in development environments."
)
async def upgrade_user(user: dict = Depends(get_current_user)):
    # Production check: Upgrade is locked outside development environment
    if settings.ENV != "development":
        raise HTTPException(
            status_code=403,
            detail="Account upgrading is restricted in production environments."
        )

    try:
        updated = supabase_service.update_user_plan(user["id"], "premium")
        if not updated:
            raise HTTPException(status_code=500, detail="Failed to upgrade plan in database.")
        
        entitlements = EntitlementService.get_entitlements(updated)
        return {
            "message": "Account successfully upgraded to Premium!",
            "user": {
                "id": updated["id"],
                "email": updated["email"],
                "subscription_plan": updated["subscription_plan"],
                "entitlements": entitlements
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
