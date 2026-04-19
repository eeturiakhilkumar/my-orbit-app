from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, create_engine, select, SQLModel
from models import Item, User, ShoppingList, ShoppingItem, Document, ItemCreate

# 1. Setup Database Connection (Using SQLite for easy start)
sqlite_url = "sqlite:///./database.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

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

# 2. THE ROUTE: Create a new Item (Bill, Appt, etc.)
@app.post("/items/", response_model=Item)
def create_item(item_data: ItemCreate, session: Session = Depends(get_session)):
    # In a real app, we'd verify the Firebase token here first
    item = Item.model_validate(item_data)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

# 3. THE ROUTE: Get all items for a specific user
@app.get("/items/{user_id}", response_model=list[Item])
def read_items(user_id: str, session: Session = Depends(get_session)):
    statement = select(Item).where(Item.user_id == user_id)
    results = session.exec(statement).all()
    return results
