import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analyzers.score_engine import (
    KeywordScoringStrategy,
    SectionScoringStrategy,
    ExperienceScoringStrategy,
    EducationScoringStrategy,
    FormattingScoringStrategy,
    ATSScoreEngine
)

client = TestClient(app)

def test_keyword_scoring():
    strategy = KeywordScoringStrategy()
    resume_data = {"keyword_analysis": {"coverage_percentage": 75.0}}
    # 75% of 40 = 30 points
    assert strategy.calculate(resume_data, {}) == 30.0


def test_section_scoring():
    strategy = SectionScoringStrategy()
    # 4 core sections detected -> 4 * 4 = 16 points
    resume_data = {
        "sections_detected": {
            "summary": True,
            "experience": True,
            "skills": True,
            "education": True,
            "projects": False,
            "certificates": True
        }
    }
    assert strategy.calculate(resume_data, {}) == 16.0


def test_experience_scoring():
    strategy = ExperienceScoringStrategy()
    
    # JD requires 5 years, candidate has 3
    assert strategy.calculate(
        {"years_of_experience": 3.0},
        {"years_of_experience": 5.0}
    ) == 12.0 # (3 / 5) * 20 = 12

    # JD requires 3 years, candidate has 5
    assert strategy.calculate(
        {"years_of_experience": 5.0},
        {"years_of_experience": 3.0}
    ) == 20.0 # Exceeds, max 20

    # No requirement
    assert strategy.calculate(
        {"years_of_experience": 0.0},
        {"years_of_experience": 0.0}
    ) == 20.0


def test_education_scoring():
    strategy = EducationScoringStrategy()
    
    # JD requires Master's, Candidate has Bachelor's
    assert strategy.calculate(
        {"education": ["Bachelor's Degree"]},
        {"education": ["Master's Degree"]}
    ) == 2 / 3 * 10.0 # (2 / 3) * 10 = 6.666...

    # JD requires Bachelor's, Candidate has Master's
    assert strategy.calculate(
        {"education": ["Master's Degree"]},
        {"education": ["Bachelor's Degree"]}
    ) == 10.0 # Exceeds


def test_formatting_scoring():
    strategy = FormattingScoringStrategy()
    
    # Email, Phone, and word count present
    resume_data = {
        "email": "test@example.com",
        "phone": "123-456-7890",
        "parsed_text": "word " * 120 # 120 words
    }
    assert strategy.calculate(resume_data, {}) == 10.0 # 4 + 4 + 2

    # Missing phone
    resume_data = {
        "email": "test@example.com",
        "phone": None,
        "parsed_text": "word " * 120
    }
    assert strategy.calculate(resume_data, {}) == 6.0 # 4 + 0 + 2


def test_score_engine_overall():
    engine = ATSScoreEngine()
    
    resume_data = {
        "keyword_analysis": {"coverage_percentage": 50.0}, # 20 pts
        "sections_detected": {
            "summary": True, "experience": True, "skills": True, "education": True, "projects": True
        }, # 20 pts
        "years_of_experience": 4.0, # 16 pts (against 5 req)
        "education": ["Bachelor's Degree"], # 10 pts (against Bachelor's req)
        "email": "test@example.com",
        "phone": "123-456-7890",
        "parsed_text": "word " * 150 # 10 pts (formatting)
    }
    
    jd_data = {
        "years_of_experience": 5.0,
        "education": ["Bachelor's Degree"]
    }
    
    result = engine.score(resume_data, jd_data)
    assert result["score"] == 76 # 20 + 20 + 16 + 10 + 10 = 76
    assert result["breakdown"]["keywords"] == 20.0
    assert result["breakdown"]["formatting"] == 10.0


def test_ats_score_api_route():
    """
    Test POST /analyze/score endpoint end-to-end.
    """
    resume_text = (
        "Alice Smith\n"
        "Summary\n"
        "Python engineer with 4 years of experience.\n"
        "Experience\n"
        "Software Engineer at Google\n"
        "Developed and maintained scalable APIs using Python and FastAPI. "
        "Collaborated with project managers and frontend developers to build "
        "production grade applications. Maintained high code quality and test coverage. "
        "Deployed code to AWS using Docker containers and GitLab CI/CD pipelines. "
        "Optimized database performance in PostgreSQL by rewriting SQL queries and "
        "adding indexing to large tables. Participated in daily scrum meetings.\n"
        "Junior Developer at Startup\n"
        "Wrote python scripts and designed database tables. Maintained test coverage. "
        "Worked on backend bugs and monitored web app metrics.\n"
        "Skills\n"
        "Python, FastAPI, SQL, Docker, AWS\n"
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
    
    assert "score" in json_data
    assert "breakdown" in json_data
    assert json_data["score"] > 50 # Standard resume should match fairly well
    assert json_data["breakdown"]["formatting"] == 10.0 # Email, phone, length present
