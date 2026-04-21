import pytest
from fastapi import HTTPException, status
from firebase_auth import get_current_user
import firebase_auth
from unittest.mock import patch, MagicMock
import os
import json

@pytest.mark.asyncio
async def test_get_current_user_no_header():
    with pytest.raises(HTTPException) as exc:
        await get_current_user(authorization=None)
    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert exc.value.detail == "Missing or invalid Authorization header"

@pytest.mark.asyncio
async def test_get_current_user_invalid_header_format():
    with pytest.raises(HTTPException) as exc:
        await get_current_user(authorization="Token something")
    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

@patch("firebase_auth.auth.verify_id_token")
@pytest.mark.asyncio
async def test_get_current_user_valid_token(mock_verify):
    mock_verify.return_value = {"uid": "user_123"}
    uid = await get_current_user(authorization="Bearer valid_token")
    assert uid == "user_123"
    mock_verify.assert_called_once_with("valid_token")

@patch("firebase_auth.auth.verify_id_token")
@pytest.mark.asyncio
async def test_get_current_user_invalid_token(mock_verify):
    mock_verify.side_effect = Exception("Expired token")
    with pytest.raises(HTTPException) as exc:
        await get_current_user(authorization="Bearer invalid_token")
    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid token" in exc.value.detail

# Testing initialization block (this runs on import, so we need to reload it with different env vars)
def test_init_with_env_var(monkeypatch):
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_JSON", json.dumps({"type": "service_account"}))
    with patch("firebase_auth.credentials.Certificate") as mock_cert:
        with patch("firebase_auth.firebase_admin.initialize_app") as mock_init:
            import importlib
            importlib.reload(firebase_auth)
            mock_cert.assert_called_once()
            mock_init.assert_called_once()

def test_init_with_local_file(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_JSON", raising=False)
    with patch("os.path.exists", return_value=True):
        with patch("firebase_auth.credentials.Certificate") as mock_cert:
            with patch("firebase_auth.firebase_admin.initialize_app") as mock_init:
                import importlib
                importlib.reload(firebase_auth)
                mock_cert.assert_called_once_with("my-orbit-app-f2a73-firebase-adminsdk.json")
                mock_init.assert_called_once()

def test_init_with_fallback(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_JSON", raising=False)
    with patch("os.path.exists", return_value=False):
        with patch("firebase_auth.firebase_admin.initialize_app") as mock_init:
            import importlib
            importlib.reload(firebase_auth)
            mock_init.assert_called_once_with()

def test_init_value_error(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_JSON", raising=False)
    with patch("os.path.exists", return_value=False):
        with patch("firebase_auth.firebase_admin.initialize_app", side_effect=ValueError("App already exists")):
            import importlib
            # Should not raise
            importlib.reload(firebase_auth)

def test_init_other_error(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_JSON", raising=False)
    with patch("os.path.exists", return_value=False):
        with patch("firebase_auth.firebase_admin.initialize_app", side_effect=Exception("Other error")):
            with patch("builtins.print") as mock_print:
                import importlib
                importlib.reload(firebase_auth)
                mock_print.assert_called_once_with("Warning: Firebase initialization failed: Other error")
