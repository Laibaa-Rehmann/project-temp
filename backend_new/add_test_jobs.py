# add_test_jobs.py
import sys
import random
from datetime import datetime, timedelta
sys.path.append('.')

from main import SessionLocal, Job, User
from sqlalchemy.orm import Session

def add_test_jobs(db: Session):
    """Add 20 sample jobs to the database"""
    
    # Get some client users (assuming you have users with client role)
    clients = db.query(User).filter(User.user_type == 'client').all()
    
    if not clients:
        print("No client users found. Creating a test client first...")
        # Create a test client if none exist
        test_client = User(
            email="client@example.com",
            username="testclient",
            first_name="Test",
            last_name="Client",
            user_type="client",
            hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"  # password: secret
        )
        db.add(test_client)
        db.commit()
        db.refresh(test_client)
        clients = [test_client]
    
    # Sample job data
    job_templates = [
        {
            "title": "Full Stack Developer for E-commerce Platform",
            "description": "We need an experienced full-stack developer to build a custom e-commerce platform with payment integration, user authentication, and admin dashboard.",
            "budget_type": "fixed",
            "budget_min": 5000,
            "budget_max": 15000,
            "skills_required": "Python,Django,React,PostgreSQL,AWS",
            "duration": "3-6 months",
            "experience_level": "intermediate"
        },
        {
            "title": "UI/UX Designer for Mobile App",
            "description": "Looking for a talented UI/UX designer to create wireframes and prototypes for a fitness tracking mobile application.",
            "budget_type": "fixed",
            "budget_min": 2000,
            "budget_max": 5000,
            "skills_required": "Figma,Adobe XD,UI Design,UX Research,Prototyping",
            "duration": "1-2 months",
            "experience_level": "intermediate"
        },
        {
            "title": "React Native Developer",
            "description": "Need a React Native developer to build a cross-platform mobile app for food delivery service.",
            "budget_type": "hourly",
            "budget_min": 35,
            "budget_max": 60,
            "skills_required": "React Native,JavaScript,Firebase,Mobile Development",
            "duration": "2-3 months",
            "experience_level": "intermediate"
        },
        {
            "title": "Content Writer for Tech Blog",
            "description": "Looking for a technical content writer to create articles about web development, AI, and software engineering.",
            "budget_type": "fixed",
            "budget_min": 500,
            "budget_max": 2000,
            "skills_required": "Content Writing,SEO,Technical Writing,Marketing",
            "duration": "Ongoing",
            "experience_level": "entry"
        },
        {
            "title": "DevOps Engineer for Startup",
            "description": "Need DevOps expertise to set up CI/CD pipeline, containerization, and cloud infrastructure.",
            "budget_type": "hourly",
            "budget_min": 50,
            "budget_max": 100,
            "skills_required": "Docker,Kubernetes,AWS,GitLab CI,Terraform",
            "duration": "1-3 months",
            "experience_level": "expert"
        },
        {
            "title": "Data Analyst for Marketing Agency",
            "description": "Analyze marketing campaign data and provide insights for optimization.",
            "budget_type": "fixed",
            "budget_min": 3000,
            "budget_max": 7000,
            "skills_required": "Python,Pandas,SQL,Data Visualization,Statistics",
            "duration": "2 months",
            "experience_level": "intermediate"
        },
        {
            "title": "WordPress Developer",
            "description": "Custom WordPress theme development and plugin customization for corporate website.",
            "budget_type": "fixed",
            "budget_min": 1500,
            "budget_max": 4000,
            "skills_required": "WordPress,PHP,JavaScript,CSS,Elementor",
            "duration": "1 month",
            "experience_level": "intermediate"
        },
        {
            "title": "Machine Learning Engineer",
            "description": "Develop recommendation system for e-learning platform using collaborative filtering.",
            "budget_type": "fixed",
            "budget_min": 8000,
            "budget_max": 20000,
            "skills_required": "Python,TensorFlow,Scikit-learn,Recommendation Systems",
            "duration": "3-4 months",
            "experience_level": "expert"
        },
        {
            "title": "Social Media Manager",
            "description": "Manage social media accounts and create engaging content for tech startup.",
            "budget_type": "hourly",
            "budget_min": 20,
            "budget_max": 40,
            "skills_required": "Social Media Marketing,Content Creation,Analytics",
            "duration": "Ongoing",
            "experience_level": "entry"
        },
        {
            "title": "Flutter Mobile App Developer",
            "description": "Build a Flutter app for real estate listings with map integration.",
            "budget_type": "fixed",
            "budget_min": 4000,
            "budget_max": 9000,
            "skills_required": "Flutter,Dart,Firebase,Google Maps API",
            "duration": "2-3 months",
            "experience_level": "intermediate"
        }
    ]
    
    # Additional job variations
    job_titles = [
        "Backend API Developer with Node.js",
        "Frontend Developer with Vue.js",
        "Android Kotlin Developer",
        "iOS Swift Developer",
        "Python Django Developer",
        "Ruby on Rails Developer",
        "Graphic Designer for Brand Identity",
        "Video Editor for YouTube Channel",
        "SEO Specialist for E-commerce",
        "QA Tester for Mobile App",
        "Blockchain Smart Contract Developer",
        "Cybersecurity Consultant",
        "Technical Support Specialist",
        "Project Manager for Software Team",
        "Business Analyst for ERP System"
    ]
    
    locations = ["Remote", "New York, NY", "San Francisco, CA", "London, UK", "Berlin, Germany", "Toronto, Canada", "Sydney, Australia"]
    experience_levels = ["entry", "intermediate", "expert"]
    durations = ["1 month", "1-2 months", "2-3 months", "3-6 months", "6+ months", "Ongoing"]
    
    skills_sets = {
        "web": "HTML,CSS,JavaScript,React,Node.js",
        "mobile": "React Native,Flutter,iOS,Android",
        "design": "Figma,Photoshop,Illustrator,UI/UX",
        "data": "Python,SQL,Pandas,Machine Learning",
        "devops": "Docker,Kubernetes,AWS,CI/CD",
        "marketing": "SEO,Content Writing,Social Media,Analytics"
    }
    
    print(f"Adding 20 jobs to database...")
    
    for i in range(20):
        if i < len(job_templates):
            job_data = job_templates[i]
        else:
            # Generate random job
            job_type = random.choice(list(skills_sets.keys()))
            job_data = {
                "title": f"{random.choice(job_titles)} - Project {i+1}",
                "description": f"This is a detailed description for project {i+1}. We're looking for skilled professionals to help us build amazing solutions.",
                "budget_type": random.choice(["fixed", "hourly"]),
                "budget_min": random.choice([500, 1000, 2000, 3000, 5000]),
                "budget_max": random.choice([3000, 5000, 8000, 12000, 15000]),
                "skills_required": skills_sets[job_type],
                "duration": random.choice(durations),
                "experience_level": random.choice(experience_levels)
            }
        
        # Create job
        job = Job(
            **job_data,
            location=random.choice(locations),
            client_id=random.choice(clients).id,
            status=random.choice(["open", "open", "open", "in_progress"]),  # Mostly open
            is_featured=random.choice([True, False, False]),  # 1/3 chance of featured
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
        )
        
        db.add(job)
        print(f"  Added: {job.title}")
    
    db.commit()
    print(f"\n✅ Successfully added 20 jobs!")
    
    # Show count
    total_jobs = db.query(Job).count()
    open_jobs = db.query(Job).filter(Job.status == "open").count()
    print(f"Total jobs in database: {total_jobs}")
    print(f"Open jobs: {open_jobs}")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        add_test_jobs(db)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()