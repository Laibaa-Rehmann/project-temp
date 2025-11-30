from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Project

router = APIRouter(prefix="/projects", tags=["Projects"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create a single project
@router.post("/")
def create_project(project: dict, db: Session = Depends(get_db)):
    new_project = Project(**project)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

# Create multiple projects
@router.post("/bulk")
def create_projects(projects: List[dict], db: Session = Depends(get_db)):
    new_projects = [Project(**proj) for proj in projects]
    db.add_all(new_projects)
    db.commit()
    # Refresh each project to get generated IDs
    for proj in new_projects:
        db.refresh(proj)
    return new_projects

# Get all projects
@router.get("/")
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()
