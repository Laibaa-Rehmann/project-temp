# populate_categories.py
from database import SessionLocal
from models import Job

db = SessionLocal()

jobs = db.query(Job).filter(Job.category == None).all()
for job in jobs:
    if "React" in job.title or "React" in (job.skills_required or ""):
        job.category = "Frontend Development"
    elif "Python" in job.title or "Python" in (job.skills_required or ""):
        job.category = "Backend Development"
    elif "DevOps" in job.title or "DevOps" in (job.skills_required or ""):
        job.category = "DevOps"
    elif "Content" in job.title or "Content" in (job.skills_required or ""):
        job.category = "Content Writing"
    else:
        job.category = "General"

db.commit()