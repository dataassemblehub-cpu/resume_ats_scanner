import re

# Regular expressions for extraction
EMAIL_REGEX = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
# Standard international and local phone number formats
PHONE_REGEX = re.compile(
    r'(?:'
    r'(?:\+\d{1,3}[-.\s]?)?'          # Optional country code (+1, +91, etc.)
    r'\(?\d{3}\)?[-.\s]?'             # Area code (3 digits, optional parens)
    r'\d{3}[-.\s]?'                   # Prefix (3 digits)
    r'\d{4}'                          # Line number (4 digits)
    r'|'
    r'(?:\+\d{1,3}[-.\s]?)?'          # Optional country code
    r'\d{4,5}[-.\s]?\d{5,6}'          # Matches alternative formats e.g. international mobile numbers
    r')'
)

def extract_email(text: str) -> str | None:
    """
    Extracts the first email address found in the text.
    """
    match = EMAIL_REGEX.search(text)
    return match.group(0) if match else None

def extract_phone(text: str) -> str | None:
    """
    Extracts the first phone number found in the text.
    """
    match = PHONE_REGEX.search(text)
    if match:
        # Simple cleanup: remove extra whitespaces
        phone = match.group(0).strip()
        # Ensure it meets basic length requirements to prevent capturing random numbers
        digits_only = re.sub(r'\D', '', phone)
        if len(digits_only) >= 7:
            return phone
    return None

def extract_name(text: str) -> str | None:
    """
    Extracts the candidate's name based on layout heuristics:
    Typically, the candidate's name is in the first few lines of the resume.
    """
    # Split into lines and filter empty lines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Common words in titles/headers that shouldn't be matched as a candidate's name
    stop_words = {
        'resume', 'cv', 'curriculum', 'vitae', 'contact', 'email', 'phone', 'portfolio',
        'experience', 'education', 'skills', 'summary', 'about', 'profile', 'work',
        'history', 'projects', 'professional', 'objective', 'page', 'address', 'github', 'linkedin'
    }
    
    for line in lines[:5]:  # Check first 5 non-empty lines
        # Check if line contains email or phone, skip it
        if EMAIL_REGEX.search(line) or PHONE_REGEX.search(line):
            continue
            
        # Check if line contains typical section header words, skip it
        words = [w.lower().strip(',.:;') for w in line.split()]
        if any(w in stop_words for w in words):
            continue
            
        # Check line length: names are typically 2 to 4 words
        if 2 <= len(words) <= 4:
            # Clean up the line (remove trailing special chars, symbols, multiple spaces)
            cleaned_name = re.sub(r'[^a-zA-Z\s\-]', '', line)
            cleaned_name = ' '.join(cleaned_name.split())
            if cleaned_name:
                return cleaned_name
                
    return "Candidate Name Not Found"
