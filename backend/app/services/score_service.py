from app.analyzers.section_analyzer import SectionAnalyzer
from app.analyzers.jd_analyzer import JDAnalyzer
from app.analyzers.keyword_analyzer import KeywordAnalyzer
from app.analyzers.score_engine import ATSScoreEngine
from app.utils.extraction import extract_email, extract_phone

class ScoreService:
    def __init__(self):
        self.section_analyzer = SectionAnalyzer()
        self.jd_analyzer = JDAnalyzer()
        self.keyword_analyzer = KeywordAnalyzer(top_n=15)
        self.score_engine = ATSScoreEngine()

    async def calculate_ats_score(self, resume_text: str, jd_text: str) -> dict:
        """
        Runs the complete end-to-end scanning pipeline locally and computes the ATS score.
        """
        r_text = resume_text.strip() if resume_text else ""
        j_text = jd_text.strip() if jd_text else ""

        if not r_text:
            raise ValueError("Resume text cannot be empty.")
        if not j_text:
            return {
                "skills": 0,
                "experience": 0,
                "projects": 0,
                "education": 0,
                "overall": 0
            }
        if r_text == j_text:
            raise ValueError("Resume and Job Description cannot be identical.")

        # 1. Segment resume sections
        sections = self.section_analyzer.analyze(r_text)

        # 2. Extract job description requirements
        jd_data = self.jd_analyzer.analyze(j_text)
        jd_data["raw_text"] = j_text

        # 3. Extract candidate details from the resume
        email = extract_email(r_text)
        phone = extract_phone(r_text)
        
        # We reuse the JDAnalyzer text parsers on the resume text to extract candidate experience and education
        candidate_exp = self.jd_analyzer._extract_experience(r_text)
        candidate_edu = self.jd_analyzer._extract_education(r_text)

        # 4. Perform keyword vector analysis
        keyword_analysis = self.keyword_analyzer.analyze(r_text, j_text)

        # 5. Compile resume characteristics
        resume_data = {
            "email": email,
            "phone": phone,
            "parsed_text": r_text,
            "sections_detected": sections["sections_detected"],
            "section_text": sections["section_text"],
            "years_of_experience": candidate_exp,
            "education": candidate_edu,
            "keyword_analysis": keyword_analysis
        }

        # 6. Compute overall score and breakdown
        try:
            score_results = self.score_engine.score(resume_data, jd_data)
            return score_results
        except Exception as e:
            raise RuntimeError(f"Failed to calculate ATS score: {str(e)}")
