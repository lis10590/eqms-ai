"use client";

import { useState } from "react";

export default function DeviationTriage() {
  const [submitterId, setSubmitterId] = useState("");
  const [deviationText, setDeviationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
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

      if (!res.ok) throw new Error("Failed to assess deviation");

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Error connecting to API:", error);
      alert("Failed to connect to the eQMS backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">
          Quality Management System
        </h1>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            New Deviation Record
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submitter ID
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="e.g., QA-042"
                value={submitterId}
                onChange={(e) => setSubmitterId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Description
              </label>
              <textarea
                required
                rows={4}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Describe the life sciences non-conformance (e.g., incubator temperature excursion, calibration failure...)"
                value={deviationText}
                onChange={(e) => setDeviationText(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Analyzing Root Cause..." : "Submit for AI Triage"}
            </button>
          </form>
        </div>

        {/* Results Component */}
        {result && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-4">
              Assessment Complete
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded border">
                <span className="block text-xs text-gray-500 uppercase">
                  Category
                </span>
                <span className="font-semibold text-gray-900">
                  {result.root_cause_category}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <span className="block text-xs text-gray-500 uppercase">
                  Recommended Action
                </span>
                <span className="font-semibold text-gray-900">
                  {result.recommended_action}
                </span>
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-100">
                <span className="block text-xs text-red-500 uppercase">
                  RPN Score
                </span>
                <span className="font-bold text-red-700 text-lg">
                  {result.rpn}
                </span>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                QA Narrative & 5 Whys
              </span>
              <p className="text-gray-600 bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
                {result.qa_narrative}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
