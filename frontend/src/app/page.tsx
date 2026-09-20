"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(false); // Added state for the cold start
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setIsTakingLong(false); // Reset just in case of multiple attempts

    // Start the 3-second countdown
    const timer = setTimeout(() => {
      setIsTakingLong(true);
    }, 3000);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      // The moment the server answers, cancel the timer
      clearTimeout(timer);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);

      router.push("/deviations");
    } catch (err: any) {
      // Cancel the timer if the request completely fails
      clearTimeout(timer);
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 text-theme-text transition-colors duration-500 relative overflow-hidden">
      {/* Subtle Background Glow Effect */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-theme-accent opacity-20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-theme-primary opacity-10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>

      {/* PREMIUM GLASS CONTAINER */}
      <div className="w-full max-w-md p-8 sm:p-10 bg-theme-card/70 backdrop-blur-2xl rounded-3xl shadow-theme-card border border-theme-border/50 transform transition-all duration-500 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-theme-primary/10 text-theme-primary mb-6 shadow-sm border border-theme-primary/20">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-theme-text">
            eQMS Login
          </h2>
          <p className="text-theme-muted mt-2 font-medium text-sm uppercase tracking-wider">
            Secure Authentication Gateway
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-semibold text-sm flex items-center gap-3">
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

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-theme-muted ml-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
              required
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-theme-muted ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
              required
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-8 py-4 text-white bg-theme-primary rounded-2xl hover:bg-theme-primaryHover transition-all font-bold text-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
            {!isLoading && (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            )}
          </button>

          {/* New Cold Start Message */}
          {isTakingLong && (
            <div className="mt-4 text-center animate-pulse">
              <p className="text-sm font-semibold text-theme-muted">
                Waking up the secure cloud server...
              </p>
              <p className="text-xs text-theme-muted/70 mt-1">
                This may take up to 30 seconds on the free tier.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
