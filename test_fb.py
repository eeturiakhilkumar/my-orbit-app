import firebase_admin
from firebase_admin import credentials, auth
import os

try:
    project_id = os.getenv("FIREBASE_PROJECT_ID", "my-orbit-app-f2a73")
    firebase_admin.initialize_app(options={'projectId': project_id})
    print("Initialized successfully!")
except Exception as e:
    print(f"Error: {e}")
