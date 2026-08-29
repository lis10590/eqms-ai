"use client";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface SopChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sopId: number;
  sopTitle: string;
}

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function SopChatModal({
  isOpen,
  onClose,
  sopId,
  sopTitle,
}: SopChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "bot",
          text: `Hello! I have loaded the SOP: **"${sopTitle}"**. What specific procedure or requirement can I help you find?`,
        },
      ]);
    }
  }, [isOpen, sopTitle, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/direct_sops/${sopId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ question: userText }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `Error: ${data.error}` },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Network error occurred." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-theme-card border border-theme-border rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-theme-border bg-theme-body/30 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-theme-muted uppercase tracking-widest">
                AI Copilot Active
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-theme-text">
              Ask the SOP
            </h2>
            <p className="text-sm font-mono text-theme-muted mt-1 truncate max-w-md">
              Loaded: {sopTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-text border border-theme-border rounded-full p-2 bg-theme-body/50 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-theme-body/10">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-[#0b132b] text-white rounded-tr-sm"
                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm"
                }`}
              >
                {/* Markdown Renderer for Bot Messages */}
                {msg.role === "bot" ? (
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }: any) => (
                          <h1
                            className="text-lg font-bold mt-4 mb-2 text-[#0b132b]"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }: any) => (
                          <h2
                            className="text-md font-bold mt-4 mb-2 text-[#0b132b]"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }: any) => (
                          <h3
                            className="text-sm font-bold mt-3 mb-1 text-[#0b132b] uppercase tracking-wide"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }: any) => (
                          <p className="mb-3 last:mb-0" {...props} />
                        ),
                        ul: ({ node, ...props }: any) => (
                          <ul
                            className="list-disc pl-5 mb-4 space-y-1"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }: any) => (
                          <ol
                            className="list-decimal pl-5 mb-4 space-y-1"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }: any) => (
                          <li className="pl-1" {...props} />
                        ),
                        strong: ({ node, ...props }: any) => (
                          <strong
                            className="font-bold text-[#0b132b]"
                            {...props}
                          />
                        ),
                        hr: ({ node, ...props }: any) => (
                          <hr className="my-4 border-gray-200" {...props} />
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-2xl bg-white border border-gray-200 rounded-tl-sm flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-theme-border bg-theme-body/30 shrink-0">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., How long should I let the sterilizer cool down?"
              className="w-full pl-5 pr-14 py-4 rounded-2xl border border-theme-border bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-[#7a8494] hover:bg-[#5b6474] text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              <svg
                className="w-5 h-5 transform rotate-90"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
