"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Navbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
      setIsAdmin(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  return (
    // Notice the subtle blur effect and sticky positioning for a modern feel
    <nav className="sticky top-0 z-50 bg-theme-card/90 backdrop-blur-md text-theme-text border-b border-theme-border shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left side: Logo & Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              {/* Added a modern accent dot next to the logo */}
              <div className="w-3 h-3 rounded-full bg-theme-accent"></div>
              <span className="font-extrabold text-2xl tracking-tight text-theme-text">
                eQMS
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/deviations"
                className="text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Deviations
              </Link>
              <Link
                href="/change-controls"
                className="text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Change Controls
              </Link>
              <Link
                href="/documents"
                className="text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Documents
              </Link>
              <Link
                href="/equipment"
                className="text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Calibrations
              </Link>
              <Link
                href="/inventory"
                className="text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Inventory
              </Link>

              {isAdmin && (
                <Link
                  href="/register"
                  className="text-theme-accent hover:text-theme-primary hover:bg-theme-body px-4 py-2 rounded-xl text-sm font-bold transition-all ml-2"
                >
                  + Register Users
                </Link>
              )}
            </div>
          </div>

          {/* Right side: Theme Switcher & Logout */}
          <div className="flex items-center gap-5">
            <ThemeSwitcher />

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
