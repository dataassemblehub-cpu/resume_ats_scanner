import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.analyzers.semantic_analyzer import SemanticAnalyzer

client = TestClient(app)

def test_semantic_analyzer_similarity():
    """
    Test direct similarity calculation on similar and dissimilar texts.
    """
    analyzer = SemanticAnalyzer()
    
    # Similar profiles (ETL vs Data Engineer)
    resume_etl = "Highly experienced ETL Developer specialized in Python, SQL, and building PySpark data pipelines."
    jd_de = "We are looking for a Data Engineer to design ETL pipelines using PySpark, SQL, and Python."
    
    res_similar = analyzer.analyze_similarity(resume_etl, jd_de)
    assert res_similar["similarity"] > 0.5
    assert res_similar["semantic_score"] > 50.0

    # Dissimilar profiles (Dentist vs Data Engineer)
    resume_dentist = "Certified Dentist with 5 years of experience in oral surgery and patient dental healthcare."
    jd_de = "We are looking for a Data Engineer to design ETL pipelines using PySpark, SQL, and Python."
    
    res_dissimilar = analyzer.analyze_similarity(resume_dentist, jd_de)
    assert res_dissimilar["similarity"] < 0.3
    assert res_dissimilar["semantic_score"] < 30.0
    
    # The similar profile must score higher than the dissimilar one
    assert res_similar["similarity"] > res_dissimilar["similarity"]

def test_semantic_endpoint_success():
    """
    Test POST /analyze/semantic route.
    """
    payload = {
        "resume_text": "Python Software Engineer with experience in FastAPI.",
        "jd_text": "Looking for a backend developer skilled in Python and web frameworks."
    }
    response = client.post("/analyze/semantic", json=payload)
    assert response.status_code == 200
    json_data = response.json()
    assert "similarity" in json_data
    assert "semantic_score" in json_data
    assert isinstance(json_data["similarity"], float)
    assert isinstance(json_data["semantic_score"], float)

def test_semantic_endpoint_validation():
    """
    Test POST /analyze/semantic validation constraints.
    """
    # Empty resume text
    payload = {
        "resume_text": "",
        "jd_text": "Looking for a backend developer."
    }
    response = client.post("/analyze/semantic", json=payload)
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]

    # Empty jd text
    payload = {
        "resume_text": "Python developer.",
        "jd_text": ""
    }
    response = client.post("/analyze/semantic", json=payload)
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]
