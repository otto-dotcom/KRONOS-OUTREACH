"use client";

import { useEffect, useState, useMemo } from "react";
import { useProject } from "../ProjectContext";
import Link from "next/link";
import { LayoutGrid, List, KanbanSquare, Calendar, Phone, Mail, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";

/* ─── Types ──────────────────────────────────────────── */

interface LeadRow {
  id: string;
  company: string;
  name: string;
  email: string;
  subject: string;
  sentAt: string;
  rank: number;
  leadStatus: string;
  city: string;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
  openedAt?: string;
  clickedAt?: string;
  url?: string;
  phone?: string;
  category?: string;
  scoreReason?: string;
  tech?: string;
  keywords?: string;
  linkedin?: string;
  revenue?: string;
  jobTitle?: string;
  headline?: string;
  seniority?: string;
  companySize?: string;
  companyDesc?: string;
  instagram?: string;
  sector?: string;
  address?: string;
  street?: string;
  postalCode?: string;
  state?: string;
  lastContactDate?: string;
  nextActionDate?: string;
  callCount?: number;
  notes?: string;
}

interface Summary {
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

type SortKey = "sentAt" | "rank" | "company" | "opened" | "clicked" | "lastContactDate";
type FilterTab = "all" | "opened" | "clicked" | "bounced" | "unread" | "contacted";
type ViewMode = "table" | "cards" | "pipeline";
type CRMStage = "prospecting" | "contacted" | "engaged" | "qualified" | "meeting" | "bounced";

interface EmailState {
  generating: boolean;
  subject: string;
  body: string;
  originalSubject: string;
  originalBody: string;
  generated: boolean;
  editingSubject: boolean;
  sending: boolean;
  sent: boolean;
  error: string;
}

interface CallLog {
  date: string;
  duration: number;
  notes: string;
  outcome: "connected" | "voicemail" | "no-answer" | "callback" | "interested" | "not-interested";
}

/* ─── CRM Stage & Config ──────────────────────────────── */

const STAGE_CONFIG: Record<CRMStage, { label: string; color: string; bg: string }> = {
  prospecting: { label: "Prospecting", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  contacted:   { label: "Contacted", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  engaged:     { label: "Engaged", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  qualified:   { label: "Qualified", color: "#FF6B00", bg: "rgba(255,107,0,0.12)" },
  meeting:     { label: "Meeting Set", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  bounced:     { label: "Bounced", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

function getStage(row: LeadRow): CRMStage {
  if (row.bounced) return "bounced";
  if (row.nextActionDate) return "meeting";
  if (row.clicked) return "qualified";
  if (row.opened) return "engaged";
  if (row.delivered || row.sentAt) return "contacted";
  return "prospecting";
}

function StageBadge({ stage }: { stage: CRMStage }) {
  const cfg = STAGE_CONFIG[stage];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      color: cfg.color, background: cfg.bg, padding: "3px 10px", borderRadius: 20,
      border: `1px solid ${cfg.color}40`, fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
      display: "inline-block",
    }}>
      {cfg.label}
    </span>
  );
}

/* ─── UI Helpers ──────────────────────────────────────── */

function Dot({ on, color = "var(--accent)" }: { on: boolean; color?: string }) {
  return (
    <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: on ? color : "rgba(255,255,255,0.08)" }} />
  );
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: accent ? "var(--accent)" : "var(--text-1)", lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--text-3)", textTransform: "uppercase" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Field({ label, value, link }: { label: string; value?: string; link?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      {link ? (
        <a href={value} target="_blank" rel="noreferrer"
          style={{ fontSize: 11, color: "var(--accent)", wordBreak: "break-all", textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = "underline"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = "none"}
        >{value}</a>
      ) : (
        <div style={{ fontSize: 11, color: "var(--text-2)" }}>{value}</div>
      )}
    </div>
  );
}

/* ─── Contact Card (for Cards & Pipeline views) ────────── */

function ContactCard({ row, onClick, mini = false }: {
  row: LeadRow; onClick: () => void; mini?: boolean;
}) {
  const stage = getStage(row);
  const cfg = STAGE_CONFIG[stage];
  const initials = (row.name || row.company || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (mini) {
    return (
      <div onClick={onClick} style={{
        background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px",
        cursor: "pointer", borderLeft: `3px solid ${cfg.color}`, transition: "all 0.15s", marginBottom: 8,
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: cfg.bg,
            border: `1px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: cfg.color,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.company}</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: row.rank >= 8 ? "var(--accent)" : "var(--text-3)" }}>{row.rank}</span>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClick} style={{
      background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px",
      cursor: "pointer", borderTop: `3px solid ${cfg.color}`, transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 12,
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${cfg.color}18`}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: cfg.bg,
            border: `1px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: cfg.color,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.company}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{row.city}</div>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: row.rank >= 8 ? "var(--accent)" : "var(--text-1)" }}>{row.rank}/10</span>
      </div>
      <StageBadge stage={stage} />
      <div>
        <div style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>{row.name}</div>
        <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.email}</div>
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < row.rank ? "var(--accent)" : "var(--border)" }} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[
          { on: row.delivered, color: "#4ade80", label: "D" },
          { on: row.opened, color: "#F59E0B", label: "O" },
          { on: row.clicked, color: "var(--accent)", label: "C" },
          { on: row.bounced, color: "#EF4444", label: "B" },
        ].map(({ on, color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Dot on={on} color={color} />
            <span style={{ fontSize: 8, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{label}</span>
          </div>
        ))}
        {row.callCount ? <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{row.callCount} calls</span> : null}
      </div>
    </div>
  );
}

/* ─── Pipeline (Kanban) view ──────────────────────────── */

function PipelineView({ rows, onSelect }: { rows: LeadRow[]; onSelect: (row: LeadRow) => void }) {
  const stages: CRMStage[] = ["prospecting", "contacted", "engaged", "qualified", "meeting", "bounced"];
  const byStage = useMemo(() => {
    const map: Record<CRMStage, LeadRow[]> = { prospecting: [], contacted: [], engaged: [], qualified: [], meeting: [], bounced: [] };
    rows.forEach(r => map[getStage(r)].push(r));
    return map;
  }, [rows]);

  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
      {stages.map(stage => {
        const cfg = STAGE_CONFIG[stage];
        const stageRows = byStage[stage];
        return (
          <div key={stage} style={{ flexShrink: 0, width: 260, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{cfg.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: `${cfg.color}20`, borderRadius: 20, padding: "1px 7px" }}>{stageRows.length}</span>
            </div>
            <div style={{ flex: 1, maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
              {stageRows.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 11, color: "var(--text-3)" }}>—</div>
              ) : (
                stageRows.map(row => (
                  <ContactCard key={row.id} row={row} onClick={() => onSelect(row)} mini />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Company Detail Modal with Call Tracking ──────────── */

function CompanyModal({ row, onClose, project, brandColor }: {
  row: LeadRow; onClose: () => void; project: string; brandColor: string;
}) {
  const [email, setEmail] = useState<EmailState>({
    generating: false, subject: "", body: "", originalSubject: "", originalBody: "",
    generated: false, editingSubject: false, sending: false, sent: false, error: "",
  });
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [notes, setNotes] = useState(row.notes || "");
  const [nextActionDate, setNextActionDate] = useState(row.nextActionDate || "");
  const [callLog, setCallLog] = useState<CallLog[]>([]);
  const [showCallForm, setShowCallForm] = useState(false);
  const [newCallOutcome, setNewCallOutcome] = useState<"connected" | "voicemail" | "no-answer" | "callback" | "interested" | "not-interested">("connected");
  const [newCallNotes, setNewCallNotes] = useState("");

  const stage = getStage(row);
  const cfg = STAGE_CONFIG[stage];
  const initials = (row.name || row.company || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  async function handleGenerateEmail() {
    setEmail((e) => ({ ...e, generating: true, error: "", generated: false, sent: false }));
    try {
      const leadData = {
        "FULL NAME": row.name, "company name": row.company, City: row.city, EMAIL: row.email,
        Phone: row.phone ?? "", Category: row.category ?? "", URL: row.url ?? "", Rank: row.rank,
        score_reason: row.scoreReason ?? "", lead_status: row.leadStatus, TECHNOLOGY: row.tech ?? "",
        KEYWORDS: row.keywords ?? "", LINKEDIN: row.linkedin ?? "", REVENUE: row.revenue ?? "",
        "JOB TITLE": row.jobTitle ?? "", HEADLINE: row.headline ?? "", SENIORITY: row.seniority ?? "",
        "COMPANY SIZE": row.companySize ?? "", "COMPANY DESCRIPTION": row.companyDesc ?? "", SECTOR: row.sector ?? "",
      };
      const res = await fetch("/api/campaign/regenerate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: row.id, leadData, project }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setEmail((e) => ({ ...e, generating: false, generated: true, subject: data.subject, body: data.emailBody, originalSubject: data.subject, originalBody: data.emailBody }));
    } catch (err) {
      setEmail((e) => ({ ...e, generating: false, error: err instanceof Error ? err.message : "Failed" }));
    }
  }

  async function handleSendEmail() {
    if (!email.generated || !email.subject || !email.body) return;
    setEmail((e) => ({ ...e, sending: true, error: "" }));
    try {
      const res = await fetch("/api/campaign/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: [{
            recordId: row.id, toEmail: row.email, subject: email.subject, emailBody: email.body,
            originalSubject: email.originalSubject || email.subject, originalBody: email.originalBody || email.body,
            wasEdited: email.subject !== email.originalSubject || email.body !== email.originalBody, wasRegenerated: true,
          }],
          project,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setEmail((e) => ({ ...e, sending: false, sent: true }));
    } catch (err) {
      setEmail((e) => ({ ...e, sending: false, error: err instanceof Error ? err.message : "Send failed" }));
    }
  }

  function addCallLog() {
    setCallLog([...callLog, { date: new Date().toISOString(), duration: 0, notes: newCallNotes, outcome: newCallOutcome }]);
    setNewCallNotes("");
    setShowCallForm(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${row.company} — Lead Detail`}>
      <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", width: "100%", maxWidth: "min(1200px, 95vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 16 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: cfg.color }}>{initials}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", textTransform: "uppercase" }}>{row.company}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <StageBadge stage={stage} />
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>{row.name} · {row.city}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {project === "helios" && (
              <Link href="/dashboard/agenda" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--accent-dim)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, fontSize: 11, color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
                <Calendar size={13} />
                Schedule Call
              </Link>
            )}
            <button onClick={onClose} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "var(--text-3)", cursor: "pointer" }} aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body - Three columns */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left: Lead Info */}
          <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid var(--border)", overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 18 }} className="custom-scrollbar">

            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 10 }}>AI Score</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>{row.rank}</span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>/10</span>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 5, borderRadius: 2, background: i < row.rank ? "var(--accent)" : "var(--border)" }} />
                ))}
              </div>
            </div>

            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 12 }}>Email Engagement</div>
              {[
                { label: "Delivered", on: row.delivered, color: "#4ade80", date: undefined },
                { label: "Opened", on: row.opened, color: "#F59E0B", date: row.openedAt },
                { label: "Clicked", on: row.clicked, color: "var(--accent)", date: row.clickedAt },
                { label: "Bounced", on: row.bounced, color: "#EF4444", date: undefined },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Dot on={s.on} color={s.color} />
                    <span style={{ fontSize: 11, color: s.on ? "var(--text-2)" : "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</span>
                  </div>
                  {s.on && s.date && (
                    <span style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                      {new Date(s.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Email" value={row.email} />
              <Field label="Phone" value={row.phone} />
              <Field label="Website" value={row.url} link />
              {row.linkedin && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>LinkedIn</div>
                  <a href={row.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)", padding: "4px 10px", borderRadius: 6, textDecoration: "none", display: "inline-block" }}>
                    VIEW PROFILE →
                  </a>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Sector" value={row.sector || row.category} />
              <Field label="Revenue" value={row.revenue} />
              <Field label="Company Size" value={row.companySize} />
              <Field label="Technology" value={row.tech} />
            </div>
          </div>

          {/* Center: Call Tracking */}
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border)", overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }} className="custom-scrollbar">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-1)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Phone size={14} style={{ color: "var(--accent)" }} />
                Call Management
              </div>
            </div>

            {/* Call Stats */}
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.1em" }}>Calls Made</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{callLog.length}</div>
              {row.lastContactDate && (
                <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 8 }}>
                  Last: {new Date(row.lastContactDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </div>
              )}
            </div>

            {/* Next Action */}
            <div>
              <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.1em" }}>Next Action Date</div>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                style={{
                  width: "100%", padding: "8px", background: "var(--surface-1)", border: "1px solid var(--border)",
                  borderRadius: 6, color: "var(--text-1)", fontSize: 11, outline: "none",
                }}
              />
            </div>

            {/* Add Call */}
            {!showCallForm ? (
              <button
                onClick={() => setShowCallForm(true)}
                style={{
                  width: "100%", padding: "10px", background: "var(--accent-dim)", border: "1px solid rgba(249,115,22,0.3)",
                  borderRadius: 8, color: "var(--accent)", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                + Log Call
              </button>
            ) : (
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.1em" }}>Outcome</div>
                <select
                  value={newCallOutcome}
                  onChange={(e) => setNewCallOutcome(e.target.value as any)}
                  style={{
                    width: "100%", padding: "6px", background: "var(--surface-1)", border: "1px solid var(--border)",
                    borderRadius: 6, color: "var(--text-1)", fontSize: 10, marginBottom: 10,
                  }}
                >
                  <option value="connected">Connected</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="no-answer">No Answer</option>
                  <option value="callback">Callback Requested</option>
                  <option value="interested">Interested</option>
                  <option value="not-interested">Not Interested</option>
                </select>
                <textarea
                  value={newCallNotes}
                  onChange={(e) => setNewCallNotes(e.target.value)}
                  placeholder="Call notes..."
                  style={{
                    width: "100%", padding: "6px", background: "var(--surface-1)", border: "1px solid var(--border)",
                    borderRadius: 6, color: "var(--text-1)", fontSize: 10, minHeight: 60, marginBottom: 8, outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={addCallLog} style={{ flex: 1, padding: "6px", background: "var(--accent)", color: "#000", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>Save</button>
                  <button onClick={() => setShowCallForm(false)} style={{ flex: 1, padding: "6px", background: "var(--surface-1)", color: "var(--text-3)", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", fontSize: 10 }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Call History */}
            {callLog.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent Calls</div>
                {callLog.slice(-3).reverse().map((call, i) => (
                  <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 8, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{call.outcome.replace("-", " ")}</div>
                    <div style={{ fontSize: 9, color: "var(--text-3)" }}>{new Date(call.date).toLocaleDateString()}</div>
                    {call.notes && <div style={{ fontSize: 9, color: "var(--text-2)", marginTop: 4, fontStyle: "italic" }}>{call.notes.substring(0, 60)}...</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div>
              <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.1em" }}>Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lead notes..."
                style={{
                  width: "100%", padding: "10px", background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: 8, color: "var(--text-1)", fontSize: 10, minHeight: 80, outline: "none",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>
          </div>

          {/* Right: Email Generation */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }} className="custom-scrollbar">
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--text-3)", textTransform: "uppercase" }}>Email Generation</div>

            {row.subject && (
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>Last Sent</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", fontStyle: "italic" }}>{row.subject}</div>
                {row.sentAt && <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6, fontFamily: "var(--font-mono)" }}>Sent {new Date(row.sentAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>}
              </div>
            )}

            {!email.sent && (
              <button
                onClick={handleGenerateEmail}
                disabled={email.generating}
                style={{
                  width: "100%", padding: "12px", border: "1px solid rgba(249,115,22,0.4)", background: "transparent",
                  color: "var(--accent)", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700,
                  cursor: email.generating ? "not-allowed" : "pointer", opacity: email.generating ? 0.5 : 1,
                  borderRadius: 8, transition: "background 0.15s",
                }}
              >
                {email.generating ? "GENERATING..." : email.generated ? "↺ REGENERATE" : "GENERATE EMAIL"}
              </button>
            )}

            {email.error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 12, color: "#EF4444", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                ERROR: {email.error}
              </div>
            )}

            {email.generated && !email.sent && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "var(--text-3)", textTransform: "uppercase" }}>Subject</div>
                    <button onClick={() => setEmail((e) => ({ ...e, editingSubject: !e.editingSubject }))} style={{ fontSize: 9, color: email.editingSubject ? "var(--accent)" : "var(--text-3)", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase" }}>
                      {email.editingSubject ? "DONE" : "EDIT"}
                    </button>
                  </div>
                  {email.editingSubject ? (
                    <input type="text" value={email.subject} onChange={(e) => setEmail((s) => ({ ...s, subject: e.target.value }))} style={{ width: "100%", background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-1)", padding: "8px 12px", fontSize: 13, borderRadius: 6, outline: "none" }} />
                  ) : (
                    <div style={{ fontSize: 14, color: "var(--text-1)", fontWeight: 600 }}>{email.subject}</div>
                  )}
                </div>

                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "var(--text-3)", textTransform: "uppercase" }}>Body Preview</div>
                    <button onClick={() => setBodyExpanded((v) => !v)} style={{ fontSize: 9, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", textTransform: "uppercase" }}>
                      {bodyExpanded ? "▲ COLLAPSE" : "▼ EXPAND"}
                    </button>
                  </div>
                  {!bodyExpanded && (
                    <p style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", margin: 0 }}>
                      {email.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)}…
                    </p>
                  )}
                  {bodyExpanded && (
                    <iframe srcDoc={email.body} sandbox="allow-same-origin" style={{ width: "100%", height: 260, border: "1px solid var(--border)", borderRadius: 6, background: "white" }} title="Email preview" />
                  )}
                </div>

                <button onClick={handleSendEmail} disabled={email.sending} style={{
                  width: "100%", padding: "13px", background: "var(--accent)", color: "#000", fontSize: 10, letterSpacing: "0.3em",
                  textTransform: "uppercase", fontWeight: 700, border: "none", cursor: email.sending ? "not-allowed" : "pointer",
                  opacity: email.sending ? 0.5 : 1, borderRadius: 8,
                }}>
                  {email.sending ? "SENDING..." : `SEND TO ${row.email}`}
                </button>
              </div>
            )}

            {email.sent && (
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 12, padding: 24, textAlign: "center" }}>
                <div style={{ width: 10, height: 10, background: "#22C55E", borderRadius: "50%", margin: "0 auto 12px", boxShadow: "0 0 12px #22C55E" }} />
                <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700, color: "#22C55E" }}>Email Sent</div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>{row.email}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Database / CRM Page ──────────────────────── */

export default function DatabasePage() {
  const { project, brandColor } = useProject();
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("sentAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    if (!project) return;
    setLoading(true);
    fetch(`/api/analytics/database?project=${project}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setRows(data.rows ?? []);
        setSummary(data.summary ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [project]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let r = rows;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((row) =>
        row.company.toLowerCase().includes(q) || row.email.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) || row.city.toLowerCase().includes(q)
      );
    }
    if (filter === "opened") r = r.filter((row) => row.opened);
    if (filter === "clicked") r = r.filter((row) => row.clicked);
    if (filter === "bounced") r = r.filter((row) => row.bounced);
    if (filter === "unread") r = r.filter((row) => row.delivered && !row.opened);
    if (filter === "contacted") r = r.filter((row) => row.callCount && row.callCount > 0);

    return [...r].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === "sentAt") { av = a.sentAt; bv = b.sentAt; }
      else if (sortKey === "rank") { av = a.rank; bv = b.rank; }
      else if (sortKey === "company") { av = a.company; bv = b.company; }
      else if (sortKey === "opened") { av = a.opened ? 1 : 0; bv = b.opened ? 1 : 0; }
      else if (sortKey === "lastContactDate") { av = a.lastContactDate || ""; bv = b.lastContactDate || ""; }
      else { av = a.clicked ? 1 : 0; bv = b.clicked ? 1 : 0; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, search, filter, sortKey, sortDir]);

  const SortArrow = ({ k }: { k: SortKey }) =>
    sortKey === k ? <span style={{ color: "var(--accent)", marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span> : <span style={{ color: "var(--border)", marginLeft: 4 }}>↕</span>;

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="blink" style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: "50%" }} />
          <span style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--text-3)", textTransform: "uppercase" }}>Syncing Airtable + Brevo...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "var(--surface-2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, padding: 24, color: "#EF4444", fontSize: 12, fontFamily: "var(--font-mono)" }}>
          ERROR: {error}
        </div>
      </div>
    );
  }

  const openRate = summary && summary.delivered > 0 ? ((summary.opened / summary.delivered) * 100).toFixed(1) : "0";
  const clickRate = summary && summary.delivered > 0 ? ((summary.clicked / summary.delivered) * 100).toFixed(1) : "0";
  const bounceRate = summary && summary.total > 0 ? ((summary.bounced / summary.total) * 100).toFixed(1) : "0";

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "opened", label: "Opened", count: summary?.opened },
    { key: "clicked", label: "Clicked", count: summary?.clicked },
    { key: "contacted", label: "Called", count: 0 },
    { key: "unread", label: "Unread" },
    { key: "bounced", label: "Bounced", count: summary?.bounced },
  ];

  return (
    <>
      {selected && project && <CompanyModal row={selected} onClose={() => setSelected(null)} project={project} brandColor={brandColor} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="fade-up">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div className="blink" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
              <span style={{ fontSize: 10, letterSpacing: "0.3em", color: "var(--text-3)", textTransform: "uppercase" }}>CRM // Airtable × Brevo × Call Tracking</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-1)", margin: 0, fontFamily: "var(--font-mono)" }}>
              LEAD<span style={{ color: "var(--accent)" }}>BASE</span>
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(["table", "cards", "pipeline"] as ViewMode[]).map((mode) => {
              const icons = { table: <List size={14} />, cards: <LayoutGrid size={14} />, pipeline: <KanbanSquare size={14} /> };
              const labels = { table: "Table", cards: "Cards", pipeline: "Pipeline" };
              return (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", border: "1px solid", borderRadius: 8,
                    fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    borderColor: viewMode === mode ? "var(--accent)" : "var(--border)",
                    background: viewMode === mode ? "var(--accent-dim)" : "var(--surface-2)",
                    color: viewMode === mode ? "var(--accent)" : "var(--text-3)",
                  }}
                >
                  {icons[mode]}
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <StatCard label="Sent" value={summary?.total ?? 0} />
          <StatCard label="Delivered" value={summary?.delivered ?? 0} />
          <StatCard label="Opened" value={summary?.opened ?? 0} sub={`${openRate}%`} accent />
          <StatCard label="Clicked" value={summary?.clicked ?? 0} sub={`${clickRate}% CTR`} accent />
          <StatCard label="Bounced" value={summary?.bounced ?? 0} sub={`${bounceRate}%`} />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                style={{
                  fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "6px 14px", border: "1px solid",
                  borderRadius: 20, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
                  borderColor: filter === tab.key ? "var(--accent)" : "var(--border)",
                  background: filter === tab.key ? "var(--accent-dim)" : "transparent",
                  color: filter === tab.key ? "var(--accent)" : "var(--text-3)", fontWeight: filter === tab.key ? 700 : 500,
                }}
              >
                {tab.label}
                {tab.count !== undefined && <span style={{ fontSize: 9, opacity: 0.7 }}>{tab.count}</span>}
              </button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, name, email..."
              style={{
                background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)",
                fontSize: 11, padding: "8px 36px 8px 14px", borderRadius: 8, outline: "none", width: 280,
                transition: "border-color 0.15s",
              }}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.5)"}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1l8 8M9 1L1 9" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* View: TABLE */}
        {viewMode === "table" && (
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {([
                      { label: "Company", key: "company" as SortKey },
                      { label: "Stage", key: null },
                      { label: "Contact", key: null },
                      { label: "Score", key: "rank" as SortKey },
                      { label: "Last Contact", key: "lastContactDate" as SortKey },
                      { label: "Calls", key: null },
                      { label: "D", key: null },
                      { label: "O", key: "opened" as SortKey },
                      { label: "C", key: "clicked" as SortKey },
                    ] as { label: string; key: SortKey | null }[]).map((col, i) => (
                      <th key={i} onClick={col.key ? () => toggleSort(col.key as SortKey) : undefined}
                        style={{
                          textAlign: "left", fontSize: 9, letterSpacing: "0.2em", color: "var(--text-3)",
                          textTransform: "uppercase", padding: "10px 16px", whiteSpace: "nowrap",
                          cursor: col.key ? "pointer" : "default", background: "var(--surface-1)",
                          userSelect: "none",
                        }}
                      >
                        {col.label}
                        {col.key && <SortArrow k={col.key} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "60px 0", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase" }}>
                        No records match
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => {
                      const stage = getStage(row);
                      const cfg = STAGE_CONFIG[stage];
                      return (
                        <tr key={row.id} onClick={() => setSelected(row)}
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", borderLeft: `3px solid ${cfg.color}` }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", textTransform: "uppercase", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{row.company}</div>
                            {row.city && <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase" }}>{row.city}</div>}
                          </td>
                          <td style={{ padding: "12px 16px" }}><StageBadge stage={stage} /></td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontSize: 11, color: "var(--text-2)" }}>{row.name}</div>
                            <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{row.email}</div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: row.rank >= 8 ? "var(--accent)" : "var(--text-1)" }}>{row.rank}</span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                            {row.lastContactDate ? new Date(row.lastContactDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>{row.callCount || 0}</td>
                          <td style={{ padding: "12px 16px" }}><Dot on={row.delivered} color="#4ade80" /></td>
                          <td style={{ padding: "12px 16px" }}><Dot on={row.opened} color="#F59E0B" /></td>
                          <td style={{ padding: "12px 16px" }}><Dot on={row.clicked} color="var(--accent)" /></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 18px", borderTop: "1px solid var(--border)", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
              <span>{filtered.length} of {rows.length} leads</span>
              <span>Click to open lead detail</span>
            </div>
          </div>
        )}

        {/* View: CARDS */}
        {viewMode === "cards" && (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", fontSize: 12, color: "var(--text-3)" }}>No records match</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {filtered.map((row) => (
                  <ContactCard key={row.id} row={row} onClick={() => setSelected(row)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* View: PIPELINE */}
        {viewMode === "pipeline" && <PipelineView rows={filtered} onSelect={setSelected} />}
      </div>
    </>
  );
}
