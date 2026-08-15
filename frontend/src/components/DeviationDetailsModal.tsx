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
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [editData, setEditData] = useState({
    submitter_id: "",
    deviation_text: "",
  });

  useEffect(() => {
    if (deviation) {
      setEditData({
        submitter_id: deviation.submitter_id || "",
        deviation_text: deviation.deviation_text || "",
      });
      setIsEditing(false);
    }
  }, [deviation]);

  if (!isOpen || !deviation) return null;

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
        onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
      {/* Floating Glass Container */}
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col transform transition-all duration-300">
        {/* Header */}
        <div className="bg-theme-body/50 border-b border-theme-border/50 px-8 py-6 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
            Deviation Details{" "}
            {deviation.id && (
              <span className="text-theme-muted font-medium ml-1">
                (#{deviation.id})
              </span>
            )}
          </h2>
          <div className="flex items-center space-x-4">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm bg-theme-primary/10 text-theme-primary px-4 py-2 rounded-xl hover:bg-theme-primary/20 font-bold transition-colors"
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

        {/* Body - Scrollable */}
        <div className="p-8 overflow-y-auto">
          {/* AI Assessment Premium Readout */}
          <div className="bg-theme-accent/5 p-6 rounded-3xl border border-theme-accent/20 shadow-sm relative overflow-hidden mb-8">
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
                  className={`font-extrabold text-lg ${(deviation.rpn ?? 0) > 50 ? "text-red-500" : "text-green-500"}`}
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
                    setEditData({ ...editData, submitter_id: e.target.value })
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
                    setEditData({ ...editData, deviation_text: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text resize-none transition-all"
                />
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
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="bg-theme-body/50 border-t border-theme-border/50 px-8 py-6 flex justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 border border-theme-border rounded-2xl text-sm font-bold text-theme-text hover:bg-theme-card transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-form"
              disabled={isLoading}
              className="bg-theme-primary text-white px-6 py-3 rounded-2xl hover:bg-theme-primaryHover disabled:opacity-50 font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              {isLoading ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
