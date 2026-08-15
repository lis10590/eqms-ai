import React, { useState, useEffect } from "react";

interface UploadSopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Reviewer {
  id: number;
  username: string;
}

export default function UploadSopModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadSopModalProps) {
  const [documentNumber, setDocumentNumber] = useState("");
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchReviewers = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/reviewers`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.ok) {
            const data = await response.json();
            setReviewers(data);
          }
        } catch (err) {
          console.error("Failed to fetch reviewers", err);
        }
      };

      fetchReviewers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!file) {
      setError("Please select a PDF file.");
      setLoading(false);
      return;
    }

    if (!selectedReviewer) {
      setError("Please select a reviewer.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("document_number", documentNumber);
    formData.append("title", title);
    formData.append("version", version);
    formData.append("reviewer_id", selectedReviewer);
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");

      if (!token || token === "null" || token === "undefined") {
        setError("Authentication error. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/upload_sop`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const data = await response.json();

      if (response.ok) {
        setDocumentNumber("");
        setTitle("");
        setVersion("");
        setSelectedReviewer("");
        setFile(null);
        onSuccess();
      } else {
        setError(data.error || "Failed to upload document");
      }
    } catch (err) {
      setError("Network error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Beautiful blurred backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
      {/* Floating Glass Modal */}
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-md p-8 transform transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
            Upload New SOP
          </h2>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-text bg-theme-body rounded-full p-2 transition-colors focus:outline-none"
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

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-semibold text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-sm font-bold text-theme-muted ml-1">
              Document Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g., SOP-001"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent focus:border-transparent outline-none transition-all shadow-sm text-theme-text"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-theme-muted ml-1">
              Title
            </label>
            <input
              type="text"
              required
              placeholder="Document Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent focus:border-transparent outline-none transition-all shadow-sm text-theme-text"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-theme-muted ml-1">
              Version
            </label>
            <input
              type="text"
              required
              placeholder="1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent focus:border-transparent outline-none transition-all shadow-sm text-theme-text"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-theme-muted ml-1">
              Assign to Reviewer
            </label>
            <select
              required
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
              className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent focus:border-transparent outline-none transition-all shadow-sm text-theme-text cursor-pointer"
            >
              <option value="" disabled>
                Select personnel...
              </option>
              {reviewers.map((reviewer) => (
                <option key={reviewer.id} value={reviewer.id}>
                  {reviewer.username}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-theme-muted ml-1">
              PDF Document
            </label>
            <input
              type="file"
              required
              accept=".pdf"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
              className="w-full px-4 py-2 bg-theme-card border border-theme-border rounded-2xl text-sm text-theme-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-theme-accent/10 file:text-theme-accent hover:file:bg-theme-accent/20 transition-all cursor-pointer"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-theme-border rounded-2xl text-sm font-bold text-theme-text hover:bg-theme-body transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-theme-primary text-white rounded-2xl text-sm font-bold hover:bg-theme-primaryHover shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {loading ? "Encrypting & Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
