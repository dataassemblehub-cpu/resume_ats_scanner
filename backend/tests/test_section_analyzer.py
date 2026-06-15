import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analyzers.section_analyzer import SectionAnalyzer

client = TestClient(app)

SAMPLE_RESUME = """
John Doe
Software Engineer

SUMMARY
Passionate backend engineer with 5 years of experience in Python and FastAPI.

EXPERIENCE
Software Engineer at Tech Corp
2021 - Present
- Built high-performance microservices.
- Optimized database queries in PostgreSQL.

PROJECTS
ATS Scanner (FastAPI, React)
- Built an open-source resume scanner tool.

SKILLS
Python, Go, SQL, FastAPI, PostgreSQL, Docker, AWS, Git

EDUCATION
Bachelor of Science in Computer Science
State University (2017 - 2021)

CERTIFICATIONS
AWS Certified Solutions Architect (2023)

AWARDS
Hackathon Winner (2020)
"""

def test_section_analyzer_success():
    """
    Test SectionAnalyzer successfully segments a standard resume.
    """
    analyzer = SectionAnalyzer()
    result = analyzer.analyze(SAMPLE_RESUME)
    
    # Check that all sections are detected
    assert result["sections_detected"]["summary"] is True
    assert result["sections_detected"]["experience"] is True
    assert result["sections_detected"]["projects"] is True
    assert result["sections_detected"]["skills"] is True
    assert result["sections_detected"]["education"] is True
    assert result["sections_detected"]["certificates"] is True
    assert result["sections_detected"]["achievements"] is True

    # Check offsets are valid ranges
    for cat, offsets in result["section_offsets"].items():
        assert len(offsets) == 2
        assert offsets[0] < offsets[1] or (offsets[0] == -1 and offsets[1] == -1)

    # Check content values
    assert "Passionate backend engineer" in result["section_text"]["summary"]
    assert "Software Engineer at Tech Corp" in result["section_text"]["experience"]
    assert "ATS Scanner (FastAPI, React)" in result["section_text"]["projects"]
    assert "Python, Go, SQL" in result["section_text"]["skills"]
    assert "Bachelor of Science" in result["section_text"]["education"]
    assert "AWS Certified Solutions Architect" in result["section_text"]["certificates"]
    assert "Hackathon Winner" in result["section_text"]["achievements"]


def test_section_analyzer_fallback():
    """
    Test SectionAnalyzer fallback logic for missing section headers.
    """
    resume_no_headers = (
        "John Doe\n"
        "Python Developer\n"
        "Python, Javascript, Typescript, HTML, CSS, SQL, React, Docker, Git\n"
        "Experience:\n"
        "Senior Developer (2018 - Present)\n"
        "Collaborated with project managers.\n"
        "Junior Developer (2015 - 2018)\n"
        "Wrote test suites."
    )
    
    analyzer = SectionAnalyzer()
    result = analyzer.analyze(resume_no_headers)
    
    # Skills section should be detected via list heuristic fallback
    assert result["sections_detected"]["skills"] is True
    assert "Python, Javascript" in result["section_text"]["skills"]
    
    # Experience should be detected via date heuristic fallback
    assert result["sections_detected"]["experience"] is True
    assert "Senior Developer" in result["section_text"]["experience"]


def test_section_detection_api():
    """
    Test POST /resume/sections route.
    """
    response = client.post("/resume/sections", json={"text": SAMPLE_RESUME})
    assert response.status_code == 200
    json_data = response.json()
    
    assert json_data["sections_detected"]["summary"] is True
    assert json_data["sections_detected"]["experience"] is True
    assert "Passionate backend engineer" in json_data["section_text"]["summary"]
