import os
from fastapi import FastAPI, Depends, HTTPException, status
from sqlmodel import Session, create_engine, select, SQLModel
from models import Item, User, ShoppingList, ShoppingItem, Document, ItemCreate
from firebase_auth import get_current_user

# 1. Setup Database Connection
# Locally, this can be 'sqlite:///./myorbit.db'
# In Cloud Run, it will be the PostgreSQL Unix Socket string
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./myorbit.db")

# Logic to handle the specific requirements of Cloud SQL vs Local SQLite
if DATABASE_URL.startswith("postgresql"):
    # Use 'pg8000' for Cloud SQL connections (pure-python driver)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"timeout": 30},
        pool_recycle=1800,
    )
else:
    # Fallback for local development
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI()

# Create tables on startup
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session

@app.get("/")
def read_root():
    return {"status": "Personal Ops API is running"}

# --- USER SYNC ---
@app.post("/users/sync")
async def sync_user(
    uid: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Check if user already exists in our local DB
    statement = select(User).where(User.id == uid)
    existing_user = session.exec(statement).first()

    if not existing_user:
        # If they are new, create them!
        # Note: Placeholder email. Frontend will eventually provide real data.
        new_user = User(id=uid, email=f"{uid}@example.com")
        session.add(new_user)
        session.commit()
        return {"message": "User created in local DB"}

    return {"message": "User already exists"}

# --- SECURE ITEMS ---

@app.post("/items/", response_model=Item)
def create_item(
    item_data: ItemCreate,
    uid: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Security check: Ensure the item's user_id matches the authenticated user
    if item_data.user_id != uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create items for your own user account"
        )

    item = Item.model_validate(item_data)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@app.get("/items/me", response_model=list[Item])
def read_my_items(
    uid: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # This query ensures user A can NEVER see user B's bills
    statement = select(Item).where(Item.user_id == uid)
    results = session.exec(statement).all()
    return results
