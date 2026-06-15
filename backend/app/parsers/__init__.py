from app.parsers.base import BaseParser
from app.parsers.pdf_parser import PDFParser
from app.parsers.docx_parser import DocxParser

def get_parser(mime_type: str) -> BaseParser:
    """
    Factory function to retrieve the appropriate parser based on MIME type.
    """
    if mime_type == "application/pdf":
        return PDFParser()
    elif mime_type in [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ]:
        return DocxParser()
    else:
        raise ValueError(f"Unsupported file format: {mime_type}. Only PDF and DOCX are supported.")
