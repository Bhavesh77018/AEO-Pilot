"use client";

import Link from "next/link";
import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatPilotInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm AEO Pilot. Let's get your brand mentioned in AI answers.",
    },
    {
      role: "assistant",
      content: "Drop your website domain below, and I'll scan for AI visibility across ChatGPT, Gemini, Claude, and Perplexity in under 60 seconds.",
    },
  ]);
  const [input, setInput] = useState("example.com");

  const handleScan = () => {
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: input }]);

    // Simulate assistant response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Scanning ${input} across 8 engines... 🔍`,
        },
      ]);
    }, 500);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `✅ Scan complete! Your AI presence score: 68/100. You're missing mentions in 3 engines. Let's fix that.`,
        },
      ]);
    }, 2000);

    setInput("");
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent p-6 backdrop-blur">
      {/* Chat messages */}
      <div className="mb-6 max-h-80 space-y-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-brand-500 text-white"
                  : "border border-white/15 bg-white/[0.05] text-white/80"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleScan()}
          placeholder="your-domain.com"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 transition focus:border-brand-500/50 focus:bg-white/10 focus:outline-none"
        />
        <button
          onClick={handleScan}
          disabled={!input.trim()}
          className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-50"
        >
          Scan
        </button>
      </div>

      {/* Footer note */}
      <p className="mt-4 text-center text-xs text-white/35">
        Free scan includes AI visibility scores across 8 engines
      </p>
    </div>
  );
}
