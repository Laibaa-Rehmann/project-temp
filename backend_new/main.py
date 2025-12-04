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
    company_name = Column(String)
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
    category = Column(String(100), nullable=True)
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
    company_name: Optional[str] = None 
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

# # ================ NEW ENDPOINTS FO
# ================ JOB ENDPOINTS ================

# Pydantic schemas for jobs
class JobCreate(BaseModel):
    title: str
    description: str
    budget_type: str  # 'fixed' or 'hourly'
    budget_min: float
    budget_max: float
    skills_required: str  # Comma-separated
    location: str = "Remote"
    duration: str
    experience_level: str = "intermediate"  # 'entry', 'intermediate', 'expert'
    category: Optional[str] = None
    is_featured: bool = False

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    budget_type: str
    budget_min: float
    budget_max: float
    budget_display: str
    skills_required: List[str]
    location: str
    duration: str
    experience_level: str
    client_id: int
    status: str
    is_featured: bool
    created_at: datetime
    proposals_count: int
    client: Optional[dict] = None
    
    class Config:
        from_attributes = True

class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    saved_jobs: List[int] = []

class CategoryResponse(BaseModel):
    id: str
    name: str
    job_count: int
    
    class Config:
        from_attributes = True

class ApplicationCreate(BaseModel):
    cover_letter: str
    proposed_rate: Optional[float] = None
    estimated_days: Optional[int] = None

# Main jobs endpoint with filtering
@app.get("/api/jobs", response_model=JobListResponse)
def get_jobs(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    skills: Optional[str] = None,
    category: Optional[str] = None,
    experience_level: Optional[str] = None,
    job_type: Optional[str] = None,
    location: Optional[str] = None,
    page: int = 1,
    limit: int = 10
):
    """Get all jobs with filtering and pagination"""
    
    try:
        print("=" * 50)
        print("🔄 GET /api/jobs called")
        print(f"👤 User: {current_user.username} (ID: {current_user.id})")
        print(f"📋 Filters: page={page}, limit={limit}, search='{search}'")
        
        # Start building query
        query = db.query(Job).filter(Job.status == 'open')
        
        # Debug: Check how many jobs are in the database
        all_jobs_count = db.query(Job).count()
        open_jobs_count = db.query(Job).filter(Job.status == 'open').count()
        print(f"📊 Database stats - Total jobs: {all_jobs_count}, Open jobs: {open_jobs_count}")
        
        if open_jobs_count == 0:
            print("⚠️  WARNING: No open jobs found in database!")
            # List all jobs to see what's there
            all_jobs = db.query(Job).all()
            for job in all_jobs:
                print(f"   Job ID {job.id}: '{job.title}' - Status: '{job.status}'")
        
        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Job.title.ilike(search_term)) | 
                (Job.description.ilike(search_term))
            )
            print(f"🔍 Applied search filter: '{search}'")
        
        # Get total count before pagination
        total = query.count()
        print(f"📊 Jobs after filters: {total}")
        
        # Apply pagination
        offset = (page - 1) * limit
        jobs = query.order_by(Job.created_at.desc()).offset(offset).limit(limit).all()
        
        print(f"📄 Fetched {len(jobs)} jobs from database")
        
        # Debug each job
        for i, job in enumerate(jobs):
            print(f"   Job {i+1}: ID={job.id}, Title='{job.title}', Status='{job.status}'")
            print(f"      Budget: ${job.budget_min}-${job.budget_max} ({job.budget_type})")
            print(f"      Client ID: {job.client_id}")
            if job.client:
                print(f"      Client: {job.client.full_name or job.client.username}")
        
        # Format job responses
        job_responses = []
        for job in jobs:
            # Get proposals count
            proposals_count = db.query(Proposal).filter(Proposal.job_id == job.id).count()
            
            # Format budget display
            if job.budget_type == 'fixed':
                budget_display = f"${job.budget_min:,.0f} - ${job.budget_max:,.0f}"
            else:
                budget_display = f"${job.budget_min}/hr - ${job.budget_max}/hr"
            
            # Get client info
            client_info = None
            if job.client:
                client_info = {
                    'id': job.client.id,
                    'full_name': job.client.full_name or job.client.username,
                    'company_name': getattr(job.client, 'company_name', None),
                    'rating': 4.5,
                    'total_spent': 0
                }
                print(f"✅ Client found for job {job.id}: {client_info['full_name']}")
            else:
                print(f"⚠️  No client found for job {job.id} (client_id: {job.client_id})")
            
            job_response = JobResponse(
                id=job.id,
                title=job.title,
                description=job.description,
                budget_type=job.budget_type,
                budget_min=job.budget_min,
                budget_max=job.budget_max,
                budget_display=budget_display,
                skills_required=job.skills_required.split(",") if job.skills_required else ["General"],
                location=job.location,
                duration=job.duration,
                experience_level=job.experience_level,
                category=job.category,
                client_id=job.client_id,
                status=job.status,
                is_featured=job.is_featured,
                created_at=job.created_at,
                proposals_count=proposals_count,
                client=client_info
            )
            job_responses.append(job_response)
        
        # Get saved jobs for current user
        saved_jobs = []
        
        response = JobListResponse(
            jobs=job_responses,
            total=total,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit if limit > 0 else 1,
            saved_jobs=saved_jobs
        )
        
        print(f"✅ Successfully returning {len(job_responses)} jobs")
        print("=" * 50)
        return response
        
    except Exception as e:
        print(f"❌ ERROR in get_jobs: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching jobs: {str(e)}")
        print(f"Error fetching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching jobs: {str(e)}")

@app.get("/api/jobs/categories", response_model=List[CategoryResponse])
def get_categories(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all job categories with counts"""
    try:
        # Get all unique categories from jobs
        categories_query = db.query(
            Job.category,
            db.func.count(Job.id).label('job_count')
        ).filter(Job.status == 'open')
        
        # If category field is None or empty, filter it out
        categories_query = categories_query.filter(Job.category.isnot(None))
        categories_query = categories_query.filter(Job.category != '')
        
        categories_result = categories_query.group_by(Job.category).all()
        
        categories = []
        for cat_name, job_count in categories_result:
            if cat_name:
                categories.append(CategoryResponse(
                    id=cat_name.lower().replace(' ', '-'),
                    name=cat_name,
                    job_count=job_count
                ))
        
        # Add common categories if they don't exist
        common_categories = ['Web Development', 'Mobile Development', 'Design', 'Writing', 'Marketing']
        for common_cat in common_categories:
            if not any(cat.name == common_cat for cat in categories):
                categories.append(CategoryResponse(
                    id=common_cat.lower().replace(' ', '-'),
                    name=common_cat,
                    job_count=0
                ))
        
        return categories
        
    except Exception as e:
        print(f"Error fetching categories: {str(e)}")
        # Return default categories on error
        return [
            CategoryResponse(id='web-development', name='Web Development', job_count=0),
            CategoryResponse(id='mobile-development', name='Mobile Development', job_count=0),
            CategoryResponse(id='design', name='Design', job_count=0),
            CategoryResponse(id='writing', name='Writing', job_count=0),
            CategoryResponse(id='marketing', name='Marketing', job_count=0),
        ]

@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a single job by ID"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Get proposals count
        proposals_count = db.query(Proposal).filter(Proposal.job_id == job.id).count()
        
        # Format budget display
        if job.budget_type == 'fixed':
            budget_display = f"${job.budget_min:,.0f} - ${job.budget_max:,.0f}"
        else:
            budget_display = f"${job.budget_min}/hr - ${job.budget_max}/hr"
        
        # Get client info
        client_info = None
        if job.client:
            client_info = {
                'id': job.client.id,
                'full_name': job.client.full_name,
                'company_name': job.client.company_name if hasattr(job.client, 'company_name') else None,
                'rating': 4.5,
                'total_spent': 0
            }
        
        return JobResponse(
            id=job.id,
            title=job.title,
            description=job.description,
            budget_type=job.budget_type,
            budget_min=job.budget_min,
            budget_max=job.budget_max,
            budget_display=budget_display,
            skills_required=job.skills_required.split(",") if job.skills_required else ["General"],
            location=job.location,
            duration=job.duration,
            experience_level=job.experience_level,
            category=job.category,
            client_id=job.client_id,
            status=job.status,
            is_featured=job.is_featured,
            created_at=job.created_at,
            proposals_count=proposals_count,
            client=client_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching job: {str(e)}")

@app.post("/api/jobs/{job_id}/apply")
def apply_to_job(
    job_id: int,
    application: ApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Apply to a job"""
    try:
        # Check if user is a freelancer
        if current_user.user_type != 'freelancer':
            raise HTTPException(status_code=403, detail="Only freelancers can apply to jobs")
        
        # Get the job
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if job is open
        if job.status != 'open':
            raise HTTPException(status_code=400, detail="Job is not open for applications")
        
        # Check if user already applied
        existing_proposal = db.query(Proposal).filter(
            Proposal.job_id == job_id,
            Proposal.freelancer_id == current_user.id
        ).first()
        
        if existing_proposal:
            raise HTTPException(status_code=400, detail="You have already applied to this job")
        
        # Calculate bid amount if not provided
        bid_amount = application.proposed_rate
        if not bid_amount:
            if job.budget_type == 'fixed':
                bid_amount = job.budget_min  # Use min budget as default
            else:
                bid_amount = job.budget_min  # Use min hourly rate as default
        
        # Create proposal
        proposal = Proposal(
            freelancer_id=current_user.id,
            job_id=job_id,
            cover_letter=application.cover_letter,
            bid_amount=bid_amount,
            estimated_days=application.estimated_days or 30,
            status='pending',
            submitted_at=datetime.utcnow()
        )
        
        db.add(proposal)
        db.commit()
        db.refresh(proposal)
        
        return {
            "message": "Application submitted successfully",
            "proposal_id": proposal.id,
            "status": proposal.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error applying to job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error applying to job: {str(e)}")

@app.get("/api/jobs/{job_id}/check-application")
def check_application(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check if user has already applied to a job"""
    try:
        existing_proposal = db.query(Proposal).filter(
            Proposal.job_id == job_id,
            Proposal.freelancer_id == current_user.id
        ).first()
        
        return {
            "applied": existing_proposal is not None,
            "proposal": {
                "id": existing_proposal.id,
                "status": existing_proposal.status,
                "submitted_at": existing_proposal.submitted_at
            } if existing_proposal else None
        }
        
    except Exception as e:
        print(f"Error checking application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking application: {str(e)}")

@app.post("/api/jobs/{job_id}/save")
def save_job(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Save a job to user's saved jobs"""
    # For now, return success - implement saved jobs table later
    return {
        "message": "Job saved successfully",
        "job_id": job_id,
        "saved": True
    }

@app.post("/api/jobs/{job_id}/unsave")
def unsave_job(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a job from user's saved jobs"""
    # For now, return success - implement saved jobs table later
    return {
        "message": "Job removed from saved list",
        "job_id": job_id,
        "saved": False
    }

@app.get("/api/jobs/saved")
def get_saved_jobs(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's saved jobs"""
    # For now, return empty list - implement saved jobs table later
    return {
        "saved_jobs": [],
        "total": 0
    }

# Create sample jobs endpoint (for testing)
@app.post("/api/jobs/create-sample")
def create_sample_jobs(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create sample jobs for testing"""
    try:
        # Check if user is a client
        if current_user.user_type != 'client':
            raise HTTPException(status_code=403, detail="Only clients can create jobs")
        
        sample_jobs = [
            {
                "title": "Senior React Developer Needed",
                "description": "Looking for an experienced React developer to build a modern dashboard interface with TypeScript and Tailwind CSS. Must have 3+ years experience with React and state management libraries.",
                "budget_type": "fixed",
                "budget_min": 5000,
                "budget_max": 8000,
                "skills_required": "React,TypeScript,Tailwind CSS,Redux,Next.js",
                "location": "Remote",
                "duration": "2 months",
                "experience_level": "expert",
                "category": "Web Development",
                "is_featured": True
            },
            {
                "title": "Full Stack Developer (Node.js + React)",
                "description": "Build a complete e-commerce platform with payment integration and admin dashboard. Experience with MongoDB and Express required. Knowledge of AWS services is a plus.",
                "budget_type": "hourly",
                "budget_min": 35,
                "budget_max": 55,
                "skills_required": "Node.js,React,MongoDB,Express,Stripe API",
                "location": "New York, NY",
                "duration": "3 months",
                "experience_level": "intermediate",
                "category": "Web Development",
                "is_featured": False
            },
            {
                "title": "UI/UX Designer for Mobile App",
                "description": "Design a beautiful and intuitive mobile app interface for a fitness tracking application. Must have experience with Figma and mobile design patterns. Portfolio required.",
                "budget_type": "fixed",
                "budget_min": 3000,
                "budget_max": 5000,
                "skills_required": "Figma,UI Design,UX Research,Mobile Design,Prototyping",
                "location": "Remote",
                "duration": "1 month",
                "experience_level": "intermediate",
                "category": "Design",
                "is_featured": True
            },
            {
                "title": "Python Backend Developer",
                "description": "Build REST APIs with FastAPI and PostgreSQL. Experience with AWS services (Lambda, S3, RDS) is a plus. Knowledge of Docker and CI/CD pipelines required.",
                "budget_type": "hourly",
                "budget_min": 50,
                "budget_max": 75,
                "skills_required": "Python,FastAPI,PostgreSQL,AWS,Docker",
                "location": "San Francisco, CA",
                "duration": "6 months",
                "experience_level": "expert",
                "category": "Web Development",
                "is_featured": False
            },
            {
                "title": "Content Writer for Tech Blog",
                "description": "Write technical articles about web development, programming, and software engineering. Must have strong technical background and excellent writing skills. SEO knowledge is a plus.",
                "budget_type": "fixed",
                "budget_min": 800,
                "budget_max": 1500,
                "skills_required": "Content Writing,Technical Writing,SEO,Blogging,Research",
                "location": "Remote",
                "duration": "Ongoing",
                "experience_level": "entry",
                "category": "Writing",
                "is_featured": False
            }
        ]
        
        created_jobs = []
        for job_data in sample_jobs:
            job = Job(
                title=job_data["title"],
                description=job_data["description"],
                budget_type=job_data["budget_type"],
                budget_min=job_data["budget_min"],
                budget_max=job_data["budget_max"],
                skills_required=job_data["skills_required"],
                location=job_data["location"],
                duration=job_data["duration"],
                experience_level=job_data["experience_level"],
                category=job_data["category"],
                is_featured=job_data["is_featured"],
                client_id=current_user.id,
                status='open',
                created_at=datetime.utcnow()
            )
            db.add(job)
            created_jobs.append(job)
        
        db.commit()
        
        return {
            "message": f"Created {len(created_jobs)} sample jobs",
            "jobs": [{
                "id": job.id,
                "title": job.title,
                "category": job.category
            } for job in created_jobs]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating sample jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating sample jobs: {str(e)}")

# Health check endpoint
@app.get("/api/health")
def health_check():
    """Health check endpoint for frontend"""
    return {
        "status": "healthy",
        "message": "Backend is running",
        "timestamp": datetime.utcnow().isoformat()
    }

# ================ END JOB ENDPOINTS ================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)