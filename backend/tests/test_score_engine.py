import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analyzers.score_engine import ATSScoreEngine

client = TestClient(app)

def test_ats_score_engine_normalization():
    """
    Test that missing sections are dynamically normalized and do not destroy overall score.
    """
    engine = ATSScoreEngine()
    
    # 1. All sections exist
    resume_data_full = {
        "parsed_text": "Alice Smith\nSummary\nPython developer.",
        "section_text": {
            "skills": "Python, SQL, PySpark, AWS, Docker",
            "experience": "Senior Software Engineer. Designed data pipelines and managed cloud infrastructure.",
            "projects": "Data Engineer ETL orchestration using Airflow. Built web scrapers in Python.",
            "education": "Bachelor of Science in Computer Science"
        },
        "keyword_analysis": {"coverage_percentage": 80.0}
    }
    
    jd_data = {
        "raw_text": "Looking for a Data Engineer with Python, SQL, AWS, and PySpark skills.",
        "skills": ["Python", "SQL", "PySpark"],
        "tools": ["AWS", "Docker"],
        "responsibilities": ["Design data pipelines", "Manage cloud infrastructure"],
        "education": ["Bachelor's Degree"]
    }
    
    result_full = engine.score(resume_data_full, jd_data)
    assert result_full["skills"] > 50
    assert result_full["experience"] > 50
    assert result_full["projects"] > 20
    assert result_full["education"] > 50
    assert result_full["overall"] > 50

    # 2. Projects section is missing. Weight for projects (0.1) should be dropped,
    # and the score should be normalized over remaining weight (0.9).
    resume_data_missing_projects = {
        "parsed_text": "Alice Smith\nSummary\nPython developer.",
        "section_text": {
            "skills": "Python, SQL, PySpark, AWS, Docker",
            "experience": "Senior Software Engineer. Designed data pipelines and managed cloud infrastructure.",
            "projects": "", # Missing!
            "education": "Bachelor of Science in Computer Science"
        },
        "keyword_analysis": {"coverage_percentage": 80.0}
    }
    
    result_missing = engine.score(resume_data_missing_projects, jd_data)
    assert result_missing["projects"] == 0
    # Education, Skills, and Experience should still match well and overall should not be ruined.
    assert result_missing["overall"] > 50
    
    # Expected overall calculation check:
    # overall = (skills * 0.4 + experience * 0.4 + education * 0.1) / 0.9
    expected_overall = int(round(
        (result_missing["skills"] * 0.4 + result_missing["experience"] * 0.4 + result_missing["education"] * 0.1) / 0.9
    ))
    assert result_missing["overall"] == expected_overall

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
    
    assert isinstance(json_data["skills"], int)
    assert isinstance(json_data["experience"], int)
    assert isinstance(json_data["overall"], int)
