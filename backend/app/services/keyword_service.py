from app.analyzers.keyword_analyzer import KeywordAnalyzer

class KeywordAnalyzerService:
    def __init__(self, top_n: int = 15):
        self.analyzer = KeywordAnalyzer(top_n=top_n)

    async def analyze_keywords(self, resume_text: str, jd_text: str) -> dict:
        """
        Validates texts and computes keyword match statistics.
        """
        r_text = resume_text.strip() if resume_text else ""
        j_text = jd_text.strip() if jd_text else ""

        if not r_text:
            raise ValueError("Resume text cannot be empty.")
        if not j_text:
            return {
                "matched": [],
                "missing": [],
                "coverage_percentage": 0.0,
                "keyword_frequency": {}
            }
        if r_text == j_text:
            raise ValueError("Resume and Job Description cannot be identical.")

        try:
            return self.analyzer.analyze(r_text, j_text)
        except Exception as e:
            raise RuntimeError(f"Error during TF-IDF keyword comparison: {str(e)}")
