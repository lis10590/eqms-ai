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

          <div className="overflow-x-auto p-4 sm:p-8">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-theme-border/50 text-theme-muted">
                  <th className="pb-4 font-bold uppercase tracking-wider pl-4">
                    ID
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Submitter
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Category
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    RPN
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {deviations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        No active deviations found. Facility is fully compliant.
                      </div>
                    </td>
                  </tr>
                ) : (
                  deviations.map((dev: any, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-theme-body/50 transition-colors cursor-pointer group"
                      onClick={() => handleRowClick(dev)}
                    >
                      <td className="py-5 pl-4">
                        <span className="bg-theme-body px-2 py-1 rounded-lg border border-theme-border/50 font-mono text-xs font-bold text-theme-text shadow-sm group-hover:bg-theme-card transition-colors">
                          {dev.id || `DEV-${index + 1}`}
                        </span>
                      </td>
                      <td className="py-5 font-medium text-theme-text">
                        {dev.submitter_id}
                      </td>
                      <td className="py-5 text-theme-muted font-medium">
                        {dev.category || dev.root_cause_category}
                      </td>
                      <td className="py-5">
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${
                            dev.rpn > 50
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : "bg-green-500/10 text-green-600 border-green-500/20"
                          }`}
                        >
                          {dev.rpn}
                        </span>
                      </td>
                      <td className="py-5 text-theme-muted font-medium">
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
