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
    # Data Engineering / BI / Data Warehousing
    "etl", "elt", "data warehousing", "data modeling", "data modelling", "data pipeline", "data pipelines",
    "star schema", "snowflake schema", "fact table", "dimension table", "data governance", "data lineage",
    "data quality", "data validation", "performance tuning", "query optimization", "stored procedures",
    "business intelligence", "big data", "batch processing", "stream processing", "workflow orchestration",
    "pipeline orchestration", "medallion architecture", "data lake", "data lakehouse", "semi-structured data"
]

COMMON_TOOLS = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "ruby", "go", "rust", "kotlin", "swift",
    "php", "html", "css", "sass", "sql", "nosql", "scala", "shell scripting", "bash", "pyspark",
    # Frameworks & Libraries
    "react", "angular", "vue", "next.js", "nextjs", "nuxt", "fastapi", "flask", "django", "spring boot",
    "express", "node.js", "nodejs", "laravel", "rails", "jquery", "bootstrap", "tailwind", "pandas",
    "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "spacy", "nltk",
    # Databases & Caching
    "postgresql", "postgres", "mysql", "mongodb", "redis", "dynamodb", "sqlite", "oracle", "cassandra",
    # Cloud & DevOps
    "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform",
    "jenkins", "github actions", "gitlab ci", "ansible",
    # Systems & Utilities
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "figma", "postman", "swagger",
    # Data Engineering / ETL / BI tools
    "snowflake", "dbt", "databricks", "apache spark", "spark", "delta lake", "unity catalog",
    "azure data factory", "adf", "aws glue", "informatica", "datastage", "snaplogic", "talend",
    "apache airflow", "airflow", "power bi", "dax", "tableau", "looker", "ssrs", "ssis",
    "snowpipe", "redshift", "bigquery", "kafka", "json", "xml", "step functions", "eventbridge"
]

DEGREE_PATTERNS = [
    # Note: "B.E." requires at least one period (B.E, B.E.) OR both letters uppercase (BE) in the
    # ORIGINAL text -- plain lowercase "be" is an extremely common English word and must not match.
    # This pattern is matched case-SENSITIVELY (see _extract_education) specifically to avoid that collision.
    r"\bB\.E\.?\b", r"\bBE\b",
    r"\bB\.?S\.?\b", r"\bM\.?S\.?\b", r"\bPh\.?D\.?\b", r"\bB\.?Tech\.?\b",
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
        Heuristic: Scans the first several non-empty lines for one that looks like a job
        title (short, no trailing punctuation, contains a role keyword). Generic boilerplate
        headers (e.g. "Job Description", "Requirements") are skipped rather than accepted as
        a fallback, since a JD's very first line is often a section label, not the actual title.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if not lines:
            return None

        title_keywords = {"engineer", "developer", "manager", "architect", "lead", "specialist",
                          "analyst", "intern", "consultant", "administrator", "scientist", "designer"}

        # Generic section-header lines that should never be treated as a title, even though
        # they're short and punctuation-free.
        generic_headers = {
            "job description", "requirements", "role overview", "about the role",
            "position summary", "overview", "responsibilities", "key responsibilities",
            "required skills", "good to have", "qualifications"
        }

        # Boilerplate prefixes to strip off a candidate title line, e.g.
        # "Requirements : Job Description – BI Developer" -> "BI Developer"
        prefix_pattern = re.compile(
            r"^(?:requirements?|job\s*description|position|role|title)\s*[:\-–]\s*", re.IGNORECASE
        )

        # Scan the first ~20 non-empty lines (titles appear near the top; going further risks
        # picking up an unrelated short sentence deep in the body text).
        for line in lines[:20]:
            candidate = line
            # Repeatedly strip boilerplate prefixes (JDs sometimes stack two, e.g.
            # "Requirements : Job Description – BI Developer").
            while True:
                new_candidate = prefix_pattern.sub("", candidate).strip()
                if new_candidate == candidate:
                    break
                candidate = new_candidate

            if candidate.lower() in generic_headers:
                continue
            if len(candidate) >= 70 or candidate.endswith((".", "?", "!")):
                continue

            words = [w.lower().strip(",()[]{}") for w in candidate.split()]
            if any(w in title_keywords for w in words):
                return candidate

        # Fallback to Named Entity Recognition (NER) if any job titles are found in text
        for ent in doc.ents:
            if ent.label_ == "ROLE":  # Some NER libraries have this, en_core_web_sm doesn't have it by default but good fallback logic
                return ent.text

        # Last resort: first non-empty line, but only if it's not a generic boilerplate header
        # and is short enough to plausibly be a title.
        first_line = lines[0]
        if len(first_line) < 50 and first_line.lower() not in generic_headers:
            return first_line
        return None

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

            # Guard: "B.E."/"BE" as an abbreviation for Bachelor of Engineering must not be
            # confused with the common English word "be". Since the overall regex is
            # case-insensitive, a bare, all-lowercase "be" with no periods is almost certainly
            # the English word, not the degree -- skip it.
            if degree.lower() == "be" and degree == "be":
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

        # We cap the returned list at 10 items to avoid bloating the response, but a naive
        # text-order truncation can silently drop the most specific, tool-named bullets (e.g.
        # "Hands-on Snowflake experience...") if they happen to appear later in the JD (such as
        # under a separate "Required Skills" section after "Key Responsibilities"). To avoid
        # losing this high-signal content, we prioritize bullets that mention a recognized skill
        # or tool keyword, keeping original relative order within each group.
        all_keywords = set(COMMON_SKILLS) | set(COMMON_TOOLS)

        def _mentions_keyword(item: str) -> bool:
            item_lower = item.lower()
            return any(kw in item_lower for kw in all_keywords)

        keyword_bullets = [r for r in responsibilities if _mentions_keyword(r)]
        other_bullets = [r for r in responsibilities if not _mentions_keyword(r)]

        prioritized = keyword_bullets + other_bullets
        return prioritized[:10]
