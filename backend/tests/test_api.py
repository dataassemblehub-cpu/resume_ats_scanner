import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from app.main import app
from app.routes.resume import get_resume_service

client = TestClient(app)

def test_upload_resume_api():
    """
    Test POST /resume/upload route by overriding dependency injection for ResumeService.
    """
    # Create mock ResumeService
    mock_service = AsyncMock()
    mock_service.process_and_save_resume.return_value = {
        "id": "12345678-1234-1234-1234-123456789012",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "123-456-7890",
        "parsed_text": "John Doe\nSoftware Engineer\njohn.doe@example.com"
    }
    
    # Inject mock service
    app.dependency_overrides[get_resume_service] = lambda: mock_service
    
    # Perform file upload POST request
    files = {"file": ("resume.pdf", b"mock binary pdf content", "application/pdf")}
    response = client.post("/resume/upload", files=files)
    
    # Asserts
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["id"] == "12345678-1234-1234-1234-123456789012"
    assert json_data["name"] == "John Doe"
    assert json_data["email"] == "john.doe@example.com"
    assert json_data["phone"] == "123-456-7890"
    
    # Clean up overrides
    app.dependency_overrides.clear()
