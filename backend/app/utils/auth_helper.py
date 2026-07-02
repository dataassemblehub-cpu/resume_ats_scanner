import os
import hashlib
import hmac
import base64
import json
import time
from fastapi import Header, HTTPException, Depends
from app.config import settings

# Global reference to secret key
SECRET_KEY = settings.SUPABASE_KEY or "ats-secret-key-fallback-12345"

def verify_jwt(token: str) -> dict | None:
    """
    Decodes and verifies signature of local JWT tokens signed with SECRET_KEY.
    """
    if not token or token.count(".") != 2:
        return None
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
        
        # Verify signature
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip('=')
        
        if not hmac.compare_digest(sig_b64, expected_sig_b64):
            return None
            
        # Decode payload
        padding = "=" * (4 - len(payload_b64) % 4)
        payload_data = json.loads(base64.urlsafe_b64decode(payload_b64 + padding).decode('utf-8'))
        
        # Verify expiration
        if payload_data.get("exp", 0) < time.time():
            return None
            
        return payload_data
    except Exception:
        return None

def hash_password(password: str) -> str:
    """
    PBKDF2 SHA-256 password hashing with constant salt.
    Guarantees OS-independent execution without external package compiles.
    """
    salt = b"ats_password_salt_constant"
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return base64.b64encode(pw_hash).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    """
    Verifies a password against its PBKDF2 hash.
    """
    if not hashed:
        return False
    return hmac.compare_digest(hash_password(password), hashed)

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

    # 1.5. Local JWT signature verification first
    local_payload = verify_jwt(token)
    if local_payload and "sub" in local_payload:
        user_uuid = local_payload["sub"]
        user_profile = supabase_service.get_user_by_uuid(user_uuid)
        if not user_profile:
            raise HTTPException(
                status_code=401,
                detail="User session expired or user profile not found."
            )
        # Override to premium if bypass is enabled in non-production environments
        if settings.BYPASS_PREMIUM and settings.ENV != "production":
            user_profile["subscription_plan"] = "premium"
        return user_profile

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
            # Try migrating by email if profile exists under a different UUID
            user_profile = supabase_service.migrate_user_uuid_by_email(email, user_uuid)
            
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
