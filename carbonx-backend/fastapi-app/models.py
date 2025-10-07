from pydantic import BaseModel

class Emission(BaseModel):
    company_id: int
    category: str
    value: float
