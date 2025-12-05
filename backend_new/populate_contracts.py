#!/usr/bin/env python3
"""
Script to populate contracts table with sample data
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Add the parent directory to the path to import from main.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Database configuration - update with your actual credentials
DATABASE_URL = "postgresql://skilllink_user:kali@localhost:5432/skilllink_db"

def create_session():
    """Create database session"""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def check_tables_exist(db):
    """Check if required tables exist"""
    try:
        tables = ['users', 'jobs', 'contracts']
        for table in tables:
            result = db.execute(text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')"))
            exists = result.fetchone()[0]
            if not exists:
                print(f"❌ Table '{table}' does not exist!")
                return False
        return True
    except Exception as e:
        print(f"Error checking tables: {e}")
        return False

def get_users_by_type(db, user_type):
    """Get users by type - FIXED VERSION"""
    try:
        result = db.execute(
            text("SELECT id, username, email, full_name FROM users WHERE user_type = :user_type"),
            {"user_type": user_type}
        )
        rows = result.fetchall()
        
        users = []
        for row in rows:
            # Convert row to dictionary manually
            users.append({
                'id': row[0],
                'username': row[1],
                'email': row[2],
                'full_name': row[3]
            })
        
        print(f"Found {len(users)} {user_type}(s)")
        return users
        
    except Exception as e:
        print(f"Error getting users: {e}")
        return []

def get_jobs(db):
    """Get available jobs - FIXED VERSION"""
    try:
        result = db.execute(
            text("SELECT id, title, client_id, budget_min, budget_max FROM jobs")
        )
        rows = result.fetchall()
        
        jobs = []
        for row in rows:
            jobs.append({
                'id': row[0],
                'title': row[1],
                'client_id': row[2],
                'budget_min': row[3],
                'budget_max': row[4]
            })
        
        print(f"Found {len(jobs)} job(s)")
        return jobs
        
    except Exception as e:
        print(f"Error getting jobs: {e}")
        return []

def create_sample_users_if_needed(db):
    """Create sample users if none exist"""
    print("\n👤 Creating sample users...")
    
    # Create a sample freelancer
    try:
        db.execute(text("""
            INSERT INTO users (username, email, hashed_password, user_type, full_name, created_at)
            VALUES ('john_doe', 'john@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'freelancer', 'John Doe', NOW())
            ON CONFLICT (username) DO NOTHING
        """))
        
        # Create a sample client
        db.execute(text("""
            INSERT INTO users (username, email, hashed_password, user_type, full_name, created_at)
            VALUES ('techcorp', 'client@techcorp.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'client', 'TechCorp Inc', NOW())
            ON CONFLICT (username) DO NOTHING
        """))
        
        db.commit()
        print("✅ Created sample users (john_doe - freelancer, techcorp - client)")
        
        # Get the created users
        freelancers = get_users_by_type(db, 'freelancer')
        clients = get_users_by_type(db, 'client')
        
        return freelancers, clients
        
    except Exception as e:
        db.rollback()
        print(f"Error creating sample users: {e}")
        return [], []

def create_sample_jobs_if_needed(db, client_id):
    """Create sample jobs if none exist"""
    print("\n💼 Creating sample jobs...")
    
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
            'status': 'open',
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
            'status': 'open',
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
            'status': 'open',
            'is_featured': True
        }
    ]
    
    try:
        for job in sample_jobs:
            db.execute(text("""
                INSERT INTO jobs (title, description, budget_type, budget_min, budget_max, 
                                skills_required, duration, experience_level, client_id, 
                                status, is_featured, created_at)
                VALUES (:title, :description, :budget_type, :budget_min, :budget_max,
                        :skills_required, :duration, :experience_level, :client_id,
                        :status, :is_featured, NOW())
            """), job)
        
        db.commit()
        print(f"✅ Created {len(sample_jobs)} sample jobs")
        
        # Get the created jobs
        return get_jobs(db)
        
    except Exception as e:
        db.rollback()
        print(f"Error creating sample jobs: {e}")
        return []

def populate_contracts(db):
    """Populate contracts table with sample data"""
    
    print("🔍 Checking database...")
    
    # Check if tables exist
    if not check_tables_exist(db):
        print("❌ Required tables don't exist. Please run database migrations first.")
        return False
    
    # Get freelancers and clients
    freelancers = get_users_by_type(db, 'freelancer')
    clients = get_users_by_type(db, 'client')
    
    # If no users exist, create sample users
    if not freelancers or not clients:
        print("⚠️ No users found. Creating sample users...")
        freelancers, clients = create_sample_users_if_needed(db)
    
    if not freelancers:
        print("❌ Failed to create freelancers.")
        return False
    
    if not clients:
        print("❌ Failed to create clients.")
        return False
    
    # Get jobs
    jobs = get_jobs(db)
    
    # If no jobs exist, create sample jobs
    if not jobs:
        print("⚠️ No jobs found. Creating sample jobs...")
        # Use first client for jobs
        jobs = create_sample_jobs_if_needed(db, clients[0]['id'])
    
    if not jobs:
        print("❌ Failed to create jobs.")
        return False
    
    print(f"✅ Found {len(freelancers)} freelancer(s), {len(clients)} client(s), {len(jobs)} job(s)")
    
    # Check if contracts already exist
    result = db.execute(text("SELECT COUNT(*) FROM contracts"))
    existing_count = result.fetchone()[0]
    
    if existing_count > 0:
        print(f"⚠️ Contracts table already has {existing_count} record(s)")
        response = input("Do you want to add more contracts? (y/n): ").strip().lower()
        if response != 'y':
            print("Operation cancelled.")
            return True
    
    print("\n📝 Creating sample contracts...")
    
    # Sample contract data
    contract_templates = [
        {
            "title": "Website Redesign Project",
            "status": "active",
            "total_amount": 12000,
            "paid_amount": 6000,
            "hourly_rate": 60,
            "hours_per_week": 20,
            "description": "Complete redesign of corporate website with CMS integration"
        },
        {
            "title": "Mobile App Development",
            "status": "active",
            "total_amount": 8000,
            "paid_amount": 2000,
            "hourly_rate": 50,
            "hours_per_week": 25,
            "description": "Cross-platform mobile app for food delivery service"
        },
        {
            "title": "E-commerce Platform",
            "status": "completed",
            "total_amount": 15000,
            "paid_amount": 15000,
            "hourly_rate": 70,
            "hours_per_week": 30,
            "description": "Full-featured e-commerce platform with payment gateway"
        },
        {
            "title": "UI/UX Design",
            "status": "active",
            "total_amount": 4500,
            "paid_amount": 1500,
            "hourly_rate": 55,
            "hours_per_week": 15,
            "description": "User interface and experience design for fitness app"
        },
        {
            "title": "SEO Optimization",
            "status": "completed",
            "total_amount": 3000,
            "paid_amount": 3000,
            "hourly_rate": 40,
            "hours_per_week": 10,
            "description": "Search engine optimization for online store"
        },
        {
            "title": "Social Media Marketing",
            "status": "pending",
            "total_amount": 2000,
            "paid_amount": 0,
            "hourly_rate": 30,
            "hours_per_week": 10,
            "description": "3-month social media marketing campaign"
        },
        {
            "title": "Logo & Branding",
            "status": "completed",
            "total_amount": 1200,
            "paid_amount": 1200,
            "hourly_rate": None,
            "hours_per_week": None,
            "description": "Logo design and brand identity package"
        },
        {
            "title": "API Development",
            "status": "active",
            "total_amount": 6000,
            "paid_amount": 3000,
            "hourly_rate": 65,
            "hours_per_week": 20,
            "description": "REST API development for inventory management system"
        }
    ]
    
    # Status colors for display
    status_colors = {
        "active": "🟢",
        "completed": "🔵",
        "pending": "🟡",
        "cancelled": "🔴"
    }
    
    contracts_created = 0
    
    try:
        for i, template in enumerate(contract_templates):
            # Select random freelancer, client, and job
            freelancer = random.choice(freelancers)
            client = random.choice(clients)
            job = random.choice(jobs)
            
            # Calculate dates
            start_date = datetime.now() - timedelta(days=random.randint(0, 90))
            
            if template['status'] == 'completed':
                end_date = start_date + timedelta(days=random.randint(30, 90))
            elif template['status'] == 'active':
                end_date = start_date + timedelta(days=random.randint(30, 180))
            else:
                end_date = None
            
            # Create contract
            contract_data = {
                "freelancer_id": freelancer['id'],
                "client_id": client['id'],
                "job_id": job['id'],
                "title": template['title'],
                "status": template['status'],
                "total_amount": template['total_amount'],
                "paid_amount": template['paid_amount'],
                "hourly_rate": template['hourly_rate'],
                "hours_per_week": template['hours_per_week'],
                "start_date": start_date,
                "end_date": end_date,
                "created_at": start_date - timedelta(days=random.randint(1, 7))
            }
            
            # Insert contract
            db.execute(text("""
                INSERT INTO contracts (
                    freelancer_id, client_id, job_id, title, status, 
                    total_amount, paid_amount, hourly_rate, hours_per_week,
                    start_date, end_date, created_at
                ) VALUES (
                    :freelancer_id, :client_id, :job_id, :title, :status,
                    :total_amount, :paid_amount, :hourly_rate, :hours_per_week,
                    :start_date, :end_date, :created_at
                )
            """), contract_data)
            
            contracts_created += 1
            
            # Display progress
            status_icon = status_colors.get(template['status'], '⚪')
            print(f"  {status_icon} Created: {template['title']} ({template['status']})")
            print(f"    💰 ${template['total_amount']} | ⏰ {template['hours_per_week'] or 'N/A'} hrs/week")
            print(f"    👤 {freelancer['username']} → {client['username']}")
            print()
        
        # Commit all changes
        db.commit()
        
        print(f"\n✅ Successfully created {contracts_created} contracts!")
        
        # Show summary
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(total_amount) as total_value,
                SUM(paid_amount) as total_paid
            FROM contracts
        """))
        
        row = result.fetchone()
        if row:
            total, active, completed, pending, total_value, total_paid = row
            print("\n📊 Contract Statistics:")
            print(f"   Total Contracts: {total}")
            print(f"   Active: {active}")
            print(f"   Completed: {completed}")
            print(f"   Pending: {pending}")
            print(f"   Total Contract Value: ${total_value:,.0f}")
            print(f"   Total Amount Paid: ${total_paid:,.0f}")
            print(f"   Pending Balance: ${total_value - total_paid:,.0f}")
        
        return True
        
    except SQLAlchemyError as e:
        db.rollback()
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        db.rollback()
        print(f"❌ Unexpected error: {e}")
        return False

def verify_contracts(db):
    """Verify contracts were created successfully"""
    print("\n🔍 Verifying contracts...")
    
    try:
        # Get all contracts with user and job info
        result = db.execute(text("""
            SELECT 
                c.id,
                c.title,
                c.status,
                c.total_amount,
                c.paid_amount,
                f.username as freelancer,
                cl.username as client,
                j.title as job_title
            FROM contracts c
            JOIN users f ON c.freelancer_id = f.id
            JOIN users cl ON c.client_id = cl.id
            JOIN jobs j ON c.job_id = j.id
            ORDER BY c.created_at DESC
            LIMIT 5
        """))
        
        rows = result.fetchall()
        
        if rows:
            print(f"📋 Latest {len(rows)} contracts:")
            for row in rows:
                id, title, status, total_amount, paid_amount, freelancer, client, job_title = row
                progress = (paid_amount / total_amount * 100) if total_amount > 0 else 0
                status_icon = status_colors.get(status, '⚪')
                print(f"\n  {status_icon} {title}")
                print(f"    👤 {freelancer} → {client}")
                print(f"    📊 {status.upper()} | ${total_amount}")
                print(f"    📈 Progress: {progress:.0f}% (${paid_amount}/${total_amount})")
                print(f"    🔗 Job: {job_title[:50]}...")
        else:
            print("No contracts found.")
            
    except Exception as e:
        print(f"Error verifying contracts: {e}")

def main():
    """Main function"""
    print("=" * 60)
    print("📂 CONTRACTS DATABASE POPULATOR")
    print("=" * 60)
    
    # Define status_colors as global for verify_contracts
    global status_colors
    status_colors = {
        "active": "🟢",
        "completed": "🔵",
        "pending": "🟡",
        "cancelled": "🔴"
    }
    
    db = None
    try:
        db = create_session()
        
        # Populate contracts
        success = populate_contracts(db)
        
        if success:
            # Verify the data
            verify_contracts(db)
            
            print("\n🎉 Done! Your contracts page should now show real data.")
            print("\n📋 Next steps:")
            print("   1. Restart your FastAPI server if needed")
            print("   2. Refresh your React contracts page")
            print("   3. Check that contracts are displayed correctly")
            print("\n💡 Tip: You can run this script again to add more contracts.")
    
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if db:
            db.close()

if __name__ == "__main__":
    main()