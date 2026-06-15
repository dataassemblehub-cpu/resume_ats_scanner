import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analyzers.score_engine import ATSScoreEngine

client = TestClient(app)

def test_ats_score_engine():
    """
    Test direct score calculation of ATSScoreEngine.
    """
    engine = ATSScoreEngine()
    
    resume_data = {
        "parsed_text": "Alice Smith\nSummary\nPython developer.",
        "section_text": {
            "skills": "Python, SQL, PySpark, AWS, Docker",
            "experience": "Senior Software Engineer. Designed data pipelines and managed cloud infrastructure.",
            "projects": "ETL orchestration using Airflow. Built web scrapers.",
            "education": "Bachelor of Science in Computer Science"
        }
    }
    
    jd_data = {
        "raw_text": "Looking for a Data Engineer with Python, SQL, AWS, and PySpark skills.",
        "skills": ["Python", "SQL", "PySpark"],
        "tools": ["AWS", "Docker"],
        "responsibilities": ["Design data pipelines", "Manage cloud infrastructure"],
        "education": ["Bachelor's Degree"]
    }
    
    result = engine.score(resume_data, jd_data)
    assert "skills" in result
    assert "experience" in result
    assert "projects" in result
    assert "education" in result
    assert "overall" in result
    
    # Assert values are reasonable (high score for good matching data)
    assert result["skills"] > 50
    assert result["experience"] > 50
    assert result["overall"] > 50

def test_ats_score_api_route():
    """
    Test POST /analyze/score endpoint end-to-end.
    """
    resume_text = (
        "Alice Smith\n"
        "Summary\n"
        "Python engineer with 4 years of experience.\n"
        "Experience\n"
        "Software Engineer at Tech Corp\n"
        "Developed and maintained scalable APIs using Python and FastAPI. "
        "Collaborated with project managers and frontend developers to build "
        "production grade applications. Maintained high code quality and test coverage. "
        "Deployed code to AWS using Docker containers and GitLab CI/CD pipelines. "
        "Optimized database performance in PostgreSQL by rewriting SQL queries and "
        "adding indexing to large tables. Participated in daily scrum meetings.\n"
        "Skills\n"
        "Python, FastAPI, SQL, Docker, AWS\n"
        "Projects\n"
        "Built a real-time data sync pipeline with Airflow and Docker.\n"
        "Education\n"
        "Bachelor of Science in Computer Science\n"
        "alice.smith@example.com | 123-456-7890"
    )
    jd_text = (
        "Seeking a Python Developer. Must know FastAPI and Docker. "
        "Requires at least 4 years of experience and a Bachelor's degree."
    )
    
    payload = {
        "resume_text": resume_text,
        "jd_text": jd_text
    }
    
    response = client.post("/analyze/score", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    
    assert "skills" in json_data
    assert "experience" in json_data
    assert "projects" in json_data
    assert "education" in json_data
    assert "overall" in json_data
    
    # Assert type correctness
    assert isinstance(json_data["skills"], int)
    assert isinstance(json_data["experience"], int)
    assert isinstance(json_data["overall"], int)
