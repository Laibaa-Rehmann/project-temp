from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker, relationship
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

# Database
DATABASE_URL = "postgresql://skilllink_user:kali@localhost:5432/skilllink_db"

# JWT Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI App
app = FastAPI(title="SkillLink API")

# ================ CORS ================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "http://127.0.0.1:5173"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.options("/{path:path}")
async def options_handler(path: str):
    return {"message": "OK"}
# ================ END CORS ================

# ================ DATABASE MODELS ================
# Update User model with additional fields for freelancer profile
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    user_type = Column(String, nullable=False)  # 'freelancer' or 'client'
    full_name = Column(String)
    profile_title = Column(String)
    description = Column(Text)
    skills = Column(String)  # Comma-separated skills
    hourly_rate = Column(Float)
    country = Column(String)
    profile_picture = Column(String)
    verified = Column(Boolean, default=False)
    profile_completion = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

# Add new models for dashboard functionality
class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    budget_type = Column(String)  # 'fixed' or 'hourly'
    budget_min = Column(Float)
    budget_max = Column(Float)
    skills_required = Column(String) 
    location = Column(String, default="Remote") # Comma-separated
    duration = Column(String)
    experience_level = Column(String)  # 'entry', 'intermediate', 'expert'
    client_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default='open')  # 'open', 'in_progress', 'completed', 'cancelled'
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    client = relationship("User", foreign_keys=[client_id])

class Proposal(Base):
    __tablename__ = "proposals"
    id = Column(Integer, primary_key=True, index=True)
    freelancer_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    cover_letter = Column(Text)
    bid_amount = Column(Float)
    estimated_days = Column(Integer)
    status = Column(String, default='pending')  # 'pending', 'accepted', 'rejected', 'interviewing', 'hired'
    submitted_at = Column(DateTime, default=datetime.utcnow)
    freelancer = relationship("User", foreign_keys=[freelancer_id])
    job = relationship("Job", foreign_keys=[job_id])

class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    freelancer_id = Column(Integer, ForeignKey("users.id"))
    client_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    title = Column(String)
    status = Column(String, default='active')  # 'active', 'completed', 'cancelled', 'disputed'
    total_amount = Column(Float)
    paid_amount = Column(Float, default=0)
    hourly_rate = Column(Float)
    hours_per_week = Column(Integer)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    freelancer = relationship("User", foreign_keys=[freelancer_id])
    client = relationship("User", foreign_keys=[client_id])
    job = relationship("Job", foreign_keys=[job_id])

# Create all tables
Base.metadata.create_all(bind=engine)

# ================ PYDANTIC SCHEMAS ================
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    user_type: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    user_type: str
    full_name: Optional[str]
    profile_title: Optional[str]
    description: Optional[str]
    skills: Optional[str]
    hourly_rate: Optional[float]
    country: Optional[str]
    profile_completion: int
    verified: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# New schemas for dashboard
class DashboardStats(BaseModel):
    active_proposals: int
    interviews: int
    active_contracts: int
    total_earnings: float
    pending_earnings: float
    profile_completion: int
    response_rate: float
    job_success_score: float
    avg_response_time_hours: float

class ActivityItem(BaseModel):
    id: int
    type: str  # 'proposal', 'interview', 'contract', 'message', 'payment'
    title: str
    description: str
    time: str
    status: str
    related_id: Optional[int]

    class Config:
        from_attributes = True

class JobRecommendation(BaseModel):
    id: int
    title: str
    client_name: str
    budget_type: str
    budget_min: Optional[float]
    budget_max: Optional[float]
    budget_display: str
    skills_required: List[str]
    posted_time: str
    proposals_count: int
    is_featured: bool
    experience_level: str

    class Config:
        from_attributes = True

# ================ HELPER FUNCTIONS ================
def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except:
        # Fallback for testing
        return plain_password == hashed_password

def get_password_hash(password):
    try:
        return pwd_context.hash(password)
    except:
        # Fallback for testing
        return password

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def calculate_profile_completion(user: User):
    """Calculate profile completion percentage"""
    fields_to_check = [
        user.full_name,
        user.profile_title,
        user.description,
        user.skills,
        user.hourly_rate,
        user.country,
    ]
    
    filled_fields = sum(1 for field in fields_to_check if field is not None and field != "")
    total_fields = len(fields_to_check)
    completion_percentage = int((filled_fields / total_fields) * 100)
    
    # Update user profile completion
    user.profile_completion = completion_percentage
    return completion_percentage

def time_ago(dt: datetime) -> str:
    """Convert datetime to relative time string"""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 365:
        return f"{diff.days // 365}y ago"
    elif diff.days > 30:
        return f"{diff.days // 30}mo ago"
    elif diff.days > 0:
        return f"{diff.days}d ago"
    elif diff.seconds > 3600:
        return f"{diff.seconds // 3600}h ago"
    elif diff.seconds > 60:
        return f"{diff.seconds // 60}m ago"
    else:
        return "Just now"

# ================ DEPENDENCIES ================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user

# ================ EXISTING ROUTES ================
@app.get("/")
def root():
    return {"message": "SkillLink API is running", "status": "healthy"}

@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create user with default freelancer fields
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        user_type=user.user_type,
        full_name=user.full_name,
        profile_completion=20  # Basic completion for new users
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"🔐 Login attempt with: {form_data.username}")
    
    # Try username first, then email
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        # Try email if username not found
        user = db.query(User).filter(User.email == form_data.username).first()
        if user:
            print(f"✅ User found by email: {user.email}")
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        print(f"❌ Login failed for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ Login successful for user: {user.username}")
    access_token = create_access_token(data={"sub": user.username})
    
    # Update profile completion
    calculate_profile_completion(user)
    db.commit()
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        user_type=user.user_type,
        full_name=user.full_name,
        profile_title=user.profile_title,
        description=user.description,
        skills=user.skills,
        hourly_rate=user.hourly_rate,
        country=user.country,
        profile_completion=user.profile_completion,
        verified=user.verified
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

# ================ NEW DASHBOARD ENDPOINTS ================
@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get real-time dashboard statistics for freelancer"""
    
    # If user is not a freelancer, return empty stats
    if current_user.user_type != 'freelancer':
        return DashboardStats(
            active_proposals=0,
            interviews=0,
            active_contracts=0,
            total_earnings=0,
            pending_earnings=0,
            profile_completion=current_user.profile_completion,
            response_rate=0,
            job_success_score=0,
            avg_response_time_hours=0
        )
    
    # Calculate active proposals (pending + interviewing)
    active_proposals = db.query(Proposal).filter(
        Proposal.freelancer_id == current_user.id,
        Proposal.status.in_(["pending", "interviewing"])
    ).count()
    
    # Calculate interviews
    interviews = db.query(Proposal).filter(
        Proposal.freelancer_id == current_user.id,
        Proposal.status == "interviewing"
    ).count()
    
    # Calculate active contracts
    active_contracts = db.query(Contract).filter(
        Contract.freelancer_id == current_user.id,
        Contract.status == "active"
    ).count()
    
    # Calculate total earnings (sum of paid amount in completed contracts)
    total_earnings_result = db.query(func.sum(Contract.paid_amount)).filter(
        Contract.freelancer_id == current_user.id,
        Contract.status == "completed"
    ).first()
    total_earnings = total_earnings_result[0] or 0
    
    # Calculate pending earnings (total - paid in active contracts)
    pending_result = db.query(func.sum(Contract.total_amount - Contract.paid_amount)).filter(
        Contract.freelancer_id == current_user.id,
        Contract.status == "active"
    ).first()
    pending_earnings = pending_result[0] or 0
    
    # Calculate profile completion
    profile_completion = calculate_profile_completion(current_user)
    db.commit()
    
    # Calculate response rate (proposals with any response vs total)
    total_proposals = db.query(Proposal).filter(
        Proposal.freelancer_id == current_user.id
    ).count()
    
    responded_proposals = db.query(Proposal).filter(
        Proposal.freelancer_id == current_user.id,
        Proposal.status.in_(["accepted", "rejected", "interviewing", "hired"])
    ).count()
    
    response_rate = (responded_proposals / total_proposals * 100) if total_proposals > 0 else 0
    
    # Calculate job success score (hired proposals vs total)
    hired_proposals = db.query(Proposal).filter(
        Proposal.freelancer_id == current_user.id,
        Proposal.status == "hired"
    ).count()
    
    job_success_score = (hired_proposals / total_proposals * 100) if total_proposals > 0 else 0
    
    # Calculate average response time (simplified)
    avg_response_time_hours = 2.4  # Mock for now
    
    return DashboardStats(
        active_proposals=active_proposals,
        interviews=interviews,
        active_contracts=active_contracts,
        total_earnings=total_earnings,
        pending_earnings=pending_earnings,
        profile_completion=profile_completion,
        response_rate=round(response_rate, 1),
        job_success_score=round(job_success_score, 1),
        avg_response_time_hours=avg_response_time_hours
    )

@app.get("/api/dashboard/activity", response_model=List[ActivityItem])
def get_recent_activity(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get recent activity for freelancer"""
    
    # If user is not a freelancer, return empty list
    if current_user.user_type != 'freelancer':
        return []
    
    activities = []
    
    # Get recent proposals (last 5)
    recent_proposals = db.query(Proposal).filter(
        Proposal.freelancer_id == current_user.id
    ).order_by(Proposal.submitted_at.desc()).limit(5).all()
    
    for proposal in recent_proposals:
        job_title = proposal.job.title if proposal.job else "a job"
        activities.append(ActivityItem(
            id=proposal.id,
            type="proposal",
            title=f"Proposal submitted for {job_title}",
            description=f"Your proposal is {proposal.status}",
            time=time_ago(proposal.submitted_at),
            status=proposal.status,
            related_id=proposal.job_id
        ))
    
    # Get recent contracts (last 3)
    recent_contracts = db.query(Contract).filter(
        Contract.freelancer_id == current_user.id
    ).order_by(Contract.created_at.desc()).limit(3).all()
    
    for contract in recent_contracts:
        activities.append(ActivityItem(
            id=contract.id,
            type="contract",
            title=f"New contract: {contract.title}",
            description=f"Contract is {contract.status}",
            time=time_ago(contract.created_at),
            status=contract.status,
            related_id=contract.job_id
        ))
    
    # Sort all activities by time and get top 6
    return activities[:6]

@app.get("/api/dashboard/recommended-jobs", response_model=List[JobRecommendation])
def get_recommended_jobs(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get job recommendations for freelancer"""
    
    # If user is not a freelancer, return empty list
    if current_user.user_type != 'freelancer':
        return []
    
    # Get freelancer skills
    freelancer_skills = current_user.skills.split(",") if current_user.skills else []
    
    # Get all open jobs
    recommended_jobs = db.query(Job).filter(
        Job.status == 'open',
        Job.client_id != current_user.id  # Don't recommend own jobs
    ).order_by(Job.created_at.desc()).limit(10).all()
    
    recommendations = []
    for job in recommended_jobs:
        # Format budget display
        if job.budget_type == 'fixed':
            budget_display = f"${job.budget_min:,.0f} - ${job.budget_max:,.0f}"
        else:
            budget_display = f"${job.budget_min}/hr - ${job.budget_max}/hr"
        
        # Get proposals count
        proposals_count = db.query(Proposal).filter(Proposal.job_id == job.id).count()
        
        # Get client name
        client_name = job.client.full_name or job.client.username if job.client else "Anonymous"
        
        recommendations.append(JobRecommendation(
            id=job.id,
            title=job.title,
            client_name=client_name,
            budget_type=job.budget_type,
            budget_min=job.budget_min,
            budget_max=job.budget_max,
            budget_display=budget_display,
            skills_required=job.skills_required.split(",") if job.skills_required else ["General"],
            posted_time=time_ago(job.created_at),
            proposals_count=proposals_count,
            is_featured=job.is_featured,
            experience_level=job.experience_level or "Intermediate"
        ))
    
    return recommendations[:5]

@app.get("/api/dashboard/upcoming-interviews")
def get_upcoming_interviews(current_user: User = Depends(get_current_active_user)):
    """Get upcoming interviews"""
    # Return mock data for now - can be implemented later
    return {
        "interviews": [
            {
                "id": 1,
                "job_title": "Full Stack Developer",
                "client_name": "TechCorp Inc",
                "scheduled_time": "Tomorrow, 2:00 PM",
                "duration": "30 minutes",
                "meeting_type": "Zoom Call"
            },
            {
                "id": 2,
                "job_title": "UI/UX Designer",
                "client_name": "Creative Studio",
                "scheduled_time": "Friday, 11:00 AM",
                "duration": "45 minutes",
                "meeting_type": "Google Meet"
            }
        ]
    }

# # ================ NEW ENDPOINTS FOR FIND WORK PAGE ================
# class JobResponse(BaseModel):
#     id: int
#     title: str
#     description: Optional[str]
#     budget_type: str
#     budget: Optional[float]
#     budget_min: Optional[float]
#     budget_max: Optional[float]
#     skills_required: Optional[List[str]]
#     location: Optional[str]
#     experience_level: Optional[str]
#     is_featured: bool
#     posted_at: Optional[str]
#     proposals_count: int
#     client: Optional[dict]
    
#     class Config:
#         from_attributes = True

# class CategoryResponse(BaseModel):
#     id: int
#     name: str
#     job_count: int
    
#     class Config:
#         from_attributes = True

# # Add this route for getting all jobs
# @app.get("/api/jobs", response_model=dict)
# def get_jobs(
#     search: Optional[str] = None,
#     min_budget: Optional[float] = None,
#     max_budget: Optional[float] = None,
#     skills: Optional[str] = None,
#     category: Optional[str] = None,
#     experience_level: Optional[str] = None,
#     job_type: Optional[str] = None,
#     location: Optional[str] = None,
#     page: int = 1,
#     limit: int = 10,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """Get all available jobs with optional filters"""
    
#     # Start with base query
#     query = db.query(Job).filter(Job.status == 'open')
    
#     # Apply filters
#     if search:
#         query = query.filter(
#             (Job.title.ilike(f"%{search}%")) | 
#             (Job.description.ilike(f"%{search}%"))
#         )
    
#     if min_budget is not None:
#         query = query.filter(Job.budget_min >= min_budget)
    
#     if max_budget is not None:
#         query = query.filter(Job.budget_max <= max_budget)
    
#     if skills:
#         skills_list = [skill.strip() for skill in skills.split(",")]
#         for skill in skills_list:
#             query = query.filter(Job.skills_required.ilike(f"%{skill}%"))
    
#     if experience_level and experience_level != 'all':
#         query = query.filter(Job.experience_level == experience_level)
    
#     if job_type and job_type != 'all':
#         query = query.filter(Job.budget_type == job_type)
    
#     if location and location != 'all':
#         if location == 'remote':
#             query = query.filter(Job.location.ilike("%remote%"))
#         # Add more location filters as needed
    
#     # Get total count before pagination
#     total = query.count()
    
#     # Apply pagination
#     offset = (page - 1) * limit
#     jobs = query.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()
    
#     # Format response
#     job_list = []
#     for job in jobs:
#         # Get proposals count
#         proposals_count = db.query(Proposal).filter(Proposal.job_id == job.id).count()
        
#         # Get client info
#         client_info = {}
#         if job.client:
#             client_info = {
#                 "company_name": job.client.company_name if hasattr(job.client, 'company_name') else None,
#                 "full_name": job.client.full_name,
#                 "username": job.client.username,
#                 "rating": 4.5,  # You can calculate this based on reviews
#                 "total_spent": 10000,  # You can calculate this from contracts
#             }
        
#         job_list.append({
#             "id": job.id,
#             "title": job.title,
#             "description": job.description,
#             "budget_type": job.budget_type,
#             "budget": job.budget_min if job.budget_type == 'fixed' else job.budget_min,  # Use min for hourly rate
#             "budget_min": job.budget_min,
#             "budget_max": job.budget_max,
#             "skills_required": job.skills_required.split(",") if job.skills_required else [],
#             "location": "Remote",  # Add location field to Job model if needed
#             "experience_level": job.experience_level,
#             "is_featured": job.is_featured,
#             "posted_at": job.created_at.isoformat() if job.created_at else None,
#             "proposals_count": proposals_count,
#             "client": client_info
#         })
    
#     return {
#         "jobs": job_list,
#         "total": total,
#         "page": page,
#         "limit": limit,
#         "total_pages": (total + limit - 1) // limit
#     }

# @app.get("/api/jobs/categories", response_model=List[CategoryResponse])
# def get_job_categories(db: Session = Depends(get_db)):
#     """Get job categories with counts"""
#     # For now, return static categories. You can make this dynamic later
#     categories = [
#         {"id": 1, "name": "Web Development", "job_count": 45},
#         {"id": 2, "name": "Mobile Development", "job_count": 28},
#         {"id": 3, "name": "Design", "job_count": 32},
#         {"id": 4, "name": "Writing", "job_count": 19},
#         {"id": 5, "name": "Marketing", "job_count": 26},
#         {"id": 6, "name": "Data Science", "job_count": 22},
#         {"id": 7, "name": "Virtual Assistant", "job_count": 15},
#     ]
#     return categories

# @app.get("/api/jobs/{job_id}", response_model=JobResponse)
# def get_job_details(
#     job_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """Get detailed information about a specific job"""
#     job = db.query(Job).filter(Job.id == job_id).first()
    
#     if not job:
#         raise HTTPException(status_code=404, detail="Job not found")
    
#     # Check if user has already applied
#     has_applied = db.query(Proposal).filter(
#         Proposal.job_id == job_id,
#         Proposal.freelancer_id == current_user.id
#     ).first() is not None
    
#     # Get proposals count
#     proposals_count = db.query(Proposal).filter(Proposal.job_id == job_id).count()
    
#     # Get client info
#     client_info = {}
#     if job.client:
#         client_info = {
#             "id": job.client.id,
#             "company_name": job.client.company_name if hasattr(job.client, 'company_name') else None,
#             "full_name": job.client.full_name,
#             "username": job.client.username,
#             "rating": 4.5,
#             "total_spent": 10000,
#             "description": job.client.description,
#             "verified": job.client.verified,
#             "member_since": job.client.created_at.year if job.client.created_at else None
#         }
    
#     return {
#         "id": job.id,
#         "title": job.title,
#         "description": job.description,
#         "budget_type": job.budget_type,
#         "budget": job.budget_min if job.budget_type == 'hourly' else job.budget_min,
#         "budget_min": job.budget_min,
#         "budget_max": job.budget_max,
#         "skills_required": job.skills_required.split(",") if job.skills_required else [],
#         "location": "Remote",  # Add to Job model
#         "experience_level": job.experience_level,
#         "is_featured": job.is_featured,
#         "posted_at": job.created_at.isoformat() if job.created_at else None,
#         "proposals_count": proposals_count,
#         "client": client_info,
#         "has_applied": has_applied,
#         "duration": job.duration,
#         "status": job.status
#     }

# @app.post("/api/jobs/{job_id}/apply")
# def apply_to_job(
#     job_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """Apply to a job"""
#     # Check if job exists
#     job = db.query(Job).filter(Job.id == job_id).first()
#     if not job:
#         raise HTTPException(status_code=404, detail="Job not found")
    
#     # Check if job is open
#     if job.status != 'open':
#         raise HTTPException(status_code=400, detail="Job is not accepting applications")
    
#     # Check if user is the client who posted the job
#     if job.client_id == current_user.id:
#         raise HTTPException(status_code=400, detail="You cannot apply to your own job")
    
#     # Check if user has already applied
#     existing_proposal = db.query(Proposal).filter(
#         Proposal.job_id == job_id,
#         Proposal.freelancer_id == current_user.id
#     ).first()
    
#     if existing_proposal:
#         raise HTTPException(status_code=400, detail="You have already applied to this job")
    
#     # Create proposal
#     new_proposal = Proposal(
#         freelancer_id=current_user.id,
#         job_id=job_id,
#         cover_letter="I'm interested in this position and would like to apply.",
#         bid_amount=job.budget_min if job.budget_type == 'fixed' else None,
#         status="pending",
#         submitted_at=datetime.utcnow()
#     )
    
#     db.add(new_proposal)
#     db.commit()
#     db.refresh(new_proposal)
    
#     return {"message": "Successfully applied to job", "proposal_id": new_proposal.id}

# @app.post("/api/jobs/{job_id}/save")
# def save_job(
#     job_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """Save a job to favorites"""
#     # You'll need to create a SavedJob model for this
#     # For now, return success
#     return {"message": "Job saved successfully"}

# @app.post("/api/jobs/{job_id}/unsave")
# def unsave_job(
#     job_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_active_user)
# ):
#     """Remove a job from saved"""
#     return {"message": "Job removed from saved"}

# # Add this before if __name__ == "__main__":

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)