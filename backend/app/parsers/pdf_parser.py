import fitz  # PyMuPDF
from app.parsers.base import BaseParser

class PDFParser(BaseParser):
    def parse(self, file_content: bytes) -> str:
        """
        Extracts plain text from PDF binary content using PyMuPDF.
        """
        text = ""
        try:
            # Open PDF from memory stream
            with fitz.open(stream=file_content, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text()
        except Exception as e:
            raise ValueError(f"Failed to parse PDF file: {str(e)}")
        
        return text.strip()
