"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { logUserQuery } from "@/lib/supabase/insights";
import { LogoMark } from "@/components/Logo";
import { SendIcon, TrashIcon } from "@/components/Icons";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { ScanProgress } from "@/components/app/ScanProgress";

/* ─── helpers ─────────────────────────────────────────────────────── */

function scoreColor(s: number) {
  if (s >= 75) return "text-emerald-400";
  if (s >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(s: number) {
  if (s >= 75) return "bg-emerald-400/10 border-emerald-400/20";
  if (s >= 50) return "bg-amber-400/10 border-amber-400/20";
  return "bg-red-400/10 border-red-400/20";
}

const DOMAIN_RE = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

/** Naïve markdown → JSX (bold + bullets only — no extra deps needed). */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
      // Bullet
      const content = trimmed.slice(2);
      result.push(
        <li key={i} className="ml-4 list-none flex gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          <span>{boldify(content)}</span>
        </li>
      );
    } else if (trimmed === "") {
      result.push(<div key={i} className="h-2" />);
    } else {
      result.push(<p key={i}>{boldify(trimmed)}</p>);
    }
  });

  return <div className="space-y-0.5 text-sm leading-relaxed text-white/80">{result}</div>;
}

/** Replace **text** with <strong> */
function boldify(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}

/* ─── types ───────────────────────────────────────────────────────── */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  type: "text" | "project" | "project-list" | "limit" | "welcome" | "quick-actions" | "scanning";
  content: string;
  project?: Project;
  projects?: Project[];
  scanDomain?: string;
}

interface ChatDashboardProps {
  userEmail: string | null;
  projects: Project[];
  isLoading: boolean;
  planName?: string;
  projectLimit?: number;
  initialDomain?: string;
  onUpgradeRequest?: () => void;
}

/* ─── quick action chips ──────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "🌐 Add a domain", value: "How do I add a project?" },
  { label: "📊 What is AEO?", value: "What is AEO and why does it matter?" },
  { label: "💡 Improve my score", value: "How can I improve my AEO score?" },
  { label: "📈 View investment plans", value: "pricing" },
];

/* ─── intent classification ───────────────────────────────────────── */
type Intent =
  | "add_domain"
  | "scan_project"
  | "help"
  | "pricing"
  | "what_is_aeo"
  | "improve_score"
  | "greet"
  | "list_projects"
  | "unknown";

function classifyIntent(input: string): Intent {
  const t = input.toLowerCase().trim();
  if (DOMAIN_RE.test(t.replace(/^(add|scan|check|analyze)\s+/i, "").trim())) return "add_domain";
  if (/^(add|new|create|track)\s+/.test(t)) return "add_domain";
  if (/^(scan|analyze|check|run)\s+/.test(t)) return "scan_project";
  if (/\b(price|pricing|plan|cost|upgrade|invest|pay)\b/.test(t)) return "pricing";
  if (/\b(what is aeo|what('s| is) (geo|seo|aeo)|explain|definition)\b/.test(t)) return "what_is_aeo";
  if (/\b(improve|increase|boost|raise|fix|optimize)\b/.test(t)) return "improve_score";
  if (/\b(help|what can|what do|how do)\b/.test(t)) return "help";
  if (/\b(hi|hello|hey|hiya|yo)\b/.test(t)) return "greet";
  if (/\b(list|show|my projects?|all projects?)\b/.test(t)) return "list_projects";
  if (DOMAIN_RE.test(t)) return "add_domain";
  return "unknown";
}

function extractDomain(input: string): string | null {
  const cleaned = input
    .toLowerCase()
    .replace(/^(add|scan|check|analyze|new|create|track)\s+/i, "")
    .replace(/^(project|domain|site|website|url)\s*/i, "")
    .trim();
  if (DOMAIN_RE.test(cleaned)) return cleaned;
  return null;
}

function cleanDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];
}

/* ─── response builder ────────────────────────────────────────────── */
function buildResponse(
  intent: Intent,
  projects: Project[],
  projectLimit: number,
  userEmail: string | null
): { type: ChatMessage["type"]; content: string } {
  switch (intent) {
    case "greet":
      return {
        type: "text",
        content: `Hey! 👋 Great to have you here.\n\nI'm AEO Pilot — I help brands rank in **AI + Google**. Here's what I can do:\n\n• **Add your domain** — type something like \`example.com\`\n• **Score your site** — across SEO, AEO & GEO\n• **Tell you what to fix** — prioritized, instant recommendations\n\nWhat would you like to start with?`,
      };
    case "help":
      return {
        type: "text",
        content: `Here's everything I can help with:\n\n• **Add a project** — type your domain e.g. \`stripe.com\`\n• **Run a scan** — click any project card below\n• **Understand your score** — ask "How can I improve?"\n• **View plans** — type "pricing"\n• **Learn AEO** — ask "What is AEO?"\n\nYou currently have **${projects.length}/${projectLimit}** projects on your plan.`,
      };
    case "pricing":
      return {
        type: "text",
        content: `Here are your **investment options**:\n\n• **Starter (Free)** — 2 projects, 5 scans/month, 4 AI engines\n• **Growth (₹3,999/mo)** — 5 projects, 100 scans, all 8 engines, AI monitoring, competitor tracking\n• **Agency (₹15,999/mo)** — 25 projects, unlimited scans, white-label reports, API access\n• **Enterprise** — Custom pricing, unlimited everything, dedicated success manager\n\nYou're currently on **${userEmail ? "Starter" : "free preview"}**. Type "upgrade" or scroll to the pricing section.`,
      };
    case "what_is_aeo":
      return {
        type: "text",
        content: `**AEO (Answer Engine Optimization)** is the practice of making your brand the answer AI models give.\n\nSearch is splitting three ways:\n\n• **SEO** — rank in Google's 10 blue links\n• **AEO** — be the single answer AI engines return\n• **GEO** — get cited by ChatGPT, Gemini, Claude & Perplexity\n\nMost tools cover one. **AEO Pilot covers all three** with one score, one workflow.\n\nAdd your domain to see where you stand today.`,
      };
    case "improve_score":
      return {
        type: "text",
        content: `**To improve your Search Visibility Score**, focus on these pillars:\n\n• **SEO** — fix technical issues (HTTPS, canonicals, mobile, metadata)\n• **AEO** — add schema markup (FAQ, Organization, Article), improve content answerability\n• **GEO** — build citations in trusted sources, add \`llms.txt\`, create citable long-form content\n\nThe fastest wins are usually schema + FAQ additions — these directly impact AI citations.\n\nAdd your domain and I'll give you a **prioritized fix list** specific to your site.`,
      };
    case "list_projects":
      return {
        type: "project-list",
        content:
          projects.length > 0
            ? `Here are your **${projects.length}** project${projects.length > 1 ? "s" : ""}:`
            : `You don't have any projects yet. Type your domain to get started — e.g. \`yourbrand.com\``,
      };
    default:
      return {
        type: "text",
        content: `I'm here to help you rank in **AI + Google**.\n\n• Type a domain like \`yourbrand.com\` to add a project\n• Ask me "What is AEO?" to learn more\n• Type "help" for a full list of commands\n\nWhat would you like to do?`,
      };
  }
}

/* ─── component ───────────────────────────────────────────────────── */

export function ChatDashboard({
  userEmail,
  projects,
  isLoading,
  planName = "Starter",
  projectLimit = 2,
  initialDomain,
  onUpgradeRequest,
}: ChatDashboardProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [scanningDomain, setScanningDomain] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] =
    useState<"project_limit" | "scan_limit" | "monitoring">("project_limit");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* mutations */
  const createProject = useMutation({
    mutationFn: (domain: string) => api.createProject(domain),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ["projects", userEmail] });
      // Immediately kick off a scan — show premium progress UI
      setScanningDomain(project.domain);
      setMessages((prev) => [
        ...prev,
        {
          id: `scanning-${project.id}`,
          role: "assistant",
          type: "scanning",
          content: project.domain,
          scanDomain: project.domain,
        },
      ]);
      startScan.mutate(project.id);
    },
    onError: (e) => {
      setScanningDomain(null);
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
      // Give ScanProgress time to animate before navigating
      setTimeout(() => {
        router.push(`/scans/${scan.id}`);
      }, 800);
    },
    onError: (e) => {
      setScanningDomain(null);
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

  const deleteProject = useMutation({
    mutationFn: (projectId: string) => api.deleteProject(projectId),
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: ["projects", userEmail] });
      setMessages((prev) =>
        prev.filter((m) => !(m.type === "project" && m.project?.id === deletedId))
      );
    },
    onError: (e) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          type: "text",
          content: `❌ Couldn't delete project — ${(e as Error).message.slice(0, 140)}`,
        },
      ]);
    },
  });

  /* initialise messages once data loads */
  useEffect(() => {
    if (!isLoading && messages.length === 0) {
      const initialMessages: ChatMessage[] = [
        {
          id: "welcome",
          role: "assistant",
          type: "welcome",
          content: !userEmail
            ? `👋 Welcome to **AEO Pilot** — the AI search agency platform.\n\nSign in to start ranking your brand across **SEO, AEO & GEO**. First score takes under 60 seconds.`
            : `👋 Hey${userEmail ? `, ${userEmail.split("@")[0]}` : ""}! I'm AEO Pilot.\n\nI rank your brand in **AI + Google** — one score across SEO, AEO & GEO. You have **${projects.length}/${projectLimit}** projects on your ${planName} plan.\n\n${
                projects.length < projectLimit
                  ? "Type a domain to get started, or pick a project below."
                  : `You've used all ${projectLimit} free projects. Upgrade to track more brands.`
              }`,
        },
        {
          id: "quick-actions",
          role: "assistant",
          type: "quick-actions",
          content: "",
        },
      ];

      if (projects.length > 0) {
        initialMessages.push({
          id: "projects-header",
          role: "assistant",
          type: "text",
          content: `Here are your **${projects.length}** project${projects.length > 1 ? "s" : ""}:`,
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

      // Auto-fire domain from ?domain= query param (coming from homepage scan)
      if (initialDomain) {
        if (userEmail) {
          // Authenticated — fire the domain scan immediately
          setTimeout(() => {
            void handleSend(null, initialDomain);
          }, 400);
        } else {
          // Not authenticated — show the domain they entered + a sign-in prompt
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: "init-user-domain",
                role: "user",
                type: "text",
                content: initialDomain,
              },
              {
                id: "init-auth-prompt",
                role: "assistant",
                type: "text",
                content: `🔒 To scan **${initialDomain}** I need to save your results — that requires a quick sign-in.\n\nYour domain is saved. **Sign in or create a free account** and I'll kick off the scan the moment you're in.`,
              },
            ]);
          }, 300);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  /* auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const openUpgrade = useCallback(
    (reason: typeof upgradeReason = "project_limit") => {
      setUpgradeReason(reason);
      setUpgradeOpen(true);
      if (onUpgradeRequest) onUpgradeRequest();
    },
    [onUpgradeRequest]
  );

  /* send message handler */
  const handleSend = async (e: React.FormEvent | null, overrideText?: string) => {
    if (e) e.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text) return;

    if (!userEmail) {
      const domain = extractDomain(text) || cleanDomain(text) || text;
      router.push(`/login?next=${encodeURIComponent(`/app?domain=${domain}`)}`);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      type: "text",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    void logUserQuery({
      message: text,
      kind: "chat",
      context: { route: "/app", projectCount: projects.length },
    });

    const intent = classifyIntent(text);

    await new Promise((r) => setTimeout(r, 600));

    try {
      if (intent === "add_domain") {
        const domain = extractDomain(text);
        if (!domain) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              type: "text",
              content:
                "💡 I couldn't find a valid domain in that. Try something like `yourbrand.com` or `add stripe.com`.",
            },
          ]);
        } else if (projects.length >= projectLimit) {
          openUpgrade("project_limit");
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              type: "limit",
              content: `You've reached your **${planName}** plan limit of **${projectLimit} projects**. Upgrade to track more brands.`,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              type: "text",
              content: `✨ Got it! Adding **${domain}** to your projects…`,
            },
          ]);
          createProject.mutate(domain);
        }
      } else if (intent === "list_projects") {
        const resp = buildResponse(intent, projects, projectLimit, userEmail);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            type: resp.type,
            content: resp.content,
            projects: projects,
          },
        ]);
        if (projects.length > 0) {
          projects.forEach((project) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `list-project-${project.id}-${Date.now()}`,
                role: "assistant",
                type: "project",
                content: project.domain,
                project,
              },
            ]);
          });
        }
      } else {
        const resp = buildResponse(intent, projects, projectLimit, userEmail);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            type: resp.type,
            content: resp.content,
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
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
  };

  const handleProjectClick = (project: Project) => {
    if (project.latest_scan_id) {
      router.push(`/scans/${project.latest_scan_id}`);
    } else {
      startScan.mutate(project.id);
    }
  };

  const handleQuickAction = (value: string) => {
    void handleSend(null, value);
  };

  /* ─── render ──────────────────────────────────────────────────── */
  return (
    <>
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason={upgradeReason}
        currentPlan={planName.toLowerCase()}
      />

      <div className="flex h-full flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-5 px-6 py-6">
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
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
              style={{ animationDuration: "0.25s" }}
            >
              {msg.role === "assistant" ? (
                <div className="flex max-w-2xl gap-3 w-full">
                  <LogoMark size={28} className="mt-1 shrink-0 rounded-lg shadow-lg" />
                  <div className="min-w-0 flex-1 space-y-3">
                    {/* Welcome */}
                    {msg.type === "welcome" && (
                      <div className="rounded-2xl border border-brand-500/25 bg-gradient-to-b from-brand-500/10 to-transparent p-5">
                        {renderMarkdown(msg.content)}
                      </div>
                    )}

                    {/* Quick actions */}
                    {msg.type === "quick-actions" && (
                      <div className="flex flex-wrap gap-2">
                        {QUICK_ACTIONS.map((a) => (
                          <button
                            key={a.label}
                            onClick={() => handleQuickAction(a.value)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-brand-500/40 hover:bg-white/10 hover:text-white"
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Project card */}
                    {msg.type === "project" && msg.project && (
                      <div className="relative w-full max-w-md">
                        <button
                          onClick={() => handleProjectClick(msg.project!)}
                          className="group w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-brand-500/40 hover:bg-white/[0.06]"
                        >
                          <div className="flex items-start justify-between gap-3 pr-6">
                            <div className="min-w-0">
                            <h3 className="truncate font-semibold text-white">
                              {msg.project.domain}
                            </h3>
                            <p className="mt-0.5 text-xs text-white/40">
                              Added {new Date(msg.project.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {msg.project.latest_score !== null ? (
                            <div
                              className={`flex flex-col items-center rounded-xl border px-3 py-2 ${scoreBg(msg.project.latest_score)}`}
                            >
                              <span
                                className={`text-2xl font-black tabular-nums ${scoreColor(msg.project.latest_score)}`}
                              >
                                {Math.round(msg.project.latest_score)}
                              </span>
                              <span className="text-[9px] uppercase tracking-wide text-white/30">
                                score
                              </span>
                            </div>
                          ) : (
                            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/40">
                              Not scanned
                            </span>
                          )}
                        </div>

                        {/* Pillar pills */}
                        <div className="mt-4 flex gap-2">
                          <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                            SEO
                          </span>
                          <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                            AEO
                          </span>
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                            GEO
                          </span>
                          <span className="ml-auto text-xs text-white/30 group-hover:text-brand-400 transition">
                            {msg.project.latest_scan_id ? "View scan →" : "Run scan →"}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this project?")) {
                            deleteProject.mutate(msg.project!.id);
                          }
                        }}
                        className="absolute top-3 right-3 p-2 text-white/20 hover:text-red-400 transition"
                        title="Delete project"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                    )}

                    {/* Limit card */}
                    {msg.type === "limit" && (
                      <div className="max-w-md rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
                        {renderMarkdown(msg.content)}
                        <button
                          onClick={() => openUpgrade("project_limit")}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-amber-400"
                        >
                          Upgrade plan →
                        </button>
                      </div>
                    )}

                    {/* Regular text */}
                    {(msg.type === "text" || msg.type === "project-list") && (
                      <div className="max-w-2xl rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        {renderMarkdown(msg.content)}
                      </div>
                    )}

                    {/* Scanning progress */}
                    {msg.type === "scanning" && msg.scanDomain && (
                      <ScanProgress
                        domain={msg.scanDomain}
                        onComplete={() => {
                          // Navigation handled by startScan.onSuccess with a delay
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* User bubble */
                <div className="max-w-sm rounded-2xl bg-brand-600 px-4 py-3">
                  <p className="text-sm text-white">{msg.content}</p>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {(isTyping || createProject.isPending || startScan.isPending) && (
            <div className="flex justify-start">
              <div className="flex max-w-2xl gap-3">
                <LogoMark size={28} className="mt-1 shrink-0 rounded-lg" />
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  {createProject.isPending || startScan.isPending ? (
                    <div className="flex items-center gap-2.5">
                      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
                      <span className="text-sm text-white/60">
                        {startScan.isPending
                          ? "Starting your scan…"
                          : "Crawling your site…"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-0.5">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="h-2 w-2 animate-bounce rounded-full bg-brand-400"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/8 bg-ink-900/60 backdrop-blur p-5">
          <form
            onSubmit={handleSend}
            className="mx-auto flex max-w-2xl gap-3"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  !userEmail
                    ? "Type a domain like stripe.com, or ask me anything…"
                    : projects.length >= projectLimit
                      ? "Upgrade to add more projects…"
                      : "Type a domain like stripe.com, or ask me anything…"
                }
                disabled={isTyping || createProject.isPending}
                className="w-full rounded-xl border border-white/10 bg-ink-900/80 px-4 py-3 pr-10 text-sm text-white placeholder-white/25 transition focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/20 disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend(null);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping || createProject.isPending}
              className="rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-500 disabled:opacity-40 flex items-center gap-2"
            >
              {isTyping || createProject.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <SendIcon size={18} />
              )}
            </button>
          </form>

          <div className="mx-auto mt-2 max-w-2xl flex items-center justify-between">
            {!userEmail ? (
              <p className="text-xs text-white/35">
                💡{" "}
                <a href="/login" className="underline hover:text-white/60">
                  Sign in
                </a>{" "}
                to create your first project and get scored in 60 seconds.
              </p>
            ) : projects.length >= projectLimit ? (
              <button
                onClick={() => openUpgrade("project_limit")}
                className="text-xs text-amber-400 hover:text-amber-300 transition"
              >
                📊 {planName} plan · {projectLimit} project limit ·{" "}
                <span className="underline">Upgrade →</span>
              </button>
            ) : (
              <p className="text-xs text-white/25">
                Press Enter to send · {planName} plan · {projects.length}/{projectLimit} projects
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
