import pytest
from unittest.mock import MagicMock, patch
from app.parsers.pdf_parser import PDFParser
from app.parsers.docx_parser import DocxParser

def test_pdf_parser_success():
    """
    Test PDFParser extracts text correctly by mocking PyMuPDF (fitz).
    """
    parser = PDFParser()
    mock_doc = MagicMock()
    mock_doc.__enter__.return_value = mock_doc
    mock_page = MagicMock()
    mock_page.get_text.return_value = "Parsed PDF Text Content"
    mock_doc.__iter__.return_value = [mock_page]
    
    with patch("fitz.open", return_value=mock_doc) as mock_open:
        result = parser.parse(b"dummy pdf bytes")
        assert result == "Parsed PDF Text Content"
        mock_open.assert_called_once()


def test_docx_parser_success():
    """
    Test DocxParser extracts text correctly by mocking python-docx.
    """
    parser = DocxParser()
    mock_doc = MagicMock()
    mock_para1 = MagicMock()
    mock_para1.text = "Paragraph Text"
    mock_doc.paragraphs = [mock_para1]
    
    # Mock table content
    mock_table = MagicMock()
    mock_row = MagicMock()
    mock_cell = MagicMock()
    mock_cell.text = "Cell Text"
    mock_row.cells = [mock_cell]
    mock_table.rows = [mock_row]
    mock_doc.tables = [mock_table]
    
    with patch("docx.Document", return_value=mock_doc) as mock_doc_class:
        result = parser.parse(b"dummy docx bytes")
        assert "Paragraph Text" in result
        assert "Cell Text" in result
        mock_doc_class.assert_called_once()
