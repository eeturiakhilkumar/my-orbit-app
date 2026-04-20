import os
from datetime import datetime
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
    # Ensure we use pg8000 driver for Cloud SQL if not specified
    if "pg8000" not in DATABASE_URL:
        if "://" in DATABASE_URL:
            DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://")

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
from typing import Optional
from pydantic import BaseModel

class UserSyncRequest(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None

@app.post("/users/sync")
async def sync_user(
    user_data: UserSyncRequest,
    uid: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Check if user already exists in our local DB
    statement = select(User).where(User.id == uid)
    existing_user = session.exec(statement).first()

    if not existing_user:
        # If they are new, create them!
        new_user = User(
            id=uid,
            email=user_data.email,
            phone_number=user_data.phone_number,
            display_name=user_data.display_name,
            photo_url=user_data.photo_url
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return {"message": "User created", "user": new_user}
    else:
        # Update existing user details if provided
        if user_data.email:
            existing_user.email = user_data.email
        if user_data.phone_number:
            existing_user.phone_number = user_data.phone_number
        if user_data.display_name:
            existing_user.display_name = user_data.display_name
        if user_data.photo_url:
            existing_user.photo_url = user_data.photo_url

        existing_user.last_login = datetime.utcnow()

        session.add(existing_user)
        session.commit()
        session.refresh(existing_user)
        return {"message": "User updated", "user": existing_user}

@app.get("/users/me", response_model=User)
async def get_me(
    uid: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(User).where(User.id == uid)
    user = session.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

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
