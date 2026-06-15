from pydantic import BaseModel

class JDParseRequest(BaseModel):
    description: str

class JDParseResponse(BaseModel):
    title: str | None
    skills: list[str]
    tools: list[str]
    education: list[str]
    years_of_experience: float | None
    responsibilities: list[str]
