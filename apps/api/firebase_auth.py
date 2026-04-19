import os
import firebase_admin
from firebase_admin import credentials, auth
from typing import Optional

# Path to the service account key file
# The memory suggests this file should be in apps/api/
SERVICE_ACCOUNT_KEY_PATH = os.getenv(
    "FIREBASE_SERVICE_ACCOUNT_KEY",
    "my-orbit-app-f2a73-firebase-adminsdk.json"
)

def initialize_firebase():
    """Initializes the Firebase Admin SDK."""
    try:
        # Check if already initialized to avoid ValueError
        firebase_admin.get_app()
    except ValueError:
        if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback for development/testing if the file is missing
            print(f"Warning: Firebase service account file not found at {SERVICE_ACCOUNT_KEY_PATH}. "
                  "Firebase Admin SDK not initialized with credentials.")
            firebase_admin.initialize_app()

def verify_token(id_token: str) -> Optional[dict]:
    """
    Verifies a Firebase ID token.
    Returns the decoded token (including uid) if valid, or None if invalid.
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"Error verifying Firebase token: {e}")
        return None

# Initialize on module import
initialize_firebase()
