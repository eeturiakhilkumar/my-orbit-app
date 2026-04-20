import React, { useState, useEffect } from 'react';
import { auth } from "../lib/firebase";
import api from "../lib/api";
import logo from "../assets/logo.png";
import { Mail, Phone, User } from 'lucide-react';

export default function Onboarding() {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/users/me");
        setEmail(response.data.email || "");
        setPhoneNumber(response.data.phone_number || "");
        setDisplayName(response.data.display_name || auth.currentUser?.displayName || "");
      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!email || !phoneNumber) {
      setError("Email and Phone Number are mandatory.");
      setSubmitting(false);
      return;
    }

    try {
      await api.post("/users/sync", {
        email,
        phone_number: phoneNumber,
        display_name: displayName
      });
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Onboarding failed", err);
      setError("Failed to save your details. Please check if the email or phone is already in use.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-6 bg-white p-8 shadow-xl rounded-2xl border border-gray-100">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="My Orbit Logo" className="w-16 h-16 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="mt-1 text-xs text-gray-500">We need a few more details to get you started</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-[11px] font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-wider">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                required
                placeholder="john@example.com"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-wider">
              Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="phone"
                type="tel"
                required
                placeholder="+1234567890"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all mt-6"
          >
            {submitting ? "Saving..." : "Start Using My Orbit"}
          </button>
        </form>
      </div>
    </div>
  );
}
