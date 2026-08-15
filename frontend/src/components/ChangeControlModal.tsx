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
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [currentState, setCurrentState] = useState("");
  const [proposedState, setProposedState] = useState("");
  const [justification, setJustification] = useState("");

  const [aiData, setAiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

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
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    const token = localStorage.getItem("token");
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

      onSuccess();
      onClose();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
      {/* Floating Glass Modal Container */}
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
              {step === 1
                ? "Initiate New Change Control"
                : "AI Quality Assessment"}
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

          {/* --- STEP 1: DRAFTING FORM --- */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Change Title
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent focus:border-transparent outline-none transition-all shadow-sm text-theme-text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Modify Incubator Temperature Setpoints"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Current State
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent focus:border-transparent outline-none transition-all shadow-sm text-theme-text resize-none"
                  rows={3}
                  value={currentState}
                  onChange={(e) => setCurrentState(e.target.value)}
                  placeholder="Describe the current process or parameter..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Proposed State
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent focus:border-transparent outline-none transition-all shadow-sm text-theme-text resize-none"
                  rows={3}
                  value={proposedState}
                  onChange={(e) => setProposedState(e.target.value)}
                  placeholder="Describe exactly what will change..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Justification
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent focus:border-transparent outline-none transition-all shadow-sm text-theme-text resize-none"
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Provide the regulatory or business rationale..."
                />
              </div>
            </div>
          )}

          {/* --- STEP 2: REVIEW AI OUTPUT --- */}
          {step === 2 && aiData && (
            <div className="space-y-6">
              {/* AI Enhanced Output Box */}
              <div className="bg-theme-accent/5 p-6 rounded-3xl border border-theme-accent/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg
                    className="w-16 h-16 text-theme-accent"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-extrabold text-theme-accent text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></div>
                  AI Enhanced Protocol
                </h3>
                <p className="text-theme-text font-medium mt-3 leading-relaxed relative z-10">
                  {aiData.Enhanced_Description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-theme-body/50 p-6 rounded-3xl border border-theme-border shadow-inner">
                  <h3 className="font-bold text-theme-muted text-sm uppercase tracking-wide">
                    Suggested Classification
                  </h3>
                  <p
                    className={`text-2xl font-extrabold mt-2 ${
                      aiData.Classification === "Critical"
                        ? "text-red-500"
                        : aiData.Classification === "Major"
                          ? "text-amber-500"
                          : "text-green-500"
                    }`}
                  >
                    {aiData.Classification}
                  </p>
                  <p className="text-sm font-medium text-theme-muted mt-2 leading-snug">
                    {aiData.Classification_Rationale}
                  </p>
                </div>

                <div className="bg-theme-body/50 p-6 rounded-3xl border border-theme-border shadow-inner">
                  <h3 className="font-bold text-theme-muted text-sm uppercase tracking-wide">
                    Impact Areas
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {aiData.Impact_Areas.map((area: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-center text-sm font-medium text-theme-text"
                      >
                        <svg
                          className="w-4 h-4 text-theme-accent mr-2 flex-shrink-0"
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
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-theme-text text-lg mb-4 pl-1">
                  Required Execution Tasks
                </h3>
                <div className="space-y-3">
                  {aiData.Suggested_Tasks.map((task: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start p-4 bg-theme-body/30 border border-theme-border rounded-2xl hover:bg-theme-card transition-colors"
                    >
                      <span className="px-3 py-1 bg-theme-card border border-theme-border/50 text-xs font-bold rounded-lg text-theme-muted mr-4 shadow-sm whitespace-nowrap">
                        {task.Domain}
                      </span>
                      <p className="text-sm font-medium text-theme-text mt-0.5">
                        {task.Task_Description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- ACTION BUTTONS --- */}
          <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-theme-border/50">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-theme-border rounded-2xl text-sm font-bold text-theme-text hover:bg-theme-body transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>

            {step === 1 ? (
              <button
                onClick={handleAnalyze}
                className="px-6 py-3 bg-theme-primary text-white rounded-2xl text-sm font-bold hover:bg-theme-primaryHover shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                disabled={
                  isLoading ||
                  !title ||
                  !currentState ||
                  !proposedState ||
                  !justification
                }
              >
                {isLoading ? (
                  <>Processing Matrix...</>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Analyze with AI
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 shadow-md disabled:opacity-50 transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Committing..." : "Submit to QA"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
