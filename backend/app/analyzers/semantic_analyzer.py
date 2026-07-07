from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SemanticAnalyzer:
    def analyze_similarity(self, resume_text: str, jd_text: str) -> dict:
        """
        Calculates TF-IDF cosine similarity and scaled score between resume and job description.
        """
        try:
            # Initialize vectorizer with English stop words
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf = vectorizer.fit_transform([resume_text, jd_text])
            
            # Calculate cosine similarity
            similarity = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
        except Exception:
            similarity = 0.0
            
        # Piecewise linear scaling to map TF-IDF similarity to realistic score.
        # TF-IDF cosine similarities are generally lower than dense embeddings (typically 0.1 to 0.5)
        # So we scale it appropriately to give a realistic matching percentage (e.g. 60% to 90%)
        x = max(0.0, similarity)
        
        # Mapping ranges for TF-IDF similarity:
        # x >= 0.35  -->  85 + (x - 0.35) * (15 / 0.65)  [85 to 100]
        # 0.15 <= x < 0.35  -->  65 + (x - 0.15) * (20 / 0.2)  [65 to 85]
        # 0.05 <= x < 0.15  -->  35 + (x - 0.05) * (30 / 0.1)  [35 to 65]
        # x < 0.05  -->  x * (35 / 0.05)                      [0 to 35]
        if x >= 0.35:
            score = 85.0 + (x - 0.35) * (15.0 / 0.65)
        elif x >= 0.15:
            score = 65.0 + (x - 0.15) * (20.0 / 0.2)
        elif x >= 0.05:
            score = 35.0 + (x - 0.05) * (30.0 / 0.1)
        else:
            score = x * (35.0 / 0.05)
            
        score = max(0.0, min(100.0, score))
        
        return {
            "similarity": round(similarity, 4),
            "semantic_score": round(score, 1)
        }
