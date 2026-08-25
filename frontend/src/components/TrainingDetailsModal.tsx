"use client";

import { useState, useEffect } from "react";

interface TrainingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  training: any;
  onSuccess: () => void;
  currentUser: any; // NEW: Passed down from dashboard
}

export default function TrainingDetailsModal({
  isOpen,
  onClose,
  training,
  onSuccess,
  currentUser,
}: TrainingDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // States for Manual Approval Module
  const [isManualApproving, setIsManualApproving] = useState(false);
  const [justification, setJustification] = useState("");

  const [editData, setEditData] = useState({
    document_id: "",
    classroom_date: "",
    classroom_time: "",
    trainer_name: "",
    ojt_effectiveness: "",
  });

  useEffect(() => {
    if (training) {
      setEditData({
        document_id: training.document_id || "",
        classroom_date: training.classroom_date || "",
        classroom_time: training.classroom_time || "",
        trainer_name: training.trainer_name || "",
        ojt_effectiveness: training.ojt_effectiveness || "",
      });
      setIsManualApproving(false);
      setJustification("");
    }
  }, [training, isOpen]);

  if (!isOpen || !training) return null;

  const currentStatus = training.status || "Open";
  const isLocked = currentStatus === "Completed";
  const isSelfReading = training.training_type === "Self-Reading";

  // SECURITY CHECKS
  const isAssignedUser = currentUser?.id === training.employee_id;
  const isQaOrAdmin =
    currentUser?.role === "qa_user" || currentUser?.role === "admin";

  const handleOpenSop = async () => {
    if (!editData.document_id) return alert("No Document ID assigned.");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trainings/view_sop/${editData.document_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok && data.url) window.open(data.url, "_blank");
      else alert(data.error || "Could not find PDF.");
    } catch (err) {
      alert("Network error.");
    }
  };

  const submitUpdate = async (payload: any) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trainings/${training.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        onSuccess();
        if (payload.status && payload.status !== training.status) onClose();
      } else {
        alert("Failed to update training record.");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-theme-body/50 border-b border-theme-border/50 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-1 bg-theme-body border border-theme-border/50 rounded-md text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                {training.training_type}
              </span>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${currentStatus === "Completed" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}
              >
                {currentStatus}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
              {training.title}
            </h2>
            <p className="text-sm font-medium text-theme-muted mt-1">
              Assigned to: {training.employee_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-text bg-theme-card rounded-full p-2 border border-theme-border/50 shadow-sm focus:outline-none"
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

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* Training Fields */}
          {isSelfReading && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Document / SOP ID
                </label>
                <input
                  type="text"
                  value={editData.document_id}
                  disabled
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl outline-none text-theme-text opacity-60"
                />
              </div>

              {/* Only assigned user can read the document to complete it */}
              {editData.document_id && isAssignedUser && (
                <button
                  onClick={handleOpenSop}
                  className="w-full py-3 bg-theme-body border border-theme-border text-theme-text font-bold rounded-xl hover:border-theme-primary transition-all flex justify-center items-center gap-2"
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  Open & Read Document
                </button>
              )}
            </div>
          )}

          {/* Render previously saved justification if it exists */}
          {training.manual_approval_justification && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="text-xs font-bold text-amber-600 uppercase mb-1">
                Manual Approval Override
              </p>
              <p className="text-sm text-theme-text">
                {training.manual_approval_justification}
              </p>
            </div>
          )}

          {/* Manual Approval Form for QA/Admins */}
          {isManualApproving && (
            <div className="p-5 bg-theme-body/30 border border-theme-border/50 rounded-2xl space-y-3 animate-fadeIn">
              <label className="block text-sm font-bold text-theme-accent uppercase tracking-wide">
                Provide Approval Justification
              </label>
              <textarea
                required
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain reason for manual override..."
                className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text resize-none transition-all"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsManualApproving(false)}
                  className="text-xs font-bold text-theme-muted hover:text-theme-text"
                >
                  Cancel
                </button>
                <button
                  disabled={!justification.trim() || isLoading}
                  onClick={() =>
                    submitUpdate({
                      ...editData,
                      status: "Completed",
                      manual_approval_justification: justification,
                    })
                  }
                  className="px-4 py-2 bg-theme-accent text-white text-xs font-bold rounded-lg disabled:opacity-50 shadow-md"
                >
                  Submit Override
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-theme-body/50 border-t border-theme-border/50 px-8 py-6 flex justify-end space-x-3 shrink-0">
          {currentStatus === "Open" && (
            <>
              {/* Only Assigned User can normally complete self-reading */}
              {isAssignedUser && isSelfReading && (
                <button
                  onClick={() =>
                    submitUpdate({ ...editData, status: "Completed" })
                  }
                  disabled={isLoading}
                  className="bg-green-600 text-white px-6 py-3 rounded-2xl hover:bg-green-700 font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Finish Training
                </button>
              )}

              {/* Admin/QA override button */}
              {isQaOrAdmin && !isManualApproving && (
                <button
                  onClick={() => setIsManualApproving(true)}
                  className="px-6 py-3 border border-amber-500/50 text-amber-500 rounded-2xl text-sm font-bold hover:bg-amber-500/10 transition-colors"
                >
                  Approve Manually
                </button>
              )}
            </>
          )}

          {currentStatus === "Completed" && (
            <span className="text-theme-muted text-sm font-bold flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Record Locked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
