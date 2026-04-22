import os
from sqlalchemy import create_engine, inspect, text

def run_migration():
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./myorbit.db")

    if DATABASE_URL.startswith("postgresql"):
        if "pg8000" not in DATABASE_URL:
            if "://" in DATABASE_URL:
                DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://")
        engine = create_engine(DATABASE_URL, connect_args={"timeout": 30})
    else:
        engine = create_engine(DATABASE_URL)

    inspector = inspect(engine)

    if not inspector.has_table("user"):
        print("Table 'user' does not exist yet. Let the app create tables on startup.")
        return

    columns = [col['name'] for col in inspector.get_columns("user")]

    with engine.connect() as conn:
        # Check and add phone_number
        if "phone_number" not in columns:
            print("Adding phone_number column to user table...")
            # Use VARCHAR for phone numbers to support international formats like +1234567890
            conn.execute(text('ALTER TABLE "user" ADD COLUMN phone_number VARCHAR;'))

            # Since phone_number is unique and indexed in our model:
            # phone_number: Optional[str] = Field(default=None, unique=True, index=True)
            print("Adding unique index to phone_number...")
            conn.execute(text('CREATE UNIQUE INDEX ix_user_phone_number ON "user" (phone_number);'))
            conn.commit()
            print("Successfully added phone_number column and index.")
        else:
            print("phone_number column already exists.")

if __name__ == "__main__":
    print("Starting database migration...")
    try:
        run_migration()
        print("Migration complete!")
    except Exception as e:
        print(f"Migration failed: {e}")
