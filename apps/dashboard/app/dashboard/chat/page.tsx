"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useProject } from "../ProjectContext";
import { useRouter } from "next/navigation";

/* ── Branded Service Icons ─────────────────────────────────────────────── */

function AirtableIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="4" fill="#FCB400"/>
      <rect x="5" y="6" width="22" height="8" rx="2" fill="white"/>
      <rect x="5" y="17" width="10" height="9" rx="2" fill="white"/>
      <rect x="17" y="17" width="10" height="9" rx="2" fill="white" opacity="0.5"/>
    </svg>
  );
}

function BrevoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="4" fill="#0092FF"/>
      <path d="M8 10h10c3.3 0 6 2.7 6 6s-2.7 6-6 6H8V10z" fill="white" opacity="0.9"/>
      <circle cx="18" cy="16" r="3" fill="#0092FF"/>
    </svg>
  );
}

function TwilioIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="16" fill="#F22F46"/>
      <circle cx="16" cy="16" r="5" fill="none" stroke="white" strokeWidth="2.5"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
      <circle cx="20" cy="12" r="2" fill="white"/>
      <circle cx="12" cy="20" r="2" fill="white"/>
      <circle cx="20" cy="20" r="2" fill="white"/>
    </svg>
  );
}

function ObsidianIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <polygon points="16,2 28,8 28,20 16,30 4,20 4,8" fill="#7C3AED"/>
      <polygon points="16,2 28,8 22,16" fill="#A78BFA" opacity="0.8"/>
      <polygon points="4,8 10,16 16,2" fill="#5B21B6" opacity="0.9"/>
      <polygon points="22,16 16,30 10,16 16,14" fill="#C4B5FD" opacity="0.7"/>
    </svg>
  );
}

function JarvisIcon({ size = 20, color = "#FF6B00" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" opacity="0.3"/>
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5"/>
      <path d="M12 6v2M12 16v2M6 12H8M16 12h2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2" fill={color}/>
    </svg>
  );
}

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Message {
  role: "user" | "assistant";
  content: string;
}

/* ── Renderer: Parses UI Blocks ────────────────────────────────────────── */

function MessageRenderer({ content, brandColor, project }: {
  content: string;
  brandColor: string;
  project: string | null;
}) {
  const router = useRouter();
  const parts = content.split(/(```ui-[a-z-]+[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        // ── ui-lead card ─────────────────────────────────────────────
        if (part.startsWith("```ui-lead")) {
          try {
            const jsonStr = part.replace(/^```ui-lead\n?/, "").replace(/```$/, "").trim();
            const lead = JSON.parse(jsonStr);
            const hasDbLink = !!lead.id;
            return (
              <div key={i} className="my-3 rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg"
                style={{ borderColor: `${brandColor}30`, background: "rgba(0,0,0,0.4)" }}>
                <div className="px-4 py-2 flex items-center justify-between text-[8px] uppercase tracking-widest font-bold border-b"
                  style={{ borderColor: `${brandColor}20`, backgroundColor: `${brandColor}10`, color: brandColor }}>
                  <div className="flex items-center gap-2">
                    <AirtableIcon size={12} />
                    <span>Lead Profile</span>
                  </div>
                  {lead.opened && <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">OPENED</span>}
                  {lead.clicked && <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 ml-1">CLICKED</span>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-black text-sm tracking-tight">{lead.company || "Unknown"}</h4>
                      <p className="text-white/50 text-[11px] mt-0.5">{lead.name || "—"} · {lead.email || "—"}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] text-white/30 uppercase tracking-wider mb-1">Rank</div>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border"
                        style={{ borderColor: `${brandColor}50`, color: brandColor }}>
                        {lead.rank ?? "?"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {lead.city && (
                      <span className="text-[9px] px-2 py-1 rounded bg-white/5 border border-white/5 text-white/40 tracking-widest uppercase">
                        📍 {lead.city}
                      </span>
                    )}
                    {hasDbLink && (
                      <button
                        onClick={() => router.push(`/dashboard/database?highlight=${lead.id}`)}
                        className="text-[9px] px-2 py-1 rounded border tracking-widest uppercase transition-all hover:opacity-80 cursor-pointer font-bold"
                        style={{ borderColor: `${brandColor}60`, color: brandColor, backgroundColor: `${brandColor}10` }}
                      >
                        → Open in Database
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          } catch {
            return <p key={i} className="text-red-400 text-xs my-1">Failed to render lead card.</p>;
          }
        }

        // ── ui-analytics card ────────────────────────────────────────
        if (part.startsWith("```ui-analytics")) {
          try {
            const jsonStr = part.replace(/^```ui-analytics\n?/, "").replace(/```$/, "").trim();
            const s = JSON.parse(jsonStr);
            const openRate = s.sent > 0 ? ((s.opens / s.sent) * 100).toFixed(1) : "0";
            const clickRate = s.opens > 0 ? ((s.clicks / s.opens) * 100).toFixed(1) : "0";
            return (
              <div key={i} className="my-3 rounded-xl border overflow-hidden" style={{ borderColor: `${brandColor}30` }}>
                <div className="px-4 py-2 flex items-center gap-2 text-[8px] uppercase tracking-widest font-bold border-b"
                  style={{ borderColor: `${brandColor}20`, backgroundColor: `${brandColor}10`, color: brandColor }}>
                  <BrevoIcon size={12} />
                  <span>Campaign Analytics</span>
                  <span className="ml-auto text-white/30">{s.period || "Last 30d"}</span>
                </div>
                <div className="p-4 grid grid-cols-4 gap-3">
                  {[
                    { label: "Sent", value: s.sent ?? 0, hex: "#FFFFFF" },
                    { label: "Opens", value: `${s.opens ?? 0} (${openRate}%)`, hex: "#60A5FA" },
                    { label: "Clicks", value: `${s.clicks ?? 0} (${clickRate}%)`, hex: brandColor },
                    { label: "Bounced", value: s.bounced ?? 0, hex: "#F87171" },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-2 rounded-lg bg-white/5">
                      <div className="text-[8px] text-white/30 uppercase tracking-wider mb-1">{m.label}</div>
                      <div className="text-base font-black font-mono" style={{ color: m.hex }}>
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          } catch {
            return <p key={i} className="text-red-400 text-xs my-1">Failed to render analytics card.</p>;
          }
        }

        // ── ui-table card ────────────────────────────────────────────
        if (part.startsWith("```ui-table")) {
          try {
            const jsonStr = part.replace(/^```ui-table\n?/, "").replace(/```$/, "").trim();
            const t = JSON.parse(jsonStr);
            return (
              <div key={i} className="my-3 rounded-xl border overflow-hidden" style={{ borderColor: `${brandColor}30` }}>
                <div className="px-4 py-2 flex items-center gap-2 text-[8px] uppercase tracking-widest font-bold border-b"
                  style={{ borderColor: `${brandColor}20`, backgroundColor: `${brandColor}10`, color: brandColor }}>
                  <AirtableIcon size={12} />
                  <span>{t.title || "Records"}</span>
                  {t.rows?.length != null && <span className="ml-auto text-white/30">{t.rows.length} rows</span>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5">
                        {t.columns?.map((col: string, ci: number) => (
                          <th key={ci} className="px-4 py-2 text-left text-[9px] uppercase tracking-widest text-white/30 font-bold whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {t.rows?.map((row: (string | number)[], ri: number) => (
                        <tr key={ri} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-2.5 text-white/75 whitespace-nowrap">{String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          } catch {
            return <p key={i} className="text-red-400 text-xs my-1">Failed to render table.</p>;
          }
        }

        // ── ui-contact card ──────────────────────────────────────────
        if (part.startsWith("```ui-contact")) {
          try {
            const jsonStr = part.replace(/^```ui-contact\n?/, "").replace(/```$/, "").trim();
            const c = JSON.parse(jsonStr);
            return (
              <div key={i} className="my-3 rounded-xl border overflow-hidden" style={{ borderColor: "#0092FF40", background: "rgba(0,146,255,0.04)" }}>
                <div className="px-4 py-2 flex items-center gap-2 text-[8px] uppercase tracking-widest font-bold border-b border-[#0092FF20]"
                  style={{ backgroundColor: "rgba(0,146,255,0.10)", color: "#0092FF" }}>
                  <BrevoIcon size={12} />
                  <span>Brevo Contact</span>
                  {c.blacklisted && <span className="ml-auto px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">BLACKLISTED</span>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-black text-sm">{c.name || c.email}</p>
                      <p className="text-white/40 text-[11px] mt-0.5">{c.email}</p>
                    </div>
                    <div className="text-right text-[9px] text-white/30">
                      {c.lastActivity && <span>Last active: {c.lastActivity}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Opens", val: c.opens ?? "—", color: "#60A5FA" },
                      { label: "Clicks", val: c.clicks ?? "—", color: brandColor },
                      { label: "Lists", val: Array.isArray(c.lists) ? c.lists.join(", ") : (c.lists ?? "—"), color: "#A78BFA" },
                    ].map(m => (
                      <div key={m.label} className="text-center p-2 rounded-lg bg-white/5">
                        <div className="text-[8px] text-white/30 uppercase tracking-wider mb-1">{m.label}</div>
                        <div className="text-sm font-black font-mono" style={{ color: m.color }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          } catch {
            return <p key={i} className="text-red-400 text-xs my-1">Failed to render contact card.</p>;
          }
        }

        // ── ui-campaign card ─────────────────────────────────────────
        if (part.startsWith("```ui-campaign")) {
          try {
            const jsonStr = part.replace(/^```ui-campaign\n?/, "").replace(/```$/, "").trim();
            const camp = JSON.parse(jsonStr);
            const statusColor = camp.status === "sent" ? "#22C55E" : camp.status === "draft" ? "#F59E0B" : "#888";
            return (
              <div key={i} className="my-3 rounded-xl border overflow-hidden" style={{ borderColor: "#0092FF40" }}>
                <div className="px-4 py-2 flex items-center justify-between text-[8px] uppercase tracking-widest font-bold border-b border-[#0092FF20]"
                  style={{ backgroundColor: "rgba(0,146,255,0.08)", color: "#0092FF" }}>
                  <div className="flex items-center gap-2"><BrevoIcon size={12} /><span>Campaign Report</span></div>
                  <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: `${statusColor}20`, color: statusColor }}>{camp.status?.toUpperCase()}</span>
                </div>
                <div className="p-4">
                  <p className="text-white font-black text-sm mb-1">{camp.name}</p>
                  {camp.sentDate && <p className="text-white/30 text-[10px] mb-3">Sent {camp.sentDate}</p>}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Sent", val: camp.sent ?? 0, color: "#fff" },
                      { label: "Delivered", val: camp.delivered ?? "—", color: "#22C55E" },
                      { label: "Opens", val: camp.opens != null ? `${camp.opens} (${camp.openRate}%)` : "—", color: "#60A5FA" },
                      { label: "Clicks", val: camp.clicks != null ? `${camp.clicks} (${camp.clickRate}%)` : "—", color: brandColor },
                      { label: "Bounced", val: camp.bounced ?? 0, color: "#F87171" },
                    ].map(m => (
                      <div key={m.label} className="text-center p-2 rounded-lg bg-white/5">
                        <div className="text-[8px] text-white/25 uppercase tracking-wider mb-1">{m.label}</div>
                        <div className="text-xs font-black font-mono leading-tight" style={{ color: m.color }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          } catch {
            return <p key={i} className="text-red-400 text-xs my-1">Failed to render campaign card.</p>;
          }
        }

        // ── ui-status card ───────────────────────────────────────────
        if (part.startsWith("```ui-status")) {
          try {
            const jsonStr = part.replace(/^```ui-status\n?/, "").replace(/```$/, "").trim();
            const s = JSON.parse(jsonStr);
            const statusColors = { ok: "#22C55E", warn: "#F59E0B", error: "#EF4444" };
            const c = statusColors[s.status as keyof typeof statusColors] || "#888";
            return (
              <div key={i} className="my-3 rounded-xl border p-4 flex items-start gap-3"
                style={{ borderColor: `${c}40`, backgroundColor: `${c}08` }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ backgroundColor: c }} />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: c }}>{s.title}</div>
                  <p className="text-sm text-white/70">{s.message}</p>
                </div>
              </div>
            );
          } catch {
            return null;
          }
        }

        // ── Standard text ────────────────────────────────────────────
        const lines = part.split("\n");
        return lines.map((line, j) => {
          if (!line.trim()) return <div key={`${i}-${j}`} className="h-2" />;
          if (line.startsWith("### ")) return <h3 key={`${i}-${j}`} className="text-white font-black text-sm uppercase tracking-widest mt-4 mb-2">{line.replace("### ", "")}</h3>;
          if (line.startsWith("## ")) return <h2 key={`${i}-${j}`} className="text-white font-black uppercase tracking-widest mt-4 mb-2" style={{ fontSize: "13px" }}>{line.replace("## ", "")}</h2>;
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <div key={`${i}-${j}`} className="flex items-start gap-2 my-1">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: brandColor }} />
                <p className="text-sm text-white/85 leading-relaxed">{line.substring(2)}</p>
              </div>
            );
          }
          if (/^\d+\./.test(line)) {
            const [num, ...rest] = line.split(". ");
            return (
              <div key={`${i}-${j}`} className="flex items-start gap-2 my-1">
                <span className="text-[10px] font-black shrink-0 mt-0.5" style={{ color: brandColor }}>{num}.</span>
                <p className="text-sm text-white/85 leading-relaxed">{rest.join(". ")}</p>
              </div>
            );
          }
          if (line.startsWith("**") && line.endsWith("**")) {
            return <p key={`${i}-${j}`} className="text-white font-black text-sm my-1">{line.replace(/\*\*/g, "")}</p>;
          }
          return <p key={`${i}-${j}`} className="text-sm text-white/85 leading-relaxed my-1">{line}</p>;
        });
      })}
    </>
  );
}

/* ── Loading Dots ──────────────────────────────────────────────────────── */
function LoadingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl rounded-bl-sm bg-black/40 border border-white/10 w-fit">
      <JarvisIcon size={14} color={color} />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 ml-1">Processing</span>
    </div>
  );
}

/* ── Quick Action Pills ─────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "Pipeline Status", icon: "📊", prompt: "What is the current status of the lead pipeline?" },
  { label: "Who Clicked", icon: "👆", prompt: "Show me who clicked our emails — render as lead cards." },
  { label: "Email Analytics", icon: "📈", prompt: "Show me email delivery and open rate analytics." },
  { label: "Recent Sends", icon: "📨", prompt: "What were the last 5 emails we sent? Show subjects." },
  { label: "Preview Campaign", icon: "✨", prompt: "Generate previews for the top 5 leads." },
  { label: "Check Logs", icon: "🔍", prompt: "Read the latest operation logs." },
];

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function AgentChat() {
  const { project, brandColor } = useProject();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Jarvis online. Intelligence layer active for **${(project ?? "SYSTEM").toUpperCase()}**.\n\nSecure neural link established. I have access to Airtable leads, Brevo analytics, SMS via Twilio, and Obsidian memory. What needs to be done?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Reset welcome message when project changes
  useEffect(() => {
    if (project) {
      setMessages([{
        role: "assistant",
        content: `Jarvis online. Intelligence layer active for **${project.toUpperCase()}**.\n\nSecure neural link established. I have access to Airtable leads, Brevo analytics, SMS via Twilio, and Obsidian memory. What needs to be done?`
      }]);
    }
  }, [project]);

  const handleSubmit = useCallback(async (e: React.FormEvent | null, overrideInput?: string) => {
    e?.preventDefault();
    const text = overrideInput ?? input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: [...messages, userMessage], project }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "```ui-status\n{\"title\":\"System Error\",\"status\":\"error\",\"message\":\"Unable to reach intelligence core. Verify API keys and network connection.\"}\n```"
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, project, isLoading]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between p-5 mb-5 rounded-2xl border border-white/5 bg-black/30 backdrop-blur-sm fade-up">
        <div className="flex items-center gap-4">
          {/* Animated pulsing core */}
          <div className="relative flex h-10 w-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-15" style={{ backgroundColor: brandColor }} />
            <div className="relative h-10 w-10 rounded-full border border-white/10 bg-black/60 flex items-center justify-center">
              <JarvisIcon size={20} color={brandColor} />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-black tracking-[0.25em] uppercase font-mono text-white">
              JARVIS <span style={{ color: brandColor }}>// INTELLIGENCE CORE</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
              <p className="text-[10px] text-white/40 tracking-[0.2em] font-mono uppercase">
                {project}_environment · GPT-4o-mini · 13 tools active
              </p>
            </div>
          </div>
        </div>

        {/* Service badges */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <AirtableIcon size={12} />
            <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider">Airtable</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <BrevoIcon size={12} />
            <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider">Brevo</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <TwilioIcon size={12} />
            <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider">Twilio</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
            <ObsidianIcon size={12} />
            <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider">Memory</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-5 rounded-2xl border border-white/5 bg-black/20 backdrop-blur-sm mb-5"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[85%] md:max-w-[78%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"} gap-3 items-end`}>
              {/* Avatar */}
              <div className="shrink-0 mb-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-white/10" : "bg-black/60 border border-white/5"}`}>
                  {m.role === "user" ? (
                    <span className="text-white/70 text-xs font-black">YOU</span>
                  ) : (
                    <JarvisIcon size={16} color={brandColor} />
                  )}
                </div>
              </div>

              {/* Bubble */}
              <div
                className={`relative p-4 shadow-xl ${m.role === "user" ? "text-black" : "bg-black/50 border border-white/8 text-white/90"}`}
                style={{
                  backgroundColor: m.role === "user" ? brandColor : undefined,
                  borderRadius: m.role === "user" ? "1rem 1rem 0 1rem" : "1rem 1rem 1rem 0",
                }}
              >
                <div className="text-[8px] uppercase tracking-[0.25em] font-black mb-2 opacity-40">
                  {m.role === "user" ? "OPERATOR" : `JARVIS // ${(project ?? "").toUpperCase()}`}
                </div>
                <div className="font-sans">
                  <MessageRenderer content={m.content} brandColor={brandColor} project={project} />
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="ml-11">
              <LoadingDots color={brandColor} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative">
        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto mb-3 pb-1" style={{ scrollbarWidth: "none" }}>
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              disabled={isLoading}
              onClick={() => handleSubmit(null, action.prompt)}
              className="flex items-center gap-2 whitespace-nowrap bg-black/60 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-full text-[10px] tracking-wide text-white/60 hover:text-white transition-all font-mono disabled:opacity-30 cursor-pointer"
            >
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-3 p-2 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md focus-within:border-white/25 transition-all"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Command Jarvis..."
            className="w-full bg-transparent p-4 text-sm text-white focus:outline-none resize-none min-h-[52px] max-h-[200px] font-sans placeholder:text-white/20"
            rows={1}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 h-12 w-12 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 mb-1 mr-1 cursor-pointer"
            style={{
              backgroundColor: input.trim() && !isLoading ? brandColor : "rgba(255,255,255,0.05)",
              color: input.trim() && !isLoading ? "black" : "white",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
          </button>
        </form>

        <p className="text-center text-[9px] text-white/15 font-mono tracking-widest uppercase mt-3">
          Jarvis does not hallucinate. All numbers come from live tool calls.
        </p>
      </div>
    </div>
  );
}
