import re
import spacy

# Synonyms for standard resume sections
SECTION_PATTERNS = {
    "summary": re.compile(
        r"^\s*(?:professional\s+|career\s+|executive\s+)?(?:summary|profile|objective|about\s+me|overview)\b", 
        re.IGNORECASE
    ),
    "experience": re.compile(
        r"^\s*(?:work|professional|employment|job|career|relevant)\s+(?:experience|history|record|background)|"
        r"^\s*experience\b|^\s*work\s+history\b|^\s*employment\b|^\s*professional\s+history\b", 
        re.IGNORECASE
    ),
    "projects": re.compile(
        r"^\s*(?:technical|personal|academic|key|recent|featured|selected)?\s*projects\b|^\s*project\s+experience\b|^\s*portfolio\b", 
        re.IGNORECASE
    ),
    "skills": re.compile(
        r"^\s*(?:technical|professional|core|key|software|relevant)?\s*(?:skills|competencies|expertise|proficiencies|technologies|capabilities)\b", 
        re.IGNORECASE
    ),
    "education": re.compile(
        r"^\s*(?:academic\s+|educational\s+)?(?:education|background|history|qualifications|credentials|academic\s+record)\b", 
        re.IGNORECASE
    ),
    "certificates": re.compile(
        r"^\s*(?:certifications|certificates|licenses|courses|training|professional\s+affiliations)\b", 
        re.IGNORECASE
    ),
    "achievements": re.compile(
        r"^\s*(?:achievements|honors|awards|accomplishments|publications|recognition)\b", 
        re.IGNORECASE
    )
}

class SectionAnalyzer:
    def __init__(self):
        self.nlp = None

    def _ensure_nlp(self):
        if self.nlp is None:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except Exception as e:
                # Log warning and keep going (fallback will use pure regex/python if spacy is not loaded)
                print(f"Warning: spaCy model not loaded in SectionAnalyzer: {str(e)}")

    def analyze(self, text: str) -> dict:
        """
        Segments raw resume text into categories using regex headers and NLP fallback.
        """
        self._ensure_nlp()
        
        # 1. Clean and split into lines, keeping track of character offsets
        lines = []
        current_offset = 0
        for line in text.splitlines(keepends=True):
            lines.append({
                "content": line,
                "stripped": line.strip(),
                "start": current_offset,
                "end": current_offset + len(line)
            })
            current_offset += len(line)

        # 2. Identify header boundaries
        detected_sections = [] # List of dict: {category, start, header_end}
        
        for i, line_info in enumerate(lines):
            stripped = line_info["stripped"]
            if not stripped:
                continue
                
            # Heuristics: A header line is usually short (<= 5 words) and doesn't end with a period
            words = stripped.split()
            if len(words) > 5:
                continue
            if stripped.endswith((".", "?", "!")) and not re.match(r"^\d+\.", stripped):
                continue

            # Check if line matches any section pattern
            for section_name, pattern in SECTION_PATTERNS.items():
                if pattern.match(stripped):
                    # Record the section start index (start of this line)
                    detected_sections.append({
                        "category": section_name,
                        "start": line_info["start"],
                        "header_end": line_info["end"]
                    })
                    break # Match first category only

        # 3. Sort section detections by offset
        detected_sections.sort(key=lambda x: x["start"])

        # Deduplicate sequential matches for the same category (keep the first one)
        deduped = []
        seen_categories = set()
        for sec in detected_sections:
            if sec["category"] not in seen_categories:
                deduped.append(sec)
                seen_categories.add(sec["category"])
        detected_sections = deduped

        # 4. Extract section texts based on boundaries
        sections_detected = {cat: False for cat in SECTION_PATTERNS.keys()}
        section_offsets = {}
        section_text = {}
        
        text_length = len(text)
        
        for idx, sec in enumerate(detected_sections):
            category = sec["category"]
            start_idx = sec["header_end"] # Section content starts after header line
            
            # End of section is the start of the next section, or end of text
            if idx + 1 < len(detected_sections):
                end_idx = detected_sections[idx + 1]["start"]
            else:
                end_idx = text_length
                
            sections_detected[category] = True
            section_offsets[category] = [sec["start"], end_idx]
            section_text[category] = text[start_idx:end_idx].strip()

        # 5. NLP Fallback: If critical sections are missing, search in raw text
        # If 'skills' is missing, look for blocks containing high concentration of skills
        if not sections_detected["skills"]:
            self._skills_nlp_fallback(text, sections_detected, section_offsets, section_text)
            
        # If 'experience' is missing, look for blocks containing job dates/periods
        if not sections_detected["experience"]:
            self._experience_nlp_fallback(text, sections_detected, section_offsets, section_text)

        # 6. Fill in default empty values for undetected sections
        for cat in SECTION_PATTERNS.keys():
            if not sections_detected[cat]:
                section_text[cat] = ""
                section_offsets[cat] = [-1, -1]

        return {
            "sections_detected": sections_detected,
            "section_offsets": section_offsets,
            "section_text": section_text
        }

    def _skills_nlp_fallback(self, text: str, sections_detected: dict, section_offsets: dict, section_text: dict):
        """
        Fallback for detecting a skills section when no header is found.
        Scans lines for high concentrations of technical words or lists of items.
        """
        skill_indicators = {"python", "javascript", "typescript", "java", "sql", "react", "html", "css", "c++", "docker", "kubernetes", "aws", "gcp", "git"}
        lines = text.split("\n")
        
        for line in lines:
            tokens = [t.lower().strip(",.;:") for t in line.split()]
            matched_skills = [t for t in tokens if t in skill_indicators]
            
            # High-confidence skills block if it contains at least 3 indicators,
            # or 2 indicators and is structured as a list (commas/pipes/bullets)
            if len(matched_skills) >= 3 or (len(matched_skills) >= 2 and (line.count(",") >= 2 or line.count("|") >= 2 or line.count("•") >= 2)):
                fallback_text = line.strip()
                start_idx = text.find(fallback_text)
                if start_idx != -1:
                    sections_detected["skills"] = True
                    section_offsets["skills"] = [start_idx, start_idx + len(fallback_text)]
                    section_text["skills"] = fallback_text
                    break

    def _experience_nlp_fallback(self, text: str, sections_detected: dict, section_offsets: dict, section_text: dict):
        """
        Fallback for detecting experience section based on date patterns (e.g. 2020 - Present, July 2018).
        """
        date_pattern = re.compile(
            r"\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|"
            r"sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}/)\s*\d{4}\s*[-–—to\s]+\s*"
            r"(?:present|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|"
            r"sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}/)\s*\d{4})\b|"
            r"\b\d{4}\s*[-–—to\s]+\s*(?:present|\d{4})\b", 
            re.IGNORECASE
        )
        
        matches = list(date_pattern.finditer(text))
        if len(matches) >= 2: # At least two employment periods found
            # Guess the experience section stretches from the first date match to the end of the text
            # or the next non-experience block.
            first_match_start = matches[0].start()
            # Find the start of the line containing the first date
            line_start = text.rfind("\n", 0, first_match_start) + 1
            
            sections_detected["experience"] = True
            section_offsets["experience"] = [line_start, len(text)]
            section_text["experience"] = text[line_start:].strip()
