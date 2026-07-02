from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services.supabase_service import SupabaseService
from app.utils.auth_helper import hash_password, verify_password

# Standard base64url HMAC token creator (pure Python, zero-dependency)
import time
import base64
import json
import hmac
import hashlib
from app.config import settings

SECRET_KEY = settings.SUPABASE_KEY or "ats-secret-key-fallback-12345"

def create_jwt(payload: dict, expires_in_seconds: int = 3600 * 24) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload_copy = payload.copy()
    payload_copy["exp"] = int(time.time()) + expires_in_seconds
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode('utf-8')).decode('utf-8').rstrip('=')
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload_copy).encode('utf-8')).decode('utf-8').rstrip('=')
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip('=')
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

router = APIRouter(prefix="/auth", tags=["Authentication"])
supabase_service = SupabaseService()

class UserAuthRequest(BaseModel):
    email: EmailStr
    password: str

@router.post(
    "/register",
    summary="Register a new candidate profile",
    description="Registers a new candidate with email credentials and creates their free-tier profile."
)
async def register(request: UserAuthRequest):
    try:
        pw_hash = hash_password(request.password)
        user = supabase_service.create_user_with_hash(request.email, pw_hash)
        return {
            "id": user["id"],
            "email": user["email"],
            "subscription_plan": user["subscription_plan"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/login",
    summary="Authenticate candidate credentials",
    description="Verifies candidate credentials and returns a Bearer session JWT token."
)
async def login(request: UserAuthRequest):
    user = supabase_service.get_user_by_email(request.email)
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    # Generate Bearer JWT token
    token = create_jwt({"sub": user["id"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "subscription_plan": user["subscription_plan"]
        }
    }

# Shared module-level mock memory store for password reset tokens
_mock_reset_tokens = {}

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

@router.post(
    "/forgot-password",
    summary="Request a password reset link/token",
    description="Simulates sending a password reset email and records a mock token in test/development environments."
)
async def forgot_password(request: ForgotPasswordRequest):
    user = supabase_service.get_user_by_email(request.email)
    if not user:
        return {
            "status": "success",
            "message": "If the email is registered, a password reset link/token has been sent."
        }
    
    # Generate mock token
    import random
    mock_token = f"mock-reset-{random.randint(1000, 9999)}"
    _mock_reset_tokens[request.email] = mock_token
    
    if supabase_service.is_configured:
        try:
            supabase_service.client.auth.reset_password_for_email(request.email)
        except Exception as e:
            print(f"Warning: Supabase reset failed: {str(e)}")
            
    return {
        "status": "success",
        "message": "If the email is registered, a password reset link/token has been sent.",
        "debug_token": mock_token
    }

@router.post(
    "/reset-password",
    summary="Reset user password using token",
    description="Resets the password of the user associated with the verification token."
)
async def reset_password(request: ResetPasswordRequest):
    saved_token = _mock_reset_tokens.get(request.email)
    if not saved_token or saved_token != request.token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    
    _mock_reset_tokens.pop(request.email, None)
    
    pw_hash = hash_password(request.new_password)
    success = supabase_service.update_user_password(request.email, pw_hash)
    if not success:
        raise HTTPException(status_code=404, detail="User not found.")
        
    return {
        "status": "success",
        "message": "Password successfully updated. You may now log in."
    }

