import pytest
from models import User, Item, ItemCategory, Document, DocumentType, ShoppingList, ShoppingItem
from datetime import datetime

def test_user_creation():
    user = User(id="uid_123", email="test@example.com", phone_number="+1234567890", display_name="Test User", timezone="UTC", currency="USD")
    assert user.id == "uid_123"
    assert user.email == "test@example.com"
    assert user.timezone == "UTC"

def test_item_creation():
    from datetime import timezone
    now = datetime.now(timezone.utc)
    item = Item(id=1, user_id="uid_123", title="Electricity Bill", category=ItemCategory.BILL, due_date=now, amount=50.0)
    assert item.title == "Electricity Bill"
    assert item.category == ItemCategory.BILL

def test_shopping_list_creation():
    sl = ShoppingList(id=1, user_id="uid_123", name="Groceries")
    assert sl.name == "Groceries"

def test_shopping_item_creation():
    si = ShoppingItem(id=1, list_id=1, content="Milk", is_bought=True)
    assert si.content == "Milk"
    assert si.is_bought is True

def test_document_creation():
    doc = Document(id=1, user_id="uid_123", file_name="pass.pdf", file_url="http://link", doc_type=DocumentType.PASSPORT)
    assert doc.file_name == "pass.pdf"
    assert doc.doc_type == DocumentType.PASSPORT
