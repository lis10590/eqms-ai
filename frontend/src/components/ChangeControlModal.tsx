"use client";

import { useState } from "react";

interface ChangeControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangeControlModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangeControlModalProps) {
  // Step 1: User Draft State
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [currentState, setCurrentState] = useState("");
  const [proposedState, setProposedState] = useState("");
  const [justification, setJustification] = useState("");

  // Step 2: AI Assessment State
  const [aiData, setAiData] = useState<any>(null);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // --- STEP 1: Send to AI for Analysis ---
  const handleAnalyze = async () => {
    setIsLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assess_change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            current_state: currentState,
            proposed_state: proposedState,
            justification,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI Analysis failed");

      setAiData(data.assessment);
      setStep(2); // Move to review screen
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2: Final Submit to Database ---
  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    // Decode token or fetch username for initiator_id in a real app. Hardcoding 'Admin' for now.
    const initiatorId = "Admin";

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/change_controls`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            initiator_id: initiatorId,
            title: title,
            current_state: currentState,
            proposed_state: proposedState,
            justification: justification,
            classification: aiData.Classification,
            classification_rationale: aiData.Classification_Rationale,
            tasks: aiData.Suggested_Tasks,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to save Change Control");

      onSuccess(); // Refresh the table
      onClose(); // Close the modal

      // Reset state for next time
      setStep(1);
      setTitle("");
      setCurrentState("");
      setProposedState("");
      setJustification("");
      setAiData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {step === 1
              ? "Initiate New Change Control"
              : "Review AI QA Assessment"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* --- STEP 1: DRAFTING FORM --- */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Change Title
                </label>
                <input
                  type="text"
                  className="mt-1 w-full p-2 border rounded"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Modify Incubator Temperature Setpoints"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current State
                </label>
                <textarea
                  className="mt-1 w-full p-2 border rounded"
                  rows={2}
                  value={currentState}
                  onChange={(e) => setCurrentState(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Proposed State
                </label>
                <textarea
                  className="mt-1 w-full p-2 border rounded"
                  rows={2}
                  value={proposedState}
                  onChange={(e) => setProposedState(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Justification
                </label>
                <textarea
                  className="mt-1 w-full p-2 border rounded"
                  rows={2}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* --- STEP 2: REVIEW AI OUTPUT --- */}
          {step === 2 && aiData && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800">
                  Enhanced Description
                </h3>
                <p className="text-sm text-blue-900 mt-1">
                  {aiData.Enhanced_Description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-700">
                    Suggested Classification
                  </h3>
                  <p
                    className={`text-lg font-bold mt-1 ${aiData.Classification === "Critical" ? "text-red-600" : aiData.Classification === "Major" ? "text-orange-600" : "text-green-600"}`}
                  >
                    {aiData.Classification}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {aiData.Classification_Rationale}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-700">Impact Areas</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {aiData.Impact_Areas.map((area: string, idx: number) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Required Execution Tasks
                </h3>
                <div className="space-y-2">
                  {aiData.Suggested_Tasks.map((task: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start p-3 bg-white border rounded"
                    >
                      <span className="px-2 py-1 bg-gray-200 text-xs font-semibold rounded mr-3">
                        {task.Domain}
                      </span>
                      <p className="text-sm text-gray-800">
                        {task.Task_Description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- ACTION BUTTONS --- */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>

            {step === 1 ? (
              <button
                onClick={handleAnalyze}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={
                  isLoading ||
                  !title ||
                  !currentState ||
                  !proposedState ||
                  !justification
                }
              >
                {isLoading ? "Analyzing..." : "Analyze with AI"}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Submit to QA"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
