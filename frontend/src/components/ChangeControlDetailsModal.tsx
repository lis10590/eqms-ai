"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ChangeControlDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeControl: any;
  onSuccess: () => void;
}

export default function ChangeControlDetailsModal({
  isOpen,
  onClose,
  changeControl,
  onSuccess,
}: ChangeControlDetailsModalProps) {
  const router = useRouter();

  // Tab & Core State
  const [activeTab, setActiveTab] = useState<"overview" | "tasks">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Edit Form State
  const [editData, setEditData] = useState({
    title: "",
    current_state: "",
    proposed_state: "",
    justification: "",
  });

  useEffect(() => {
    if (changeControl) {
      setEditData({
        title: changeControl.title || "",
        current_state: changeControl.current_state || "",
        proposed_state: changeControl.proposed_state || "",
        justification: changeControl.justification || "",
      });
      setIsEditing(false);
      setActiveTab("overview");
    }
  }, [changeControl, isOpen]);

  if (!isOpen || !changeControl) return null;

  const currentStatus = changeControl.status || "Under Review";

  // --- API: Update Change Control ---
  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/change_controls/${changeControl.id}`,
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
        console.error("Failed to update Change Control");
      }
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to safely parse JSON impact areas and tasks if stored as strings
  const impactAreas =
    typeof changeControl.impact_areas === "string"
      ? JSON.parse(changeControl.impact_areas || "[]")
      : changeControl.impact_areas || [];

  const suggestedTasks =
    typeof changeControl.suggested_tasks === "string"
      ? JSON.parse(changeControl.suggested_tasks || "[]")
      : changeControl.suggested_tasks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
      {/* Floating Glass Container */}
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col transform transition-all duration-300">
        {/* Header */}
        <div className="bg-theme-body/50 border-b border-theme-border/50 px-8 py-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-extrabold text-theme-text tracking-tight flex items-center gap-2">
              Change Control
              {changeControl.id && (
                <span className="text-theme-muted font-medium text-lg">
                  (CC-{changeControl.id})
                </span>
              )}
            </h2>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${
                currentStatus === "Approved"
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : currentStatus === "Closed"
                    ? "bg-theme-body text-theme-muted border-theme-border/50"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}
            >
              {currentStatus}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {!isEditing &&
              activeTab === "overview" &&
              currentStatus !== "Closed" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm bg-theme-primary/10 text-theme-primary px-4 py-2 rounded-xl hover:bg-theme-primary/20 font-bold transition-colors shadow-sm"
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

        {/* Pill Tabs */}
        <div className="px-8 pt-6 pb-2 shrink-0 border-b border-theme-border/30">
          <div className="flex space-x-2 bg-theme-body/50 p-1.5 rounded-2xl w-max border border-theme-border/50 shadow-inner">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === "overview"
                  ? "bg-theme-card shadow-sm text-theme-text"
                  : "text-theme-muted hover:text-theme-text"
              }`}
            >
              Proposal Overview
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-2 px-6 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
                activeTab === "tasks"
                  ? "bg-theme-card shadow-sm text-theme-text"
                  : "text-theme-muted hover:text-theme-text"
              }`}
            >
              Execution Tasks
              {suggestedTasks.length > 0 && (
                <span className="bg-theme-accent text-white text-[10px] px-2 py-0.5 rounded-full">
                  {suggestedTasks.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="p-8 overflow-y-auto flex-1">
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
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>

                <h3 className="font-extrabold text-theme-accent text-lg flex items-center gap-2 mb-4 relative z-10">
                  <div className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></div>
                  AI Risk & Impact Assessment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm relative z-10">
                  <div className="bg-theme-card/80 backdrop-blur-sm p-4 rounded-2xl border border-theme-border/50 shadow-sm">
                    <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-1">
                      Classification
                    </span>
                    <span
                      className={`font-extrabold text-lg ${
                        changeControl.classification === "Critical"
                          ? "text-red-500"
                          : changeControl.classification === "Major"
                            ? "text-amber-500"
                            : "text-green-500"
                      }`}
                    >
                      {changeControl.classification || "Pending"}
                    </span>
                  </div>

                  <div className="bg-theme-card/80 backdrop-blur-sm p-4 rounded-2xl border border-theme-border/50 shadow-sm">
                    <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-1">
                      Impact Areas
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {impactAreas.length > 0 ? (
                        impactAreas.map((area: string, i: number) => (
                          <span
                            key={i}
                            className="bg-theme-body border border-theme-border/50 text-theme-text text-xs px-2 py-1 rounded-md"
                          >
                            {area}
                          </span>
                        ))
                      ) : (
                        <span className="text-theme-muted">Not assessed</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 bg-theme-card/80 backdrop-blur-sm p-4 rounded-2xl border border-theme-border/50 shadow-sm">
                    <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-1">
                      Classification Rationale
                    </span>
                    <span className="text-theme-text font-medium text-base leading-relaxed">
                      {changeControl.classification_rationale ||
                        "No rationale provided."}
                    </span>
                  </div>
                </div>
              </div>

              {/* View/Edit Form */}
              {isEditing ? (
                <form
                  onSubmit={handleUpdate}
                  className="space-y-5 bg-theme-body/30 p-6 rounded-3xl border border-theme-border/50"
                >
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Current State
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={editData.current_state}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          current_state: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text resize-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Proposed State
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={editData.proposed_state}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          proposed_state: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text resize-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Justification
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={editData.justification}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          justification: e.target.value,
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
                      Title
                    </span>
                    <p className="text-theme-text font-bold text-xl">
                      {changeControl.title}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="block text-sm font-bold text-theme-muted mb-2 uppercase tracking-wide">
                        Current State
                      </span>
                      <p className="text-theme-text bg-theme-body/50 p-4 rounded-2xl border border-theme-border/50 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {changeControl.current_state}
                      </p>
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-theme-muted mb-2 uppercase tracking-wide">
                        Proposed State
                      </span>
                      <p className="text-theme-text bg-theme-body/50 p-4 rounded-2xl border border-theme-border/50 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {changeControl.proposed_state}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-theme-muted mb-2 uppercase tracking-wide">
                      Justification
                    </span>
                    <p className="text-theme-text bg-theme-body/50 p-4 rounded-2xl border border-theme-border/50 whitespace-pre-wrap leading-relaxed shadow-inner">
                      {changeControl.justification}
                    </p>
                  </div>

                  {/* AI Enhanced Description */}
                  {changeControl.enhanced_description && (
                    <div className="mt-8 border-t border-theme-border/50 pt-6">
                      <span className="text-sm font-bold text-theme-accent mb-2 uppercase tracking-wide flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        AI Enhanced Technical Summary
                      </span>
                      <p className="text-theme-text bg-theme-body/50 p-5 rounded-2xl border border-theme-border/50 whitespace-pre-wrap leading-relaxed shadow-inner italic">
                        {changeControl.enhanced_description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: EXECUTION TASKS */}
          {/* ========================================== */}
          {activeTab === "tasks" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-theme-body/30 p-4 rounded-2xl border border-theme-border/50">
                <p className="font-bold text-sm text-theme-text">
                  Implementation Action Plan
                </p>
                <p className="text-xs text-theme-muted mt-0.5">
                  The following tasks have been identified by the AI assessment
                  to safely execute this change.
                </p>
              </div>

              {suggestedTasks.length === 0 ? (
                <div className="text-center py-12 text-theme-muted font-medium">
                  No tasks generated for this Change Control.
                </div>
              ) : (
                <div className="grid gap-4">
                  {suggestedTasks.map((task: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-5 bg-theme-card border border-theme-border/50 rounded-2xl shadow-sm hover:border-theme-accent/50 transition-colors group"
                    >
                      <div className="shrink-0 mt-0.5">
                        <div className="w-6 h-6 rounded-full border-2 border-theme-muted flex items-center justify-center group-hover:border-theme-accent transition-colors">
                          <span className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-theme-accent transition-colors"></span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-theme-body text-theme-muted mb-2 border border-theme-border/50">
                          {task.Domain}
                        </span>
                        <p className="text-theme-text font-medium text-sm leading-relaxed">
                          {task.Task_Description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
