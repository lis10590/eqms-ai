"use client";

import React, { useState, useEffect } from "react";

interface LogTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LogTrainingModal({
  isOpen,
  onClose,
  onSuccess,
}: LogTrainingModalProps) {
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [trainingType, setTrainingType] = useState("Self-Reading");
  const [status, setStatus] = useState("Completed");

  // Conditional Fields
  const [documentId, setDocumentId] = useState("");
  const [classroomDate, setClassroomDate] = useState("");
  const [classroomTime, setClassroomTime] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [ojtEffectiveness, setOjtEffectiveness] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/trainings/users`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            const data = await res.json();
            setAvailableUsers(data);
          }
        } catch (error) {
          console.error("Failed to fetch users");
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      employee_id: employeeId,
      title,
      training_type: trainingType,
      status,
      document_id: trainingType === "Self-Reading" ? documentId : null,
      classroom_date: trainingType === "Classroom" ? classroomDate : null,
      classroom_time: trainingType === "Classroom" ? classroomTime : null,
      trainer_name: trainingType === "Classroom" ? trainerName : null,
      ojt_effectiveness:
        trainingType === "On-Job Training" ? ojtEffectiveness : null,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trainings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        setEmployeeId("");
        setTitle("");
        setDocumentId("");
        setClassroomDate("");
        setClassroomTime("");
        setTrainerName("");
        setOjtEffectiveness("");
        onSuccess();
        onClose();
      } else {
        alert("Failed to log training.");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-theme-border/50 flex justify-between items-center bg-theme-body/30">
          <div>
            <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
              Log Training Record
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              Record employee qualifications and SOP reading.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-text bg-theme-card rounded-full p-2 border border-theme-border/50 transition-colors"
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

        <div className="p-8 overflow-y-auto flex-1">
          <form
            id="training-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Employee
                </label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
                >
                  <option value="" disabled>
                    Select an employee...
                  </option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-theme-muted ml-1">
                  Training Type
                </label>
                <select
                  value={trainingType}
                  onChange={(e) => setTrainingType(e.target.value)}
                  className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
                >
                  <option value="Self-Reading">Self-Reading (SOP)</option>
                  <option value="Classroom">Classroom / Frontal</option>
                  <option value="On-Job Training">On-Job Training (OJT)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-bold text-theme-muted ml-1">
                Training Title / Subject
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Cleanroom Gowning Protocol"
                className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
              />
            </div>

            {trainingType === "Self-Reading" && (
              <div className="p-5 bg-theme-body/30 border border-theme-border/50 rounded-2xl space-y-4 animate-fadeIn">
                <p className="text-xs font-bold text-theme-accent uppercase tracking-wide">
                  Document Link
                </p>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-theme-muted ml-1">
                    SOP / Document ID
                  </label>
                  <input
                    required
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="e.g., SOP-001 v2.0"
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
                  />
                </div>
              </div>
            )}

            {trainingType === "Classroom" && (
              <div className="p-5 bg-theme-body/30 border border-theme-border/50 rounded-2xl space-y-4 animate-fadeIn">
                <p className="text-xs font-bold text-theme-accent uppercase tracking-wide">
                  Session Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Date
                    </label>
                    <input
                      required
                      type="date"
                      value={classroomDate}
                      onChange={(e) => setClassroomDate(e.target.value)}
                      className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-theme-muted ml-1">
                      Time
                    </label>
                    <input
                      required
                      type="time"
                      value={classroomTime}
                      onChange={(e) => setClassroomTime(e.target.value)}
                      className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-theme-muted ml-1">
                    Instructor Name
                  </label>
                  <input
                    required
                    type="text"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    placeholder="e.g., Dr. Smith"
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
                  />
                </div>
              </div>
            )}

            {trainingType === "On-Job Training" && (
              <div className="p-5 bg-theme-body/30 border border-theme-border/50 rounded-2xl space-y-4 animate-fadeIn">
                <p className="text-xs font-bold text-theme-accent uppercase tracking-wide">
                  Practical Evaluation
                </p>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-theme-muted ml-1">
                    Training Effectiveness & Context
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={ojtEffectiveness}
                    onChange={(e) => setOjtEffectiveness(e.target.value)}
                    placeholder="e.g., Supervised operation of Centrifuge #3 during Batch BTN-882..."
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text resize-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-bold text-theme-muted ml-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 bg-theme-body/50 border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
              >
                <option value="Completed">Completed & Verified</option>
                <option value="Pending">Pending Evaluation</option>
              </select>
            </div>
          </form>
        </div>

        <div className="bg-theme-body/50 border-t border-theme-border/50 px-8 py-6 flex justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-theme-border rounded-2xl text-sm font-bold text-theme-text hover:bg-theme-card transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="training-form"
            disabled={isLoading}
            className="bg-theme-primary text-white px-6 py-3 rounded-2xl hover:bg-theme-primaryHover disabled:opacity-50 font-bold shadow-md transition-all"
          >
            {isLoading ? "Saving..." : "Log Training"}
          </button>
        </div>
      </div>
    </div>
  );
}
