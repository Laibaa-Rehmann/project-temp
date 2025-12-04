# add_location_column.py
import sys
import os
sys.path.append('.')

from main import SessionLocal
from sqlalchemy import text

print("Checking and adding location column to jobs table...")

db = SessionLocal()
try:
    # Check if column exists
    result = db.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='jobs' AND column_name='location'
    """))
    
    if result.fetchone() is None:
        print("Adding 'location' column...")
        db.execute(text("ALTER TABLE jobs ADD COLUMN location VARCHAR DEFAULT 'Remote'"))
        db.commit()
        print("✅ Successfully added 'location' column with default value 'Remote'")
    else:
        print("✅ 'location' column already exists")
        
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()