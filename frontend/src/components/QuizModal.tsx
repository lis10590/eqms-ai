"use client";

import { useState, useEffect } from "react";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  training: any;
  onSuccess: () => void;
}

export default function QuizModal({
  isOpen,
  onClose,
  training,
  onSuccess,
}: QuizModalProps) {
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  // ONLY fetch and reset when the modal is initially opened
  useEffect(() => {
    if (isOpen && training) {
      setQuizData([]);
      setUserAnswers({});
      setQuizResult(null);
      generateQuiz();
    }
  }, [isOpen]);

  const generateQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trainings/${training.id}/quiz`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setQuizData(data.questions);
      } else {
        alert(data.error || "Failed to generate quiz.");
        onClose();
      }
    } catch (err) {
      alert("Network error generating quiz.");
      onClose();
    }
    setIsGeneratingQuiz(false);
  };

  const handleGradeQuiz = async () => {
    let correct = 0;
    quizData.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_index) correct++;
    });

    const score = (correct / quizData.length) * 100;
    const passed = score >= 80;

    setQuizResult({ score, passed });

    // If passed, silently update the DB in the background
    if (passed) {
      try {
        const token = localStorage.getItem("token");
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/trainings/${training.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "Completed" }),
          },
        );
        onSuccess(); // Refresh the dashboard behind the modal
      } catch (err) {
        console.error("Failed to save passing score", err);
      }
    }
  };

  if (!isOpen || !training) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-opacity">
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <span className="px-3 py-1 bg-white/20 text-white rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
              Comprehension Check
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {training.title}
            </h2>
          </div>
          {!quizResult && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
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
          )}
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {isGeneratingQuiz ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <svg
                className="w-12 h-12 text-blue-500 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <p className="text-theme-text font-bold text-lg animate-pulse">
                AI is reading the SOP and generating your quiz...
              </p>
            </div>
          ) : !quizResult ? (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                <span className="font-bold text-theme-text">
                  Answer all questions to complete your training.
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {Object.keys(userAnswers).length} / {quizData.length} Answered
                </span>
              </div>

              {quizData.map((q, qIdx) => (
                <div key={qIdx} className="space-y-3">
                  <h3 className="font-bold text-lg text-theme-text">
                    {qIdx + 1}. {q.question}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt: string, oIdx: number) => (
                      <label
                        key={oIdx}
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${userAnswers[qIdx] === oIdx ? "bg-blue-500/10 border-blue-500" : "bg-theme-body border-theme-border hover:border-theme-primary/50"}`}
                      >
                        <input
                          type="radio"
                          name={`question-${qIdx}`}
                          value={oIdx}
                          checked={userAnswers[qIdx] === oIdx}
                          onChange={() =>
                            setUserAnswers({ ...userAnswers, [qIdx]: oIdx })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="ml-3 text-sm font-medium text-theme-text">
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn text-center py-6">
              <div
                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center border-4 ${quizResult.passed ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}`}
              >
                <span className="text-3xl font-black">{quizResult.score}%</span>
              </div>
              <div>
                <h3
                  className={`text-2xl font-bold ${quizResult.passed ? "text-green-500" : "text-red-500"}`}
                >
                  {quizResult.passed ? "Training Passed!" : "Training Failed"}
                </h3>
                <p className="text-theme-muted mt-2">
                  {quizResult.passed
                    ? "Your training record has been officially updated and locked."
                    : "You must score at least 80% to pass. Please review the material and try again."}
                </p>
              </div>

              {quizResult.passed && (
                <button
                  onClick={onClose}
                  className="mt-4 px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md"
                >
                  Finish & Close Window
                </button>
              )}

              <div className="text-left mt-8 space-y-4">
                <h4 className="font-bold text-theme-text text-lg border-b border-theme-border pb-2">
                  Review Your Answers
                </h4>
                {quizData.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${userAnswers[idx] === q.correct_index ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}
                  >
                    <p className="font-bold text-theme-text mb-2">
                      {idx + 1}. {q.question}
                    </p>
                    <p className="text-sm font-bold text-theme-text mb-1">
                      Your Answer:{" "}
                      <span
                        className={
                          userAnswers[idx] === q.correct_index
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {q.options[userAnswers[idx]] || "No Answer"}
                      </span>
                    </p>
                    {userAnswers[idx] !== q.correct_index && (
                      <p className="text-sm font-bold text-green-600 mb-2">
                        Correct Answer: {q.options[q.correct_index]}
                      </p>
                    )}
                    <p className="text-sm text-theme-muted mt-2 border-t border-theme-border/50 pt-2">
                      <span className="font-bold text-theme-text">
                        Explanation:
                      </span>{" "}
                      {q.explanation}
                    </p>
                  </div>
                ))}
              </div>

              {!quizResult.passed && (
                <button
                  onClick={() => {
                    setUserAnswers({});
                    setQuizResult(null);
                  }}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                >
                  Retake Quiz
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isGeneratingQuiz && !quizResult && (
          <div className="bg-theme-body/50 border-t border-theme-border/50 px-8 py-6 flex justify-end space-x-3 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-theme-border rounded-2xl text-sm font-bold text-theme-text hover:bg-theme-card"
            >
              Cancel
            </button>
            <button
              onClick={handleGradeQuiz}
              disabled={Object.keys(userAnswers).length < quizData.length}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              Submit Answers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
