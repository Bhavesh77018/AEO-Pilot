"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { logUserQuery } from "@/lib/supabase/insights";
import { LogoMark } from "@/components/Logo";
import { SendIcon } from "@/components/Icons";

function scoreColor(s: number) {
  if (s >= 75) return "text-emerald-400";
  if (s >= 50) return "text-amber-400";
  return "text-red-400";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  type?: "text" | "project" | "limit" | "welcome";
  content: string;
  project?: Project;
}

interface ChatDashboardProps {
  userEmail: string | null;
  projects: Project[];
  isLoading: boolean;
}

export function ChatDashboard({
  userEmail,
  projects,
  isLoading,
}: ChatDashboardProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createProject = useMutation({
    mutationFn: (domain: string) => api.createProject(domain),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setMessages((prev) => [
        ...prev,
        {
          id: `created-${project.id}`,
          role: "assistant",
          type: "text",
          content: `✅ Added ${project.domain}! Tap the card below to run your first Search Visibility scan — SEO + AEO + GEO.`,
        },
        { id: `project-${project.id}`, role: "assistant", type: "project", content: project.domain, project },
      ]);
    },
    onError: (e) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          type: "text",
          content: `❌ Couldn't add that domain — ${(e as Error).message.slice(0, 140)}`,
        },
      ]);
    },
  });

  const startScan = useMutation({
    mutationFn: (projectId: string) => api.startScan(projectId),
    onSuccess: (scan) => {
      router.push(`/scans/${scan.id}`);
    },
    onError: (e) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          type: "text",
          content: `❌ Couldn't start the scan — ${(e as Error).message.slice(0, 140)}`,
        },
      ]);
    },
  });

  // Initialize messages
  useEffect(() => {
    if (!isLoading && messages.length === 0) {
      const initialMessages: ChatMessage[] = [
        {
          id: "welcome",
          role: "assistant",
          type: "welcome",
          content: `👋 Hey! I'm AEO Pilot. I score your site across SEO, AEO & GEO — so you rank in Google AND get cited by ChatGPT, Gemini, Claude & Perplexity.\n\n${
            !userEmail
              ? "Sign in to start analyzing your websites for AI visibility."
              : `You have ${projects.length}/2 free projects. ${
                  projects.length < 2
                    ? "Type a domain to add a new project!"
                    : "You've reached your project limit on the free plan. Upgrade to add more."
                }`
          }`,
        },
      ];

      if (projects.length > 0) {
        initialMessages.push({
          id: "projects-list",
          role: "assistant",
          type: "text",
          content: "Here are your projects:",
        });

        projects.forEach((project) => {
          initialMessages.push({
            id: `project-${project.id}`,
            role: "assistant",
            type: "project",
            content: project.domain,
            project,
          });
        });
      }

      setMessages(initialMessages);
    }
  }, [isLoading, userEmail, projects, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userEmail) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      type: "text",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim().toLowerCase();
    // Capture the query (best-effort) so we can improve the product over time.
    void logUserQuery({
      message: input.trim(),
      kind: "chat",
      context: { route: "/app", projectCount: projects.length },
    });
    setInput("");
    setIsTyping(true);

    // Simulate processing delay
    setTimeout(async () => {
      try {
        // Check if user is trying to add a project
        if (
          currentInput.includes("add") ||
          currentInput.includes("new") ||
          currentInput.includes("project") ||
          currentInput.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        ) {
          if (projects.length >= 2) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "assistant",
                type: "limit",
                content: `⚠️ You've reached your free plan limit of 2 projects. \n\nCurrent projects: ${projects.length}/2\n\nUpgrade to Growth or Agency plan to add more projects and get AI monitoring, competitor tracking, and done-for-you services.`,
              },
            ]);
          } else {
            // Extract domain from input
            let domain = currentInput;
            if (currentInput.includes("add")) {
              domain = currentInput.replace("add", "").trim();
            }
            if (domain.includes("project")) {
              domain = domain.replace("project", "").trim();
            }

            if (domain && domain.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
              createProject.mutate(domain);
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "assistant",
                  type: "text",
                  content: `✨ Adding ${domain}... This will take a moment as I analyze your site's AEO score.`,
                },
              ]);
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "assistant",
                  type: "text",
                  content:
                    "💡 Type a domain like `example.com` or say `add example.com` to get started.",
                },
              ]);
            }
          }
        } else if (currentInput.includes("help")) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              type: "text",
              content: `Here's what I can help with:
• **Add a project**: Type a domain like "stripe.com"
• **Scan a project**: Click a project card to run an AEO scan
• **View pricing**: Type "pricing" to see our plans
• **Sign in**: Click your email to sign out or the login link to sign in

What would you like to do?`,
            },
          ]);
        } else if (currentInput.includes("pricing")) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              type: "text",
              content: `📊 **AEO Pilot Pricing**

• **Free**: 2 projects, 5 scans/month
• **Growth**: ₹3,999/mo - 5 projects, 100 scans, AI monitoring
• **Agency**: ₹15,999/mo - 25 projects, unlimited scans
• **Enterprise**: Custom - unlimited everything

You're currently on the **Free** plan. Upgrade anytime!`,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              type: "text",
              content: `I'm here to help you optimize your AI visibility. You can:\n\n1. **Add a project** - Type your domain (e.g., "example.com")\n2. **View projects** - They're listed above\n3. **Get help** - Type "help"\n\nWhat would you like to do?`,
            },
          ]);
        }
      } catch (error) {
        console.error("Error processing message:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            type: "text",
            content: "❌ Something went wrong. Please try again.",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 800);
  };

  const handleProjectClick = (project: Project) => {
    if (project.latest_scan_id) {
      router.push(`/scans/${project.latest_scan_id}`);
    } else {
      startScan.mutate(project.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-6">
        {isLoading && messages.length === 0 && (
          <div className="flex items-center gap-3">
            <LogoMark size={28} className="rounded-lg" />
            <div className="flex items-center gap-2 text-sm text-white/50">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
              Loading your workspace…
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" ? (
              <div className="flex max-w-2xl gap-3">
                <LogoMark size={28} className="mt-1 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-3">
                {msg.type === "project" && msg.project ? (
                  // Project card message
                  <button
                    onClick={() => handleProjectClick(msg.project!)}
                    className="text-left w-full max-w-md rounded-lg border border-white/10 bg-white/5 hover:bg-white/[0.08] p-4 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white">
                          {msg.project.domain}
                        </h3>
                        <p className="text-xs text-white/40 mt-1">
                          {new Date(msg.project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {msg.project.latest_score !== null && (
                        <div className={`text-2xl font-black tabular-nums ${scoreColor(msg.project.latest_score)}`}>
                          {Math.round(msg.project.latest_score)}
                        </div>
                      )}
                    </div>
                    {msg.project.latest_score !== null && (
                      <p className="text-xs text-white/50">
                        Latest score: {msg.project.latest_score}/100 · Click to scan
                      </p>
                    )}
                  </button>
                ) : msg.type === "limit" ? (
                  // Limit reached message
                  <div className="max-w-2xl rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    <a
                      href="/#pricing"
                      className="mt-3 inline-block rounded-lg bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 text-sm font-semibold transition"
                    >
                      View Plans →
                    </a>
                  </div>
                ) : msg.type === "welcome" ? (
                  // Welcome message
                  <div className="max-w-2xl rounded-lg border border-brand-500/30 bg-brand-500/10 p-4">
                    <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  // Regular text message
                  <div className="max-w-2xl rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                )}
                </div>
              </div>
            ) : (
              // User message
              <div className="max-w-2xl rounded-lg bg-brand-600 p-4">
                <p className="text-white text-sm">{msg.content}</p>
              </div>
            )}
          </div>
        ))}

        {/* Typing / working indicator */}
        {(isTyping || createProject.isPending || startScan.isPending) && (
          <div className="flex justify-start">
            <div className="flex max-w-2xl gap-3">
              <LogoMark size={28} className="mt-1 shrink-0 rounded-lg" />
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {createProject.isPending || startScan.isPending ? (
                  <div className="flex items-center gap-2.5">
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
                    <span className="text-sm text-white/70">
                      {startScan.isPending ? "Starting your scan…" : "Adding & analyzing your site…"}
                    </span>
                    <span className="hidden text-[11px] text-white/30 sm:inline">
                      the server may take a few seconds to wake
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "0.15s" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "0.3s" }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 bg-ink-800/50 p-6">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                !userEmail
                  ? "Sign in to start analyzing..."
                  : projects.length >= 2
                    ? "Project limit reached. Upgrade to add more..."
                    : "Type a domain or say 'help'..."
              }
              disabled={!userEmail || isTyping || createProject.isPending}
              className="flex-1 rounded-xl border border-white/10 bg-ink-900/50 px-4 py-3 text-white placeholder-white/30 focus:border-brand-500/50 focus:outline-none disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping || !userEmail || createProject.isPending}
              className="rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 px-4 py-3 font-semibold text-white transition flex items-center justify-center gap-2"
            >
              {isTyping || createProject.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <SendIcon size={18} />
              )}
            </button>
          </div>
          {!userEmail && (
            <p className="mt-2 text-xs text-white/40">
              💡 Sign in to create your first project
            </p>
          )}
          {projects.length >= 2 && (
            <p className="mt-2 text-xs text-amber-400">
              📊 Free plan limit: 2 projects. Upgrade for more.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
