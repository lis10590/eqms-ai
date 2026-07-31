"use client";

import { useState, FormEvent } from "react";

// 1. Define the types for the props your modal accepts
interface DeviationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 2. Define a rough type for the AI assessment so TypeScript knows what fields exist
interface AssessmentData {
  root_cause_category?: string;
  required_action?: string;
  rpn?: number;
  qa_narrative?: string;
}

export default function DeviationModal({
  isOpen,
  onClose,
  onSuccess,
}: DeviationModalProps) {
  const [submitterId, setSubmitterId] = useState<string>("");
  const [deviationText, setDeviationText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 3. Tell TypeScript that this state will hold AssessmentData or null
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);

  if (!isOpen) return null;

  // 4. Type the form event
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assess_deviation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submitter_id: submitterId,
            deviation_text: deviationText,
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        setAssessment(result.assessment);
      } else {
        console.error("Failed to assess deviation");
      }
    } catch (error) {
      console.error("Error submitting deviation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = () => {
    if (onSuccess) onSuccess();

    setSubmitterId("");
    setDeviationText("");
    setAssessment(null);

    onClose();
  };

  const handleCancel = () => {
    setSubmitterId("");
    setDeviationText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {assessment ? "AI Assessment Complete" : "Log New Deviation"}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {assessment ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Deviation Logged Successfully
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-semibold text-gray-700">
                      Category:{" "}
                    </span>
                    <span className="text-gray-900">
                      {assessment.root_cause_category}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Action:{" "}
                    </span>
                    <span className="text-gray-900">
                      {assessment.required_action}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Calculated RPN:{" "}
                    </span>
                    {/* Optional chaining (?) ensures we don't crash if RPN is missing */}
                    <span
                      className={`font-bold ${(assessment.rpn ?? 0) > 50 ? "text-red-600" : "text-green-600"}`}
                    >
                      {assessment.rpn}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block mb-1">
                    QA Narrative:
                  </span>
                  <p className="text-gray-800 bg-white p-3 border rounded text-sm whitespace-pre-wrap">
                    {assessment.qa_narrative}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleAcknowledge}
                  className="bg-blue-600 text-white font-medium py-2 px-6 rounded hover:bg-blue-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submitter ID
                </label>
                <input
                  type="text"
                  required
                  value={submitterId}
                  onChange={(e) => setSubmitterId(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., QA-019"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deviation Text
                </label>
                <textarea
                  required
                  rows={5}
                  value={deviationText}
                  onChange={(e) => setDeviationText(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the non-conformance event..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isLoading ? "Assessing..." : "Submit to AI Engine"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
