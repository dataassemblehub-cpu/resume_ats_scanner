import pytest
import json
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
import httpx

from app.main import app
from app.config import settings
from app.services.gemini_recommendation_service import GeminiRecommendationService
from app.routes.recommendation import get_recommendation_service

client = TestClient(app)

# Dummy inputs for testing
DUMMY_RESUME = "John Doe Software Engineer Python, FastAPI, Docker"
DUMMY_JD = "Seeking Senior Software Engineer with Python and Docker"
DUMMY_ATS = {
    "overall": 85,
    "skills": 90,
    "experience": 80,
    "projects": 85,
    "education": 90,
    "keywords": {
        "matched": ["Python", "Docker"],
        "missing": ["Kubernetes"],
        "frequencies": {"Python": 3}
    },
    "formatting": {
        "score": 90,
        "issues": ["No page numbers"],
        "warnings": ["Long paragraph"]
    }
}

MOCK_GEMINI_JSON = {
    "resume_summary": "Experienced software engineer specializing in Python development.",
    "strengths": ["Strong backend skills", "Containerization experience"],
    "weaknesses": ["Missing Kubernetes container orchestration skills"],
    "missing_skills": ["Kubernetes"],
    "ats_improvements": ["Add a dedicated Projects section if not already clear"],
    "recruiter_improvements": ["Ensure LinkedIn profile is present in contact info"],
    "suggested_bullet_points": ["Optimized backend microservices using Python and FastAPI"],
    "resume_improvements": ["Ensure resume is exactly 1-2 pages"],
    "ats_recommendations": ["Incorporate missing keywords in your experience bullets"]
}

def get_mock_response(status_code: int, content_dict: dict = None, is_text: bool = True):
    response = MagicMock(spec=httpx.Response)
    response.status_code = status_code
    if content_dict is not None:
        if is_text:
            # Gemini JSON is embedded in a JSON string within candidates[0].content.parts[0].text
            response.json.return_value = {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": json.dumps(content_dict)
                                }
                            ]
                        }
                    }
                ]
            }
        else:
            response.json.return_value = content_dict
    return response

def test_generate_recommendations_success():
    """
    Test successful generation of AI recommendations.
    """
    service = GeminiRecommendationService()
    service._cache.clear()

    mock_resp = get_mock_response(200, MOCK_GEMINI_JSON)

    with patch("app.services.gemini_recommendation_service.settings") as mock_settings, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_settings.GEMINI_API_KEY = "test_api_key"
        mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
        mock_post.return_value = mock_resp

        result = asyncio.run(service.generate_recommendations(DUMMY_RESUME, DUMMY_JD, DUMMY_ATS))

        assert result["status"] == "success"
        assert result["resume_summary"] == MOCK_GEMINI_JSON["resume_summary"]
        assert result["strengths"] == MOCK_GEMINI_JSON["strengths"]
        assert mock_post.call_count == 1

def test_generate_recommendations_cache_hit():
    """
    Test caching layer to verify second request is served from cache.
    """
    service = GeminiRecommendationService()
    service._cache.clear()

    mock_resp = get_mock_response(200, MOCK_GEMINI_JSON)

    with patch("app.services.gemini_recommendation_service.settings") as mock_settings, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_settings.GEMINI_API_KEY = "test_api_key"
        mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
        mock_post.return_value = mock_resp

        # First call (Cache Miss)
        result1 = asyncio.run(service.generate_recommendations(DUMMY_RESUME, DUMMY_JD, DUMMY_ATS))
        assert result1["status"] == "success"
        
        # Second call (Cache Hit)
        result2 = asyncio.run(service.generate_recommendations(DUMMY_RESUME, DUMMY_JD, DUMMY_ATS))
        assert result2["status"] == "success"
        
        # HTTP client post should only be called once
        assert mock_post.call_count == 1

def test_generate_recommendations_retry_logic():
    """
    Test exponential backoff retries when transient errors are returned.
    """
    service = GeminiRecommendationService()
    service._cache.clear()

    mock_429 = get_mock_response(429)
    mock_200 = get_mock_response(200, MOCK_GEMINI_JSON)

    with patch("app.services.gemini_recommendation_service.settings") as mock_settings, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        mock_settings.GEMINI_API_KEY = "test_api_key"
        mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
        
        # Returns 429 on first call, 200 on second call
        mock_post.side_effect = [mock_429, mock_200]

        result = asyncio.run(service.generate_recommendations(DUMMY_RESUME, DUMMY_JD, DUMMY_ATS))

        assert result["status"] == "success"
        assert mock_post.call_count == 2
        assert mock_sleep.call_count == 1
        # First retry backoff for 429: 5 * 1 = 5 seconds
        mock_sleep.assert_called_with(5)

def test_generate_recommendations_fallback_on_401():
    """
    Test immediate failure without retry on non-retryable error (e.g. 401 Unauthorized).
    """
    service = GeminiRecommendationService()
    service._cache.clear()

    mock_401 = get_mock_response(401)

    with patch("app.services.gemini_recommendation_service.settings") as mock_settings, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        mock_settings.GEMINI_API_KEY = "test_api_key"
        mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
        mock_post.return_value = mock_401

        result = asyncio.run(service.generate_recommendations(DUMMY_RESUME, DUMMY_JD, DUMMY_ATS))

        assert result["status"] == "unavailable"
        assert mock_post.call_count == 1
        assert mock_sleep.call_count == 0

def test_generate_recommendations_fallback_on_exhausted_retries():
    """
    Test fallback behavior if all retries return 500 error.
    """
    service = GeminiRecommendationService()
    service._cache.clear()

    mock_500 = get_mock_response(500)

    with patch("app.services.gemini_recommendation_service.settings") as mock_settings, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        mock_settings.GEMINI_API_KEY = "test_api_key"
        mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
        mock_post.return_value = mock_500

        result = asyncio.run(service.generate_recommendations(DUMMY_RESUME, DUMMY_JD, DUMMY_ATS))

        assert result["status"] == "unavailable"
        assert mock_post.call_count == 3
        assert mock_sleep.call_count == 2

def test_generate_recommendations_fallback_on_invalid_json():
    """
    Test fallback behavior when Gemini returns bad JSON or missing fields.
    """
    service = GeminiRecommendationService()
    service._cache.clear()

    # Missing resume_summary and other keys
    bad_json = {"status": "success"}
    mock_resp = get_mock_response(200, bad_json)

    with patch("app.services.gemini_recommendation_service.settings") as mock_settings, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_settings.GEMINI_API_KEY = "test_api_key"
        mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
        mock_post.return_value = mock_resp

        result = asyncio.run(service.generate_recommendations(DUMMY_RESUME, DUMMY_JD, DUMMY_ATS))

        assert result["status"] == "unavailable"
        assert mock_post.call_count == 1

def test_generate_recommendations_model_fallback_rotation():
    """
    Test that retry attempts cycle through configured primary and fallback models.
    """
    service = GeminiRecommendationService()
    service._cache.clear()

    mock_429 = get_mock_response(429)
    mock_200 = get_mock_response(200, MOCK_GEMINI_JSON)

    with patch("app.services.gemini_recommendation_service.settings") as mock_settings, \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
         patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        mock_settings.GEMINI_API_KEY = "test_api_key"
        mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
        mock_settings.GEMINI_FALLBACK_MODELS = "gemini-2.5-flash-lite,gemini-flash-lite-latest"

        # Returns 429 on first, 429 on second, 200 on third
        mock_post.side_effect = [mock_429, mock_429, mock_200]

        result = asyncio.run(service.generate_recommendations(DUMMY_RESUME, DUMMY_JD, DUMMY_ATS))

        assert result["status"] == "success"
        assert mock_post.call_count == 3
        assert mock_sleep.call_count == 2

        # Verify URLs contained the correct model names in rotation order
        calls = mock_post.call_args_list
        url_attempt1 = calls[0][0][0]
        url_attempt2 = calls[1][0][0]
        url_attempt3 = calls[2][0][0]

        assert "gemini-2.5-flash" in url_attempt1
        assert "gemini-2.5-flash-lite" in url_attempt2
        assert "gemini-flash-lite-latest" in url_attempt3

def test_recommendation_api_route():
    """
    Test POST /analyze/recommendation API endpoint using Dependency Injection override.
    """
    # Bypass authentication for endpoint test
    orig_bypass = settings.BYPASS_AUTH
    orig_env = settings.ENV
    settings.BYPASS_AUTH = True
    settings.ENV = "development"
    
    mock_service = AsyncMock()
    mock_service.generate_recommendations.return_value = {
        "status": "success",
        "resume_summary": "Test Summary",
        "strengths": ["HTML"],
        "weaknesses": ["CSS"],
        "missing_skills": ["JS"],
        "ats_improvements": [],
        "recruiter_improvements": [],
        "suggested_bullet_points": [],
        "resume_improvements": [],
        "ats_recommendations": []
    }

    # Inject mock service
    app.dependency_overrides[get_recommendation_service] = lambda: mock_service

    payload = {
        "resume_text": DUMMY_RESUME,
        "jd_text": DUMMY_JD,
        "ats_results": DUMMY_ATS
    }

    headers = {"Authorization": "Bearer mock-token-test@example.com"}
    response = client.post("/analyze/recommendation", json=payload, headers=headers)
    
    # Restore settings
    settings.BYPASS_AUTH = orig_bypass
    settings.ENV = orig_env
    
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["resume_summary"] == "Test Summary"
    assert json_data["strengths"] == ["HTML"]

    app.dependency_overrides.clear()
