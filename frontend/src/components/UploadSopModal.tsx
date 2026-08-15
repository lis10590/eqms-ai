import React, { useState, useEffect } from "react";

interface UploadSopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 1. Define the Reviewer interface
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

  // 2. Add state for reviewers and the selected selection
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 3. Fetch the list of reviewers when the modal opens
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
    // 4. Append the selected reviewer to the payload
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Upload New SOP</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... Keep Document Number, Title, and Version inputs exactly the same ... */}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Document Number
            </label>
            <input
              type="text"
              required
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Version
            </label>
            <input
              type="text"
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* 5. Add the Reviewer Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assign to Reviewer
            </label>
            <select
              required
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>
                Select a person...
              </option>
              {reviewers.map((reviewer) => (
                <option key={reviewer.id} value={reviewer.id}>
                  {reviewer.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              PDF Document
            </label>
            <input
              type="file"
              required
              accept=".pdf"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
