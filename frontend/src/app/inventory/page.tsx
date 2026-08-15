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
        `${process.env.NEXT_PUBLIC_API_URL}/inventory`,
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
        `${process.env.NEXT_PUBLIC_API_URL}/inventory`,
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
        setMessage("Material successfully logged to warehouse.");
        setTimeout(() => setMessage(""), 4000);
      } else {
        alert("Failed to add inventory.");
      }
    } catch (error) {
      alert("Network error.");
    }
  };

  const getExpirationStatusUI = (expDateString: string) => {
    const expDate = new Date(expDateString);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-full text-xs shadow-sm whitespace-nowrap">
          Expired
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold rounded-full text-xs shadow-sm whitespace-nowrap">
          Exp. Soon ({diffDays}d)
        </span>
      );
    } else {
      return (
        <span className="text-theme-text font-medium">{expDateString}</span>
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
                Warehouse Control
              </h1>
              <p className="text-theme-muted mt-1 font-medium">
                Manage reagents, raw materials, and consumables.
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-theme-primary text-white px-6 py-3 rounded-2xl hover:bg-theme-primaryHover font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
            >
              {showForm ? "Cancel Entry" : "+ Receive Material"}
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
              onSubmit={handleAddInventory}
              className="m-8 p-6 bg-theme-body/50 border border-theme-border rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 transition-all"
            >
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
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
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                >
                  <option value="Reagent">Reagent</option>
                  <option value="Consumable">Consumable</option>
                  <option value="Raw Material">Raw Material</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
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
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
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
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
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
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Expiration Date
                </label>
                <input
                  required
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiration_date: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                />
              </div>

              <div className="col-span-1 md:col-span-3 mt-2">
                <button
                  type="submit"
                  className="w-full bg-theme-primary text-white py-4 rounded-2xl font-bold hover:bg-theme-primaryHover shadow-md transition-all flex justify-center items-center gap-2"
                >
                  Log Inventory to Warehouse
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
                    Item Name
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Category
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Lot #
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Expiration
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {inventory.length === 0 ? (
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
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        Warehouse is completely empty. Add materials to begin
                        tracking.
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-theme-body/50 transition-colors group"
                    >
                      <td className="py-5 pl-4 font-bold text-theme-text">
                        {item.name}
                      </td>
                      <td className="py-5 text-theme-muted font-medium">
                        {item.category}
                      </td>
                      <td className="py-5">
                        <span className="bg-theme-body px-2 py-1 rounded-lg border border-theme-border/50 font-mono text-xs text-theme-text shadow-sm">
                          {item.lot_number}
                        </span>
                      </td>
                      <td className="py-5 font-bold text-lg text-theme-text">
                        {item.quantity}{" "}
                        <span className="text-theme-muted font-medium text-sm">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-5">
                        {getExpirationStatusUI(item.expiration_date)}
                      </td>
                      <td className="py-5">
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${
                            item.status === "Released"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}
                        >
                          {item.status}
                        </span>
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
