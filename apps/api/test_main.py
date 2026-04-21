import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
import os
import importlib

# SQLite in-memory doesn't persist across separate connections unless we manage it properly,
# but the problem in our tests is that `client = TestClient(main.app)` connects to `main.app`,
# and inside the requests, our dependency override is used.
# Let's verify our engine creation.

import main

# Let's create an engine that maps to a real temporary file instead of :memory: to completely avoid the "sqlite in-memory threading" issues
# where one connection creates tables and another connection can't see them.
db_path = "sqlite:///./test_myorbit.db"
test_engine = create_engine(db_path, connect_args={"check_same_thread": False})
SQLModel.metadata.create_all(test_engine)

main.engine = test_engine

def get_session_override():
    with Session(test_engine) as session:
        yield session

main.app.dependency_overrides[main.get_session] = get_session_override

@pytest.fixture(autouse=True)
def clear_db():
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)
    yield

def override_get_current_user():
    return "test_uid_123"

main.app.dependency_overrides[main.get_current_user] = override_get_current_user

client = TestClient(main.app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "Personal Ops API is running"}

def test_sync_user_create():
    response = client.post("/users/sync", json={
        "email": "test@test.com",
        "phone_number": "+1234567890",
        "display_name": "Test User",
        "photo_url": "http://photo.com"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "User created"
    assert response.json()["user"]["email"] == "test@test.com"

def test_sync_user_update():
    client.post("/users/sync", json={"email": "old@test.com"})

    response = client.post("/users/sync", json={
        "email": "new@test.com",
        "phone_number": "+1234567890",
        "display_name": "New Name",
        "photo_url": "http://newphoto.com"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "User updated"
    assert response.json()["user"]["email"] == "new@test.com"
    assert response.json()["user"]["display_name"] == "New Name"

def test_sync_user_partial_update():
    client.post("/users/sync", json={"email": "old@test.com", "phone_number": "+111"})

    response = client.post("/users/sync", json={
        "email": None,
        "phone_number": None,
        "display_name": None,
        "photo_url": None
    })
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "old@test.com"
    assert response.json()["user"]["phone_number"] == "+111"

def test_get_me():
    client.post("/users/sync", json={"email": "test@test.com"})

    response = client.get("/users/me")
    assert response.status_code == 200
    assert response.json()["email"] == "test@test.com"

def test_get_me_not_found():
    def override_get_current_user_not_found():
        return "non_existent_uid"
    main.app.dependency_overrides[main.get_current_user] = override_get_current_user_not_found

    response = client.get("/users/me")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"

    main.app.dependency_overrides[main.get_current_user] = override_get_current_user

def test_create_item():
    client.post("/users/sync", json={"email": "test@test.com"})

    response = client.post("/items/", json={
        "title": "My Bill",
        "category": "Bill",
        "due_date": "2023-01-01T00:00:00",
        "user_id": "test_uid_123"
    })
    assert response.status_code == 200
    assert response.json()["title"] == "My Bill"

def test_create_item_forbidden():
    client.post("/users/sync", json={"email": "test@test.com"})

    response = client.post("/items/", json={
        "title": "My Bill",
        "category": "Bill",
        "due_date": "2023-01-01T00:00:00",
        "user_id": "wrong_uid"
    })
    assert response.status_code == 403
    assert response.json()["detail"] == "You can only create items for your own user account"

def test_read_my_items():
    client.post("/users/sync", json={"email": "test@test.com"})
    client.post("/items/", json={
        "title": "My Bill 1",
        "category": "Bill",
        "due_date": "2023-01-01T00:00:00",
        "user_id": "test_uid_123"
    })

    response = client.get("/items/me")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "My Bill 1"

def test_main_postgres_url(mocker):
    # This must be the last test or we clean up correctly
    import os
    import importlib

    mocker.patch.dict(os.environ, {"DATABASE_URL": "postgresql://user:pass@localhost/db"})
    importlib.reload(main)
    assert "postgresql+pg8000://" in main.DATABASE_URL

    mocker.patch.dict(os.environ, {"DATABASE_URL": "postgresql+pg8000://user:pass@localhost/db"})
    importlib.reload(main)
    assert "postgresql+pg8000://" in main.DATABASE_URL

    mocker.patch.dict(os.environ, {"DATABASE_URL": "sqlite:///./test_myorbit.db"})
    importlib.reload(main)

    # Restore mock overrides after module reload!
    main.app.dependency_overrides[main.get_session] = get_session_override
    main.app.dependency_overrides[main.get_current_user] = override_get_current_user
    main.engine = test_engine

def test_startup_event():
    from unittest.mock import patch
    with patch("main.SQLModel.metadata.create_all") as mock_create_all:
        main.on_startup()
        mock_create_all.assert_called_once()

def test_get_session_yields():
    gen = main.get_session()
    sess = next(gen)
    assert sess is not None

def teardown_module(module):
    if os.path.exists("./test_myorbit.db"):
        os.remove("./test_myorbit.db")
