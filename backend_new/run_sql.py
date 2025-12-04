# run_sql.py
import psycopg2

# Your SQL commands
sql_commands = """
-- Add missing columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_type VARCHAR;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_min FLOAT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_max FLOAT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills_required VARCHAR;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duration VARCHAR;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level VARCHAR;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_title VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate FLOAT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;

-- Create proposals table if not exists
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    freelancer_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    cover_letter TEXT,
    bid_amount FLOAT,
    estimated_days INTEGER,
    status VARCHAR DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contracts table if not exists
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    freelancer_id INTEGER REFERENCES users(id),
    client_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    title VARCHAR,
    status VARCHAR DEFAULT 'active',
    total_amount FLOAT,
    paid_amount FLOAT DEFAULT 0,
    hourly_rate FLOAT,
    hours_per_week INTEGER,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

try:
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        dbname="skilllink_db",
        user="skilllink_user",
        password="kali",
        host="localhost",
        port="5432"
    )
    
    cursor = conn.cursor()
    
    # Split SQL commands by semicolon and execute each
    commands = sql_commands.split(';')
    
    for command in commands:
        if command.strip():  # Skip empty commands
            print(f"Executing: {command[:50]}...")
            cursor.execute(command)
    
    conn.commit()
    print("\n✅ All SQL commands executed successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()