import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Header, HTTPException, status

# This part initializes the connection to Firebase
# It only needs to run once when the server starts
try:
    # Attempt to use the filename from user snippet
    cred = credentials.Certificate("my-orbit-app-f2a73-firebase-adminsdk.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    # This prevents errors if the app is already initialized
    pass
except Exception as e:
    # Fallback if the file doesn't exist, as per the user's manual step 3
    print(f"Warning: Firebase initialization failed: {e}")
    try:
        firebase_admin.initialize_app()
    except Exception:
        pass

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
