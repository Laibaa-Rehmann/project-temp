#!/usr/bin/env python3
"""
Script to add more contracts for user 'anuj'
"""

import sys
import os
from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database configuration
DATABASE_URL = "postgresql://skilllink_user:kali@localhost:5432/skilllink_db"

def create_session():
    """Create database session"""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def add_contracts_for_anuj():
    """Add 10 more contracts for user 'anuj'"""
    
    db = create_session()
    
    try:
        print("🔍 Finding user 'anuj'...")
        
        # Get user anuj
        result = db.execute(
            text("SELECT id, username FROM users WHERE username = 'anuj'")
        )
        anuj = result.fetchone()
        
        if not anuj:
            print("❌ User 'anuj' not found!")
            print("   Available users:")
            result = db.execute(text("SELECT username, user_type FROM users"))
            for row in result.fetchall():
                print(f"    - {row[0]} ({row[1]})")
            return
        
        anuj_id = anuj[0]
        anuj_username = anuj[1]
        print(f"✅ Found user '{anuj_username}' with ID: {anuj_id}")
        
        # Get all clients
        result = db.execute(
            text("SELECT id, username FROM users WHERE user_type = 'client'")
        )
        client_rows = result.fetchall()
        clients = []
        for row in client_rows:
            clients.append({'id': row[0], 'username': row[1]})
        
        if not clients:
            print("❌ No clients found!")
            return
        
        # Get all jobs
        result = db.execute(
            text("SELECT id, title FROM jobs")
        )
        job_rows = result.fetchall()
        jobs = []
        for row in job_rows:
            jobs.append({'id': row[0], 'title': row[1]})
        
        if not jobs:
            print("❌ No jobs found!")
            return
        
        print(f"✅ Found {len(clients)} clients and {len(jobs)} jobs")
        
        # Contract templates
        contract_templates = [
            # Active contracts with pending earnings
            {
                "title": "Website Maintenance Contract",
                "status": "active",
                "total_amount": 7500,
                "paid_amount": 3000,
                "hourly_rate": 45,
                "hours_per_week": 25,
                "description": "Monthly website maintenance and updates"
            },
            {
                "title": "Mobile App Backend API",
                "status": "active",
                "total_amount": 12000,
                "paid_amount": 5000,
                "hourly_rate": 60,
                "hours_per_week": 30,
                "description": "Backend API development for mobile application"
            },
            {
                "title": "E-commerce Dashboard",
                "status": "active",
                "total_amount": 9000,
                "paid_amount": 4500,
                "hourly_rate": 50,
                "hours_per_week": 20,
                "description": "Admin dashboard for e-commerce platform"
            },
            # Completed contracts
            {
                "title": "SEO Campaign - Q3 2024",
                "status": "completed",
                "total_amount": 4000,
                "paid_amount": 4000,
                "hourly_rate": 40,
                "hours_per_week": 15,
                "description": "Quarterly SEO optimization campaign"
            },
            {
                "title": "WordPress Website",
                "status": "completed",
                "total_amount": 3500,
                "paid_amount": 3500,
                "hourly_rate": 35,
                "hours_per_week": 20,
                "description": "Custom WordPress theme development"
            },
            {
                "title": "Logo Design Package",
                "status": "completed",
                "total_amount": 1500,
                "paid_amount": 1500,
                "hourly_rate": None,
                "hours_per_week": None,
                "description": "Complete logo and branding package"
            },
            # Pending contracts
            {
                "title": "Social Media Strategy",
                "status": "pending",
                "total_amount": 2500,
                "paid_amount": 0,
                "hourly_rate": 30,
                "hours_per_week": 10,
                "description": "3-month social media marketing strategy"
            },
            {
                "title": "Content Writing - Tech Blog",
                "status": "pending",
                "total_amount": 1800,
                "paid_amount": 0,
                "hourly_rate": 25,
                "hours_per_week": 12,
                "description": "Weekly technical blog posts"
            },
            # More active contracts
            {
                "title": "React Native App Development",
                "status": "active",
                "total_amount": 15000,
                "paid_amount": 7000,
                "hourly_rate": 65,
                "hours_per_week": 35,
                "description": "Cross-platform React Native mobile app"
            },
            {
                "title": "Database Optimization",
                "status": "active",
                "total_amount": 5500,
                "paid_amount": 2000,
                "hourly_rate": 55,
                "hours_per_week": 15,
                "description": "Database performance optimization and tuning"
            }
        ]
        
        print("\n📝 Adding 10 contracts for 'anuj'...")
        
        contracts_added = 0
        
        for i, template in enumerate(contract_templates):
            # Select random client and job
            client = random.choice(clients)
            job = random.choice(jobs)
            
            # Calculate dates
            start_date = datetime.now() - timedelta(days=random.randint(0, 120))
            
            if template['status'] == 'completed':
                end_date = start_date + timedelta(days=random.randint(30, 90))
                created_at = start_date - timedelta(days=random.randint(1, 7))
            elif template['status'] == 'active':
                end_date = start_date + timedelta(days=random.randint(30, 180))
                created_at = start_date - timedelta(days=random.randint(1, 7))
            else:  # pending
                end_date = None
                created_at = start_date
            
            # Create contract
            contract_data = {
                "freelancer_id": anuj_id,
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
                "created_at": created_at
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
            
            contracts_added += 1
            
            # Display progress
            status_icon = {
                "active": "🟢",
                "completed": "🔵",
                "pending": "🟡"
            }.get(template['status'], '⚪')
            
            print(f"  {status_icon} {template['title']}")
            print(f"    💰 ${template['total_amount']} | 💵 Paid: ${template['paid_amount']}")
            print(f"    📅 Status: {template['status']}")
            if template['hourly_rate']:
                print(f"    ⏰ ${template['hourly_rate']}/hr | {template['hours_per_week']} hrs/week")
            print()
        
        # Commit all changes
        db.commit()
        
        print(f"✅ Successfully added {contracts_added} contracts for 'anuj'!")
        
        # Show summary for anuj
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(total_amount) as total_value,
                SUM(paid_amount) as total_paid
            FROM contracts
            WHERE freelancer_id = :freelancer_id
        """), {"freelancer_id": anuj_id})
        
        row = result.fetchone()
        if row:
            total, active, completed, pending, total_value, total_paid = row
            print("\n📊 Contract Statistics for 'anuj':")
            print(f"   Total Contracts: {total}")
            print(f"   Active: {active}")
            print(f"   Completed: {completed}")
            print(f"   Pending: {pending}")
            print(f"   Total Contract Value: ${total_value:,.0f}")
            print(f"   Total Amount Paid: ${total_paid:,.0f}")
            print(f"   Pending Balance: ${total_value - total_paid:,.0f}")
        
        # Show all contracts for anuj
        print("\n📋 All contracts for 'anuj':")
        result = db.execute(text("""
            SELECT 
                c.id,
                c.title,
                c.status,
                c.total_amount,
                c.paid_amount,
                u.username as client_name,
                j.title as job_title
            FROM contracts c
            JOIN users u ON c.client_id = u.id
            JOIN jobs j ON c.job_id = j.id
            WHERE c.freelancer_id = :freelancer_id
            ORDER BY c.created_at DESC
        """), {"freelancer_id": anuj_id})
        
        contracts = result.fetchall()
        for contract in contracts:
            id, title, status, total_amount, paid_amount, client_name, job_title = contract
            progress = (paid_amount / total_amount * 100) if total_amount > 0 else 0
            status_icon = {
                "active": "🟢",
                "completed": "🔵",
                "pending": "🟡"
            }.get(status, '⚪')
            
            print(f"  {status_icon} #{id}: {title}")
            print(f"     👤 Client: {client_name}")
            print(f"     💰 ${total_amount} | 💵 ${paid_amount} paid")
            print(f"     📊 {status} | 📈 {progress:.0f}% complete")
            print()
        
        print("\n🎉 Done! User 'anuj' now has multiple contracts.")
        print("   Log in as 'anuj' to see the contracts page populated.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("📂 ADD CONTRACTS FOR USER 'ANUJ'")
    print("=" * 60)
    
    add_contracts_for_anuj()