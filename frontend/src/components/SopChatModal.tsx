"use client";

import React, { useState, useRef, useEffect } from "react";

interface SopChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sopId: number;
  sopTitle: string;
}

export default function SopChatModal({
  isOpen,
  onClose,
  sopId,
  sopTitle,
}: SopChatModalProps) {
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset chat when opened
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: "ai",
          text: `Hello! I have loaded the SOP: "${sopTitle}". What specific procedure or requirement can I help you find?`,
        },
      ]);
    }
  }, [isOpen, sopTitle]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sops/${sopId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ question: userMessage }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "❌ Error: Could not reach the AI engine." },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "❌ Network error occurred." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
      <div className="bg-theme-card/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-theme-border/50 w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-theme-border/50 flex justify-between items-center bg-theme-body/30 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                AI Copilot Active
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-theme-text tracking-tight flex items-center gap-2">
              Ask the SOP
            </h2>
            <p className="text-xs text-theme-muted font-mono mt-1">
              Loaded: {sopTitle}
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

        {/* Chat Messages Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-theme-body/10">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-theme-primary text-white rounded-br-none"
                    : "bg-theme-card border border-theme-border/50 text-theme-text rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-theme-card border border-theme-border/50 rounded-2xl rounded-bl-none p-4 shadow-sm flex gap-2 items-center">
                <div className="w-2 h-2 bg-theme-muted rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-theme-muted rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-theme-muted rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-theme-body/50 border-t border-theme-border/50 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., How long should I let the sterilizer cool down?"
              className="w-full px-5 py-4 bg-theme-card border border-theme-border rounded-2xl focus:ring-2 focus:ring-theme-accent outline-none text-theme-text transition-all pr-16 shadow-inner text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 bg-theme-primary text-white px-4 rounded-xl hover:bg-theme-primaryHover disabled:opacity-50 transition-all flex items-center justify-center shadow-md"
            >
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
