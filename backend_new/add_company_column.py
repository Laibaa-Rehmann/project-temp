# add_company_column.py
from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql://skilllink_user:kali@localhost:5432/skilllink_db"

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_company_name_column():
    """Add company_name column to users table"""
    try:
        with engine.connect() as connection:
            # Check if column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='company_name'
            """))
            
            if result.fetchone():
                print("Column 'company_name' already exists")
                return
            
            # Add the column
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN company_name VARCHAR
            """))
            connection.commit()
            print("Successfully added 'company_name' column to users table")
            
    except Exception as e:
        print(f"Error adding column: {str(e)}")
        raise

if __name__ == "__main__":
    add_company_name_column()