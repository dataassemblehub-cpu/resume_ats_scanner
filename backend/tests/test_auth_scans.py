import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.services.supabase_service import SupabaseService
from app.services.entitlement_service import EntitlementService

client = TestClient(app)
supabase_service = SupabaseService()

@pytest.fixture(autouse=True)
def setup_mock_db():
    # Reset in-memory mockup database before each test
    SupabaseService._mock_users.clear()
    SupabaseService._mock_resumes.clear()
    
    # Register default test user
    SupabaseService._mock_users["00000000-0000-0000-0000-000000000000"] = {
        "id": "00000000-0000-0000-0000-000000000000",
        "email": "test@example.com",
        "subscription_plan": "free",
        "ai_generation_count": 0,
        "last_ai_generation_at": None,
        "password_hash": "mocked_password_hash_12345"
    }
    
    # Store initial settings
    orig_bypass_auth = settings.BYPASS_AUTH
    orig_bypass_premium = settings.BYPASS_PREMIUM
    orig_env = settings.ENV
    
    # Disable bypasses by default for tests to ensure real auth/premium gating is verified
    settings.BYPASS_AUTH = False
    settings.BYPASS_PREMIUM = False
    
    yield
    
    # Restore settings
    settings.BYPASS_AUTH = orig_bypass_auth
    settings.BYPASS_PREMIUM = orig_bypass_premium
    settings.ENV = orig_env

def test_auth_registration_and_login():
    # 1. Register a new user
    reg_data = {"email": "candidate@example.com", "password": "securepassword123"}
    reg_res = client.post("/auth/register", json=reg_data)
    assert reg_res.status_code == 200
    assert reg_res.json()["email"] == "candidate@example.com"
    assert reg_res.json()["subscription_plan"] == "free"

    # 2. Registering duplicate user fails
    dup_res = client.post("/auth/register", json=reg_data)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Log in user
    login_res = client.post("/auth/login", json=reg_data)
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()
    assert login_res.json()["token_type"] == "bearer"
    token = login_res.json()["access_token"]

    # 4. Access protected profile route
    headers = {"Authorization": f"Bearer {token}"}
    profile_res = client.get("/user/profile", headers=headers)
    assert profile_res.status_code == 200
    assert profile_res.json()["email"] == "candidate@example.com"
    assert profile_res.json()["subscription_plan"] == "free"
    assert profile_res.json()["entitlements"]["can_generate_ai"] is True
    assert profile_res.json()["entitlements"]["can_export_report"] is False

def test_unauthenticated_request_throws_401():
    res = client.get("/user/profile")
    assert res.status_code == 401

def test_entitlements_service():
    # Test Free user entitlements
    free_user = {"subscription_plan": "free", "ai_generation_count": 0}
    assert EntitlementService.can_generate_ai(free_user) is True
    assert EntitlementService.can_export_report(free_user) is False

    # Free user with exhausted quota
    exhausted_user = {"subscription_plan": "free", "ai_generation_count": 1}
    assert EntitlementService.can_generate_ai(exhausted_user) is False

    # Premium user entitlements
    premium_user = {"subscription_plan": "premium", "ai_generation_count": 5}
    assert EntitlementService.can_generate_ai(premium_user) is True
    assert EntitlementService.can_export_report(premium_user) is True

def test_upgrade_locked_outside_development():
    # Sign up & login
    reg_data = {"email": "candidate@example.com", "password": "password"}
    client.post("/auth/register", json=reg_data)
    token = client.post("/auth/login", json=reg_data).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Set ENV to production
    settings.ENV = "production"
    
    # Attempt simulated upgrade
    upgrade_res = client.post("/user/upgrade", headers=headers)
    assert upgrade_res.status_code == 403
    assert "restricted in production" in upgrade_res.json()["detail"]

    # Set ENV to development
    settings.ENV = "development"
    
    # Try simulated upgrade again
    upgrade_res = client.post("/user/upgrade", headers=headers)
    assert upgrade_res.status_code == 200
    assert upgrade_res.json()["user"]["subscription_plan"] == "premium"
    assert upgrade_res.json()["user"]["entitlements"]["can_export_report"] is True

def test_paginated_scans():
    # Login as default test user (with mock token auth bypass)
    settings.BYPASS_AUTH = True
    settings.ENV = "development"
    headers = {"Authorization": "Bearer mock-token-test@example.com"}
    
    user_uuid = "00000000-0000-0000-0000-000000000000"
    supabase_service._mock_resumes.clear()

    # Populate 15 mockup resumes
    for i in range(15):
        supabase_service.save_resume(
            user_id=user_uuid,
            file_name=f"resume-{i}.pdf",
            parsed_text=f"Parsed text {i}",
            name="Test Candidate",
            email="test@example.com",
            phone="12345"
        )

    # 1. Fetch scans (should be capped at 10 items due to automatic soft-pruning)
    scans_res = client.get("/scans?page=1&limit=10", headers=headers)
    assert scans_res.status_code == 200
    data = scans_res.json()
    assert len(data["items"]) == 10
    assert data["total"] == 10
    assert data["page"] == 1
    assert data["pages"] == 1

    # Verify that the oldest 5 resumes are soft deleted (is_deleted is True)
    soft_deleted_count = sum(1 for r in supabase_service._mock_resumes.values() if r.get("is_deleted") is True)
    assert soft_deleted_count == 5
