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
  const [availableSops, setAvailableSops] = useState<any[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [trainingType, setTrainingType] = useState("Self-Reading");

  // Conditional Fields
  const [documentId, setDocumentId] = useState("");
  const [classroomDate, setClassroomDate] = useState("");
  const [classroomTime, setClassroomTime] = useState("");
  const [trainerName, setTrainerName] = useState("");

  // NEW: Array state to hold dynamic OJT tasks
  const [ojtTasks, setOjtTasks] = useState<string[]>([""]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchSetupData = async () => {
        try {
          const token = localStorage.getItem("token");
          const userRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/trainings/users`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (userRes.ok) setAvailableUsers(await userRes.json());

          const sopRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/documents?view=active`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (sopRes.ok) setAvailableSops(await sopRes.json());
        } catch (error) {
          console.error("Failed to fetch setup data");
        }
      };
      fetchSetupData();

      // Reset form states on open
      setEmployeeId("");
      setTitle("");
      setTrainingType("Self-Reading");
      setDocumentId("");
      setClassroomDate("");
      setClassroomTime("");
      setTrainerName("");
      setOjtTasks([""]); // Start with one empty task
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTaskChange = (idx: number, val: string) => {
    const newTasks = [...ojtTasks];
    newTasks[idx] = val;
    setOjtTasks(newTasks);
  };

  const handleAddTask = () => setOjtTasks([...ojtTasks, ""]);
  const handleRemoveTask = (idx: number) => {
    const newTasks = [...ojtTasks];
    newTasks.splice(idx, 1);
    setOjtTasks(newTasks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Format the tasks into an array of objects and convert to string
    const formattedTasks = ojtTasks
      .filter((t) => t.trim() !== "")
      .map((t) => ({ task: t.trim(), response: "" }));

    const payload = {
      employee_id: employeeId,
      title,
      training_type: trainingType,
      status: "Open", // Always Open
      document_id: trainingType === "Self-Reading" ? documentId : null,
      classroom_date: trainingType === "Classroom" ? classroomDate : null,
      classroom_time: trainingType === "Classroom" ? classroomTime : null,
      trainer_name: trainingType === "Classroom" ? trainerName : null,
      // Save the tasks array as a JSON string to fit in the text column
      ojt_effectiveness:
        trainingType === "On-Job Training"
          ? JSON.stringify(formattedTasks)
          : null,
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

  const handleSopSelection = (selectedDocumentNumber: string) => {
    setDocumentId(selectedDocumentNumber);
    const selectedSop = availableSops.find(
      (sop) => sop.document_number === selectedDocumentNumber,
    );
    if (selectedSop) setTitle(selectedSop.title);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-theme-border/50 flex justify-between items-center bg-theme-body/30 shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-theme-text tracking-tight">
              Assign Training
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              Record employee qualifications and OJT tasks.
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

            {trainingType === "Self-Reading" && (
              <div className="p-5 bg-theme-body/30 border border-theme-border/50 rounded-2xl space-y-4 animate-fadeIn">
                <p className="text-xs font-bold text-theme-accent uppercase tracking-wide">
                  Document Selection
                </p>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-theme-muted ml-1">
                    Select Active SOP
                  </label>
                  <select
                    required
                    value={documentId}
                    onChange={(e) => handleSopSelection(e.target.value)}
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
                  >
                    <option value="" disabled>
                      Search or select an SOP...
                    </option>
                    {availableSops.map((sop) => (
                      <option key={sop.version_id} value={sop.document_number}>
                        {sop.document_number} - {sop.title} (v{sop.version})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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

            {trainingType === "Classroom" && (
              <div className="p-5 bg-theme-body/30 border border-theme-border/50 rounded-2xl space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all"
                  />
                </div>
              </div>
            )}

            {/* --- NEW: DYNAMIC OJT TASKS --- */}
            {trainingType === "On-Job Training" && (
              <div className="p-5 bg-theme-body/30 border border-theme-border/50 rounded-2xl space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-theme-accent uppercase tracking-wide">
                    Effectiveness Tasks
                  </p>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="text-xs font-bold text-theme-primary hover:text-theme-primaryHover bg-theme-primary/10 px-3 py-1 rounded-lg"
                  >
                    + Add Task
                  </button>
                </div>

                {ojtTasks.map((task, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <textarea
                      required
                      rows={2}
                      value={task}
                      onChange={(e) => handleTaskChange(idx, e.target.value)}
                      placeholder={`Task ${idx + 1} (e.g., Successfully operate Centrifuge #3)`}
                      className="w-full px-4 py-3 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text resize-none transition-all"
                    />
                    {ojtTasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="mt-2 text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            {isLoading ? "Saving..." : "Assign Training"}
          </button>
        </div>
      </div>
    </div>
  );
}
