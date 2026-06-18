from sentence_transformers import SentenceTransformer, util
from app.utils.logging_config import logger

class SemanticAnalyzer:
    _model = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """
        Lazy-loads the SentenceTransformer model and caches it.
        """
        if cls._model is None:
            logger.info("Initializing SentenceTransformer model 'all-MiniLM-L6-v2'...")
            # Automatically downloads to default Hugging Face cache directory if not present
            cls._model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model successfully loaded.")
        return cls._model

    def analyze_similarity(self, resume_text: str, jd_text: str) -> dict:
        """
        Calculates cosine similarity and scaled score between resume and job description.
        """
        model = self.get_model()
        
        # Generate embeddings
        resume_emb = model.encode(resume_text, convert_to_tensor=True) #convert it to vectors
        jd_emb = model.encode(jd_text, convert_to_tensor=True) #convert it to vectors
        
        # Calculate cosine similarity
        # -1.0 → opposite meaning
        # 0.0 → unrelated
        # 1.0 → identical
        similarity = float(util.cos_sim(resume_emb, jd_emb).item()) 
     
        
        # Piecewise linear scaling to map raw cosine similarity to realistic score
        # x is the similarity coefficient (typically between -1.0 and 1.0)
        # We clamp x to [0.0, 1.0] first
        x = max(0.0, similarity)
        
        # Mapping ranges:
        # x >= 0.7  -->  90 + (x - 0.7) * (10 / 0.3)  [90 to 100]
        # 0.45 <= x < 0.7  -->  60 + (x - 0.45) * (30 / 0.25)  [60 to 90]
        # 0.2 <= x < 0.45  -->  20 + (x - 0.2) * (40 / 0.25)   [20 to 60]
        # x < 0.2   -->  x * (20 / 0.2)                        [0 to 20]
        if x >= 0.7:
            score = 90.0 + (x - 0.7) * (10.0 / 0.3)
        elif x >= 0.45:
            score = 60.0 + (x - 0.45) * (30.0 / 0.25)
        elif x >= 0.2:
            score = 20.0 + (x - 0.2) * (40.0 / 0.25)
        else:
            score = x * (20.0 / 0.2)

        # Clamp just in case to [0.0, 100.0]
        score = max(0.0, min(100.0, score))
        
        return {
            "similarity": round(similarity, 4),
            "semantic_score": round(score, 1)
        }
