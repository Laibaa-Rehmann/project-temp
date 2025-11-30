from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Application

router = APIRouter(prefix="/applications", tags=["Applications"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def apply_project(application: dict, db: Session = Depends(get_db)):
    new_app = Application(**application)
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app
