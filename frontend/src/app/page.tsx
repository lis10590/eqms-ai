"use client";

import { useState, useEffect } from "react";
// Import the newly created modal component
import DeviationModal from "../components/DeviationModal";

export default function Dashboard() {
  // State for the dashboard table and modal visibility
  const [deviations, setDeviations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to fetch all deviations from the backend
  const fetchDeviations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deviations`);
      if (res.ok) {
        const data = await res.json();
        setDeviations(data);
      }
    } catch (error) {
      console.error("Error fetching deviations:", error);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchDeviations();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">eQMS Dashboard</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white font-medium py-2 px-6 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Open New Deviation
          </button>
        </div>

        {/* Deviations Data Table */}
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
                    className="hover:bg-gray-50 transition-colors"
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
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${dev.rpn > 50 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                      >
                        {dev.rpn}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dev.created_at || "Just now"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Render the modal component conditionally based on state */}
        <DeviationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchDeviations} // Passes the fetch function so the modal can refresh the table
        />
      </div>
    </main>
  );
}
