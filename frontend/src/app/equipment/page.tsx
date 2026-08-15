"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

interface Equipment {
  id: number;
  name: string;
  serial_number: string;
  location: string;
  last_calibration_date: string;
  next_calibration_date: string;
  status: string;
}

export default function CalibrationDashboard() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [message, setMessage] = useState<string>("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    serial_number: "",
    location: "",
    last_calibration_date: "",
    next_calibration_date: "",
  });

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Authentication error: Please log in again.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/equipment`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (response.ok) {
        setEquipmentList(data);
      } else {
        setMessage(data.error || "Failed to load equipment list");
      }
    } catch (error) {
      setMessage("Network error");
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/equipment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (response.ok) {
        setShowForm(false);
        setFormData({
          name: "",
          serial_number: "",
          location: "",
          last_calibration_date: "",
          next_calibration_date: "",
        });
        fetchEquipment();
        setMessage("Equipment added successfully!");
        setTimeout(() => setMessage(""), 4000);
      }
    } catch (error) {
      alert("Failed to add equipment");
    }
  };

  // Upgraded Premium Status Badges
  const getCalibrationStatusUI = (nextCalDateString: string) => {
    const nextCalDate = new Date(nextCalDateString);
    const today = new Date();

    const diffTime = nextCalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-full text-xs shadow-sm">
          Overdue
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold rounded-full text-xs shadow-sm">
          Due Soon ({diffDays}d)
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 font-bold rounded-full text-xs shadow-sm">
          Compliant
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen text-theme-text transition-colors duration-500">
      <Navbar />

      <div className="max-w-7xl mx-auto mt-12 p-4 sm:p-8">
        {/* PREMIUM GLASS CONTAINER */}
        <div className="bg-theme-card/60 backdrop-blur-2xl rounded-3xl shadow-theme-card border border-theme-border/50 overflow-hidden transition-all duration-500">
          {/* Header Section */}
          <div className="p-8 border-b border-theme-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Calibration Management
              </h1>
              <p className="text-theme-muted mt-1 font-medium">
                Track and maintain laboratory instrument compliance.
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-theme-primary text-white px-6 py-3 rounded-2xl hover:bg-theme-primaryHover font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
            >
              {showForm ? "Cancel Entry" : "+ Add Equipment"}
            </button>
          </div>

          {message && (
            <div className="mx-8 mt-6 p-4 bg-theme-accent/10 text-theme-accent border border-theme-accent/20 rounded-2xl font-semibold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></div>
              {message}
            </div>
          )}

          {/* Elegant Form Component */}
          {showForm && (
            <form
              onSubmit={handleAddEquipment}
              className="m-8 p-6 bg-theme-body/50 border border-theme-border rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-6 transition-all"
            >
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Equipment Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., pH Meter"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none transition-all shadow-sm text-theme-text"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Serial Number
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., SN-102938"
                  value={formData.serial_number}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_number: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none transition-all shadow-sm text-theme-text"
                />
              </div>

              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Location
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Cleanroom 2"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none transition-all shadow-sm text-theme-text"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Last Calibration Date
                </label>
                <input
                  required
                  type="date"
                  value={formData.last_calibration_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      last_calibration_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none transition-all shadow-sm text-theme-text"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Next Calibration Due
                </label>
                <input
                  required
                  type="date"
                  value={formData.next_calibration_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      next_calibration_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none transition-all shadow-sm text-theme-text"
                />
              </div>

              <div className="col-span-1 md:col-span-2 mt-2">
                <button
                  type="submit"
                  className="w-full bg-theme-primary text-white py-4 rounded-2xl font-bold hover:bg-theme-primaryHover shadow-md transition-all flex justify-center items-center gap-2"
                >
                  <span>Save Equipment</span>
                </button>
              </div>
            </form>
          )}

          {/* Redesigned Minimalist Table */}
          <div className="overflow-x-auto p-4 sm:p-8">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-theme-border/50 text-theme-muted">
                  <th className="pb-4 font-bold uppercase tracking-wider pl-4">
                    Equipment Name
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    S/N
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Location
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Last Cal
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Next Cal
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {equipmentList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-theme-muted font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <svg
                          className="w-12 h-12 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                          />
                        </svg>
                        No equipment registered yet.
                      </div>
                    </td>
                  </tr>
                ) : (
                  equipmentList.map((eq) => (
                    <tr
                      key={eq.id}
                      className="hover:bg-theme-body/50 transition-colors group"
                    >
                      <td className="py-5 pl-4 font-bold text-theme-text">
                        {eq.name}
                      </td>
                      <td className="py-5">
                        <span className="bg-theme-body px-2 py-1 rounded-lg border border-theme-border/50 font-mono text-xs text-theme-text shadow-sm">
                          {eq.serial_number}
                        </span>
                      </td>
                      <td className="py-5 text-theme-muted font-medium">
                        {eq.location}
                      </td>
                      <td className="py-5 text-theme-muted">
                        {eq.last_calibration_date}
                      </td>
                      <td className="py-5 text-theme-text font-bold">
                        {eq.next_calibration_date}
                      </td>
                      <td className="py-5">
                        {getCalibrationStatusUI(eq.next_calibration_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
