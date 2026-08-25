"use client";
import React, { useState } from "react";

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (docId: number, docNumber: string, title: string) => void;
}

export default function CreateDocumentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        onSuccess(data.document_id, data.document_number, data.title);
        setTitle("");
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-theme-card border border-theme-border rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-theme-text mb-2">
          Create New Document
        </h2>
        <p className="text-sm text-theme-muted mb-6">
          A unique SOP number will be auto-generated.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-theme-muted ml-1">
              Document Title
            </label>
            <input
              required
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-theme-body border border-theme-border rounded-xl text-theme-text outline-none focus:ring-2 focus:ring-theme-primary"
              placeholder="e.g., HVAC Decontamination"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 font-bold text-theme-text border border-theme-border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 font-bold text-white bg-theme-primary rounded-xl disabled:opacity-50"
            >
              Next: Add Revision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
