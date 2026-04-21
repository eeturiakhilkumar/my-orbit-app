import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { auth, googleProvider, setupRecaptcha } from "../lib/firebase";
import api from "../lib/api";
import logo from "../assets/logo.png";
import { LogIn, Phone, ShieldCheck, Mail } from 'lucide-react';

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setupRecaptcha('recaptcha-container');
  }, []);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      console.log("Starting Google Sign-In...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Firebase Login Successful:", result.user.email);

      // Check if user is complete in backend
      try {
        console.log("Syncing with backend...");
        const response = await api.get("/users/me");
        if (response.data.phone_number && response.data.email) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/onboarding";
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // New user, sync and then onboarding
          await api.post("/users/sync", {
            email: result.user.email,
            display_name: result.user.displayName,
            photo_url: result.user.photoURL
          });
          window.location.href = "/onboarding";
        } else {
          console.error("Backend sync failed:", err);
          setError(`Backend sync failed: ${err.message || "Unknown error"}. Please try again.`);
        }
      }
    } catch (error: any) {
      console.error("Google Login failed", error);
      setError(`Google Login failed: ${error.message || "Please check your Firebase configuration."}`);
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (num: string) => {
    const trimmed = num.trim();
    if (trimmed.startsWith("+")) {
      // If it starts with +, ensure it has a reasonable number of digits (minimum 7 for country code + number)
      const digitsOnly = trimmed.replace(/\D/g, "");
      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }
    // Otherwise, assume it's a 10-digit number
    const digitsOnly = trimmed.replace(/\D/g, "");
    return digitsOnly.length === 10;
  };

  const formatPhone = (num: string) => {
    let formatted = num.trim().replace(/[^\d+]/g, "");
    if (formatted.startsWith("0")) formatted = formatted.substring(1);
    // If no country code and is 10 digits, add +91
    if (!formatted.startsWith("+") && formatted.length === 10) {
      formatted = `+91${formatted}`;
    }
    return formatted;
  };

  const onSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formattedPhone = formatPhone(phoneNumber);

    if (!formattedPhone.startsWith("+") || formattedPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      setLoading(false);
      return;
    }

    try {
      setupRecaptcha('recaptcha-container');
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error("Phone sign-in failed", err);
      setError("Failed to send OTP. Check your phone number format (e.g., +1234567890).");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null as any;
      }
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!confirmationResult || !otp) {
      setError("Please enter the verification code.");
      setLoading(false);
      return;
    }

    try {
      const result = await confirmationResult.confirm(otp);
      console.log("Phone Login Successful:", result.user.phoneNumber);

      // Check user status
      try {
        console.log("Syncing with backend...");
        const response = await api.get("/users/me");
        if (response.data.phone_number && response.data.email) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/onboarding";
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // New user
          await api.post("/users/sync", {
            phone_number: result.user.phoneNumber,
          });
          window.location.href = "/onboarding";
        } else {
          console.error("Backend sync failed:", err);
          setError(`Backend sync failed: ${err.message}. Please try again.`);
        }
      }
    } catch (err: any) {
      console.error("OTP verification failed", err);
      setError(`Verification failed: ${err.message || "Invalid code. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-6 bg-white p-8 shadow-xl rounded-2xl border border-gray-100">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="My Orbit Logo" className="w-20 h-20 mb-4" />
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome to My Orbit</h2>
          <p className="mt-2 text-xs text-gray-500">Manage your life with precision and ease</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-medium border border-red-100">
            {error}
          </div>
        )}

        {!confirmationResult ? (
          <form onSubmit={onSignInSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="+1 234 567 890"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !validatePhone(phoneNumber)}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={onOtpSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-xs font-semibold text-gray-700 mb-1">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="otp"
                  type="text"
                  required
                  placeholder="123456"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <p className="mt-2 text-[10px] text-gray-500">
                OTP sent to {phoneNumber}. <button type="button" onClick={() => setConfirmationResult(null)} className="text-indigo-600 font-medium">Change number</button>
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-gray-400 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex justify-center items-center py-2 px-4 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}

import { RecaptchaVerifier } from "firebase/auth";

// Add types for window
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    grecaptcha: any;
  }
}
