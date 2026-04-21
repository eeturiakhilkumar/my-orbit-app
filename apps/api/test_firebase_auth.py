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
    with patch("os.path.exists", return_value=False):
        with patch("firebase_auth.firebase_admin._apps", {}):
            with patch("firebase_auth.credentials.Certificate") as mock_cert:
                with patch("firebase_auth.firebase_admin.initialize_app") as mock_init:
                    import importlib
                    importlib.reload(firebase_auth)
                    mock_cert.assert_called_once()
                    mock_init.assert_called_once()

def test_init_with_env_var_fallback(monkeypatch):
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_JSON", json.dumps({"type": "service_account"}))
    with patch("os.path.exists", return_value=True):
        with patch("firebase_auth.firebase_admin._apps", {}):
            with patch("firebase_auth.credentials.Certificate", side_effect=[ValueError("Invalid file"), MagicMock()]):
                with patch("firebase_auth.firebase_admin.initialize_app") as mock_init:
                    import importlib
                    importlib.reload(firebase_auth)
                    mock_init.assert_called_once()

def test_init_with_cloud_run_secret(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_JSON", raising=False)
    # Mock os.path.exists to only return True for the cloud_run_cred_path
    def mock_exists(path):
        return path == "/app/firebase-adminsdk.json"

    with patch("os.path.exists", side_effect=mock_exists):
        with patch("firebase_auth.firebase_admin._apps", {}):
            with patch("firebase_auth.credentials.Certificate") as mock_cert:
                with patch("firebase_auth.firebase_admin.initialize_app") as mock_init:
                    import importlib
                    importlib.reload(firebase_auth)
                    mock_cert.assert_called_once_with("/app/firebase-adminsdk.json")
                    mock_init.assert_called_once()

def test_init_with_local_file(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_JSON", raising=False)
    # Mock os.path.exists to only return True for the local_cred_path
    def mock_exists(path):
        return path == firebase_auth.local_cred_path

    with patch("os.path.exists", side_effect=mock_exists):
        with patch("firebase_auth.firebase_admin._apps", {}):
            with patch("firebase_auth.credentials.Certificate") as mock_cert:
                with patch("firebase_auth.firebase_admin.initialize_app") as mock_init:
                    import importlib
                    importlib.reload(firebase_auth)
                    mock_cert.assert_called_once_with(firebase_auth.local_cred_path)
                    mock_init.assert_called_once()

def test_init_with_fallback(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_JSON", raising=False)
    with patch("os.path.exists", return_value=False):
        with patch("firebase_auth.firebase_admin._apps", {}):
            with patch("firebase_auth.firebase_admin.initialize_app") as mock_init:
                with patch("builtins.print") as mock_print:
                    import importlib
                    importlib.reload(firebase_auth)
                    mock_init.assert_called_once()
                    mock_print.assert_any_call("Firebase Admin SDK initialized successfully using default credentials.")

def test_init_value_error(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_JSON", raising=False)
    def mock_exists(path):
        return path == "/app/firebase-adminsdk.json"

    with patch("os.path.exists", side_effect=mock_exists):
        with patch("firebase_auth.firebase_admin._apps", {}):
            with patch("firebase_auth.credentials.Certificate"):
                with patch("firebase_auth.firebase_admin.initialize_app", side_effect=[ValueError("App already exists"), MagicMock()]):
                    import importlib
                    with patch("builtins.print") as mock_print:
                        importlib.reload(firebase_auth)
                        mock_print.assert_any_call("Warning: Failed to initialize from secret mount: App already exists")

def test_init_other_error(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_JSON", raising=False)
    def mock_exists(path):
        return path == "/app/firebase-adminsdk.json"

    with patch("os.path.exists", side_effect=mock_exists):
        with patch("firebase_auth.firebase_admin._apps", {}):
            with patch("firebase_auth.credentials.Certificate"):
                with patch("firebase_auth.firebase_admin.initialize_app", side_effect=[Exception("Other error"), MagicMock()]):
                    with patch("builtins.print") as mock_print:
                        import importlib
                        importlib.reload(firebase_auth)
                        mock_print.assert_any_call("Warning: Failed to initialize from secret mount: Other error")
