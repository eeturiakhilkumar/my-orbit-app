from sqlmodel import SQLModel, create_engine
from models import User, Item  # Ensure these are imported so they are registered

# This creates a file named 'vantage.db' in your api folder
sqlite_url = "sqlite:///./myorbit.db"
engine = create_engine(sqlite_url, echo=True) # echo=True shows the SQL in your terminal

def create_db_and_tables():
    print("Creating tables...")
    SQLModel.metadata.create_all(engine)
    print("Database initialized successfully!")

if __name__ == "__main__":
    create_db_and_tables()
