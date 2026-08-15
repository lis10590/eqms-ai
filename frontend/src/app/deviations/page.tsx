"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DeviationModal from "../../components/DeviationModal";
import DeviationDetailsModal from "../../components/DeviationDetailsModal";
import { formatDateTime } from "../../utils/functions";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const router = useRouter(); // Initialize the router
  const [deviations, setDeviations] = useState<any[]>([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New state for viewing/editing
  const [selectedDeviation, setSelectedDeviation] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // 1. Protect the route
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/"); // Redirect to login if no token is found
    }
  }, [router]);

  // 2. Add the Authorization header to your fetch request
  const fetchDeviations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deviations`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach the JWT
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDeviations(data);
      } else if (res.status === 401) {
        // If the token is expired or invalid, clear it and redirect to login
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

  // Handler for clicking a row
  const handleRowClick = (deviation: any) => {
    setSelectedDeviation(deviation);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold text-gray-900">eQMS Dashboard</h1>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="bg-blue-600 text-white font-medium py-2 px-6 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              + Open New Deviation
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RPN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deviations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No deviations found. Click the button above to create one.
                    </td>
                  </tr>
                ) : (
                  deviations.map((dev: any, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(dev)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {dev.id || `DEV-${index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dev.submitter_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dev.category || dev.root_cause_category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            dev.rpn > 50
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {dev.rpn}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(dev.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Existing Modal for New Deviations */}
          <DeviationModal
            isOpen={isNewModalOpen}
            onClose={() => setIsNewModalOpen(false)}
            onSuccess={fetchDeviations}
          />

          {/* New Modal for Viewing/Editing */}
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
