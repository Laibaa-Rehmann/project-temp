from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str

class ProjectCreate(BaseModel):
    title: str
    description: str
    budget: int

class ApplicationCreate(BaseModel):
    project_id: int
    proposal: str
