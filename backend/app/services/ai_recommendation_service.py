from abc import ABC, abstractmethod

class AIRecommendationService(ABC):
    @abstractmethod
    async def generate_recommendations(self, resume_text: str, jd_text: str, ats_results: dict) -> dict:
        """
        Generates qualitative recommendations and rewriting suggestions
        based on raw texts and deterministic ATS scores.
        """
        pass
