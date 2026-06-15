from abc import ABC, abstractmethod
from typing import Dict

class ScoringStrategy(ABC):
    @abstractmethod
    def calculate(self, resume_data: dict, jd_data: dict) -> float:
        """
        Calculates the score for a specific category.
        """
        pass

class KeywordScoringStrategy(ScoringStrategy):
    def calculate(self, resume_data: dict, jd_data: dict) -> float:
        # Keyword match counts for 40% of the total score
        coverage = resume_data.get("keyword_analysis", {}).get("coverage_percentage", 0.0)
        return (coverage / 100.0) * 40.0

class SectionScoringStrategy(ScoringStrategy):
    def calculate(self, resume_data: dict, jd_data: dict) -> float:
        # Section quality counts for 20% of the total score
        # Core sections: Summary, Experience, Skills, Education, Projects
        core_sections = ["summary", "experience", "skills", "education", "projects"]
        sections_detected = resume_data.get("sections_detected", {})
        
        detected_count = sum(1 for sec in core_sections if sections_detected.get(sec, False))
        # Each core section present contributes 4 points (max 20)
        return float(detected_count * 4)

class ExperienceScoringStrategy(ScoringStrategy):
    def calculate(self, resume_data: dict, jd_data: dict) -> float:
        # Experience match counts for 20% of the total score
        jd_req = jd_data.get("years_of_experience")
        candidate_exp = resume_data.get("years_of_experience")

        # If the job description does not specify an experience requirement, default to full marks
        if jd_req is None or jd_req == 0:
            return 20.0

        if candidate_exp is None:
            candidate_exp = 0.0

        # If candidate experience meets or exceeds requirement, full 20 points
        if candidate_exp >= jd_req:
            return 20.0
            
        # Scale score if candidate is under-qualified
        return (candidate_exp / jd_req) * 20.0

class EducationScoringStrategy(ScoringStrategy):
    # Tier mapping for ranking educational degrees
    DEGREE_RANK = {
        "none": 0,
        "associate's degree": 1,
        "bachelor's degree": 2,
        "master's degree": 3,
        "mba": 3,
        "ph.d.": 4
    }

    def _get_highest_degree_rank(self, degrees: list) -> int:
        ranks = []
        for d in degrees:
            cleaned = d.strip().lower()
            rank = self.DEGREE_RANK.get(cleaned, 0)
            # Check for partial matches
            if rank == 0:
                if "bachelor" in cleaned:
                    rank = 2
                elif "master" in cleaned or "mba" in cleaned:
                    rank = 3
                elif "doctor" in cleaned or "phd" in cleaned or "ph.d" in cleaned:
                    rank = 4
                elif "associate" in cleaned:
                    rank = 1
            ranks.append(rank)
        return max(ranks) if ranks else 0

    def calculate(self, resume_data: dict, jd_data: dict) -> float:
        # Education match counts for 10% of the total score
        jd_degrees = jd_data.get("education", [])
        candidate_degrees = resume_data.get("education", [])

        # If the Job Description doesn't specify any education level, default to full marks
        if not jd_degrees:
            return 10.0

        jd_rank = self._get_highest_degree_rank(jd_degrees)
        candidate_rank = self._get_highest_degree_rank(candidate_degrees)

        if jd_rank == 0:
            return 10.0

        if candidate_rank >= jd_rank:
            return 10.0

        # Scale score if candidate rank is lower than requirement
        return (candidate_rank / jd_rank) * 10.0

class FormattingScoringStrategy(ScoringStrategy):
    def calculate(self, resume_data: dict, jd_data: dict) -> float:
        # Formatting and basic contact details count for 10% of the total score
        score = 0.0
        
        # Email present (+4 points)
        if resume_data.get("email"):
            score += 4.0
            
        # Phone present (+4 points)
        if resume_data.get("phone"):
            score += 4.0
            
        # Document length verification (+2 points)
        # Verify document has a minimal word count (e.g. > 100 words) to avoid short/empty uploads
        text_content = resume_data.get("parsed_text", "")
        word_count = len(text_content.split())
        if word_count > 100:
            score += 2.0
            
        return score

class ATSScoreEngine:
    def __init__(self):
        self.strategies = {
            "keywords": KeywordScoringStrategy(),
            "sections": SectionScoringStrategy(),
            "experience": ExperienceScoringStrategy(),
            "education": EducationScoringStrategy(),
            "formatting": FormattingScoringStrategy()
        }

    def score(self, resume_data: dict, jd_data: dict) -> dict:
        """
        Coordinates the score calculation strategies and returns the overall score and breakdown.
        """
        breakdown = {}
        total_score = 0.0

        for key, strategy in self.strategies.items():
            val = strategy.calculate(resume_data, jd_data)
            # Round score segments to 2 decimal places
            breakdown[key] = round(val, 2)
            total_score += val

        return {
            "score": int(round(total_score)),
            "breakdown": breakdown
        }
