'use client';

import React from 'react';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import api from "../lib/api";

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      // 1. Login to Firebase
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged into Firebase:", result.user.displayName);

      // 2. Sync with FastAPI (This triggers the 'sync_user' route we wrote)
      await api.post("/users/sync");

      alert("System Sync Complete! Welcome to Vantage.");
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif'
    }}>
      <h1>My Orbit Login</h1>
      <p>Please sign-in:</p>
      <button
        onClick={handleLogin}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#4285F4',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
