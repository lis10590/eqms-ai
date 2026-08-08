"use client";

import { useState, useEffect } from "react";

// 1. Define your TypeScript Interfaces
interface DocumentVersion {
  version_id: number;
  document_number: string;
  title: string;
  version: string;
  status: string;
  uploaded_at: string;
}

type TabState = "active" | "pending";

export default function DocumentDashboard() {
  // 2. Apply strict types to your state
  const [activeTab, setActiveTab] = useState<TabState>("active");
  const [documents, setDocuments] = useState<DocumentVersion[]>([]);
  const [message, setMessage] = useState<string>("");

  const fetchDocuments = async (status: string) => {
    try {
      const token = localStorage.getItem("token");

      // 🚨 GUARD CLAUSE: Stop the request if there is no token
      if (!token) {
        setMessage("Authentication error: Please log in again.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents?status=${status}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setDocuments(data);
      } else {
        setMessage(data.error || "Failed to load documents");
      }
    } catch (error) {
      setMessage("Network error while fetching documents");
    }
  };

  useEffect(() => {
    const statusQuery = activeTab === "active" ? "Authorized" : "Draft";
    fetchDocuments(statusQuery);
  }, [activeTab]);

  const handleViewPdf = async (versionId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/view_document/${versionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (response.ok) {
        window.open(data.url, "_blank");
      } else {
        alert(data.error || "Failed to open document");
      }
    } catch (error) {
      alert("Network error");
    }
  };

  const handleApprove = async (versionId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/approve_document/${versionId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        setMessage("Document successfully authorized!");
        fetchDocuments("Draft");
      }
    } catch (error) {
      alert("Failed to approve document");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Document Control Center
        </h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium shadow-sm">
          + Upload New SOP
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`py-2 px-6 font-medium text-sm ${
            activeTab === "active"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Active SOPs
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`py-2 px-6 font-medium text-sm ${
            activeTab === "pending"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending Reviews
        </button>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Document No.
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No documents found in this category.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.version_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {doc.document_number}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{doc.title}</td>
                  <td className="px-6 py-4 text-gray-700">{doc.version}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        doc.status === "Authorized"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => handleViewPdf(doc.version_id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View PDF
                    </button>

                    {activeTab === "pending" && (
                      <button
                        onClick={() => handleApprove(doc.version_id)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
