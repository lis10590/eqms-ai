"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface DeviationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviation: any;
  onSuccess: () => void;
}

export default function DeviationDetailsModal({
  isOpen,
  onClose,
  deviation,
  onSuccess,
}: DeviationDetailsModalProps) {
  const router = useRouter();

  // Tab & Core State
  const [activeTab, setActiveTab] = useState<"overview" | "investigation">(
    "overview",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingStatus, setIsProcessingStatus] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false); // NEW: AI Loading State

  // Edit Form State
  const [editData, setEditData] = useState({
    submitter_id: "",
    deviation_text: "",
  });

  // Investigation Form State
  const [rootCause, setRootCause] = useState("");
  const [capa, setCapa] = useState("");

  useEffect(() => {
    if (deviation) {
      setEditData({
        submitter_id: deviation.submitter_id || "",
        deviation_text: deviation.deviation_text || "",
      });
      setRootCause(deviation.root_cause || "");
      setCapa(deviation.capa || "");
      setIsEditing(false);
      setActiveTab("overview");
    }
  }, [deviation, isOpen]);

  if (!isOpen || !deviation) return null;

  const currentStatus = deviation.status || "Open";

  // --- API: Update Deviation Text/Submitter ---
  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deviations/${deviation.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editData),
        },
      );

      if (response.ok) {
        setIsEditing(false);
        onSuccess();
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/");
      } else {
        console.error("Failed to update deviation");
      }
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- API: Change Status (Close or Investigate) ---
  const handleStatusChange = async (endpoint: string, method: string) => {
    setIsProcessingStatus(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deviations/${deviation.id}/${endpoint}`,
        {
          method: method,
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        onSuccess();
        if (endpoint === "investigate") {
          setActiveTab("investigation");
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.error(`Failed to ${endpoint} deviation:`, error);
    } finally {
      setIsProcessingStatus(false);
    }
  };

  // --- API: Save Investigation Data ---
  const handleSaveInvestigation = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deviations/${deviation.id}/investigation`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            root_cause: rootCause,
            capa: capa,
          }),
        },
      );

      if (response.ok) {
        onSuccess();
        alert("Investigation data securely saved!");
      } else {
        const data = await response.json();
        console.error("Failed to save investigation:", data.error);
        alert(data.error || "Failed to save investigation data.");
      }
    } catch (error) {
      console.error("Error saving investigation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- API: Auto-Generate AI Investigation ---
  const handleAIGenerateInvestigation = async () => {
    setIsGeneratingAI(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deviations/${deviation.id}/ai_investigate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (response.ok) {
        setRootCause(data.root_cause);
        setCapa(data.capa);
      } else {
        alert(data.error || "Failed to generate AI investigation.");
      }
    } catch (error) {
      console.error("AI Investigation error:", error);
      alert("Network error during AI investigation.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
      {/* Floating Glass Container */}
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col transform transition-all duration-300">
        {/* Header (Responsive) */}
        <div className="bg-theme-body/50 border-b border-theme-border/50 px-4 sm:px-8 py-4 sm:py-6 flex justify-between items-start shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-theme-text tracking-tight flex items-center">
                Deviation Details
              </h2>
              {deviation.id && (
                <span className="text-theme-muted font-medium text-base sm:text-lg">
                  (#{deviation.id})
                </span>
              )}
            </div>
            <div>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm inline-block ${
                  currentStatus === "Completed"
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : currentStatus === "Under Investigation"
                      ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                }`}
              >
                {currentStatus}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-end sm:items-center gap-3 shrink-0 ml-2">
            {!isEditing &&
              activeTab === "overview" &&
              currentStatus !== "Completed" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs sm:text-sm bg-theme-primary/10 text-theme-primary px-3 sm:px-4 py-2 rounded-xl hover:bg-theme-primary/20 font-bold transition-colors shadow-sm whitespace-nowrap"
                >
                  Edit Details
                </button>
              )}
            <button
              onClick={onClose}
              className="text-theme-muted hover:text-theme-text bg-theme-card rounded-full p-2 border border-theme-border/50 shadow-sm transition-colors focus:outline-none"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Pill Tabs (Responsive Scrolling) */}
        <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-2 shrink-0 border-b border-theme-border/30 overflow-x-auto">
          <div className="flex space-x-2 bg-theme-body/50 p-1.5 rounded-2xl w-max border border-theme-border/50 shadow-inner">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                activeTab === "overview"
                  ? "bg-theme-card shadow-sm text-theme-text"
                  : "text-theme-muted hover:text-theme-text"
              }`}
            >
              Event Overview
            </button>
            <button
              onClick={() => setActiveTab("investigation")}
              className={`py-2 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 ${
                activeTab === "investigation"
                  ? "bg-theme-card shadow-sm text-theme-text"
                  : "text-theme-muted hover:text-theme-text"
              }`}
            >
              Investigation Module
              {currentStatus === "Under Investigation" && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              )}
            </button>
          </div>
        </div>

        {/* Body - Scrollable (Responsive Padding) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1">
          {/* ========================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================== */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fadeIn">
              {/* AI Assessment Readout */}
              <div className="bg-theme-accent/5 p-6 rounded-3xl border border-theme-accent/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg
                    className="w-24 h-24 text-theme-accent"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>

                <h3 className="font-extrabold text-theme-accent text-lg flex items-center gap-2 mb-4 relative z-10">
                  <div className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></div>
                  AI Triage Results
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm relative z-10">
                  <div className="bg-theme-card/80 backdrop-blur-sm p-4 rounded-2xl border border-theme-border/50 shadow-sm">
                    <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-1">
                      Category
                    </span>
                    <span className="text-theme-text font-medium text-base">
                      {deviation.category || deviation.root_cause_category}
                    </span>
                  </div>
                  <div className="bg-theme-card/80 backdrop-blur-sm p-4 rounded-2xl border border-theme-border/50 shadow-sm">
                    <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-1">
                      Risk Priority Number
                    </span>
                    <span
                      className={`font-extrabold text-lg ${
                        (deviation.rpn ?? 0) > 50
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {deviation.rpn}
                    </span>
                  </div>
                  <div className="col-span-1 md:col-span-2 bg-theme-card/80 backdrop-blur-sm p-4 rounded-2xl border border-theme-border/50 shadow-sm">
                    <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-1">
                      Required Action
                    </span>
                    <span className="text-theme-text font-medium text-base">
                      {deviation.required_action}
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Data: Toggle between View and Edit Modes */}
              {isEditing ? (
                <form
                  id="edit-form"
                  onSubmit={handleUpdate}
                  className="space-y-5 bg-theme-body/30 p-6 rounded-3xl border border-theme-border/50"
                >
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Submitter ID
                    </label>
                    <input
                      type="text"
                      required
                      value={editData.submitter_id}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          submitter_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Deviation Text
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={editData.deviation_text}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          deviation_text: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text resize-none transition-all"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border border-theme-border rounded-2xl text-sm font-bold text-theme-text hover:bg-theme-card transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-theme-primary text-white px-6 py-3 rounded-2xl hover:bg-theme-primaryHover disabled:opacity-50 font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 px-2">
                  <div>
                    <span className="block text-sm font-bold text-theme-muted mb-1 uppercase tracking-wide">
                      Submitter ID
                    </span>
                    <p className="text-theme-text font-medium text-lg">
                      {deviation.submitter_id}
                    </p>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-theme-muted mb-2 uppercase tracking-wide">
                      Deviation Text
                    </span>
                    <p className="text-theme-text bg-theme-body/50 p-5 rounded-2xl border border-theme-border/50 whitespace-pre-wrap leading-relaxed shadow-inner">
                      {deviation.deviation_text}
                    </p>
                  </div>
                  {deviation.qa_narrative && (
                    <div>
                      <span className="block text-sm font-bold text-theme-muted mb-2 uppercase tracking-wide">
                        QA Narrative
                      </span>
                      <p className="text-theme-text bg-theme-body/50 p-5 rounded-2xl border border-theme-border/50 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {deviation.qa_narrative}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons for Overview Tab */}
              {!isEditing && currentStatus !== "Completed" && (
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-theme-border/50">
                  <button
                    onClick={() => handleStatusChange("close", "PUT")}
                    disabled={isProcessingStatus}
                    className="px-6 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 shadow-md transition-all disabled:opacity-50"
                  >
                    {isProcessingStatus ? "Processing..." : "Mark as Completed"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: INVESTIGATION */}
          {/* ========================================== */}
          {activeTab === "investigation" && (
            <div className="space-y-6 h-full flex flex-col animate-fadeIn">
              {/* State A: Investigation Not Started */}
              {currentStatus !== "Under Investigation" &&
                currentStatus !== "Completed" && (
                  <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-sm">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-theme-text">
                      No Active Investigation
                    </h3>
                    <p className="text-theme-muted mt-2 max-w-md">
                      This deviation has not been escalated to a formal
                      investigation yet. Initiate one to begin tracking root
                      cause and CAPA.
                    </p>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to escalate this to a formal investigation?",
                          )
                        ) {
                          handleStatusChange("investigate", "POST");
                        }
                      }}
                      disabled={isProcessingStatus}
                      className="mt-6 px-6 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600 shadow-md transition-all disabled:opacity-50"
                    >
                      {isProcessingStatus
                        ? "Initiating..."
                        : "Initiate Formal Investigation"}
                    </button>
                  </div>
                )}

              {/* State B: Investigation Active or Completed */}
              {(currentStatus === "Under Investigation" ||
                currentStatus === "Completed") && (
                <div className="space-y-5">
                  {/* Investigation Header & AI Button */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-theme-body/30 p-4 rounded-2xl border border-theme-border/50">
                    <div>
                      <p
                        className={`font-bold text-sm flex items-center gap-2 ${currentStatus === "Completed" ? "text-green-500" : "text-red-500"}`}
                      >
                        {currentStatus === "Completed" ? (
                          <>Investigation Closed and Locked</>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Formal Investigation Module
                          </>
                        )}
                      </p>
                      <p className="text-xs text-theme-muted mt-0.5">
                        Execute 5 Whys Root Cause Analysis and outline CAPA
                        plans.
                      </p>
                    </div>

                    {currentStatus !== "Completed" && (
                      <button
                        type="button"
                        onClick={handleAIGenerateInvestigation}
                        disabled={isGeneratingAI}
                        className="bg-linear-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingAI ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Analyzing Event...
                          </>
                        ) : (
                          <>✨ Auto-Generate with AI</>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Root Cause Textarea */}
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Root Cause Analysis (5 Whys)
                    </label>
                    <textarea
                      rows={6}
                      value={rootCause}
                      onChange={(e) => setRootCause(e.target.value)}
                      disabled={currentStatus === "Completed"}
                      placeholder="Detail the fundamental breakdown or failure that caused this event..."
                      className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all resize-none disabled:opacity-50 text-sm leading-relaxed"
                    />
                  </div>

                  {/* CAPA Textarea */}
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Corrective & Preventive Action (CAPA)
                    </label>
                    <textarea
                      rows={6}
                      value={capa}
                      onChange={(e) => setCapa(e.target.value)}
                      disabled={currentStatus === "Completed"}
                      placeholder="Outline the steps to fix the issue and prevent recurrence..."
                      className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all resize-none disabled:opacity-50 text-sm leading-relaxed"
                    />
                  </div>

                  {currentStatus !== "Completed" && (
                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={handleSaveInvestigation}
                        disabled={isLoading}
                        className="px-6 py-3 bg-theme-primary text-white rounded-2xl text-sm font-bold hover:bg-theme-primaryHover shadow-md disabled:opacity-50 transition-all"
                      >
                        {isLoading ? "Saving..." : "Save Investigation Data"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
