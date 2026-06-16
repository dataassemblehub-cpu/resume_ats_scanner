import re
from app.utils.extraction import EMAIL_REGEX, PHONE_REGEX
from app.analyzers.section_analyzer import SectionAnalyzer

# Regex to check for LinkedIn link
LINKEDIN_REGEX = re.compile(r'linkedin\.com/in/[\w\-]+|linkedin\.com/pub/[\w\-]+|linkedin\.com/[\w\-]+', re.IGNORECASE)

# Standard bullet characters
STANDARD_BULLETS = {'•', '-', '*', '▪', 'o', '■'}

# Non-standard special symbols often used in resumes
SPECIAL_SYMBOLS = {'★', '✔', '❖', '➢', '➤', '✓', '✦', '▲', '◆', '❌', '👉'}

class FormattingAnalyzer:
    def __init__(self):
        self.section_analyzer = SectionAnalyzer()

    def analyze(self, text: str) -> dict:
        """
        Analyzes the resume text formatting and generates issues, warnings, and recommendations.
        """
        issues = []
        warnings = []
        recommendations = []

        if not text.strip():
            return {
                "issues": ["Resume text is empty."],
                "warnings": [],
                "recommendations": []
            }

        # 1. Contact Information Checks
        email_match = EMAIL_REGEX.search(text)
        if not email_match:
            issues.append("Missing email address.")
            recommendations.append("Include a professional email address (e.g. john.doe@email.com) in the contact header.")

        phone_match = PHONE_REGEX.search(text)
        if not phone_match:
            issues.append("Missing phone number.")
            recommendations.append("Include a valid phone number so recruiters can reach you.")

        linkedin_match = LINKEDIN_REGEX.search(text)
        if not linkedin_match:
            issues.append("Missing LinkedIn profile link.")
            recommendations.append("Add your LinkedIn profile link to showcase your professional network.")

        # 2. Section Checks
        sections = self.section_analyzer.analyze(text)
        sections_detected = sections.get("sections_detected", {})
        
        if not sections_detected.get("skills", False):
            issues.append("Missing Skills section.")
            recommendations.append("Create a dedicated 'Skills' or 'Technical Skills' section to list your core proficiencies.")

        # 3. Word Count Check
        words = text.split()
        word_count = len(words)
        if word_count < 200:
            warnings.append(f"Resume is extremely short ({word_count} words).")
            recommendations.append("Expand your resume with more detailed descriptions of your achievements and projects.")
        elif word_count > 1000:
            warnings.append(f"Resume is very long ({word_count} words).")
            recommendations.append("Keep your resume concise (aim for 400 to 800 words, typically 1 to 2 pages).")

        # 4. Bullet Points Check
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        bullet_count = 0
        non_standard_symbol_count = 0
        
        for line in lines:
            # Check if line starts with a bullet point
            if any(line.startswith(b) for b in STANDARD_BULLETS):
                bullet_count += 1
            # Check for special bullet characters
            if any(symbol in line for symbol in SPECIAL_SYMBOLS):
                non_standard_symbol_count += sum(line.count(symbol) for symbol in SPECIAL_SYMBOLS)

        if bullet_count < 5:
            warnings.append(f"Fewer than 5 bullet points detected ({bullet_count} found).")
            recommendations.append("Use bullet points starting with strong action verbs to describe responsibilities and achievements.")

        if non_standard_symbol_count > 5:
            warnings.append(f"Excessive non-standard icons or symbols detected ({non_standard_symbol_count} found).")
            recommendations.append("Limit special formatting symbols and stick to standard bullets (•, -, or *) to avoid parsing errors.")

        # 5. Very Long Paragraphs Check
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        long_paragraph_found = False
        for p in paragraphs:
            p_words = p.split()
            # If paragraph has > 80 words and does not start with bullet points, it's a block paragraph
            if len(p_words) > 80 and not any(p.startswith(b) for b in STANDARD_BULLETS):
                long_paragraph_found = True
                break

        if long_paragraph_found:
            warnings.append("Very long text paragraph detected (exceeding 80 words).")
            recommendations.append("Break large blocks of text down into bulleted lists of 1-2 lines each for readability.")

        # 6. Table & Columns Detection
        pipe_lines = sum(1 for line in lines if line.count('|') >= 1)
        tab_count = text.count('\t')
        
        # Check for multiple spaces (3 or more) in the middle of words (indicates tabular/column alignment)
        consecutive_spaces_lines = sum(1 for line in lines if re.search(r'\w{2,}\s{3,}\w{2,}', line))

        if pipe_lines >= 2 or tab_count >= 3 or consecutive_spaces_lines >= 3:
            warnings.append("Potential table or multi-column layout detected.")
            recommendations.append("Avoid tables and multi-column formatting, as many ATS parsers cannot read them in the correct sequence.")

        # 7. Section Order Check
        # Check if education appears before experience (for general chronological layout recommendation)
        section_text = sections.get("section_text", {})
        edu_text = section_text.get("education", "").strip()
        exp_text = section_text.get("experience", "").strip()
        
        if edu_text and exp_text:
            edu_idx = text.find(edu_text)
            exp_idx = text.find(exp_text)
            if edu_idx != -1 and exp_idx != -1 and edu_idx < exp_idx:
                warnings.append("Education is listed before Professional Experience.")
                recommendations.append("Place your Professional Experience section before Education unless you are a recent graduate.")

        return {
            "issues": issues,
            "warnings": warnings,
            "recommendations": recommendations
        }
