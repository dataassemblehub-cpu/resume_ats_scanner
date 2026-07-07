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

        # We will collect the scores and weights for sections that actually exist
        available_scores = []
        available_weights = []

        # 1. Skills Score (Hybrid: 50% Keyword Coverage + 50% Semantic similarity)
        resume_skills = section_text.get("skills", "").strip()
        skills_exists = bool(resume_skills)
        
        jd_skills_list = jd_data.get("skills", []) + jd_data.get("tools", [])
        jd_skills_text = ", ".join(jd_skills_list) if jd_skills_list else j_text
        
        if skills_exists:
            skills_res = self.semantic_analyzer.analyze_similarity(resume_skills, jd_skills_text)
            skills_semantic = skills_res["semantic_score"]
        else:
            skills_semantic = 0.0

        keyword_coverage = resume_data.get("keyword_analysis", {}).get("coverage_percentage", 0.0)
        s_raw = (keyword_coverage * 0.5) + (skills_semantic * 0.5)
        
        # Apply lenient matching curve: matching 50%+ on combined metrics represents a strong skills fit
        if s_raw >= 50.0:
            skills_score = 80.0 + (s_raw - 50.0) * (20.0 / 50.0)
        elif s_raw >= 25.0:
            skills_score = 50.0 + (s_raw - 25.0) * (30.0 / 25.0)
        else:
            skills_score = s_raw * (50.0 / 25.0)
        
        if skills_exists:
            available_scores.append(skills_score)
            available_weights.append(0.4)

        # 2. Experience Score
        resume_exp = section_text.get("experience", "").strip()
        experience_exists = bool(resume_exp)
        if experience_exists:
            jd_exp_list = jd_data.get("responsibilities", [])
            # Check if responsibilities text exists in list and is non-empty before joining
            jd_exp_text = " ".join(jd_exp_list) if (jd_exp_list and len(jd_exp_list) > 0) else j_text
            exp_res = self.semantic_analyzer.analyze_similarity(resume_exp, jd_exp_text)
            experience_score = exp_res["semantic_score"]
            available_scores.append(experience_score)
            available_weights.append(0.4)
        else:
            experience_score = 0.0

        # 3. Projects Score
        resume_projects = section_text.get("projects", "").strip()
        projects_exists = bool(resume_projects)
        if projects_exists:
            projects_res = self.semantic_analyzer.analyze_similarity(resume_projects, j_text)
            projects_score = projects_res["semantic_score"]
            available_scores.append(projects_score)
            available_weights.append(0.1)
        else:
            projects_score = 0.0

        # 4. Education Score (Hybrid: Standardized Degree level matching + TF-IDF fallback)
        resume_edu = section_text.get("education", "").strip()
        education_exists = bool(resume_edu)
        if education_exists:
            jd_edu_list = jd_data.get("education", [])
            candidate_edu_list = resume_data.get("education", [])
            
            if not jd_edu_list:
                # No education requirements specified in JD -> 100%
                education_score = 100.0
            else:
                # Map standardized degrees to numeric levels
                level_map = {
                    "Associate's Degree": 1,
                    "Bachelor's Degree": 2,
                    "Master's Degree": 3,
                    "MBA": 3,
                    "Ph.D.": 4
                }
                
                # Check if we have recognized standard levels on both sides
                jd_levels = [level_map[deg] for deg in jd_edu_list if deg in level_map]
                cand_levels = [level_map[deg] for deg in candidate_edu_list if deg in level_map]
                
                if jd_levels and cand_levels:
                    jd_max = max(jd_levels)
                    cand_max = max(cand_levels)
                    
                    if cand_max >= jd_max:
                        # Candidate meets or exceeds the required level
                        education_score = 100.0
                    else:
                        # Graduated partial score based on gap size
                        gap = jd_max - cand_max
                        if gap == 1:
                            education_score = 70.0  # e.g., Bachelor's applying for Master's
                        elif gap == 2:
                            education_score = 40.0  # e.g., Associate's for Master's, or Bachelor's for Ph.D.
                        else:
                            education_score = 20.0  # e.g., Associate's for Ph.D.
                else:
                    # Fallback to lexical TF-IDF similarity if degrees are non-standard/unrecognized
                    # We establish a baseline minimum of 40% if the candidate has an education section
                    # to prevent harsh word-choice penalties (e.g. for non-standard diplomas or bootcamps)
                    jd_edu_text = " ".join(jd_edu_list)
                    edu_res = self.semantic_analyzer.analyze_similarity(resume_edu, jd_edu_text)
                    education_score = max(40.0, edu_res["semantic_score"])
            
            available_scores.append(education_score)
            available_weights.append(0.1)
        else:
            education_score = 0.0

        # Calculate dynamic weighted normalized overall score
        total_weight = sum(available_weights)
        if total_weight > 0:
            weighted_sum = sum(score * weight for score, weight in zip(available_scores, available_weights))
            overall = int(round(weighted_sum / total_weight))
        else:
            overall = 0

        return {
            "skills": int(round(skills_score)),
            "experience": int(round(experience_score)),
            "projects": int(round(projects_score)),
            "education": int(round(education_score)),
            "overall": overall
        }
