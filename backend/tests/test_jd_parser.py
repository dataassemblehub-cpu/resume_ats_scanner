import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analyzers.jd_analyzer import JDAnalyzer
from app.services.jd_parser_service import JDParserService

client = TestClient(app)

# A sample job description for testing
SAMPLE_JD = """
Senior Python Backend Developer
Location: Remote
Experience: We are looking for someone with at least 5 years of industry experience.
Requirements:
- Strong skills in python and software engineering principles.
- Experience with web frameworks like fastapi or django.
- Familiarity with databases, specifically postgresql or mongodb.
- Proven experience with docker and aws.
Education:
- Bachelor's degree in Computer Science or equivalent.
Responsibilities:
- Design and implement scalable backend APIs.
- Collaborate with frontend engineers to integrate user-facing elements.
- Maintain code quality through unit testing.
"""

def test_jd_analyzer_extraction():
    """
    Test extraction logic of the raw analyzer.
    """
    analyzer = JDAnalyzer()
    
    # We mock or run the analysis. Note: we need spaCy model to be loaded.
    # If the spaCy model is installed, this will test the real extraction.
    try:
        result = analyzer.analyze(SAMPLE_JD)
        
        # Title check
        assert result["title"] == "Senior Python Backend Developer"
        
        # Skills & Tools check
        skills_lower = [s.lower() for s in result["skills"]]
        tools_lower = [t.lower() for t in result["tools"]]
        
        assert "software engineering" in skills_lower
        assert "python" in tools_lower
        assert "fastapi" in tools_lower
        assert "postgresql" in tools_lower
        assert "docker" in tools_lower
        assert "aws" in tools_lower
        
        # Experience check
        assert result["years_of_experience"] == 5.0
        
        # Education check
        assert "Bachelor's Degree" in result["education"]
        
        # Responsibilities check
        assert len(result["responsibilities"]) > 0
        assert "Design and implement scalable backend APIs." in result["responsibilities"]
    except Exception as e:
        pytest.fail(f"JDAnalyzer analysis failed: {str(e)}")


def test_jd_parser_service_validation():
    """
    Test that the service throws errors for invalid input.
    """
    service = JDParserService()
    
    with pytest.raises(ValueError, match="Job description text cannot be empty"):
        import asyncio
        asyncio.run(service.parse_jd(""))


def test_jd_parse_api_route():
    """
    Test the POST /jd/parse endpoint.
    """
    response = client.post("/jd/parse", json={"description": SAMPLE_JD})
    
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["title"] == "Senior Python Backend Developer"
    assert "Software Engineering" in json_data["skills"]
    assert "FastAPI" in json_data["tools"]
    assert json_data["years_of_experience"] == 5.0
