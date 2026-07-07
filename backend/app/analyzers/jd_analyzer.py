import re
import spacy
from spacy.matcher import PhraseMatcher

# Curated taxonomies of Skills and Tools for custom extraction
COMMON_SKILLS = [
    "software engineering", "backend development", "frontend development", "full stack development",
    "web development", "mobile development", "system design", "database design", "object oriented programming",
    "oop", "data structures", "algorithms", "rest api", "graphql", "microservices", "ci/cd", "devops",
    "agile", "scrum", "cloud computing", "machine learning", "deep learning", "natural language processing",
    "nlp", "data science", "data analysis", "data engineering", "unit testing", "test driven development",
    "tdd", "version control", "responsive design", "state management", "cybersecurity", "ui/ux design",
    "etl", "elt", "data warehousing", "data warehouse", "star schema", "snowflake schema", "fact table",
    "dimension table", "stored procedures", "dax", "medallion architecture", "data modeling",
    "pipeline orchestration", "workflow orchestration", "delta lake", "data quality", "data governance"
]

COMMON_TOOLS = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "ruby", "go", "rust", "kotlin", "swift",
    "php", "html", "css", "sass", "sql", "nosql", "scala", "shell scripting", "bash",
    # Frameworks & Libraries
    "react", "angular", "vue", "next.js", "nextjs", "nuxt", "fastapi", "flask", "django", "spring boot",
    "express", "node.js", "nodejs", "laravel", "rails", "jquery", "bootstrap", "tailwind", "pandas",
    "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "spacy", "nltk",
    # Databases & Caching
    "postgresql", "postgres", "mysql", "mongodb", "redis", "dynamodb", "sqlite", "oracle", "cassandra",
    "snowflake", "dbt", "databricks", "apache spark", "pyspark", "spark",
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform",
    "jenkins", "github actions", "gitlab ci", "ansible",
    # Systems & Utilities
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "figma", "postman", "swagger",
    # ETL & BI Tools
    "power bi", "informatica", "datastage", "snaplogic", "airflow", "azure data factory", "adf", "json", "xml"
]

DEGREE_PATTERNS = [
    r"\bB\.?S\.?\b", r"\bM\.?S\.?\b", r"\bPh\.?D\.?\b", r"\bB\.?E\.?\b", r"\bB\.?Tech\.?\b",
    r"\bM\.?Tech\.?\b", r"\bM\.?B\.?A\.?\b", r"\bBachelor['’]?s?\b", r"\bMaster['’]?s?\b", r"\bDoctorate\b",
    r"\bAssociate['’]?s?\b"
]

# Common verbs that open responsibility bullet points
ACTION_VERBS = {
    "develop", "build", "design", "implement", "create", "write", "manage", "lead", "collaborate",
    "coordinate", "maintain", "optimize", "improve", "deploy", "debug", "test", "support",
    "analyze", "research", "integrate", "architect", "scale", "mentor", "participate", "drive"
}

class JDAnalyzer:
    def __init__(self):
        # We load spaCy model. If loading fails (e.g. during test setups), we load it on demand or mock it.
        self.nlp = None
        self.skills_matcher = None
        self.tools_matcher = None

    def _ensure_nlp(self):
        if self.nlp is None:
            try:
                from app.utils.nlp import load_spacy_model_safely
                self.nlp = load_spacy_model_safely("en_core_web_sm")
                
                # Initialize Matchers
                self.skills_matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
                skills_patterns = [self.nlp.make_doc(text) for text in COMMON_SKILLS]
                self.skills_matcher.add("SKILLS", skills_patterns)

                self.tools_matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
                tools_patterns = [self.nlp.make_doc(text) for text in COMMON_TOOLS]
                self.tools_matcher.add("TOOLS", tools_patterns)
            except Exception as e:
                # Fallback to loading it or print error (in production, we'd raise/log)
                raise RuntimeError(f"Failed to load spaCy model 'en_core_web_sm'. Ensure it is downloaded. Error: {str(e)}")

    def analyze(self, text: str) -> dict:
        """
        Parses raw job description text and returns structured components.
        """
        self._ensure_nlp()
        doc = self.nlp(text)
        
        title = self._extract_title(text, doc)
        skills, tools = self._extract_skills_and_tools(doc)
        education = self._extract_education(text)
        experience = self._extract_experience(text)
        responsibilities = self._extract_responsibilities(text, doc)

        return {
            "title": title,
            "skills": skills,
            "tools": tools,
            "education": education,
            "years_of_experience": experience,
            "responsibilities": responsibilities
        }

    def _extract_title(self, text: str, doc) -> str | None:
        """
        Heuristic: The first non-empty line of the text is frequently the job title.
        Verifies that it looks like a typical title.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if not lines:
            return None
            
        first_line = lines[0]
        # Clean title candidates (must not be too long or resemble a sentence)
        if len(first_line) < 70 and not first_line.endswith((".", "?", "!")):
            # Title words check
            title_keywords = {"engineer", "developer", "manager", "architect", "lead", "specialist", 
                              "analyst", "intern", "consultant", "administrator", "scientist", "designer"}
            words = [w.lower().strip(",()[]{}") for w in first_line.split()]
            if any(w in title_keywords for w in words):
                return first_line
                
        # Fallback to Named Entity Recognition (NER) if any job titles are found in text
        for ent in doc.ents:
            if ent.label_ == "ROLE":  # Some NER libraries have this, en_core_web_sm doesn't have it by default but good fallback logic
                return ent.text
                
        return first_line if len(first_line) < 50 else None

    def _extract_skills_and_tools(self, doc) -> tuple[list[str], list[str]]:
        """
        Uses spaCy PhraseMatcher to extract skills and tools.
        """
        skills = set()
        tools = set()

        # Skill Matches
        skill_matches = self.skills_matcher(doc)
        for _, start, end in skill_matches:
            skills.add(doc[start:end].text.title())

        # Tool Matches
        tool_matches = self.tools_matcher(doc)
        for _, start, end in tool_matches:
            # Keep tools in standard casing (e.g., Python, JavaScript, Next.js, AWS)
            matched_text = doc[start:end].text
            # Format nicely
            formatted = matched_text.title()
            if matched_text.lower() in ["aws", "gcp", "ci/cd", "oop", "tdd", "api", "css", "html", "sql", "nosql", "bs", "ms", "phd"]:
                formatted = matched_text.upper()
            elif matched_text.lower() == "next.js":
                formatted = "Next.js"
            elif matched_text.lower() == "node.js":
                formatted = "Node.js"
            elif matched_text.lower() == "fastapi":
                formatted = "FastAPI"
            elif matched_text.lower() == "git":
                formatted = "Git"
            elif matched_text.lower() == "github":
                formatted = "GitHub"
            tools.add(formatted)

        return sorted(list(skills)), sorted(list(tools))

    def _extract_education(self, text: str) -> list[str]:
        """
        Regex match for degrees and surrounding education contexts.
        """
        education = set()
        
        # Combine patterns
        combined_pattern = "|".join(DEGREE_PATTERNS)
        matches = re.finditer(combined_pattern, text, re.IGNORECASE)
        
        # Expand matched degree tokens to capture their basic lines/fields
        for match in matches:
            degree = match.group(0)
            
            # Prevent 'be' collision (only allow BE or B.E. capitalized)
            if degree.lower() == "be":
                original_text = text[match.start():match.end()]
                if original_text != "BE" and original_text != "B.E.":
                    continue
            
            # Standardize degrees
            deg_lower = degree.lower()
            if "b.s" in deg_lower or "bachelor" in deg_lower or "b.e" in deg_lower or "b.tech" in deg_lower:
                standardized = "Bachelor's Degree"
            elif "m.s" in deg_lower or "master" in deg_lower or "m.tech" in deg_lower:
                standardized = "Master's Degree"
            elif "ph.d" in deg_lower or "doctorate" in deg_lower or "phd" in deg_lower:
                standardized = "Ph.D."
            elif "mba" in deg_lower:
                standardized = "MBA"
            elif "associate" in deg_lower:
                standardized = "Associate's Degree"
            else:
                standardized = degree
            education.add(standardized)
            
        return sorted(list(education))

    def _extract_experience(self, text: str) -> float | None:
        """
        Regex to find years of experience requirements (e.g. 5+ years of experience, 3 years, etc.).
        """
        # Matches patterns like:
        # "3+ years", "3-5 years", "minimum of 4 years", "at least 2 years of work experience"
        patterns = [
            r"(\d+(?:\.\d+)?)\s*(?:\+|-\d+)?\s*years?(?:\s+of)?\s*(?:experience|work|industry|relevant)",
            r"(?:experience|work)\s+(?:of\s+)?(?:at\s+least\s+)?(\d+(?:\.\d+)?)\s*years?"
        ]
        
        candidates = []
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for m in matches:
                try:
                    val = float(m.group(1))
                    candidates.append(val)
                except ValueError:
                    continue
                    
        # Return the maximum requirement if multiple are found, else default
        return max(candidates) if candidates else None

    def _extract_responsibilities(self, text: str, doc) -> list[str]:
        """
        Heuristic: Splits text into bullet points or sentences,
        filtering for items starting with verbs or located under responsibility sections.
        """
        responsibilities = []
        
        # Heuristic 1: Look at bullet points (starting with -, *, •, or numbers like 1.)
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        for line in lines:
            # Match lines starting with a bullet marker
            bullet_match = re.match(r"^[\-\*\u2022\d+\.]\s*(.*)", line)
            if bullet_match:
                content = bullet_match.group(1).strip()
                # Check if it starts with an action verb (POS tag verification or set check)
                words = content.split()
                if words:
                    first_word = words[0].lower().strip(",.;:")
                    if first_word in ACTION_VERBS or len(content) > 30:
                        responsibilities.append(content)
            elif len(line) > 40 and not line.endswith((".", "?", "!")):
                # Check if it starts with an action verb
                words = line.split()
                if words:
                    first_word = words[0].lower().strip(",.;:")
                    if first_word in ACTION_VERBS:
                        responsibilities.append(line)
                        
        # Fallback to extracting sentences containing strong action verbs if no bullets detected
        if not responsibilities:
            for sent in doc.sents:
                sent_text = sent.text.strip()
                # check if first word is a verb
                if len(sent) > 0 and sent[0].pos_ == "VERB" and sent[0].text.lower() in ACTION_VERBS:
                    responsibilities.append(sent_text)
                    
        # Return top 25 responsibilities max to avoid bloating response and truncation of skills
        return responsibilities[:25]
