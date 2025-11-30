from fastapi import FastAPI
from database import Base, engine
from routers import auth, projects, applications
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SkillLink API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(applications.router)
app.include_router(projects.router, prefix="/projects", tags=["Projects"])


@app.get("/")
def root():
    return {"message": "SkillLink Backend is running"}
