"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  lot_number: string;
  quantity: number;
  unit: string;
  expiration_date: string;
  status: string;
}

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "Reagent",
    lot_number: "",
    quantity: "",
    unit: "",
    expiration_date: "",
    status: "Released",
  });

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Authentication error: Please log in again.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/inventory`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (response.ok) {
        setInventory(data);
      } else {
        setMessage(data.error || "Failed to load inventory");
      }
    } catch (error) {
      setMessage("Network error");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/inventory`,
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
          category: "Reagent",
          lot_number: "",
          quantity: "",
          unit: "",
          expiration_date: "",
          status: "Released",
        });
        fetchInventory();
        setMessage("Inventory logged successfully!");
      } else {
        alert("Failed to add inventory.");
      }
    } catch (error) {
      alert("Network error.");
    }
  };

  // Helper to color-code expiration dates
  const getExpirationStatusUI = (expDateString: string) => {
    const expDate = new Date(expDateString);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 font-bold rounded-full text-xs">
          Expired
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 font-bold rounded-full text-xs">
          Exp. Soon ({diffDays}d)
        </span>
      );
    } else {
      return <span className="text-gray-700">{expDateString}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Insert your custom Navbar here */}
      <Navbar />

      {/* Main Content Dashboard */}
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Warehouse & Inventory
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium shadow-sm"
          >
            {showForm ? "Cancel" : "+ Receive Material"}
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            {message}
          </div>
        )}

        {/* Receive Material Form */}
        {showForm && (
          <form
            onSubmit={handleAddInventory}
            className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Item Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g., Isopropyl Alcohol"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md bg-white"
              >
                <option value="Reagent">Reagent</option>
                <option value="Consumable">Consumable</option>
                <option value="Raw Material">Raw Material</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Lot / Batch Number
              </label>
              <input
                required
                type="text"
                placeholder="e.g., L-90210"
                value={formData.lot_number}
                onChange={(e) =>
                  setFormData({ ...formData, lot_number: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Quantity
              </label>
              <input
                required
                type="number"
                min="0"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Unit of Measure
              </label>
              <input
                required
                type="text"
                placeholder="e.g., Bottles, Boxes, mL"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Expiration Date
              </label>
              <input
                required
                type="date"
                value={formData.expiration_date}
                onChange={(e) =>
                  setFormData({ ...formData, expiration_date: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="col-span-3">
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-md font-bold hover:bg-indigo-700 transition-colors"
              >
                Log Inventory to Warehouse
              </button>
            </div>
          </form>
        )}

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Lot #
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 text-gray-700 font-mono text-xs">
                    {item.lot_number}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {item.quantity}{" "}
                    <span className="text-gray-400 font-normal">
                      {item.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getExpirationStatusUI(item.expiration_date)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === "Released"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Warehouse is empty. Receive new materials to populate this
                    list.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
