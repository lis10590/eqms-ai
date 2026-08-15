"use client";
import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("default");

  // Load the saved theme when the page loads
  useEffect(() => {
    const savedTheme = localStorage.getItem("eqms-theme") || "default";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("eqms-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-theme-muted">UI Theme:</label>
      <select
        value={theme}
        onChange={(e) => changeTheme(e.target.value)}
        className="bg-theme-card text-theme-text border border-theme-border rounded-xl px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary transition-colors cursor-pointer"
      >
        <option value="default">Corporate GMP</option>
        <option value="biomed">Clinical Biotech</option>
        <option value="dark">Dark Lab</option>
      </select>
    </div>
  );
}
