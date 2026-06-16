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
        "• Python, FastAPI, Docker, SQL, PostgreSQL, AWS, CI/CD, Git, Linux, Kubernetes, Redis, RabbitMQ\n"
        "\n"
        "Experience\n"
        "• Software Engineer at Tech Corp (2023 - Present)\n"
        "  - Built scalable REST APIs using FastAPI and Python, serving over 1M requests per day.\n"
        "  - Optimized database query runtimes by 30% through index optimization and query refactoring.\n"
        "  - Implemented caching strategies using Redis to reduce latency by 50%.\n"
        "\n"
        "• Lead Developer at Dev Inc (2021 - 2023)\n"
        "  - Deployed containerized applications to AWS utilizing Docker and ECS.\n"
        "  - Maintained code coverage above 90% and resolved critical frontend and backend bugs.\n"
        "  - Automated deployment pipelines using GitHub Actions, saving 10 hours of manual work per week.\n"
        "\n"
        "• Junior Engineer at Web Solutions (2019 - 2021)\n"
        "  - Designed and developed responsive frontend components using React and TypeScript.\n"
        "  - Written unit and integration tests using Jest and Pytest to ensure reliability.\n"
        "  - Integrated third-party APIs and services to extend application capabilities.\n"
        "\n"
        "Projects\n"
        "• Portfolio Website: Built a personal portfolio website to showcase projects and experience.\n"
        "• Task Manager App: Developed a task management application with React and Node.js.\n"
        "• Chat Application: Created a real-time chat application using WebSockets and Socket.io.\n"
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
    assert any("very long" in w.lower() for w in result["warnings"])
    assert any("non-standard" in w for w in result["warnings"])
    assert any("education is listed before" in w.lower() for w in result["warnings"])
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
