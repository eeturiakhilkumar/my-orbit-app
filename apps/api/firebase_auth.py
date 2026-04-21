import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Header, HTTPException, status

# Get the absolute path to the credential file
base_dir = os.path.dirname(os.path.abspath(__file__))
cred_path = os.path.join(base_dir, "my-orbit-app-f2a73-firebase-adminsdk.json")

# Initialize Firebase Admin SDK only if it hasn't been initialized
if not firebase_admin._apps:
    try:
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully from file.")
        else:
            firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            if firebase_json:
                cred_dict = json.loads(firebase_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin SDK initialized successfully from env var.")
            else:
                print("Warning: Firebase service account JSON not found.")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")

async def get_current_user(authorization: str = Header(None)):
    """
    This extracts the token from the request header and verifies it.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    # Get the token from "Bearer <token_string>"
    token = authorization.split("Bearer ")[1]

    try:
        # Verify the token with Firebase
        decoded_token = auth.verify_id_token(token)
        # Return the unique Firebase User ID (uid)
        return decoded_token['uid']
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )
