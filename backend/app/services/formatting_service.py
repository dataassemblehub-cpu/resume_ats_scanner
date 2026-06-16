from app.analyzers.formatting_analyzer import FormattingAnalyzer

class FormattingAnalyzerService:
    def __init__(self):
        self.analyzer = FormattingAnalyzer()

    async def analyze_formatting(self, resume_text: str) -> dict:
        """
        Validates the resume text and analyzes formatting.
        """
        text = resume_text.strip() if resume_text else ""
        if not text:
            raise ValueError("Resume text cannot be empty.")

        try:
            return self.analyzer.analyze(text)
        except Exception as e:
            raise RuntimeError(f"Error during formatting analysis: {str(e)}")
