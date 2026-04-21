from datetime import datetime
from typing import Optional, List
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship

class ItemCategory(str, Enum):
    BILL = "Bill"
    APPOINTMENT = "Appointment"
    RENEWAL = "Renewal"
    TRAVEL = "Travel"
    SOCIAL = "Social"
    IMPORTANT_DATE = "Important Date"

class DocumentType(str, Enum):
    PASSPORT = "Passport"
    INSURANCE = "Insurance"
    TICKET = "Ticket"

class User(SQLModel, table=True):
    # This ID MUST match the 'uid' provided by Firebase
    id: str = Field(primary_key=True, index=True)

    # Basic Info
    email: Optional[str] = Field(default=None, unique=True, index=True)
    phone_number: Optional[str] = Field(default=None, unique=True, index=True)
    display_name: Optional[str] = None
    photo_url: Optional[str] = None # Sync this from Firebase/Google login

    # Personalization
    timezone: str = Field(default="Asia/Kolkata") # Critical for appointment reminders
    currency: str = Field(default="INR") # For your Bills and Shopping lists

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    # Growth features
    is_onboarded: bool = Field(default=False)

    # Relationships
    items: List["Item"] = Relationship(back_populates="user")
    shopping_lists: List["ShoppingList"] = Relationship(back_populates="user")
    documents: List["Document"] = Relationship(back_populates="user")

class ItemBase(SQLModel):
    title: str = Field(index=True)
    description: Optional[str] = None
    category: ItemCategory
    due_date: datetime
    is_completed: bool = False
    priority: int = Field(default=1) # 1: Low, 2: Med, 3: High
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Optional fields for specific categories
    amount: Optional[float] = None     # For Bills
    location: Optional[str] = None   # For Appointments
    link: Optional[str] = None       # For Travel/Documents

class ItemCreate(ItemBase):
    user_id: str

class Item(ItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)

    user: Optional[User] = Relationship(back_populates="items")

class ShoppingListBase(SQLModel):
    name: str # e.g., "Grocery", "Hardware Store"

class ShoppingList(ShoppingListBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="shopping_lists")
    items: List["ShoppingItem"] = Relationship(back_populates="shopping_list")

class ShoppingItemBase(SQLModel):
    content: str
    is_bought: bool = False

class ShoppingItem(ShoppingItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    list_id: int = Field(foreign_key="shoppinglist.id")

    shopping_list: Optional[ShoppingList] = Relationship(back_populates="items")

class DocumentBase(SQLModel):
    file_name: str
    file_url: str
    doc_type: DocumentType
    expiry_date: Optional[datetime] = None

class Document(DocumentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id")

    user: Optional[User] = Relationship(back_populates="documents")
