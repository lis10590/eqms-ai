"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DeviationModal from "../../components/DeviationModal";
import DeviationDetailsModal from "../../components/DeviationDetailsModal";
import { formatDateTime } from "../../utils/functions";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const router = useRouter();
  const [deviations, setDeviations] = useState<any[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [selectedDeviation, setSelectedDeviation] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  const fetchDeviations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deviations`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDeviations(data);
        // Keep selected deviation in sync if modal is currently open
        if (selectedDeviation) {
          const updated = data.find((d: any) => d.id === selectedDeviation.id);
          if (updated) setSelectedDeviation(updated);
        }
      } else if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching deviations:", error);
    }
  };

  useEffect(() => {
    fetchDeviations();
  }, []);

  const handleRowClick = (deviation: any) => {
    setSelectedDeviation(deviation);
    setIsDetailsModalOpen(true);
  };

  const renderStatusBadge = (status: string) => {
    if (status === "Completed") {
      return (
        <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm bg-green-500/10 text-green-600 border-green-500/20">
          Completed
        </span>
      );
    }
    if (status === "Under Investigation") {
      return (
        <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm bg-red-500/10 text-red-500 border-red-500/20 animate-pulse">
          Under Investigation
        </span>
      );
    }
    return (
      <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm bg-amber-500/10 text-amber-600 border-amber-500/20">
        Open
      </span>
    );
  };

  return (
    <div className="min-h-screen text-theme-text transition-colors duration-500">
      <Navbar />

      <main className="max-w-7xl mx-auto mt-12 p-4 sm:p-8">
        {/* PREMIUM GLASS CONTAINER */}
        <div className="bg-theme-card/60 backdrop-blur-2xl rounded-3xl shadow-theme-card border border-theme-border/50 overflow-hidden transition-all duration-500">
          <div className="p-8 border-b border-theme-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Quality Deviations
              </h1>
              <p className="text-theme-muted mt-1 font-medium">
                Log, investigate, and resolve non-conformances.
              </p>
            </div>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="bg-theme-primary text-white px-6 py-3 rounded-2xl hover:bg-theme-primaryHover font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
            >
              + Open New Deviation
            </button>
          </div>

          {/* ========================================== */}
          {/* MOBILE CARD LAYOUT (Hidden on Desktop)     */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-8 md:hidden">
            {deviations.length === 0 ? (
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                No active deviations found.
              </div>
            ) : (
              deviations.map((dev: any, index: number) => (
                <div
                  key={dev.id || index}
                  onClick={() => handleRowClick(dev)}
                  className="bg-theme-body/30 p-5 rounded-2xl border border-theme-border/50 shadow-sm cursor-pointer hover:bg-theme-card transition-colors flex flex-col gap-4"
                >
                  {/* Top Row: ID & Status */}
                  <div className="flex justify-between items-start">
                    <span className="bg-theme-card px-2 py-1 rounded-lg border border-theme-border/50 font-mono text-xs font-bold text-theme-text shadow-sm">
                      DEV-{dev.id}
                    </span>
                    {renderStatusBadge(dev.status || "Open")}
                  </div>

                  {/* Middle Row: Category & RPN */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-extrabold text-theme-text">
                      {dev.category || dev.root_cause_category}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-theme-muted tracking-wider mb-0.5">
                        RPN
                      </span>
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${dev.rpn > 50 ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-green-500/10 text-green-600 border-green-500/20"}`}
                      >
                        {dev.rpn}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Submitter & Date */}
                  <div className="flex justify-between items-center text-sm text-theme-muted font-medium pt-4 border-t border-theme-border/30">
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {dev.submitter_id}
                    </span>
                    <span>{formatDateTime(dev.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ========================================== */}
          {/* DESKTOP TABLE LAYOUT (Hidden on Mobile)    */}
          {/* ========================================== */}
          <div className="hidden md:block overflow-x-auto p-4 sm:p-8">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-theme-border/50 text-theme-muted">
                  <th className="pb-4 font-bold uppercase tracking-wider pl-4 whitespace-nowrap">
                    ID
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    Submitter
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    Category
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    RPN
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
                {deviations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-theme-muted font-medium"
                    >
                      No active deviations found. Facility is fully compliant.
                    </td>
                  </tr>
                ) : (
                  deviations.map((dev: any, index: number) => (
                    <tr
                      key={dev.id || index}
                      className="hover:bg-theme-body/50 transition-colors cursor-pointer group"
                      onClick={() => handleRowClick(dev)}
                    >
                      <td className="py-5 pl-4 whitespace-nowrap">
                        <span className="bg-theme-body px-2 py-1 rounded-lg border border-theme-border/50 font-mono text-xs font-bold text-theme-text shadow-sm group-hover:bg-theme-card transition-colors">
                          DEV-{dev.id}
                        </span>
                      </td>
                      <td className="py-5 font-medium text-theme-text whitespace-nowrap pr-4">
                        {dev.submitter_id}
                      </td>
                      <td className="py-5 text-theme-muted font-medium whitespace-nowrap pr-4">
                        {dev.category || dev.root_cause_category}
                      </td>
                      <td className="py-5 whitespace-nowrap pr-4">
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${dev.rpn > 50 ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-green-500/10 text-green-600 border-green-500/20"}`}
                        >
                          {dev.rpn}
                        </span>
                      </td>
                      <td className="py-5 whitespace-nowrap pr-4">
                        {renderStatusBadge(dev.status || "Open")}
                      </td>
                      <td className="py-5 text-theme-muted font-medium whitespace-nowrap pr-4">
                        {formatDateTime(dev.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DeviationModal
            isOpen={isNewModalOpen}
            onClose={() => setIsNewModalOpen(false)}
            onSuccess={fetchDeviations}
          />

          {selectedDeviation && (
            <DeviationDetailsModal
              isOpen={isDetailsModalOpen}
              onClose={() => setIsDetailsModalOpen(false)}
              deviation={selectedDeviation}
              onSuccess={fetchDeviations}
            />
          )}
        </div>
      </main>
    </div>
  );
}
