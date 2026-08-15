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

  // Basic form state for the MVP
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
      }
    } catch (error) {
      alert("Failed to add equipment");
    }
  };

  // Helper function to color-code the dates
  const getCalibrationStatusUI = (nextCalDateString: string) => {
    const nextCalDate = new Date(nextCalDateString);
    const today = new Date();

    // Calculate difference in days
    const diffTime = nextCalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 font-bold rounded-full text-xs">
          Overdue
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded-full text-xs">
          Due Soon ({diffDays}d)
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 font-bold rounded-full text-xs">
          Compliant
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Calibration Management
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-medium shadow-sm"
          >
            {showForm ? "Cancel" : "+ Add Equipment"}
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            {message}
          </div>
        )}

        {/* Inline Form to Add Equipment */}
        {showForm && (
          <form
            onSubmit={handleAddEquipment}
            className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-2 gap-4"
          >
            <input
              required
              type="text"
              placeholder="Equipment Name (e.g., pH Meter)"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="px-3 py-2 border rounded-md"
            />
            <input
              required
              type="text"
              placeholder="Serial Number"
              value={formData.serial_number}
              onChange={(e) =>
                setFormData({ ...formData, serial_number: e.target.value })
              }
              className="px-3 py-2 border rounded-md"
            />
            <input
              required
              type="text"
              placeholder="Location (e.g., Cleanroom 2)"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="px-3 py-2 border rounded-md"
            />
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
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
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
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
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <button
              type="submit"
              className="col-span-2 bg-purple-600 text-white py-2 rounded-md font-bold mt-2"
            >
              Save Equipment
            </button>
          </form>
        )}

        {/* Equipment Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Equipment Name
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  S/N
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Last Cal
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Next Cal
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipmentList.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {eq.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {eq.serial_number}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{eq.location}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {eq.last_calibration_date}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">
                    {eq.next_calibration_date}
                  </td>
                  <td className="px-6 py-4">
                    {getCalibrationStatusUI(eq.next_calibration_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
