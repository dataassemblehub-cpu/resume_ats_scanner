from app.analyzers.jd_analyzer import JDAnalyzer

class JDParserService:
    def __init__(self):
        self.analyzer = JDAnalyzer()

    async def parse_jd(self, text: str) -> dict:
        """
        Validates job description and triggers NLP parsing.
        """
        cleaned_text = text.strip() if text else ""
        if not cleaned_text:
            raise ValueError("Job description text cannot be empty.")
        
        try:
            # Analyze using spaCy analyzer
            result = self.analyzer.analyze(cleaned_text)
            return result
        except Exception as e:
            raise RuntimeError(f"Failed to parse Job Description: {str(e)}")
