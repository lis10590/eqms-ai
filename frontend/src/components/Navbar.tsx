"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Navbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-theme-card/90 backdrop-blur-md text-theme-text border-b border-theme-border shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left side: Logo & Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-theme-accent"></div>
              <span className="font-extrabold text-2xl tracking-tight text-theme-text">
                eQMS
              </span>
            </div>

            {/* Desktop Links (Hidden on Mobile) */}
            <div className="hidden lg:flex items-center gap-1">
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
              <Link
                href="/trainings"
                className="text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                Trainings
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

          {/* Right side: Theme Switcher & Logout (Desktop) */}
          <div className="hidden lg:flex items-center gap-5">
            <ThemeSwitcher />
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Logout
            </button>
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-theme-text hover:text-theme-primary focus:outline-none p-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-theme-card border-t border-theme-border absolute w-full shadow-2xl">
          <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col shadow-inner">
            <Link
              onClick={closeMenu}
              href="/deviations"
              className="block text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-3 rounded-xl text-base font-semibold transition-all"
            >
              Deviations
            </Link>
            <Link
              onClick={closeMenu}
              href="/change-controls"
              className="block text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-3 rounded-xl text-base font-semibold transition-all"
            >
              Change Controls
            </Link>
            <Link
              onClick={closeMenu}
              href="/documents"
              className="block text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-3 rounded-xl text-base font-semibold transition-all"
            >
              Documents
            </Link>
            <Link
              onClick={closeMenu}
              href="/equipment"
              className="block text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-3 rounded-xl text-base font-semibold transition-all"
            >
              Calibrations
            </Link>
            <Link
              onClick={closeMenu}
              href="/inventory"
              className="block text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-3 rounded-xl text-base font-semibold transition-all"
            >
              Inventory
            </Link>
            <Link
              onClick={closeMenu}
              href="/trainings"
              className="block text-theme-muted hover:text-theme-text hover:bg-theme-body px-4 py-3 rounded-xl text-base font-semibold transition-all"
            >
              Trainings
            </Link>

            {isAdmin && (
              <Link
                onClick={closeMenu}
                href="/register"
                className="block text-theme-accent hover:text-theme-primary hover:bg-theme-body px-4 py-3 rounded-xl text-base font-bold transition-all"
              >
                + Register Users
              </Link>
            )}

            <div className="h-px bg-theme-border/50 my-4"></div>

            <div className="px-4 py-2">
              <ThemeSwitcher />
            </div>
            <div className="px-4 pt-2">
              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl text-base font-bold shadow-md transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
