import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Header, HTTPException, status

# This part initializes the connection to Firebase
# It only needs to run once when the server starts
try:
    # 1. Check for service account JSON in environment variable
    firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if firebase_json:
        # Load credentials from the JSON string
        cred_dict = json.loads(firebase_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    else:
        # 2. Attempt to use the local filename if it exists
        cred_file = "my-orbit-app-f2a73-firebase-adminsdk.json"
        if os.path.exists(cred_file):
            cred = credentials.Certificate(cred_file)
            firebase_admin.initialize_app(cred)
        else:
            # 3. Fallback to default credentials (useful for Cloud Run environment)
            firebase_admin.initialize_app()
except ValueError:
    # This prevents errors if the app is already initialized
    pass
except Exception as e:
    print(f"Warning: Firebase initialization failed: {e}")

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
