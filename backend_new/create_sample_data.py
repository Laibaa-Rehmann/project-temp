# create_sample_data.py
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# We need to import the models from main.py
# Let's create a simple script that doesn't import from main.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

DATABASE_URL = "postgresql://skilllink_user:kali@localhost:5432/skilllink_db"

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_sample_data():
    db = SessionLocal()
    
    try:
        # Check if we have any users
        from sqlalchemy import text
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        user_count = result.scalar()
        
        if user_count == 0:
            print("⚠️ No users found in database. Please register users first via the frontend.")
            print("   Register at: http://localhost:5173/register")
            print("\nRecommended registration:")
            print("   Email: john@example.com")
            print("   Password: password123")
            print("   User Type: freelancer")
            print("   Full Name: John Doe")
            return
        
        print(f"✅ Found {user_count} user(s) in database")
        
        # Check if we have jobs
        result = db.execute(text("SELECT COUNT(*) FROM jobs"))
        job_count = result.scalar()
        
        if job_count == 0:
            print("\n📝 Creating sample jobs...")
            
            # Get a client user to associate with jobs
            result = db.execute(text("SELECT id, username FROM users WHERE user_type = 'client' LIMIT 1"))
            client = result.fetchone()
            
            if not client:
                print("   ⚠️ No client users found. Creating a sample client...")
                # Create a sample client
                db.execute(text("""
                    INSERT INTO users (username, email, hashed_password, user_type, full_name, created_at)
                    VALUES ('techcorp', 'client@techcorp.com', 'password123', 'client', 'TechCorp Inc', NOW())
                    ON CONFLICT (username) DO NOTHING
                """))
                db.commit()
                result = db.execute(text("SELECT id, username FROM users WHERE username = 'techcorp'"))
                client = result.fetchone()
            
            client_id = client[0]
            client_name = client[1]
            
            # Create sample jobs
            sample_jobs = [
                {
                    'title': 'Full Stack Developer for E-commerce Platform',
                    'description': 'We need an experienced full stack developer to build an e-commerce platform from scratch.',
                    'budget_type': 'fixed',
                    'budget_min': 5000,
                    'budget_max': 8000,
                    'skills_required': 'React,Node.js,MongoDB,JavaScript',
                    'duration': '3 months',
                    'experience_level': 'expert',
                    'client_id': client_id,
                    'is_featured': True
                },
                {
                    'title': 'UI/UX Designer for Mobile App',
                    'description': 'Looking for a talented UI/UX designer to create designs for a fitness tracking app.',
                    'budget_type': 'hourly',
                    'budget_min': 40,
                    'budget_max': 60,
                    'skills_required': 'Figma,UI Design,UX Design',
                    'duration': '1 month',
                    'experience_level': 'intermediate',
                    'client_id': client_id,
                    'is_featured': False
                },
                {
                    'title': 'Python Data Analyst',
                    'description': 'Need a data analyst to analyze customer data and generate insights.',
                    'budget_type': 'fixed',
                    'budget_min': 3000,
                    'budget_max': 5000,
                    'skills_required': 'Python,Pandas,Data Analysis,SQL',
                    'duration': '2 months',
                    'experience_level': 'intermediate',
                    'client_id': client_id,
                    'is_featured': True
                }
            ]
            
            for job in sample_jobs:
                db.execute(text("""
                    INSERT INTO jobs (title, description, budget_type, budget_min, budget_max, 
                                    skills_required, duration, experience_level, client_id, 
                                    status, is_featured, created_at)
                    VALUES (:title, :description, :budget_type, :budget_min, :budget_max,
                            :skills_required, :duration, :experience_level, :client_id,
                            'open', :is_featured, NOW())
                """), job)
            
            db.commit()
            print(f"   ✅ Created {len(sample_jobs)} sample jobs")
        
        # Check if we have proposals
        result = db.execute(text("SELECT COUNT(*) FROM proposals"))
        proposal_count = result.scalar()
        
        if proposal_count == 0:
            print("\n📋 Creating sample proposals...")
            
            # Get a freelancer and a job
            result = db.execute(text("""
                SELECT u.id as freelancer_id, j.id as job_id, j.title 
                FROM users u, jobs j 
                WHERE u.user_type = 'freelancer' 
                AND j.status = 'open'
                LIMIT 1
            """))
            proposal_data = result.fetchone()
            
            if proposal_data:
                freelancer_id, job_id, job_title = proposal_data
                
                sample_proposals = [
                    {
                        'freelancer_id': freelancer_id,
                        'job_id': job_id,
                        'cover_letter': f'I am very interested in the {job_title} position and have relevant experience.',
                        'bid_amount': 4500,
                        'estimated_days': 30,
                        'status': 'pending'
                    },
                    {
                        'freelancer_id': freelancer_id,
                        'job_id': job_id,
                        'cover_letter': f'I have worked on similar projects before and can deliver high-quality results for {job_title}.',
                        'bid_amount': 55,
                        'estimated_days': 20,
                        'status': 'interviewing'
                    }
                ]
                
                for proposal in sample_proposals:
                    db.execute(text("""
                        INSERT INTO proposals (freelancer_id, job_id, cover_letter, bid_amount, 
                                             estimated_days, status, submitted_at)
                        VALUES (:freelancer_id, :job_id, :cover_letter, :bid_amount,
                                :estimated_days, :status, NOW())
                    """), proposal)
                
                db.commit()
                print(f"   ✅ Created {len(sample_proposals)} sample proposals")
        
        print("\n🎉 Sample data setup complete!")
        print("\n📊 Dashboard will now show real data from your database.")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()