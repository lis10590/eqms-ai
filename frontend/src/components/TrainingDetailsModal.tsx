"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface TrainingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  training: any;
  onSuccess: () => void;
}

export default function TrainingDetailsModal({
  isOpen,
  onClose,
  training,
  onSuccess,
}: TrainingDetailsModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
    }
  }, [training, isOpen]);

  if (!isOpen || !training) return null;

  const currentStatus = training.status || "Open";
  const isLocked =
    currentStatus === "Completed" || currentStatus === "Pending QA Approval";

  // Updates text fields
  const handleSaveDetails = async () => {
    await submitUpdate(editData);
  };

  // Changes the status
  const handleStatusChange = async (newStatus: string) => {
    await submitUpdate({ ...editData, status: newStatus });
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
        if (payload.status && payload.status !== training.status) {
          onClose(); // Close if status changed
        }
      } else {
        alert("Failed to update training record.");
      }
    } catch (error) {
      console.error(error);
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
                className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${
                  currentStatus === "Completed"
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : currentStatus === "Pending QA Approval"
                      ? "bg-purple-500/10 text-purple-500 border-purple-500/20 animate-pulse"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                }`}
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
          {/* Conditional Form Based on Type */}
          {training.training_type === "Self-Reading" && (
            <div className="space-y-1">
              <label className="block text-sm font-bold text-theme-muted ml-1">
                Document / SOP ID
              </label>
              <input
                type="text"
                value={editData.document_id}
                onChange={(e) =>
                  setEditData({ ...editData, document_id: e.target.value })
                }
                disabled={isLocked}
                className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all disabled:opacity-60"
              />
            </div>
          )}

          {training.training_type === "Classroom" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-theme-muted ml-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editData.classroom_date}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        classroom_date: e.target.value,
                      })
                    }
                    disabled={isLocked}
                    className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-theme-muted ml-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={editData.classroom_time}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        classroom_time: e.target.value,
                      })
                    }
                    disabled={isLocked}
                    className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={editData.trainer_name}
                  onChange={(e) =>
                    setEditData({ ...editData, trainer_name: e.target.value })
                  }
                  disabled={isLocked}
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all disabled:opacity-60"
                />
              </div>
            </>
          )}

          {training.training_type === "On-Job Training" && (
            <div className="space-y-1">
              <label className="block text-sm font-bold text-theme-muted ml-1">
                OJT Effectiveness & Execution Notes
              </label>
              <textarea
                rows={5}
                value={editData.ojt_effectiveness}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    ojt_effectiveness: e.target.value,
                  })
                }
                disabled={isLocked}
                placeholder="Detail the batch number, equipment used, and proof of proficiency..."
                className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text resize-none transition-all disabled:opacity-60"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-theme-body/50 border-t border-theme-border/50 px-8 py-6 flex justify-end space-x-3 shrink-0">
          {currentStatus === "Open" && (
            <>
              <button
                onClick={handleSaveDetails}
                disabled={isLoading}
                className="px-6 py-3 border border-theme-border rounded-2xl text-sm font-bold text-theme-text hover:bg-theme-card transition-colors disabled:opacity-50"
              >
                Save Details
              </button>
              <button
                onClick={() => handleStatusChange("Pending QA Approval")}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 font-bold shadow-md transition-all disabled:opacity-50"
              >
                Send to QA Approval
              </button>
            </>
          )}

          {currentStatus === "Pending QA Approval" && (
            <button
              onClick={() => handleStatusChange("Completed")}
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
              Approve & Complete
            </button>
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
