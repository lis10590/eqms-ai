"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import LogTrainingModal from "@/components/LogTrainingModal";
import TrainingDetailsModal from "@/components/TrainingDetailsModal";
import QuizModal from "@/components/QuizModal";

export default function TrainingsDashboard() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [filterEmployeeId, setFilterEmployeeId] = useState("All");

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // 1. Fetch Current User Profile
      const userProfileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trainings/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (userProfileRes.ok) setCurrentUser(await userProfileRes.json());

      // 2. Fetch Trainings
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trainings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrainings(data);
        if (selectedTraining) {
          const updated = data.find((t: any) => t.id === selectedTraining.id);
          if (updated) setSelectedTraining(updated);
        }
      }

      // 3. Fetch Users for Filter
      const userRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trainings/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (userRes.ok) setUsers(await userRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (training: any) => {
    setSelectedTraining(training);
    setIsDetailsModalOpen(true);
  };

  const filteredTrainings = trainings.filter(
    (t) =>
      filterEmployeeId === "All" ||
      t.employee_id.toString() === filterEmployeeId,
  );

  const isQaOrAdmin =
    currentUser?.role === "admin" || currentUser?.role === "qa_user";

  return (
    <div className="min-h-screen text-theme-text transition-colors duration-500">
      <Navbar />

      <main className="max-w-7xl mx-auto mt-6 sm:mt-12 p-4 sm:p-8">
        <div className="bg-theme-card/60 backdrop-blur-2xl rounded-3xl shadow-theme-card border border-theme-border/50 overflow-hidden transition-all duration-500">
          {/* Header Section */}
          <div className="p-6 sm:p-8 border-b border-theme-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Personnel Qualifications
              </h1>
              <p className="text-theme-muted mt-1 text-sm sm:text-base font-medium">
                Manage and track employee GMP training records.
              </p>
            </div>

            {/* Filter and Action Buttons (Stacked on Mobile, Row on Desktop) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-theme-body/50 border border-theme-border/50 rounded-2xl px-4 py-3 sm:py-2 w-full sm:w-auto">
                <svg
                  className="w-4 h-4 text-theme-muted shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <select
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  className="bg-transparent outline-none text-theme-text text-sm font-bold w-full truncate"
                >
                  <option value="All">All Employees</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ONLY RENDER BUTTON FOR QA/ADMIN */}
              {isQaOrAdmin && (
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="w-full sm:w-auto bg-theme-primary text-white px-6 py-3 rounded-2xl hover:bg-theme-primaryHover font-bold shadow-md transition-all whitespace-nowrap flex justify-center items-center gap-2"
                >
                  + Assign Training
                </button>
              )}
            </div>
          </div>

          {/* ========================================== */}
          {/* MOBILE CARD VIEW (Hidden on md and larger) */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
            {filteredTrainings.length === 0 ? (
              <div className="py-12 text-center text-theme-muted font-medium flex flex-col items-center gap-3">
                <svg
                  className="w-10 h-10 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                No training records found.
              </div>
            ) : (
              filteredTrainings.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => handleRowClick(t)}
                  className="bg-theme-body/30 p-5 rounded-2xl border border-theme-border/50 shadow-sm cursor-pointer hover:bg-theme-card transition-colors flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-theme-text text-lg">
                        {t.employee_name}
                      </h3>
                      <span className="inline-block mt-1 px-2 py-1 bg-theme-body border border-theme-border/50 rounded-md text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                        {t.training_type}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${t.status === "Completed" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-theme-border/30 mt-1">
                    <span className="text-[10px] uppercase font-bold text-theme-muted tracking-wider block mb-1">
                      Subject / SOP
                    </span>
                    <span className="font-semibold text-theme-text text-sm leading-snug block">
                      {t.title}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ========================================== */}
          {/* DESKTOP TABLE VIEW (Hidden on mobile)      */}
          {/* ========================================== */}
          <div className="hidden md:block overflow-x-auto p-4 sm:p-8">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-theme-border/50 text-theme-muted">
                  <th className="pb-4 font-bold uppercase tracking-wider pl-4 whitespace-nowrap">
                    Employee
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    Type
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    Subject / SOP
                  </th>
                  <th className="pb-4 font-bold uppercase tracking-wider whitespace-nowrap pr-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/30">
                {filteredTrainings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-theme-muted font-medium"
                    >
                      No training records found.
                    </td>
                  </tr>
                ) : (
                  filteredTrainings.map((t: any) => (
                    <tr
                      key={t.id}
                      onClick={() => handleRowClick(t)}
                      className="hover:bg-theme-body/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-5 pl-4 font-bold text-theme-text group-hover:text-theme-primary transition-colors whitespace-nowrap">
                        {t.employee_name}
                      </td>
                      <td className="py-5 whitespace-nowrap pr-4">
                        <span className="px-2 py-1 bg-theme-body border border-theme-border/50 rounded-md text-xs font-bold">
                          {t.training_type}
                        </span>
                      </td>
                      <td className="py-5 pr-4">
                        <span className="font-medium text-theme-text block min-w-200">
                          {t.title}
                        </span>
                      </td>
                      <td className="py-5 whitespace-nowrap pr-4">
                        <span
                          className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${t.status === "Completed" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <LogTrainingModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={fetchData}
      />

      <TrainingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        training={selectedTraining}
        onSuccess={fetchData}
        currentUser={currentUser}
        onOpenQuiz={() => {
          setIsDetailsModalOpen(false);
          setIsQuizModalOpen(true);
        }}
      />

      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        training={selectedTraining}
        onSuccess={fetchData}
      />
    </div>
  );
}
