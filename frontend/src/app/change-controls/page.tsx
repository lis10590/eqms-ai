"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ChangeControlModal from "@/components/ChangeControlModal";
import ChangeControlDetailsModal from "@/components/ChangeControlDetailsModal";

export default function ChangeControlsPage() {
  const [changeControls, setChangeControls] = useState([]);
  const [error, setError] = useState("");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<any | null>(null);

  const fetchChangeControls = async () => {
    const token = localStorage.getItem("token");

    if (!token || token === "null") {
      setError("You are not logged in. Please return to the login screen.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/change_controls`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch Change Controls");

      const data = await response.json();
      setChangeControls(data);

      if (selectedChange) {
        const updated = data.find((cc: any) => cc.id === selectedChange.id);
        if (updated) setSelectedChange(updated);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchChangeControls();
  }, []);

  const handleRowClick = (cc: any) => {
    setSelectedChange(cc);
    setIsDetailsModalOpen(true);
  };

  const renderClassificationBadge = (classification: string) => {
    return (
      <span
        className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${
          classification === "Critical"
            ? "bg-red-500/10 text-red-500 border-red-500/20"
            : classification === "Major"
              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
              : "bg-green-500/10 text-green-500 border-green-500/20"
        }`}
      >
        {classification || "Unclassified"}
      </span>
    );
  };

  return (
    <div className="min-h-screen text-theme-text transition-colors duration-500">
      <Navbar />

      <main className="max-w-7xl mx-auto mt-6 sm:mt-12 p-4 sm:p-8">
        <div className="bg-theme-card/60 backdrop-blur-2xl rounded-3xl shadow-theme-card border border-theme-border/50 overflow-hidden transition-all duration-500">
          {/* Header Section */}
          <div className="p-6 sm:p-8 border-b border-theme-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Change Controls
              </h1>
              <p className="text-theme-muted mt-1 text-sm sm:text-base font-medium">
                Track, assess, and approve facility and process changes.
              </p>
            </div>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="w-full md:w-auto bg-theme-primary text-white px-6 py-3 rounded-2xl hover:bg-theme-primaryHover font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              + Initiate Change
            </button>
          </div>

          {error && (
            <div className="mx-4 sm:mx-8 mt-6 p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-semibold flex items-center gap-3 text-sm">
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

          {/* ========================================== */}
          {/* MOBILE CARD VIEW (Hidden on md and larger) */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
            {changeControls.length === 0 ? (
              <div className="py-12 text-center text-theme-muted font-medium flex flex-col items-center gap-3">
                <svg
                  className="w-10 h-10 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
                No Change Controls found. Initiate a new change to begin.
              </div>
            ) : (
              changeControls.map((cc: any) => (
                <div
                  key={cc.id}
                  onClick={() => handleRowClick(cc)}
                  className="bg-theme-body/30 p-5 rounded-2xl border border-theme-border/50 shadow-sm cursor-pointer hover:bg-theme-card transition-colors flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="bg-theme-card px-2.5 py-1 rounded-lg border border-theme-border/50 font-mono text-xs font-bold text-theme-text shadow-sm">
                      CC-{cc.id}
                    </span>
                    {renderClassificationBadge(cc.classification)}
                  </div>

                  <h3 className="font-bold text-base text-theme-text leading-snug">
                    {cc.title}
                  </h3>

                  <div className="flex justify-between items-center text-xs text-theme-muted font-medium pt-3 border-t border-theme-border/30">
                    <span className="flex items-center gap-1.5 font-semibold text-theme-text">
                      <span className="w-2 h-2 rounded-full bg-theme-accent"></span>
                      {cc.status || "Under Review"}
                    </span>
                    <span>{cc.created_at}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ========================================== */}
          {/* DESKTOP TABLE VIEW (Hidden on small screens) */}
          {/* ========================================== */}
          <div className="hidden md:block overflow-x-auto p-4 sm:p-8">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-theme-border/50 text-theme-muted">
                  <th className="pb-4 font-bold uppercase tracking-wider pl-4 whitespace-nowrap">
                    ID
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    Title
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    Classification
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    Status
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {changeControls.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-theme-muted font-medium"
                    >
                      No Change Controls found. Initiate a new change to begin.
                    </td>
                  </tr>
                ) : (
                  changeControls.map((cc: any) => (
                    <tr
                      key={cc.id}
                      onClick={() => handleRowClick(cc)}
                      className="hover:bg-theme-body/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-5 pl-4 whitespace-nowrap">
                        <span className="bg-theme-body px-2 py-1 rounded-lg border border-theme-border/50 font-mono text-xs text-theme-text shadow-sm group-hover:bg-theme-card transition-colors">
                          CC-{cc.id}
                        </span>
                      </td>
                      <td className="py-5 font-bold text-theme-text whitespace-nowrap pr-4">
                        {cc.title}
                      </td>
                      <td className="py-5 whitespace-nowrap pr-4">
                        {renderClassificationBadge(cc.classification)}
                      </td>
                      <td className="py-5 text-theme-muted font-medium whitespace-nowrap pr-4">
                        {cc.status}
                      </td>
                      <td className="py-5 text-theme-muted whitespace-nowrap pr-4">
                        {cc.created_at}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ChangeControlModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={fetchChangeControls}
      />

      {selectedChange && (
        <ChangeControlDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          changeControl={selectedChange}
          onSuccess={fetchChangeControls}
        />
      )}
    </div>
  );
}
