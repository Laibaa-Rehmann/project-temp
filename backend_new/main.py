from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker, relationship
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
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
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # ADD THIS LINE
    budget_type = Column(String, default='fixed')  # ADD THIS LINE
    budget_amount = Column(String) 
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

# Add these Pydantic models for contracts
class ContractBase(BaseModel):
    title: str
    client_id: int
    job_id: int
    status: str = "pending"
    total_amount: float
    paid_amount: float = 0
    hourly_rate: Optional[float] = None
    hours_per_week: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    status: Optional[str] = None
    paid_amount: Optional[float] = None
    end_date: Optional[datetime] = None

class ContractResponse(ContractBase):
    id: int
    freelancer_id: int
    created_at: datetime
    
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
     # In your existing /api/dashboard/stats endpoint, update the contracts calculation:

        # Calculate active contracts
    active_contracts = db.query(Contract).filter(
            Contract.freelancer_id == current_user.id,
            Contract.status == "active"
        ).count()

        # Calculate total earnings (sum of paid amount in all contracts)
    total_earnings_result = db.query(func.sum(Contract.paid_amount)).filter(
            Contract.freelancer_id == current_user.id,
            Contract.status.in_(["active", "completed"])  # Include both active and completed
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
# ================ JOB DETAILS & APPLICATION ENDPOINTS ================

# Check if job is saved by user
@app.get("/api/jobs/{job_id}/check-saved")
def check_saved_job(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check if user has saved this job"""
    # For now, return False since we don't have saved jobs table
    # You'll implement this later
    return {
        "saved": False,
        "job_id": job_id
    }

# Get similar jobs
@app.get("/api/jobs/{job_id}/similar")
def get_similar_jobs(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = 3
):
    """Get similar jobs based on skills and category"""
    try:
        # Get the current job
        current_job = db.query(Job).filter(Job.id == job_id).first()
        if not current_job:
            return {"jobs": []}
        
        # Get similar jobs based on skills and category
        similar_query = db.query(Job).filter(
            Job.id != job_id,
            Job.status == 'open',
            Job.client_id != current_user.id  # Don't show own jobs
        )
        
        # Try to match by category first
        if current_job.category:
            similar_query = similar_query.filter(Job.category == current_job.category)
        
        similar_jobs = similar_query.order_by(Job.created_at.desc()).limit(limit).all()
        
        jobs_list = []
        for job in similar_jobs:
            # Get proposals count
            proposals_count = db.query(Proposal).filter(Proposal.job_id == job.id).count()
            
            # Format budget display
            if job.budget_type == 'fixed':
                budget_display = f"${job.budget_min:,.0f} - ${job.budget_max:,.0f}"
            else:
                budget_display = f"${job.budget_min}/hr - ${job.budget_max}/hr"
            
            # Get client info
            client_name = job.client.full_name if job.client and job.client.full_name else "Anonymous Client"
            
            jobs_list.append({
                "id": job.id,
                "title": job.title,
                "description": job.description[:100] + "..." if len(job.description) > 100 else job.description,
                "budget_display": budget_display,
                "budget_type": job.budget_type,
                "location": job.location or "Remote",
                "required_skills": job.skills_required.split(",") if job.skills_required else [],
                "proposals_count": proposals_count,
                "client": {
                    "company_name": client_name
                }
            })
        
        return {"jobs": jobs_list}
        
    except Exception as e:
        print(f"Error getting similar jobs: {str(e)}")
        return {"jobs": []}

# Job application endpoint
class JobApplication(BaseModel):
    cover_letter: str
    bid_amount: float
    estimated_days: int
    links: List[str] = []

@app.post("/api/jobs/{job_id}/apply")
def apply_to_job_endpoint(
    job_id: int,
    application: JobApplication,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit an application for a job"""
    try:
        # Check if user is a freelancer
        if current_user.user_type != 'freelancer':
            raise HTTPException(
                status_code=403, 
                detail="Only freelancers can apply to jobs"
            )
        
        # Check if job exists and is open
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job.status != 'open':
            raise HTTPException(status_code=400, detail="Job is not accepting applications")
        
        # Check if user is the client who posted the job
        if job.client_id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot apply to your own job")
        
        # Check if user has already applied
        existing_proposal = db.query(Proposal).filter(
            Proposal.job_id == job_id,
            Proposal.freelancer_id == current_user.id
        ).first()
        
        if existing_proposal:
            raise HTTPException(status_code=400, detail="You have already applied to this job")
        
        # Validate bid amount
        if job.budget_type == 'fixed':
            if application.bid_amount < job.budget_min or application.bid_amount > job.budget_max:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Bid amount must be between ${job.budget_min} and ${job.budget_max}"
                )
        else:  # hourly
            if application.bid_amount < job.budget_min or application.budget_amount > job.budget_max:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Hourly rate must be between ${job.budget_min}/hr and ${job.budget_max}/hr"
                )
        
        # Create proposal
        proposal = Proposal(
            freelancer_id=current_user.id,
            job_id=job_id,
            cover_letter=application.cover_letter,
            bid_amount=application.bid_amount,
            estimated_days=application.estimated_days,
            status="pending",
            submitted_at=datetime.utcnow()
        )
        
        db.add(proposal)
        db.commit()
        db.refresh(proposal)
        
        # Update user profile completion if this is first proposal
        user_proposals = db.query(Proposal).filter(
            Proposal.freelancer_id == current_user.id
        ).count()
        
        if user_proposals == 1:  # First proposal
            if current_user.profile_completion < 100:
                current_user.profile_completion = min(100, current_user.profile_completion + 10)
                db.commit()
        
        return {
            "success": True,
            "message": "Application submitted successfully!",
            "proposal_id": proposal.id,
            "status": proposal.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error submitting application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error submitting application: {str(e)}")

# Get detailed job info for application page
@app.get("/api/jobs/{job_id}/application-info")
def get_job_application_info(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get job information for application page"""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if user has already applied
        has_applied = db.query(Proposal).filter(
            Proposal.job_id == job_id,
            Proposal.freelancer_id == current_user.id
        ).first() is not None
        
        if has_applied:
            raise HTTPException(status_code=400, detail="You have already applied to this job")
        
        # Format budget info
        if job.budget_type == 'fixed':
            budget_display = f"${job.budget_min:,.0f} - ${job.budget_max:,.0f}"
            budget_suggestion = job.budget_min
        else:
            budget_display = f"${job.budget_min}/hr - ${job.budget_max}/hr"
            budget_suggestion = job.budget_min
        
        # Get client info
        client_info = None
        if job.client:
            # Calculate client stats
            completed_contracts = db.query(Contract).filter(
                Contract.client_id == job.client_id,
                Contract.status == 'completed'
            ).count()
            
            total_spent_result = db.query(func.sum(Contract.total_amount)).filter(
                Contract.client_id == job.client_id,
                Contract.status == 'completed'
            ).first()
            total_spent = total_spent_result[0] or 0
            
            client_info = {
                "id": job.client.id,
                "full_name": job.client.full_name,
                "company_name": job.client.company_name if job.client.company_name else None,
                "description": job.client.description,
                "verified": job.client.verified,
                "member_since": job.client.created_at.year if job.client.created_at else None,
                "completed_contracts": completed_contracts,
                "total_spent": total_spent,
                "rating": 4.5
            }
        
        return {
            "job": {
                "id": job.id,
                "title": job.title,
                "description": job.description,
                "budget_type": job.budget_type,
                "budget_min": job.budget_min,
                "budget_max": job.budget_max,
                "budget_display": budget_display,
                "budget_suggestion": budget_suggestion,
                "skills_required": job.skills_required.split(",") if job.skills_required else [],
                "location": job.location or "Remote",
                "duration": job.duration,
                "experience_level": job.experience_level or "Any",
                "category": job.category,
                "is_featured": job.is_featured,
                "proposals_count": db.query(Proposal).filter(Proposal.job_id == job.id).count(),
                "created_at": job.created_at.isoformat() if job.created_at else None
            },
            "client": client_info,
            "application_requirements": {
                "min_cover_letter_length": 100,
                "max_cover_letter_length": 1000,
                "allowed_file_types": [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
                "max_file_size_mb": 5,
                "max_files": 5,
                "max_links": 5
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting job application info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting job information: {str(e)}")

# Get user's applications
@app.get("/api/applications")
def get_user_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10
):
    """Get all applications for current user"""
    try:
        if current_user.user_type != 'freelancer':
            return {
                "applications": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 0
            }
        
        # Build query
        query = db.query(Proposal).filter(Proposal.freelancer_id == current_user.id)
        
        if status:
            query = query.filter(Proposal.status == status)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        proposals = query.order_by(Proposal.submitted_at.desc()).offset(offset).limit(limit).all()
        
        applications = []
        for proposal in proposals:
            job = proposal.job
            applications.append({
                "id": proposal.id,
                "job_id": proposal.job_id,
                "job_title": job.title if job else "Job not found",
                "cover_letter": proposal.cover_letter[:200] + "..." if proposal.cover_letter and len(proposal.cover_letter) > 200 else proposal.cover_letter,
                "bid_amount": proposal.bid_amount,
                "estimated_days": proposal.estimated_days,
                "status": proposal.status,
                "submitted_at": proposal.submitted_at.isoformat() if proposal.submitted_at else None,
                "client_name": job.client.full_name if job and job.client else "Unknown Client"
            })
        
        return {
            "applications": applications,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1
        }
        
    except Exception as e:
        print(f"Error getting applications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting applications: {str(e)}")

# Get single application details
@app.get("/api/applications/{application_id}")
def get_application_details(
    application_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific application"""
    try:
        proposal = db.query(Proposal).filter(Proposal.id == application_id).first()
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Check if user owns this application
        if proposal.freelancer_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't have permission to view this application")
        
        job = proposal.job
        client = job.client if job else None
        
        return {
            "id": proposal.id,
            "job": {
                "id": job.id if job else None,
                "title": job.title if job else "Job not found",
                "description": job.description if job else None,
                "budget_type": job.budget_type if job else None,
                "budget_min": job.budget_min if job else None,
                "budget_max": job.budget_max if job else None,
                "duration": job.duration if job else None,
                "experience_level": job.experience_level if job else None
            },
            "client": {
                "id": client.id if client else None,
                "full_name": client.full_name if client else "Unknown Client",
                "company_name": client.company_name if client else None
            } if client else None,
            "proposal": {
                "cover_letter": proposal.cover_letter,
                "bid_amount": proposal.bid_amount,
                "estimated_days": proposal.estimated_days,
                "status": proposal.status,
                "submitted_at": proposal.submitted_at.isoformat() if proposal.submitted_at else None
            },
            "messages": []  # You can add message system later
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting application details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting application details: {str(e)}")

# Update application status (for clients)
@app.patch("/api/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    status_update: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update application status (for clients only)"""
    try:
        if current_user.user_type != 'client':
            raise HTTPException(status_code=403, detail="Only clients can update application status")
        
        proposal = db.query(Proposal).filter(Proposal.id == application_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Check if current user is the client who posted the job
        job = proposal.job
        if not job or job.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't have permission to update this application")
        
        new_status = status_update.get("status")
        if not new_status or new_status not in ["pending", "accepted", "rejected", "interviewing", "hired"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        proposal.status = new_status
        db.commit()
        
        return {
            "success": True,
            "message": f"Application status updated to {new_status}",
            "application_id": proposal.id,
            "status": proposal.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating application status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating application status: {str(e)}")

# ================ END JOB DETAILS & APPLICATION ENDPOINTS ================

# ================ CONTRACTS ENDPOINTS ================

@app.get("/api/contracts", response_model=List[ContractResponse])
async def get_contracts(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all contracts for the current freelancer
    """
    try:
        print(f"🔍 Fetching contracts for user: {current_user.username} (ID: {current_user.id}, Type: {current_user.user_type})")
        
        # For freelancers, get contracts where they are the freelancer
        if current_user.user_type == 'freelancer':
            query = db.query(Contract).filter(Contract.freelancer_id == current_user.id)
        # For clients, get contracts where they are the client
        elif current_user.user_type == 'client':
            query = db.query(Contract).filter(Contract.client_id == current_user.id)
        # For others, return empty
        else:
            return []
        
        # Apply status filter if provided
        if status and status != "all":
            query = query.filter(Contract.status == status)
        
        # Order by newest first
        contracts = query.order_by(Contract.created_at.desc()).all()
        
        print(f"✅ Found {len(contracts)} contracts for user {current_user.username}")
        return contracts
        
    except Exception as e:
        print(f"❌ Error fetching contracts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contracts/stats")
async def get_contract_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get contract statistics for dashboard
    """
    try:
        print(f"📊 Getting contract stats for user: {current_user.username}")
        
        # For freelancers, get contracts where they are the freelancer
        if current_user.user_type == 'freelancer':
            contracts = db.query(Contract).filter(Contract.freelancer_id == current_user.id).all()
        # For clients, get contracts where they are the client
        elif current_user.user_type == 'client':
            contracts = db.query(Contract).filter(Contract.client_id == current_user.id).all()
        # For others, return empty stats
        else:
            return {
                "total": 0,
                "active": 0,
                "completed": 0,
                "totalEarnings": 0,
                "pendingEarnings": 0
            }
        
        total = len(contracts)
        active = len([c for c in contracts if c.status == "active"])
        completed = len([c for c in contracts if c.status == "completed"])
        
        total_earnings = sum(c.paid_amount for c in contracts)
        
        # Calculate pending earnings from active contracts
        pending_earnings = sum(
            (c.total_amount - c.paid_amount) 
            for c in contracts 
            if c.status == "active" and c.total_amount > c.paid_amount
        )
        
        stats = {
            "total": total,
            "active": active,
            "completed": completed,
            "totalEarnings": total_earnings,
            "pendingEarnings": pending_earnings
        }
        
        print(f"✅ Contract stats: {stats}")
        return stats
        
    except Exception as e:
        print(f"❌ Error fetching contract stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contracts/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific contract by ID
    """
    try:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Check permissions
        if (current_user.user_type == 'freelancer' and contract.freelancer_id != current_user.id) or \
           (current_user.user_type == 'client' and contract.client_id != current_user.id):
            raise HTTPException(status_code=403, detail="You don't have permission to view this contract")
        
        return contract
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting contract: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/contracts", response_model=ContractResponse)
async def create_contract(
    contract: ContractCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new contract (for clients)
    """
    try:
        if current_user.user_type != 'client':
            raise HTTPException(status_code=403, detail="Only clients can create contracts")
        
        # Check if job exists
        job = db.query(Job).filter(Job.id == contract.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if client owns the job
        if job.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't own this job")
        
        # Get freelancer from proposal
        proposal = db.query(Proposal).filter(
            Proposal.job_id == contract.job_id,
            Proposal.status == "accepted"
        ).first()
        
        if not proposal:
            raise HTTPException(status_code=400, detail="No accepted proposal found for this job")
        
        # Create contract
        db_contract = Contract(
            **contract.dict(),
            freelancer_id=proposal.freelancer_id,
            created_at=datetime.utcnow()
        )
        
        db.add(db_contract)
        db.commit()
        db.refresh(db_contract)
        
        # Update proposal status to hired
        proposal.status = "hired"
        db.commit()
        
        return db_contract
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating contract: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/contracts/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: int,
    contract_update: ContractUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a contract (status, payment, etc.)
    """
    try:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Check permissions
        if (current_user.user_type == 'freelancer' and contract.freelancer_id != current_user.id) and \
           (current_user.user_type == 'client' and contract.client_id != current_user.id):
            raise HTTPException(status_code=403, detail="You don't have permission to update this contract")
        
        update_data = contract_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(contract, field, value)
        
        db.commit()
        db.refresh(contract)
        
        return contract
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating contract: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/contracts/{contract_id}")
async def delete_contract(
    contract_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a contract (clients only)
    """
    try:
        if current_user.user_type != 'client':
            raise HTTPException(status_code=403, detail="Only clients can delete contracts")
        
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Check if client owns the contract
        if contract.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't own this contract")
        
        db.delete(contract)
        db.commit()
        
        return {"message": "Contract deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting contract: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contracts/debug/all")
async def get_all_contracts_debug(db: Session = Depends(get_db)):
    """Debug endpoint to see all contracts (temporary)"""
    contracts = db.query(Contract).all()
    
    result = []
    for contract in contracts:
        result.append({
            "id": contract.id,
            "title": contract.title,
            "freelancer_id": contract.freelancer_id,
            "client_id": contract.client_id,
            "job_id": contract.job_id,
            "status": contract.status,
            "total_amount": contract.total_amount,
            "paid_amount": contract.paid_amount,
            "hourly_rate": contract.hourly_rate,
            "hours_per_week": contract.hours_per_week,
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "created_at": contract.created_at,
            # Get usernames
            "freelancer_username": contract.freelancer.username if contract.freelancer else None,
            "client_username": contract.client.username if contract.client else None
        })
    
    return result

# For development/testing only
@app.post("/api/contracts/test")
async def create_test_contract(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a test contract for development
    """
    try:
        if current_user.user_type != 'freelancer':
            raise HTTPException(status_code=403, detail="Only freelancers can create test contracts")
        
        # Find a client to use for test
        client = db.query(User).filter(
            User.user_type == "client"
        ).first()
        
        if not client:
            # Create a test client if none exists
            test_client = User(
                username=f"test_client_{int(datetime.utcnow().timestamp())}",
                email="test@client.com",
                hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
                user_type="client",
                full_name="Test Client",
                created_at=datetime.utcnow()
            )
            db.add(test_client)
            db.commit()
            db.refresh(test_client)
            client = test_client
        
        # Find a job to use for test
        job = db.query(Job).first()
        if not job:
            # Create a test job if none exists
            test_job = Job(
                title="Test Job",
                description="Test job description",
                client_id=client.id,
                budget_min=5000,
                budget_max=8000,
                budget_type="fixed",
                skills_required="Test,Skills",
                duration="1 month",
                experience_level="intermediate",
                status="open",
                created_at=datetime.utcnow()
            )
            db.add(test_job)
            db.commit()
            db.refresh(test_job)
            job = test_job
        
        # Create test contract
        test_contract = Contract(
            title="Website Development",
            freelancer_id=current_user.id,
            client_id=client.id,
            job_id=job.id,
            status="active",
            total_amount=5000,
            paid_amount=2500,
            hourly_rate=50,
            hours_per_week=20,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),
            created_at=datetime.utcnow()
        )
        
        db.add(test_contract)
        db.commit()
        db.refresh(test_contract)
        
        return {
            "message": "Test contract created successfully",
            "contract": {
                "id": test_contract.id,
                "title": test_contract.title,
                "status": test_contract.status,
                "total_amount": test_contract.total_amount,
                "paid_amount": test_contract.paid_amount
            }
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error creating test contract: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================ END CONTRACTS ENDPOINTS ================
# ================ PROPOSAL ENDPOINTS ================

# Pydantic schemas for proposals
class ProposalBase(BaseModel):
    job_id: int
    cover_letter: str
    bid_amount: float
    estimated_days: Optional[int] = None
class ProposalCreate(ProposalBase):
    pass

class ProposalResponse(BaseModel):
    id: int
    job_id: int
    freelancer_id: int
    cover_letter: str
    bid_amount: float
    estimated_days: Optional[int]
    status: str
    submitted_at: datetime
    last_updated: Optional[datetime]  # Make this optional
    job_title: Optional[str] = None  # Add these fields
    client_name: Optional[str] = None
    client_rating: Optional[float] = None
    budget_type: Optional[str] = None
    budget_amount: Optional[str] = None
    
    class Config:
        from_attributes = True

class ProposalUpdate(BaseModel):
    status: Optional[str] = None
    cover_letter: Optional[str] = None
    bid_amount: Optional[float] = None
    estimated_days: Optional[int] = None

# class ProposalResponse(BaseModel):
    id: int
    job_id: int
    freelancer_id: int
    cover_letter: str
    bid_amount: float
    estimated_days: Optional[int]
    status: str
    submitted_at: datetime
    last_updated: Optional[datetime]  # Make this optional
    job_title: Optional[str] = None 
    job: Optional[dict] = None
    client: Optional[dict] = None
    
    class Config:
        from_attributes = True

class ProposalListResponse(BaseModel):
    proposals: List[ProposalResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class ProposalStats(BaseModel):
    total: int
    pending: int
    interviewing: int
    accepted: int
    rejected: int
    withdrawn: int
    hired: int

@app.get("/api/proposals", response_model=ProposalListResponse)
def get_proposals(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 10
):
    """
    Get all proposals for the current freelancer with pagination and filtering
    """
    try:
        print(f"🔍 Fetching proposals for user: {current_user.username} (Type: {current_user.user_type})")
        
        if current_user.user_type != 'freelancer':
            return ProposalListResponse(
                proposals=[],
                total=0,
                page=page,
                limit=limit,
                total_pages=0
            )
        
        # Build query
        query = db.query(Proposal).filter(Proposal.freelancer_id == current_user.id)
        
        # Apply status filter
        if status and status != 'all':
            query = query.filter(Proposal.status == status)
        
        # Get total count
        total = query.count()
        print(f"📊 Total proposals found: {total}")
        
        # Apply pagination
        offset = (page - 1) * limit
        proposals = query.order_by(Proposal.submitted_at.desc()).offset(offset).limit(limit).all()
        
        print(f"📄 Fetched {len(proposals)} proposals")
        
        # Format proposals with job and client info
        proposal_responses = []
        for proposal in proposals:
            job = proposal.job
            client = job.client if job else None
            # Get client rating from user or default
            client_rating = None
            if client:
                # You can add a rating system later
                client_rating = 4.5
            
            proposal_data = {
                "id": proposal.id,
                "job_id": proposal.job_id,
                "freelancer_id": proposal.freelancer_id,
                "cover_letter": proposal.cover_letter,
                "bid_amount": proposal.bid_amount,
                "estimated_days": proposal.estimated_days,
                "status": proposal.status,
                "submitted_at": proposal.submitted_at,
                "last_updated": proposal.last_updated,
                "job": None,
                "client": None
            }
            if job:
                proposal_data["job"] = {
                    "id": job.id,
                    "title": job.title,
                    "description": job.description,
                    "budget_type": job.budget_type,
                    "budget_min": job.budget_min,
                    "budget_max": job.budget_max,
                    "budget_display": f"${job.budget_min:,.0f} - ${job.budget_max:,.0f}" if job.budget_type == 'fixed' else f"${job.budget_min}/hr - ${job.budget_max}/hr",
                    "duration": job.duration,
                    "experience_level": job.experience_level,
                    "category": job.category
                }
            
            if client:
                proposal_data["client"] = {
                    "id": client.id,
                    "name": client.full_name or client.username,
                    "company_name": client.company_name,
                    "rating": 4.5,  # You can calculate this from reviews
                    "total_spent": 0  # You can calculate this from contracts
                }
            
            proposal_responses.append(ProposalResponse(**proposal_data))
        
        return ProposalListResponse(
            proposals=proposal_responses,
            total=total,
            page=page,
            limit=limit,
            total_pages=(total + limit - 1) // limit if limit > 0 else 1
        )
        
    except Exception as e:
        print(f"❌ Error fetching proposals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/proposals/stats", response_model=ProposalStats)
def get_proposal_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get proposal statistics for the current freelancer
    """
    try:
        if current_user.user_type != 'freelancer':
            return ProposalStats(
                total=0,
                pending=0,
                interviewing=0,
                accepted=0,
                rejected=0,
                withdrawn=0,
                hired=0
            )
        
        # Get all proposals for the user
        proposals = db.query(Proposal).filter(Proposal.freelancer_id == current_user.id).all()
        
        stats = {
            "total": len(proposals),
            "pending": len([p for p in proposals if p.status == 'pending']),
            "interviewing": len([p for p in proposals if p.status == 'interviewing']),
            "accepted": len([p for p in proposals if p.status == 'accepted']),
            "rejected": len([p for p in proposals if p.status == 'rejected']),
            "withdrawn": len([p for p in proposals if p.status == 'withdrawn']),
            "hired": len([p for p in proposals if p.status == 'hired'])
        }
        
        print(f"📊 Proposal stats for {current_user.username}: {stats}")
        return ProposalStats(**stats)
        
    except Exception as e:
        print(f"❌ Error fetching proposal stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/proposals/{proposal_id}", response_model=ProposalResponse)
def get_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific proposal by ID
    """
    try:
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Check if user owns this proposal
        if proposal.freelancer_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't have permission to view this proposal")
        
        # Get job and client info
        job = proposal.job
        client = job.client if job else None
        
        proposal_data = {
            "id": proposal.id,
            "job_id": proposal.job_id,
            "freelancer_id": proposal.freelancer_id,
            "cover_letter": proposal.cover_letter,
            "bid_amount": proposal.bid_amount,
            "estimated_days": proposal.estimated_days,
            "status": proposal.status,
            "submitted_at": proposal.submitted_at,
            "last_updated": proposal.last_updated,
            "job": None,
            "client": None
        }
        
        if job:
            proposal_data["job"] = {
                "id": job.id,
                "title": job.title,
                "description": job.description,
                "budget_type": job.budget_type,
                "budget_min": job.budget_min,
                "budget_max": job.budget_max,
                "budget_display": f"${job.budget_min:,.0f} - ${job.budget_max:,.0f}" if job.budget_type == 'fixed' else f"${job.budget_min}/hr - ${job.budget_max}/hr",
                "duration": job.duration,
                "experience_level": job.experience_level,
                "category": job.category,
                "skills_required": job.skills_required.split(",") if job.skills_required else [],
                "location": job.location or "Remote",
                "created_at": job.created_at
            }
        
        if client:
            proposal_data["client"] = {
                "id": client.id,
                "name": client.full_name or client.username,
                "company_name": client.company_name,
                "description": client.description,
                "country": client.country,
                "rating": 4.5,
                "total_spent": 0,
                "member_since": client.created_at.year if client.created_at else None
            }
        
        return ProposalResponse(**proposal_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching proposal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/proposals", response_model=ProposalResponse)
def create_proposal(
    proposal: ProposalCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new proposal
    """
    try:
        if current_user.user_type != 'freelancer':
            raise HTTPException(status_code=403, detail="Only freelancers can create proposals")
        
        print(f"📝 Creating proposal for user: {current_user.username}")
        
        # Check if job exists
        job = db.query(Job).filter(Job.id == proposal.job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if job is open
        if job.status != 'open':
            raise HTTPException(status_code=400, detail="Job is not open for proposals")
        
        # Check if user already applied
        existing_proposal = db.query(Proposal).filter(
            Proposal.job_id == proposal.job_id,
            Proposal.freelancer_id == current_user.id
        ).first()
        
        if existing_proposal:
            raise HTTPException(status_code=400, detail="You have already applied to this job")
        
        # Validate bid amount
        if proposal.bid_amount <= 0:
            raise HTTPException(status_code=400, detail="Bid amount must be greater than 0")
        
        if job.budget_type == 'fixed':
            if proposal.bid_amount < job.budget_min or proposal.bid_amount > job.budget_max:
                raise HTTPException(
                    status_code=400,
                    detail=f"Bid amount must be between ${job.budget_min:,.0f} and ${job.budget_max:,.0f}"
                )
        else:  # hourly
            if proposal.bid_amount < job.budget_min or proposal.bid_amount > job.budget_max:
                raise HTTPException(
                    status_code=400,
                    detail=f"Hourly rate must be between ${job.budget_min}/hr and ${job.budget_max}/hr"
                )
        
        # Create proposal
        db_proposal = Proposal(
            **proposal.dict(),
            freelancer_id=current_user.id,
            status='pending',
            submitted_at=datetime.utcnow()
        )
        
        db.add(db_proposal)
        db.commit()
        db.refresh(db_proposal)
        
        # Get job and client info for response
        client = job.client if job else None
        
        proposal_data = {
            "id": db_proposal.id,
            "job_id": db_proposal.job_id,
            "freelancer_id": db_proposal.freelancer_id,
            "cover_letter": db_proposal.cover_letter,
            "bid_amount": db_proposal.bid_amount,
            "estimated_days": db_proposal.estimated_days,
            "status": db_proposal.status,
            "submitted_at": db_proposal.submitted_at,
            "last_updated": db_proposal.last_updated,
            "job": None,
            "client": None
        }
        
        if job:
            proposal_data["job"] = {
                "id": job.id,
                "title": job.title,
                "description": job.description[:100] + "..." if len(job.description) > 100 else job.description
            }
        
        if client:
            proposal_data["client"] = {
                "id": client.id,
                "name": client.full_name or client.username
            }
        
        print(f"✅ Proposal created successfully: {db_proposal.id}")
        return ProposalResponse(**proposal_data)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating proposal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/proposals/{proposal_id}", response_model=ProposalResponse)
def update_proposal(
    proposal_id: int,
    proposal_update: ProposalUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a proposal (e.g., withdraw, update details)
    """
    try:
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Check if user owns this proposal
        if proposal.freelancer_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't have permission to update this proposal")
        
        # Only allow updates to pending proposals
        if proposal.status != 'pending':
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot update proposal with status '{proposal.status}'"
            )
        
        # Update proposal
        update_data = proposal_update.dict(exclude_unset=True)
        
        # Validate bid amount if updating
        if 'bid_amount' in update_data:
            job = proposal.job
            if job:
                if job.budget_type == 'fixed':
                    if update_data['bid_amount'] < job.budget_min or update_data['bid_amount'] > job.budget_max:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Bid amount must be between ${job.budget_min:,.0f} and ${job.budget_max:,.0f}"
                        )
                else:  # hourly
                    if update_data['bid_amount'] < job.budget_min or update_data['bid_amount'] > job.budget_max:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Hourly rate must be between ${job.budget_min}/hr and ${job.budget_max}/hr"
                        )
        
        # Update fields
        for field, value in update_data.items():
            setattr(proposal, field, value)
        
        proposal.last_updated = datetime.utcnow()
        db.commit()
        db.refresh(proposal)
        
        return ProposalResponse(
            id=proposal.id,
            job_id=proposal.job_id,
            freelancer_id=proposal.freelancer_id,
            cover_letter=proposal.cover_letter,
            bid_amount=proposal.bid_amount,
            estimated_days=proposal.estimated_days,
            status=proposal.status,
            submitted_at=proposal.submitted_at,
            last_updated=proposal.last_updated,
            job=None,
            client=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating proposal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/proposals/{proposal_id}")
def delete_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a proposal (only for pending proposals)
    """
    try:
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Check if user owns this proposal
        if proposal.freelancer_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this proposal")
        
        # Only allow deletion of pending proposals
        if proposal.status != 'pending':
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete proposal with status '{proposal.status}'"
            )
        
        db.delete(proposal)
        db.commit()
        
        return {"message": "Proposal deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting proposal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/proposals/debug/all")
def get_all_proposals_debug(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to see all proposals (for testing only)
    """
    proposals = db.query(Proposal).all()
    
    result = []
    for proposal in proposals:
        result.append({
            "id": proposal.id,
            "job_id": proposal.job_id,
            "freelancer_id": proposal.freelancer_id,
            "cover_letter": proposal.cover_letter[:50] + "..." if proposal.cover_letter and len(proposal.cover_letter) > 50 else proposal.cover_letter,
            "bid_amount": proposal.bid_amount,
            "estimated_days": proposal.estimated_days,
            "status": proposal.status,
            "submitted_at": proposal.submitted_at,
            "last_updated": proposal.last_updated,
            "freelancer_username": proposal.freelancer.username if proposal.freelancer else None,
            "job_title": proposal.job.title if proposal.job else None
        })
    
    return result

@app.post("/api/proposals/test")
def create_test_proposal(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create test proposals for development
    """
    try:
        if current_user.user_type != 'freelancer':
            raise HTTPException(status_code=403, detail="Only freelancers can create test proposals")
        
        print(f"🧪 Creating test proposals for: {current_user.username}")
        
        # Find some open jobs
        jobs = db.query(Job).filter(Job.status == 'open').limit(3).all()
        
        if not jobs:
            return {"message": "No open jobs found to create test proposals"}
        
        test_proposals = []
        statuses = ['pending', 'interviewing', 'accepted', 'rejected', 'hired']
        
        for i, job in enumerate(jobs):
            status = statuses[i % len(statuses)]
            
            # Check if proposal already exists
            existing = db.query(Proposal).filter(
                Proposal.job_id == job.id,
                Proposal.freelancer_id == current_user.id
            ).first()
            
            if existing:
                print(f"⚠️  Proposal already exists for job {job.id}, skipping...")
                continue
            
            proposal = Proposal(
                freelancer_id=current_user.id,
                job_id=job.id,
                cover_letter=f"This is a test proposal for {job.title}. I have extensive experience in this field and believe I can deliver excellent results.",
                bid_amount=job.budget_min + (job.budget_max - job.budget_min) * 0.5,  # Midpoint of budget range
                estimated_days=30,
                status=status,
                submitted_at=datetime.utcnow()
            )
            
            db.add(proposal)
            test_proposals.append({
                "job_title": job.title,
                "bid_amount": proposal.bid_amount,
                "status": proposal.status
            })
        
        db.commit()
        
        return {
            "message": f"Created {len(test_proposals)} test proposals",
            "proposals": test_proposals
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test proposals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================ END PROPOSAL ENDPOINTS ================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)