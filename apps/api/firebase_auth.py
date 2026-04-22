import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Header, HTTPException, status

# Get the absolute path to the local credential file for fallback
base_dir = os.path.dirname(os.path.abspath(__file__))
local_cred_path = os.path.join(base_dir, "my-orbit-app-f2a73-firebase-adminsdk.json")
# The path defined in Cloud Run secret mount
cloud_run_cred_path = "/app/firebase-adminsdk.json"

# Initialize Firebase Admin SDK only if it hasn't been initialized
if not firebase_admin._apps:
    initialized = False

    # 1. Try Cloud Run Secret Manager mount
    if os.path.exists(cloud_run_cred_path):
        try:
            cred = credentials.Certificate(cloud_run_cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully from secret mount.")
            initialized = True
        except Exception as e:
            print(f"Warning: Failed to initialize from secret mount: {e}")

    # 2. Try Local Dev File
    if not initialized and os.path.exists(local_cred_path):
        try:
            cred = credentials.Certificate(local_cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully from local file.")
            initialized = True
        except Exception as e:
            print(f"Warning: Failed to initialize from local file: {e}")

    # 3. Try Environment Variable string
    if not initialized:
        firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if firebase_json:
            try:
                cred_dict = json.loads(firebase_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin SDK initialized successfully from env var.")
                initialized = True
            except Exception as e:
                print(f"Warning: Failed to initialize from env var: {e}")

    # 4. Fallback to default application credentials
    if not initialized:
        try:
            project_id = os.getenv("FIREBASE_PROJECT_ID", "my-orbit-app-f2a73")
            firebase_admin.initialize_app(options={'projectId': project_id})
            print("Firebase Admin SDK initialized successfully using default credentials.")
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
