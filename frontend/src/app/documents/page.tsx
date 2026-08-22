"use client";
import { useState, useEffect } from "react";
import UploadSopModal from "../../components/UploadSopModal";
import SopChatModal from "@/components/SopChatModal"; // NEW: Import the Chat Modal
import Navbar from "@/components/Navbar";

interface DocumentVersion {
  version_id: number;
  document_number: string;
  title: string;
  version: string;
  status: string;
  uploaded_at: string;
  reviewer: string;
}

type TabState = "active" | "my_uploads" | "my_reviews";

export default function DocumentDashboard() {
  const [activeTab, setActiveTab] = useState<TabState>("active");
  const [documents, setDocuments] = useState<DocumentVersion[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- NEW: Chat Modal States ---
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedSopId, setSelectedSopId] = useState<number | null>(null);
  const [selectedSopTitle, setSelectedSopTitle] = useState("");

  const fetchDocuments = async (viewType: string) => {
    try {
      const token = localStorage.getItem("token");

      if (!token || token === "null" || token === "undefined") {
        setMessage("Authentication error: Please log in again.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents?view=${viewType}`,
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
    fetchDocuments(activeTab);
  }, [activeTab]);

  const handleViewPdf = async (versionId: number) => {
    try {
      const token = localStorage.getItem("token");

      if (!token || token === "null" || token === "undefined") {
        alert("Authentication error: Please log in again to view documents.");
        return;
      }

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
      const token = localStorage.getItem("token");

      if (!token || token === "null" || token === "undefined") {
        alert(
          "Authentication error: Please log in again to approve documents.",
        );
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/approve_document/${versionId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        setMessage("Document successfully authorized!");
        fetchDocuments(activeTab);
        setTimeout(() => setMessage(""), 4000);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to approve document");
      }
    } catch (error) {
      alert("Failed to approve document due to a network error");
    }
  };

  // --- NEW: Function to open the chat ---
  const handleOpenChat = (id: number, title: string) => {
    setSelectedSopId(id);
    setSelectedSopTitle(title);
    setIsChatModalOpen(true);
  };

  return (
    <div className="min-h-screen text-theme-text transition-colors duration-500">
      <Navbar />

      <div className="max-w-7xl mx-auto mt-12 p-4 sm:p-8">
        {/* PREMIUM GLASS CONTAINER */}
        <div className="bg-theme-card/60 backdrop-blur-2xl rounded-3xl shadow-theme-card border border-theme-border/50 overflow-hidden transition-all duration-500">
          <div className="p-8 border-b border-theme-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Document Control Center
              </h1>
              <p className="text-theme-muted mt-1 font-medium">
                Manage and review Standard Operating Procedures.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-theme-primary text-white px-6 py-3 rounded-2xl hover:bg-theme-primaryHover font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
            >
              + Upload New SOP
            </button>
          </div>

          {message && (
            <div className="mx-8 mt-6 p-4 bg-theme-accent/10 text-theme-accent border border-theme-accent/20 rounded-2xl font-semibold flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></div>
              {message}
            </div>
          )}

          <div className="px-8 pt-6">
            {/* Premium Pill Tabs */}
            <div className="flex space-x-2 bg-theme-body/50 p-1.5 rounded-2xl w-max border border-theme-border/50 shadow-inner">
              <button
                onClick={() => setActiveTab("active")}
                className={`py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === "active"
                    ? "bg-theme-card shadow-sm text-theme-text"
                    : "text-theme-muted hover:text-theme-text"
                }`}
              >
                Active SOPs
              </button>
              <button
                onClick={() => setActiveTab("my_uploads")}
                className={`py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === "my_uploads"
                    ? "bg-theme-card shadow-sm text-theme-text"
                    : "text-theme-muted hover:text-theme-text"
                }`}
              >
                My Uploads
              </button>
              <button
                onClick={() => setActiveTab("my_reviews")}
                className={`py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === "my_reviews"
                    ? "bg-theme-card shadow-sm text-theme-text"
                    : "text-theme-muted hover:text-theme-text"
                }`}
              >
                For My Review
              </button>
            </div>
          </div>

          {/* Redesigned Minimalist Table */}
          <div className="overflow-x-auto p-4 sm:p-8">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-theme-border/50 text-theme-muted">
                  <th className="pb-4 font-bold uppercase tracking-wider pl-4">
                    Document No.
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Title
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Version
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider text-right pr-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {documents.length === 0 ? (
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        No documents found in this queue.
                      </div>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr
                      key={doc.version_id}
                      className="hover:bg-theme-body/50 transition-colors group"
                    >
                      <td className="py-5 pl-4 font-bold text-theme-text">
                        {doc.document_number}
                      </td>
                      <td className="py-5 text-theme-text font-medium">
                        {doc.title}
                      </td>
                      <td className="py-5">
                        <span className="bg-theme-body px-2 py-1 rounded-lg border border-theme-border/50 font-mono text-xs text-theme-text shadow-sm">
                          v{doc.version}
                        </span>
                      </td>
                      <td className="py-5">
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${
                            doc.status === "Authorized"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-5 text-theme-muted font-medium">
                        {doc.reviewer}
                      </td>

                      <td className="py-5 text-right space-x-4 pr-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewPdf(doc.version_id)}
                          className="text-theme-accent hover:text-theme-primary font-bold transition-colors"
                        >
                          View PDF
                        </button>

                        {/* NEW: ASK AI BUTTON IS INJECTED HERE */}
                        <button
                          onClick={() =>
                            handleOpenChat(doc.version_id, doc.title)
                          }
                          className="text-theme-accent hover:text-theme-primary font-bold transition-colors inline-flex items-center gap-1"
                        >
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
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                          Ask AI
                        </button>

                        {activeTab === "my_reviews" && (
                          <button
                            onClick={() => handleApprove(doc.version_id)}
                            className="text-green-600 hover:text-green-500 font-bold transition-colors"
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

        <UploadSopModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            setMessage("New SOP uploaded successfully!");
            fetchDocuments(activeTab);
            setTimeout(() => setMessage(""), 4000);
          }}
        />

        {/* NEW: THE CHAT MODAL RENDERER */}
        {selectedSopId && (
          <SopChatModal
            isOpen={isChatModalOpen}
            onClose={() => setIsChatModalOpen(false)}
            sopId={selectedSopId}
            sopTitle={selectedSopTitle}
          />
        )}
      </div>
    </div>
  );
}
