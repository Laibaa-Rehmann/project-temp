# fix_proposals_table.py
import psycopg2

sql_commands = """
-- First, drop the proposals table if it exists (to recreate it properly)
DROP TABLE IF EXISTS proposals CASCADE;

-- Recreate proposals table with all required columns
CREATE TABLE proposals (
    id SERIAL PRIMARY KEY,
    freelancer_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    cover_letter TEXT,
    bid_amount FLOAT,
    estimated_days INTEGER,
    status VARCHAR DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Also fix contracts table if needed
DROP TABLE IF EXISTS contracts CASCADE;

CREATE TABLE contracts (
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
    
    print("Fixing database tables...")
    
    # Execute each command
    commands = sql_commands.split(';')
    for command in commands:
        if command.strip():  # Skip empty commands
            print(f"Executing: {command[:80]}...")
            cursor.execute(command)
    
    conn.commit()
    print("\n✅ Tables recreated successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    if conn:
        conn.rollback()
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()