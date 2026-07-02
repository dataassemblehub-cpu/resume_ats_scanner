from fastapi import Header, HTTPException, Depends
from app.config import settings

async def get_current_user(authorization: str | None = Header(None)) -> dict:
    """
    Dependency injection helper that extracts and validates the Bearer token.
    Uses Supabase native auth engine to retrieve user metadata.
    """
    from app.services.supabase_service import SupabaseService
    supabase_service = SupabaseService()

    # 1. Production-locked test bypass check
    bypass_auth = settings.BYPASS_AUTH and settings.ENV != "production"
    if bypass_auth:
        # Resolve or create test user UUID
        user_uuid = supabase_service.get_or_create_user("test@example.com")
        return {
            "id": user_uuid,
            "email": "test@example.com",
            "subscription_plan": "free" if not settings.BYPASS_PREMIUM else "premium"
        }

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication credentials were not provided or are invalid."
        )

    token = authorization.split(" ")[1]

    # 2. Mock mode verification fallback when Supabase is not configured
    if not supabase_service.is_configured:
        email = "test@example.com"
        if token.count(".") == 2:
            try:
                import base64
                import json
                payload_part = token.split(".")[1]
                padding = "=" * (4 - len(payload_part) % 4)
                payload_data = json.loads(base64.urlsafe_b64decode(payload_part + padding).decode('utf-8'))
                if "email" in payload_data:
                    email = payload_data["email"]
            except Exception:
                pass
        elif token.startswith("mock-token-"):
            email = token.replace("mock-token-", "")
            
        user_id = supabase_service.get_or_create_user(email)
        user_record = supabase_service.get_user_by_uuid(user_id)
        if not user_record:
            raise HTTPException(status_code=401, detail="Invalid session token.")
        
        # Override to premium if bypass is enabled in non-production environments
        if settings.BYPASS_PREMIUM and settings.ENV != "production":
            user_record["subscription_plan"] = "premium"
        return user_record

    # 3. Native Supabase Auth Token verification
    try:
        auth_response = supabase_service.client.auth.get_user(token)
        if not auth_response or not auth_response.user:
            raise HTTPException(status_code=401, detail="Session expired or invalid token.")
        
        user_uuid = auth_response.user.id
        email = auth_response.user.email

        # Retrieve user database profile to fetch plan, counts, etc.
        user_profile = supabase_service.get_user_by_uuid(user_uuid)
        if not user_profile:
            # Fallback to create profile record if missing
            supabase_service.client.table("users").insert({
                "id": user_uuid,
                "email": email,
                "subscription_plan": "free"
            }).execute()
            user_profile = {
                "id": user_uuid,
                "email": email,
                "subscription_plan": "free",
                "ai_generation_count": 0,
                "last_ai_generation_at": None
            }
        
        # Override to premium if bypass is enabled in non-production environments
        if settings.BYPASS_PREMIUM and settings.ENV != "production":
            user_profile["subscription_plan"] = "premium"
            
        return user_profile
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication token verification failed: {str(e)}"
        )
