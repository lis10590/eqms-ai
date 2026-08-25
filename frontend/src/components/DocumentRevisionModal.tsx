"use client";
import React, { useState, useEffect } from "react";

interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number | null;
  documentNumber: string;
  documentTitle: string;
  onSuccess: () => void;
}

export default function DocumentRevisionModal({
  isOpen,
  onClose,
  documentId,
  documentNumber,
  documentTitle,
  onSuccess,
}: RevisionModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isAddingForm, setIsAddingForm] = useState(false);
  const [reviewers, setReviewers] = useState<any[]>([]);

  // Form State
  const [version, setVersion] = useState("");
  const [reason, setReason] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      // 1. Fetch History
      const fetchHistory = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}/revisions`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
          // If no history exists, auto-open the form and default the text
          if (data.length === 0) {
            setIsAddingForm(true);
            setReason("New doc");
            setVersion("1.0");
          } else {
            setIsAddingForm(false);
            setReason("");
            // Auto-increment version suggestion
            const lastV = parseFloat(data[0].version);
            setVersion(isNaN(lastV) ? "" : (lastV + 1.0).toFixed(1));
          }
        }
      };

      // 2. Fetch Reviewers
      const fetchReviewers = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reviewers`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) setReviewers(await res.json());
      };

      fetchHistory();
      fetchReviewers();
      setFile(null);
    }
  }, [isOpen, documentId]);

  if (!isOpen || !documentId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a file.");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("version", version);
    formData.append("reviewer_id", reviewerId);
    formData.append("change_reason", reason);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}/revisions`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (res.ok) {
        onSuccess(); // Triggers dashboard refresh
        onClose();
      } else {
        alert("Failed to upload revision.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-theme-border flex justify-between items-center bg-theme-body/30 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-theme-text">
              {documentTitle}
            </h2>
            <div className="flex gap-2 items-center mt-1">
              <span className="px-2 py-1 bg-theme-primary/10 text-theme-primary font-mono text-xs font-bold rounded-md border border-theme-primary/20">
                {documentNumber}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-text border border-theme-border rounded-full p-2 bg-theme-card"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* History List */}
          {history.length > 0 && !isAddingForm && (
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="font-bold text-theme-text text-lg">
                  Revision History
                </h3>
                <button
                  onClick={() => setIsAddingForm(true)}
                  className="px-4 py-2 bg-theme-primary text-white text-sm font-bold rounded-xl shadow-md"
                >
                  + Add Revision
                </button>
              </div>
              <div className="space-y-3">
                {history.map((ver, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-theme-border bg-theme-body/50 flex flex-col gap-2 relative"
                  >
                    {idx === 0 && (
                      <span className="absolute top-4 right-4 text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded-md">
                        CURRENT
                      </span>
                    )}
                    <div className="flex gap-3 items-baseline">
                      <span className="font-bold text-lg text-theme-text">
                        v{ver.version}
                      </span>
                      <span className="text-xs font-bold text-theme-muted">
                        {ver.uploaded_at} by {ver.uploader}
                      </span>
                    </div>
                    <p className="text-sm text-theme-text bg-theme-card p-3 rounded-lg border border-theme-border/50">
                      <span className="text-theme-muted font-bold block mb-1">
                        Reason for Revision:
                      </span>
                      {ver.change_reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Revision Form */}
          {isAddingForm && (
            <form
              id="revision-form"
              onSubmit={handleSubmit}
              className="bg-theme-body/30 p-6 rounded-2xl border border-theme-border space-y-5"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-theme-text text-lg">
                  Upload New Revision
                </h3>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingForm(false)}
                    className="text-sm font-bold text-theme-muted hover:text-theme-text underline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-theme-muted">
                  Reason for Change
                </label>
                <textarea
                  required
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-xl text-theme-text resize-none outline-none focus:ring-2 focus:ring-theme-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-theme-muted">
                    Version Number
                  </label>
                  <input
                    required
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-xl text-theme-text outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-theme-muted">
                    Assign Reviewer
                  </label>
                  <select
                    required
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-xl text-theme-text outline-none focus:ring-2 focus:ring-theme-primary"
                  >
                    <option value="" disabled>
                      Select Reviewer...
                    </option>
                    {reviewers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-theme-muted">
                  Attach PDF Document
                </label>
                <input
                  required
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="w-full px-4 py-2 bg-theme-card border border-theme-border rounded-xl text-theme-text"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-theme-border bg-theme-body/30 flex justify-end shrink-0">
          {isAddingForm ? (
            <button
              type="submit"
              form="revision-form"
              disabled={isLoading}
              className="px-6 py-3 font-bold text-white bg-theme-primary rounded-xl shadow-md disabled:opacity-50 transition-all"
            >
              {isLoading ? "Uploading..." : "Submit Revision"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-bold text-theme-text border border-theme-border rounded-xl bg-theme-card"
            >
              Close window
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
