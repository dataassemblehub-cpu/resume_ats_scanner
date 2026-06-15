import re
from sklearn.feature_extraction.text import TfidfVectorizer

class KeywordAnalyzer:
    def __init__(self, top_n: int = 15):
        self.top_n = top_n

    def analyze(self, resume_text: str, jd_text: str) -> dict:
        """
        Extracts top keywords from Job Description using TF-IDF and
        analyzes their presence and frequency in the Resume text.
        """
        # 1. Clean input texts (lowercase and normalize spacing)
        cleaned_resume = resume_text.strip().lower()
        cleaned_jd = jd_text.strip().lower()

        if not cleaned_resume or not cleaned_jd:
            return {
                "matched": [],
                "missing": [],
                "coverage_percentage": 0.0,
                "keyword_frequency": {}
            }

        # 2. Vectorize the Job Description using TfidfVectorizer
        # We allow both unigrams (single words) and bigrams (two words)
        vectorizer = TfidfVectorizer(
            stop_words='english', 
            ngram_range=(1, 2),
            token_pattern=r'(?u)\b[a-zA-Z]{2,}(?:\+[a-zA-Z0-9]+)?\b' # Matches terms like c++, next.js, .net
        )

        try:
            tfidf_matrix = vectorizer.fit_transform([cleaned_jd])
            feature_names = vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
        except ValueError:
            # If TF-IDF fails (e.g. no terms found after removing stop words), fallback to basic tokenizer
            feature_names = [word for word in re.findall(r'\b[a-z]{3,}\b', cleaned_jd) if word not in vectorizer.get_stop_words()]
            scores = [1.0] * len(feature_names)

        # 3. Associate terms with their scores and sort
        term_scores = list(zip(feature_names, scores))
        # Sort by score descending
        term_scores.sort(key=lambda x: x[1], reverse=True)

        # Filter out numbers and duplicates, retaining top N terms
        seen_terms = set()
        top_keywords = []
        for term, score in term_scores:
            if len(top_keywords) >= self.top_n:
                break
            # Ignore purely numeric terms and very short words
            if term.isdigit() or len(term) < 2:
                continue
            if term not in seen_terms:
                seen_terms.add(term)
                top_keywords.append(term)

        # 4. Count frequency of each top keyword in Resume and JD
        matched = []
        missing = []
        keyword_frequency = {}

        for kw in top_keywords:
            # Build regex boundary pattern (handle special chars like c++, next.js correctly)
            # If keyword ends with special chars, word boundary \b might fail, so we use optional boundaries
            escaped_kw = re.escape(kw)
            if re.match(r'.*[\+\.#]$', kw):
                pattern = re.compile(r'\b' + escaped_kw + r'(?:\b|\s|$)', re.IGNORECASE)
            else:
                pattern = re.compile(r'\b' + escaped_kw + r'\b', re.IGNORECASE)

            resume_count = len(pattern.findall(cleaned_resume))
            jd_count = len(pattern.findall(cleaned_jd))

            keyword_frequency[kw.title()] = {
                "resume": resume_count,
                "jd": jd_count
            }

            if resume_count > 0:
                matched.append(kw.title())
            else:
                missing.append(kw.title())

        # 5. Calculate coverage percentage
        total_kw = len(top_keywords)
        coverage_pct = (len(matched) / total_kw * 100.0) if total_kw > 0 else 0.0

        return {
            "matched": sorted(matched),
            "missing": sorted(missing),
            "coverage_percentage": round(coverage_pct, 2),
            "keyword_frequency": keyword_frequency
        }
