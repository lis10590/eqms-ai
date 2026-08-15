"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface DeviationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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
  const router = useRouter();
  const [submitterId, setSubmitterId] = useState<string>("");
  const [deviationText, setDeviationText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assess_deviation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            submitter_id: submitterId,
            deviation_text: deviationText,
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        setAssessment(result.assessment);
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-2xl overflow-hidden transform transition-all duration-300">
        <div className="bg-theme-body/50 border-b border-theme-border/50 px-8 py-6 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
            {assessment ? "AI Assessment Complete" : "Log New Deviation"}
          </h2>
          <button
            onClick={handleCancel}
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

        <div className="p-8">
          {assessment ? (
            <div className="space-y-6">
              {/* Premium AI Success Readout */}
              <div className="bg-theme-accent/5 p-6 rounded-3xl border border-theme-accent/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg
                    className="w-24 h-24 text-theme-accent"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <h3 className="font-extrabold text-theme-accent text-lg flex items-center gap-2 mb-6 relative z-10">
                  <div className="w-2 h-2 rounded-full bg-theme-accent animate-pulse"></div>
                  Deviation Logged Successfully
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6 relative z-10">
                  <div className="bg-theme-card/80 backdrop-blur-sm p-4 rounded-2xl border border-theme-border/50 shadow-sm">
                    <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-1">
                      Category
                    </span>
                    <span className="text-theme-text font-medium text-base">
                      {assessment.root_cause_category}
                    </span>
                  </div>

                  <div className="bg-theme-card/80 backdrop-blur-sm p-4 rounded-2xl border border-theme-border/50 shadow-sm">
                    <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-1">
                      Calculated RPN
                    </span>
                    <span
                      className={`font-extrabold text-lg ${(assessment.rpn ?? 0) > 50 ? "text-red-500" : "text-green-500"}`}
                    >
                      {assessment.rpn}
                    </span>
                  </div>

                  <div className="col-span-1 md:col-span-2 bg-theme-card/80 backdrop-blur-sm p-4 rounded-2xl border border-theme-border/50 shadow-sm">
                    <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-1">
                      Required Action
                    </span>
                    <span className="text-theme-text font-medium text-base">
                      {assessment.required_action}
                    </span>
                  </div>
                </div>

                <div className="relative z-10">
                  <span className="block font-bold text-theme-muted uppercase tracking-wide text-xs mb-2 ml-1">
                    QA Narrative Generated
                  </span>
                  <p className="text-theme-text bg-theme-card/80 backdrop-blur-sm p-5 rounded-2xl border border-theme-border/50 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                    {assessment.qa_narrative}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleAcknowledge}
                  className="bg-theme-primary text-white font-bold py-3 px-8 rounded-2xl hover:bg-theme-primaryHover shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Submitter ID
                </label>
                <input
                  type="text"
                  required
                  value={submitterId}
                  onChange={(e) => setSubmitterId(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text transition-all"
                  placeholder="e.g., QA-019"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Deviation Text
                </label>
                <textarea
                  required
                  rows={5}
                  value={deviationText}
                  onChange={(e) => setDeviationText(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none shadow-sm text-theme-text resize-none transition-all"
                  placeholder="Describe the non-conformance event..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-2 border-t border-theme-border/50">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-6 py-3 border border-theme-border rounded-2xl text-sm font-bold text-theme-text hover:bg-theme-body transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-theme-primary text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-theme-primaryHover disabled:opacity-50 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  {isLoading ? (
                    "Assessing via AI..."
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
                      Submit to AI Engine
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
