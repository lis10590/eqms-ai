"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("qa_user");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("You must be logged in as an admin to register users.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username, password, role }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setMessage(data.message);
      setUsername("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen text-theme-text transition-colors duration-500">
      <Navbar />

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        {/* PREMIUM GLASS CONTAINER */}
        <div className="w-full max-w-md p-8 bg-theme-card/60 backdrop-blur-2xl rounded-3xl shadow-theme-card border border-theme-border/50 transform transition-all duration-500 relative overflow-hidden">
          {/* Subtle Decorative Background Element */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-theme-accent opacity-10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-theme-text">
              Create New User
            </h2>
            <p className="text-theme-muted mt-2 font-medium text-sm">
              Provision system access and assign roles.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-semibold text-sm flex items-center gap-2">
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl font-semibold text-sm flex items-center gap-2">
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {message}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5 relative z-10">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-theme-muted ml-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                required
                placeholder="Enter username"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-bold text-theme-muted ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                required
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-bold text-theme-muted ml-1">
                Role Assignment
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all cursor-pointer"
              >
                <option value="qa_user">QA User</option>
                <option value="admin">System Administrator</option>
                <option value="manufacturing_user">Manufacturing User</option>
                <option value="qc_user">QC Analyst</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-4 text-white bg-theme-primary rounded-2xl hover:bg-theme-primaryHover transition-all font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              Provision Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
