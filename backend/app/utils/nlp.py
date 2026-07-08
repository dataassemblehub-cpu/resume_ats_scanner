import spacy
from app.utils.logging_config import logger

def load_spacy_model_safely(model_name: str = "en_core_web_sm"):
    """
    Attempts to load a spaCy model. If E050 Can't find model error occurs,
    automatically downloads it dynamically.
    """
    import spacy
    try:
        return spacy.load(model_name)
    except OSError:
        logger.info(f"spaCy model '{model_name}' not found locally. Downloading dynamically...")
        try:
            import spacy.cli
            spacy.cli.download(model_name)
            # Re-attempt loading after downloading
            model = spacy.load(model_name)
            logger.info(f"spaCy model '{model_name}' successfully downloaded and loaded.")
            return model
        except Exception as e:
            logger.error(f"Failed to dynamically download spaCy model '{model_name}': {str(e)}")
            raise
