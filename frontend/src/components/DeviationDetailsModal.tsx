"use client";

import { useState, useEffect, FormEvent } from "react";

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
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Editable form state
  const [editData, setEditData] = useState({
    submitter_id: "",
    deviation_text: "",
  });

  // Populate the edit form when the modal opens or the deviation changes
  useEffect(() => {
    if (deviation) {
      setEditData({
        submitter_id: deviation.submitter_id || "",
        deviation_text: deviation.deviation_text || "",
      });
      // Reset edit mode if a new deviation is opened
      setIsEditing(false);
    }
  }, [deviation]);

  if (!isOpen || !deviation) return null;

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Note: You will need a PUT endpoint in Flask mapped to /deviations/<id>
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/deviations/${deviation.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        },
      );

      if (response.ok) {
        setIsEditing(false);
        onSuccess(); // Refresh the table
        onClose(); // Close the modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            Deviation Details {deviation.id && `(#${deviation.id})`}
          </h2>
          <div className="flex items-center space-x-4">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit Details
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto">
          {/* AI Assessment Readout (Usually non-editable directly in an eQMS) */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              AI Triage Results
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Category: </span>
                <span className="text-gray-900">
                  {deviation.category || deviation.root_cause_category}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">RPN: </span>
                <span
                  className={`font-bold ${(deviation.rpn ?? 0) > 50 ? "text-red-600" : "text-green-600"}`}
                >
                  {deviation.rpn}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-gray-700">
                  Required Action:{" "}
                </span>
                <span className="text-gray-900">
                  {deviation.required_action}
                </span>
              </div>
            </div>
          </div>

          {/* Core Data: Toggle between View and Edit Modes */}
          {isEditing ? (
            <form id="edit-form" onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submitter ID
                </label>
                <input
                  type="text"
                  required
                  value={editData.submitter_id}
                  onChange={(e) =>
                    setEditData({ ...editData, submitter_id: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deviation Text
                </label>
                <textarea
                  required
                  rows={6}
                  value={editData.deviation_text}
                  onChange={(e) =>
                    setEditData({ ...editData, deviation_text: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Submitter ID
                </span>
                <p className="text-gray-900">{deviation.submitter_id}</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Deviation Text
                </span>
                <p className="text-gray-900 bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                  {deviation.deviation_text}
                </p>
              </div>
              {deviation.qa_narrative && (
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    QA Narrative
                  </span>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                    {deviation.qa_narrative}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="bg-gray-50 border-t px-6 py-4 flex justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-form"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
