from app.analyzers.semantic_analyzer import SemanticAnalyzer

class SemanticAnalyzerService:
    def __init__(self):
        self.analyzer = SemanticAnalyzer()

    async def analyze_semantic_similarity(self, resume_text: str, jd_text: str) -> dict:
        """
        Validates text and runs semantic analysis using SentenceTransformers.
        """
        r_text = resume_text.strip() if resume_text else ""
        j_text = jd_text.strip() if jd_text else ""

        if not r_text:
            raise ValueError("Resume text cannot be empty.")
        if not j_text:
            raise ValueError("Job description text cannot be empty.")
        if r_text == j_text:
            raise ValueError("Resume and Job Description cannot be identical.")

        try:
            return self.analyzer.analyze_similarity(r_text, j_text)
        except Exception as e:
            raise RuntimeError(f"Error during semantic similarity matching: {str(e)}")
