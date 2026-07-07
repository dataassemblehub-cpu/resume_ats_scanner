from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

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
        # x >= 0.4  -->  85 + (x - 0.4) * (15 / 0.6)  [85 to 100]
        # 0.2 <= x < 0.4  -->  60 + (x - 0.2) * (25 / 0.2)  [60 to 85]
        # 0.05 <= x < 0.2  -->  20 + (x - 0.05) * (40 / 0.15) [20 to 60]
        # x < 0.05  -->  x * (20 / 0.05)                    [0 to 20]
        if x >= 0.4:
            score = 85.0 + (x - 0.4) * (15.0 / 0.6)
        elif x >= 0.2:
            score = 60.0 + (x - 0.2) * (25.0 / 0.2)
        elif x >= 0.05:
            score = 20.0 + (x - 0.05) * (40.0 / 0.15)
        else:
            score = x * (20.0 / 0.05)
            
        score = max(0.0, min(100.0, score))
        
        return {
            "similarity": round(similarity, 4),
            "semantic_score": round(score, 1)
        }
