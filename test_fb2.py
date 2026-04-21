import firebase_admin
from firebase_admin import credentials, auth
import os

try:
    firebase_admin.initialize_app()
    print("Initialized successfully!")
except Exception as e:
    print(f"Error: {e}")
