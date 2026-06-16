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
     
        
        # Scale to 0-100. Text similarity is generally positive, so clamp to [0.0, 100.0]
        score = max(0.0, similarity) * 100.0
        
        return {
            "similarity": round(similarity, 4),
            "semantic_score": round(score, 1)
        }
