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

interface ToolEvent {
  tool: string;
  ok?: boolean;
  round?: number;
  ts: number;
}

/* ── Inline markdown renderer ──────────────────────────────────────────── */
function renderInline(text: string, brandColor: string): React.ReactNode {
  // Split on **bold** patterns
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  if (segments.length === 1) return text;
  return segments.map((seg, k) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={k} style={{ color: brandColor, fontWeight: 800 }}>{seg.slice(2, -2)}</strong>;
    }
    return seg;
  });
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
                        <tr key={ri} className="border-b border-white/5 hover:bg-white/5 transition-colors">
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
          if (line.startsWith("### ")) return <h3 key={`${i}-${j}`} className="text-white font-black text-sm uppercase tracking-widest mt-4 mb-2">{renderInline(line.replace("### ", ""), brandColor)}</h3>;
          if (line.startsWith("## ")) return <h2 key={`${i}-${j}`} className="text-white font-black uppercase tracking-widest mt-4 mb-2" style={{ fontSize: "13px" }}>{renderInline(line.replace("## ", ""), brandColor)}</h2>;
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <div key={`${i}-${j}`} className="flex items-start gap-2 my-1">
                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: brandColor }} />
                <p className="text-sm text-white/85 leading-relaxed">{renderInline(line.substring(2), brandColor)}</p>
              </div>
            );
          }
          if (/^\d+\./.test(line)) {
            const dotIdx = line.indexOf(". ");
            const num = line.slice(0, dotIdx);
            const rest = line.slice(dotIdx + 2);
            return (
              <div key={`${i}-${j}`} className="flex items-start gap-2 my-1">
                <span className="text-[10px] font-black shrink-0 mt-0.5" style={{ color: brandColor }}>{num}.</span>
                <p className="text-sm text-white/85 leading-relaxed">{renderInline(rest, brandColor)}</p>
              </div>
            );
          }
          return <p key={`${i}-${j}`} className="text-sm text-white/85 leading-relaxed my-1">{renderInline(line, brandColor)}</p>;
        });
      })}
    </>
  );
}

/* ── Tool name formatter ────────────────────────────────────────────────── */
const TOOL_LABELS: Record<string, string> = {
  airtable_get_leads:       "Fetching leads",
  airtable_get_lead_by_email: "Looking up lead",
  airtable_get_leads_stats: "Counting pipeline",
  airtable_update_lead:     "Updating record",
  airtable_create_lead:     "Creating record",
  brevo_get_contacts:       "Fetching contacts",
  brevo_get_contact:        "Looking up contact",
  brevo_get_campaigns:      "Fetching campaigns",
  brevo_get_smtp_events:    "Fetching SMTP events",
  brevo_get_email_stats:    "Fetching email stats",
  brevo_send_transactional: "Sending email",
  brevo_get_aggregated_stats:"Fetching aggregates",
  twilio_send_sms:          "Sending SMS",
  obsidian_read:            "Reading memory",
  obsidian_write:           "Writing memory",
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name.replace(/_/g, " ");
}

/* ── Loading Indicator ──────────────────────────────────────────────────── */
function LoadingDots({ color, currentTool, toolHistory }: {
  color: string;
  currentTool: string | null;
  toolHistory: ToolEvent[];
}) {
  return (
    <div className="space-y-2">
      {/* Tool history log */}
      {toolHistory.length > 0 && (
        <div className="flex flex-col gap-0.5 pl-11">
          {toolHistory.slice(-4).map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px] font-mono tracking-wider">
              <span className={t.ok === false ? "text-red-400" : "text-white/25"}>
                {t.ok === false ? "✕" : "✓"}
              </span>
              <span className={t.ok === false ? "text-red-400/60" : "text-white/20"}>
                {toolLabel(t.tool)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Active loading bubble */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl rounded-bl-sm bg-black/40 border border-white/10 w-fit">
        <JarvisIcon size={14} color={color} />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <span className="text-[10px] uppercase font-mono tracking-widest ml-1" style={{ color: currentTool ? color : undefined, opacity: currentTool ? 0.7 : 0.3 }}>
          {currentTool ? toolLabel(currentTool) : "Processing"}
        </span>
      </div>
    </div>
  );
}

/* ── Quick Action Pills ─────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "Pipeline Status", icon: "📊", prompt: "Give me the full pipeline status — total, sent, ready, priority. Show top leads as lead cards." },
  { label: "Who Engaged", icon: "👆", prompt: "Show me all leads who opened or clicked our emails. Render each as a lead card." },
  { label: "Email Analytics", icon: "📈", prompt: "Show email analytics for the last 30 days as an analytics card." },
  { label: "Recent Sends", icon: "📨", prompt: "Show the last 10 emails we sent as a table: company, city, subject, rank." },
  { label: "Campaigns", icon: "📣", prompt: "List our Brevo email campaigns with stats. Show as campaign cards." },
  { label: "Preview Campaign", icon: "✨", prompt: "Generate email copy previews for the top 5 leads. Don't send anything." },
  { label: "Top Priority Leads", icon: "🎯", prompt: "List all priority leads that haven't been emailed yet. Show as a table." },
  { label: "Check Bounces", icon: "⚠️", prompt: "Check Brevo SMTP events for bounce events in the last 7 days." },
  { label: "SMTP Events", icon: "🔍", prompt: "Get the last 50 Brevo SMTP events and summarise: how many delivered, opened, clicked, bounced?" },
];

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function AgentChat() {
  const { project, brandColor } = useProject();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `JARVIS online. Intelligence core active for **${(project ?? "SYSTEM").toUpperCase()}**.\n\n22 tools armed: Airtable read/write, Brevo contacts/campaigns/SMTP events, transactional send, Twilio SMS, Obsidian memory.\n\nWhat needs to be done?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [toolHistory, setToolHistory] = useState<ToolEvent[]>([]);
  const [lastFailedInput, setLastFailedInput] = useState<{ text: string; msgs: Message[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, currentTool]);

  // Reset welcome message when project changes
  useEffect(() => {
    if (project) {
      setMessages([{
        role: "assistant",
        content: `Jarvis online. Intelligence layer active for **${project.toUpperCase()}**.\n\nSecure neural link established. I have access to Airtable leads, Brevo analytics, SMS via Twilio, and Obsidian memory. What needs to be done?`
      }]);
      setToolHistory([]);
      setLastFailedInput(null);
    }
  }, [project]);

  const sendRequest = useCallback(async (text: string, priorMessages: Message[]) => {
    const userMessage: Message = { role: "user", content: text };
    const allMessages = [...priorMessages, userMessage];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    setCurrentTool(null);
    setToolHistory([]);
    setLastFailedInput(null);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: allMessages, project }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";
      let gotContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: Record<string, unknown>;
          try { event = JSON.parse(line); } catch { continue; }

          if (event.type === "tool_start") {
            const tool = event.tool as string;
            setCurrentTool(tool);
            setToolHistory(prev => [...prev, { tool, round: event.round as number, ts: Date.now() }]);
          } else if (event.type === "tool_end") {
            setCurrentTool(null);
            setToolHistory(prev => {
              const copy = [...prev];
              // Mark the last matching tool entry
              for (let i = copy.length - 1; i >= 0; i--) {
                if (copy[i].tool === event.tool && copy[i].ok === undefined) {
                  copy[i] = { ...copy[i], ok: event.ok as boolean };
                  break;
                }
              }
              return copy;
            });
          } else if (event.type === "content") {
            gotContent = true;
            setMessages(prev => [...prev, { role: "assistant", content: event.text as string }]);
          } else if (event.type === "limit") {
            gotContent = true;
            setMessages(prev => [...prev, {
              role: "assistant",
              content: "```ui-status\n{\"title\":\"Tool Limit\",\"status\":\"warn\",\"message\":\"Reached the maximum tool-call rounds. Try rephrasing or breaking the request into smaller steps.\"}\n```"
            }]);
          } else if (event.type === "error") {
            throw new Error(event.message as string);
          }
        }
      }

      if (!gotContent) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "```ui-status\n{\"title\":\"No Response\",\"status\":\"warn\",\"message\":\"JARVIS returned no content. Try again or check API keys.\"}\n```"
        }]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setLastFailedInput({ text, msgs: priorMessages });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `\`\`\`ui-status\n${JSON.stringify({ title: "System Error", status: "error", message: msg })}\n\`\`\``
      }]);
    } finally {
      setIsLoading(false);
      setCurrentTool(null);
    }
  }, [project]);

  const handleSubmit = useCallback(async (e: React.FormEvent | null, overrideInput?: string) => {
    e?.preventDefault();
    const text = overrideInput ?? input;
    if (!text.trim() || isLoading) return;
    await sendRequest(text, messages);
  }, [input, messages, isLoading, sendRequest]);

  const handleRetry = useCallback(() => {
    if (!lastFailedInput || isLoading) return;
    sendRequest(lastFailedInput.text, lastFailedInput.msgs);
  }, [lastFailedInput, isLoading, sendRequest]);

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
                {project}_environment · GPT-4o-mini · 22 tools active
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
              <LoadingDots color={brandColor} currentTool={currentTool} toolHistory={toolHistory} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative">
        {/* Retry bar */}
        {lastFailedInput && !isLoading && (
          <div className="flex items-center justify-between px-4 py-2.5 mb-2 rounded-xl border border-red-500/20 bg-red-500/5">
            <span className="text-[10px] font-mono text-red-400/70 uppercase tracking-widest">Last request failed</span>
            <button
              onClick={handleRetry}
              className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              ↺ Retry
            </button>
          </div>
        )}

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
