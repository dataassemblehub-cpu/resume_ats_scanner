from app.analyzers.semantic_analyzer import SemanticAnalyzer

class ATSScoreEngine:
    def __init__(self):
        self.semantic_analyzer = SemanticAnalyzer()

    def score(self, resume_data: dict, jd_data: dict) -> dict:
        """
        Calculates ATS scores by comparing segmented resume sections
        semantically against the job description requirements.
        """
        section_text = resume_data.get("section_text", {})
        r_text = resume_data.get("parsed_text", "")
        j_text = jd_data.get("raw_text", "")

        # 1. Skills Similarity
        resume_skills = section_text.get("skills", "").strip()
        if resume_skills:
            jd_skills_list = jd_data.get("skills", []) + jd_data.get("tools", [])
            jd_skills_text = ", ".join(jd_skills_list) if jd_skills_list else j_text
            skills_res = self.semantic_analyzer.analyze_similarity(resume_skills, jd_skills_text)
            skills_score = int(round(skills_res["semantic_score"]))
        else:
            skills_score = 0

        # 2. Experience Similarity
        resume_exp = section_text.get("experience", "").strip()
        if resume_exp:
            jd_exp_list = jd_data.get("responsibilities", [])
            jd_exp_text = "\n".join(jd_exp_list) if jd_exp_list else j_text
            exp_res = self.semantic_analyzer.analyze_similarity(resume_exp, jd_exp_text)
            exp_score = int(round(exp_res["semantic_score"]))
        else:
            exp_score = 0

        # 3. Projects Similarity
        resume_projects = section_text.get("projects", "").strip()
        if resume_projects:
            projects_res = self.semantic_analyzer.analyze_similarity(resume_projects, j_text)
            projects_score = int(round(projects_res["semantic_score"]))
        else:
            projects_score = 0

        # 4. Education Similarity
        resume_edu = section_text.get("education", "").strip()
        if resume_edu:
            jd_edu_list = jd_data.get("education", [])
            jd_edu_text = ", ".join(jd_edu_list) if jd_edu_list else j_text
            edu_res = self.semantic_analyzer.analyze_similarity(resume_edu, jd_edu_text)
            edu_score = int(round(edu_res["semantic_score"]))
        else:
            edu_score = 0

        # Calculate weighted overall score
        # Weighting: Skills (40%), Experience (40%), Projects (10%), Education (10%)
        overall = int(round(
            skills_score * 0.4 +
            exp_score * 0.4 +
            projects_score * 0.1 +
            edu_score * 0.1
        ))

        return {
            "skills": skills_score,
            "experience": exp_score,
            "projects": projects_score,
            "education": edu_score,
            "overall": overall
        }
