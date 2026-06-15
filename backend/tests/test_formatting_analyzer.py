import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analyzers.formatting_analyzer import FormattingAnalyzer

client = TestClient(app)

def test_formatting_analyzer_clean():
    """
    Test formatting analyzer on a clean, well-structured resume.
    """
    analyzer = FormattingAnalyzer()
    
    clean_resume = (
        "John Doe\n"
        "john.doe@example.com | 123-456-7890 | linkedin.com/in/johndoe\n"
        "\n"
        "Summary\n"
        "Experienced software developer specializing in Python backend engineering.\n"
        "\n"
        "Skills\n"
        "• Python, FastAPI, Docker, SQL\n"
        "\n"
        "Experience\n"
        "• Software Engineer at Tech Corp (2023 - Present)\n"
        "  - Built scalable REST APIs using FastAPI and Python.\n"
        "  - Optimized database query runtimes by 30%.\n"
        "• Junior Developer at Dev Inc (2021 - 2023)\n"
        "  - Deployed containerized applications to AWS.\n"
        "  - Maintained code coverage and resolved frontend bugs.\n"
        "\n"
        "Education\n"
        "• Bachelor of Science in Computer Science (2021)\n"
    )
    
    result = analyzer.analyze(clean_resume)
    assert len(result["issues"]) == 0
    assert len(result["warnings"]) == 0
    assert len(result["recommendations"]) == 0

def test_formatting_analyzer_issues():
    """
    Test formatting analyzer on a resume with multiple layout and content issues.
    """
    analyzer = FormattingAnalyzer()
    
    poor_resume = (
        "Alice Smith\n"
        "Education\n"
        "Master of Science in Mathematics\n"
        "\n"
        "Experience\n"
        "No email or phone or linkedin listed here. "
        "Also, this is a very long paragraph that has more than 80 words without any bullet points or line breaks. "
        "We are writing this long block of text specifically to test if the formatting analyzer will correctly detect it and flag it as a warning so that candidates know that recruiters and ATS systems prefer concise bullet points rather than large walls of text that are hard to read and parse. "
        "We expect it to flag this paragraph as a warning. "
        "Let's add some more words here to ensure it crosses the 80 words limit easily.\n"
        "\n"
        "This is a line with | pipes | to | simulate | a | table.\n"
        "This is another line with | pipes | for | table | format.\n"
        "Special symbols bullet points:\n"
        "★ Built database triggers\n"
        "✔ Automated report parsing\n"
        "❖ Managed deployment processes\n"
        "➢ Coordinated scrum meetings\n"
        "➤ Wrote integration tests\n"
        "✦ Documented system architecture\n"
    )
    
    result = analyzer.analyze(poor_resume)
    
    # Missing email, phone, linkedin, and skills section should be flagged as issues
    assert "Missing email address." in result["issues"]
    assert "Missing phone number." in result["issues"]
    assert "Missing LinkedIn profile link." in result["issues"]
    assert "Missing Skills section." in result["issues"]
    
    # Long paragraph, non-standard symbols, education before experience, and table layouts should be flagged as warnings
    assert any("very long" in w for w in result["warnings"])
    assert any("non-standard" in w for w in result["warnings"])
    assert any("Education is listed before" in w for w in result["warnings"])
    assert any("table" in w for w in result["warnings"])
    
    # Should contain recommendations to solve them
    assert len(result["recommendations"]) > 0

def test_formatting_endpoint_validation():
    """
    Test POST /analyze/formatting endpoint validations.
    """
    # Test valid request
    payload = {"resume_text": "John Doe\njohn.doe@example.com | 123-456-7890\nSkills\n• Python"}
    response = client.post("/analyze/formatting", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert "issues" in json_data
    assert "warnings" in json_data
    assert "recommendations" in json_data
    
    # Test empty text validation
    response_empty = client.post("/analyze/formatting", json={"resume_text": "   "})
    assert response_empty.status_code == 400
    assert "cannot be empty" in response_empty.json()["detail"]
