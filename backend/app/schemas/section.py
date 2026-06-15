from pydantic import BaseModel
from typing import Dict, List

class SectionRequest(BaseModel):
    text: str

class SectionResponse(BaseModel):
    sections_detected: Dict[str, bool]
    section_offsets: Dict[str, List[int]]  # Map of section -> [start_index, end_index]
    section_text: Dict[str, str]           # Map of section -> actual text content
