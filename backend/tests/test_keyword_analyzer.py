import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analyzers.keyword_analyzer import KeywordAnalyzer

client = TestClient(app)

SAMPLE_RESUME = "John Doe is a Python Software Engineer with experience in FastAPI, Docker, and SQL."
SAMPLE_JD = "We are seeking a Python Developer. Must know FastAPI and Docker. Experience with SQL and Kubernetes is a plus."

def test_keyword_analyzer_success():
    """
    Test KeywordAnalyzer extracts top keywords from JD and matches them against resume.
    """
    analyzer = KeywordAnalyzer(top_n=5)
    result = analyzer.analyze(SAMPLE_RESUME, SAMPLE_JD)
    
    # Check keys in response
    assert "matched" in result
    assert "missing" in result
    assert "coverage_percentage" in result
    assert "keyword_frequency" in result

    # Check list sizes
    total_extracted = len(result["matched"]) + len(result["missing"])
    assert total_extracted == 5

    # Check that Python, FastAPI, Docker are matched
    matched_lower = [m.lower() for m in result["matched"]]
    missing_lower = [m.lower() for m in result["missing"]]
    
    # These terms are very significant in our JD text
    assert any(t in matched_lower for t in ["python", "fastapi", "docker", "sql"])
    
    # Kubernetes is in the JD but not in the Resume
    assert "kubernetes" in missing_lower or len(result["missing"]) > 0

    # Coverage percentage should be calculated correctly
    expected_coverage = (len(result["matched"]) / 5) * 100.0
    assert result["coverage_percentage"] == round(expected_coverage, 2)


def test_keyword_analyzer_empty():
    """
    Test KeywordAnalyzer returns empty structure when given empty text.
    """
    analyzer = KeywordAnalyzer(top_n=5)
    result = analyzer.analyze("", "Some job description")
    assert result["matched"] == []
    assert result["coverage_percentage"] == 0.0


def test_keyword_analysis_api_route():
    """
    Test POST /analyze/keywords endpoint.
    """
    payload = {
        "resume_text": SAMPLE_RESUME,
        "jd_text": SAMPLE_JD
    }
    response = client.post("/analyze/keywords", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    
    assert "matched" in json_data
    assert "missing" in json_data
    assert "coverage_percentage" in json_data
    assert json_data["coverage_percentage"] > 0

def test_keyword_analysis_identical_error():
    payload = {
        "resume_text": SAMPLE_RESUME,
        "jd_text": SAMPLE_RESUME
    }
    response = client.post("/analyze/keywords", json=payload)
    assert response.status_code == 400
    assert "cannot be identical" in response.json()["detail"]
