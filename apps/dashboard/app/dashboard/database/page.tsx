"use client";

import { useEffect, useState, useMemo } from "react";
import { useProject } from "../ProjectContext";

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
  // extended
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
}

interface Summary {
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

type SortKey = "sentAt" | "rank" | "company" | "opened" | "clicked";
type FilterTab = "all" | "opened" | "clicked" | "bounced" | "unread";

interface EmailState {
  generating: boolean;
  subject: string;
  body: string;
  generated: boolean;
  editingSubject: boolean;
  sending: boolean;
  sent: boolean;
  error: string;
}

/* ─── Small UI helpers ───────────────────────────────── */

function Dot({ on, color = "var(--color-k)" }: { on: boolean; color?: string }) {
  return (
    <div className="w-2 h-2 rounded-none" style={{ backgroundColor: on ? color : "rgba(255,255,255,0.12)" }} />
  );
}

function StatCard({
  label, value, sub, accent,
}: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className="bg-k-card border border-k-border p-5">
      <div className={`text-3xl font-bold mb-1 ${accent ? "text-k" : "text-white"}`}>
        {value}
      </div>
      <div className="text-[9px] tracking-[0.2em] text-text-dim uppercase">{label}</div>
      {sub && <div className="text-[9px] text-k mt-1">{sub}</div>}
    </div>
  );
}

function Field({ label, value, link }: { label: string; value?: string; link?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[8px] tracking-[0.25em] text-[#444] uppercase mb-1">{label}</div>
      {link ? (
        <a href={value} target="_blank" rel="noreferrer"
          className="text-[11px] text-[#FF6B00] hover:underline break-all">{value}</a>
      ) : (
        <div className="text-[11px] text-[#AAA]">{value}</div>
      )}
    </div>
  );
}

/* ─── Company Detail Modal ───────────────────────────── */

function CompanyModal({
  row,
  onClose,
  project,
  brandColor,
}: {
  row: LeadRow;
  onClose: () => void;
  project: string;
  brandColor: string;
}) {
  const [email, setEmail] = useState<EmailState>({
    generating: false,
    subject: "",
    body: "",
    generated: false,
    editingSubject: false,
    sending: false,
    sent: false,
    error: "",
  });
  const [bodyExpanded, setBodyExpanded] = useState(false);

  async function handleGenerate() {
    setEmail((e) => ({ ...e, generating: true, error: "", generated: false, sent: false }));
    try {
      const leadData = {
        "FULL NAME": row.name,
        "company name": row.company,
        City: row.city,
        EMAIL: row.email,
        Phone: row.phone ?? "",
        Category: row.category ?? "",
        URL: row.url ?? "",
        Rank: row.rank,
        score_reason: row.scoreReason ?? "",
        lead_status: row.leadStatus,
        TECHNOLOGY: row.tech ?? "",
        KEYWORDS: row.keywords ?? "",
        LINKEDIN: row.linkedin ?? "",
        REVENUE: row.revenue ?? "",
        "JOB TITLE": row.jobTitle ?? "",
        HEADLINE: row.headline ?? "",
        SENIORITY: row.seniority ?? "",
        "COMPANY SIZE": row.companySize ?? "",
        "COMPANY DESCRIPTION": row.companyDesc ?? "",
        SECTOR: row.sector ?? "",
      };
      const res = await fetch("/api/campaign/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: row.id, leadData, project }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setEmail((e) => ({
        ...e,
        generating: false,
        generated: true,
        subject: data.subject,
        body: data.emailBody,
      }));
    } catch (err) {
      setEmail((e) => ({
        ...e,
        generating: false,
        error: err instanceof Error ? err.message : "Failed",
      }));
    }
  }

  async function handleSend() {
    if (!email.generated || !email.subject || !email.body) return;
    setEmail((e) => ({ ...e, sending: true, error: "" }));
    try {
      const res = await fetch("/api/campaign/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: [{
            recordId: row.id,
            toEmail: row.email,
            subject: email.subject,
            emailBody: email.body,
            originalSubject: email.subject,
            originalBody: email.body,
            wasEdited: false,
            wasRegenerated: true,
          }],
          project,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setEmail((e) => ({ ...e, sending: false, sent: true }));
    } catch (err) {
      setEmail((e) => ({
        ...e,
        sending: false,
        error: err instanceof Error ? err.message : "Send failed",
      }));
    }
  }

  const initials = (row.name || row.company || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#1A1A1A] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border border-[#FF6B00]/30 flex items-center justify-center text-sm font-bold text-[#FF6B00]">
              {initials}
            </div>
            <div>
              <div className="text-white font-bold uppercase tracking-wide">{row.company}</div>
              <div className="text-[9px] text-[#555] tracking-[0.2em] uppercase">{row.name} · {row.city}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-[#1A1A1A] text-[#555] hover:text-white hover:border-[#555] transition-all"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Lead info */}
          <div className="w-80 shrink-0 border-r border-k-border overflow-y-auto p-6 space-y-6">

            {/* Rank */}
            <div className="bg-k-card border border-k-border p-4">
              <div className="text-[8px] tracking-[0.25em] text-[#444] uppercase mb-2">Rank</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-k">{row.rank}</span>
                <span className="text-[10px] text-[#444]">/10</span>
              </div>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`flex-1 h-1.5 ${i < row.rank ? "bg-k" : "bg-k-border"}`} />
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div className="bg-k-card border border-k-border p-4 space-y-3">
              <div className="text-[8px] tracking-[0.25em] text-[#444] uppercase mb-1">Brevo Status</div>
              {[
                { label: "Delivered", on: row.delivered, color: "#4ade80" },
                { label: "Opened", on: row.opened, color: "#FF6B00", date: row.openedAt },
                { label: "Clicked", on: row.clicked, color: "#FF6B00", date: row.clickedAt },
                { label: "Bounced", on: row.bounced, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dot on={s.on} color={s.color} />
                    <span className="text-[10px] text-[#666] uppercase tracking-widest">{s.label}</span>
                  </div>
                  {s.on && s.date && (
                    <span className="text-[8px] text-[#444]">
                      {new Date(s.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <Field label="Email" value={row.email} />
              <Field label="Phone" value={row.phone} />
              <Field label="Website" value={row.url} link />
              {row.linkedin && (
                <div>
                  <div className="text-[8px] tracking-[0.25em] text-[#444] uppercase mb-1">LinkedIn</div>
                  <a href={row.linkedin} target="_blank" rel="noreferrer"
                    className="text-[10px] text-[#0077b5] border border-[#0077b5]/30 px-2 py-1 hover:bg-[#0077b5]/10 transition-all inline-block">
                    LINKEDIN →
                  </a>
                </div>
              )}
            </div>

            {/* Firmographics */}
            <div className="space-y-4">
              <Field label="Sector" value={row.sector || row.category} />
              <Field label="Revenue" value={row.revenue} />
              <Field label="Company Size" value={row.companySize} />
              <Field label="Job Title" value={row.jobTitle} />
              <Field label="Seniority" value={row.seniority} />
              <Field label="Technology" value={row.tech} />
            </div>

            {/* Score reason */}
            {row.scoreReason && (
              <div className="bg-[#0D0D0D] border-l-2 border-l-[#FF6B00]/30 border border-[#1A1A1A] p-4">
                <div className="text-[8px] tracking-[0.25em] text-[#444] uppercase mb-2">AI Rationale</div>
                <p className="text-[10px] text-[#666] leading-relaxed italic">"{row.scoreReason}"</p>
              </div>
            )}

            {/* Description */}
            {row.companyDesc && (
              <div>
                <div className="text-[8px] tracking-[0.25em] text-[#444] uppercase mb-2">Description</div>
                <p className="text-[10px] text-[#555] leading-relaxed">{row.companyDesc}</p>
              </div>
            )}
          </div>

          {/* Right: Email generation */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-[9px] tracking-[0.3em] text-[#555] uppercase mb-4">
              Email Generation
            </div>

            {/* Last sent subject */}
            {row.subject && (
              <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-4">
                <div className="text-[8px] tracking-[0.25em] text-[#444] uppercase mb-1">Last Sent Subject</div>
                <div className="text-[11px] text-[#666] italic">{row.subject}</div>
                {row.sentAt && (
                  <div className="text-[9px] text-[#333] mt-1">
                    Sent {new Date(row.sentAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                )}
              </div>
            )}

            {/* Generate button */}
            {!email.sent && (
              <button
                onClick={handleGenerate}
                disabled={email.generating}
                className="w-full py-3 border border-[#FF6B00]/40 text-[#FF6B00] text-[9px] tracking-[0.3em] uppercase hover:bg-[#FF6B00]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold"
              >
                {email.generating
                  ? "GENERATING WITH GPT-4o-mini..."
                  : email.generated
                  ? "↺ REGENERATE EMAIL"
                  : "GENERATE EMAIL"}
              </button>
            )}

            {/* Error */}
            {email.error && (
              <div className="bg-red-950/20 border border-red-900/40 p-3 text-red-400 text-[10px] font-mono">
                ERROR: {email.error}
              </div>
            )}

            {/* Generated email */}
            {email.generated && !email.sent && (
              <div className="space-y-3">
                {/* Subject */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[8px] tracking-[0.25em] text-[#444] uppercase">Subject</div>
                    <button
                      onClick={() => setEmail((e) => ({ ...e, editingSubject: !e.editingSubject }))}
                      className="text-[8px] text-[#444] hover:text-[#FF6B00] transition-colors"
                    >
                      {email.editingSubject ? "DONE" : "EDIT"}
                    </button>
                  </div>
                  {email.editingSubject ? (
                    <input
                      type="text"
                      value={email.subject}
                      onChange={(e) => setEmail((s) => ({ ...s, subject: e.target.value }))}
                      className="w-full bg-[#060606] border border-[#333] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors"
                    />
                  ) : (
                    <div className="text-[13px] text-white font-medium">{email.subject}</div>
                  )}
                </div>

                {/* Body preview toggle */}
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[8px] tracking-[0.25em] text-[#444] uppercase">Email Body</div>
                    <button
                      onClick={() => setBodyExpanded((v) => !v)}
                      className="text-[8px] text-[#444] hover:text-[#FF6B00] transition-colors"
                    >
                      {bodyExpanded ? "▲ COLLAPSE" : "▼ EXPAND"}
                    </button>
                  </div>
                  {!bodyExpanded && (
                    <p className="text-[10px] text-[#555] italic line-clamp-3">
                      {email.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180)}…
                    </p>
                  )}
                  {bodyExpanded && (
                    <iframe
                      srcDoc={email.body}
                      sandbox="allow-same-origin"
                      className="w-full border border-[#1A1A1A] bg-white"
                      style={{ height: "260px" }}
                      title="Email preview"
                    />
                  )}
                </div>

                {/* Send */}
                <button
                  onClick={handleSend}
                  disabled={email.sending}
                  className="w-full py-3 bg-[#FF6B00] text-black text-[9px] tracking-[0.3em] uppercase font-bold hover:bg-[#FF8C00] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {email.sending ? "SENDING..." : `SEND TO ${row.email}`}
                </button>
              </div>
            )}

            {/* Sent confirmation */}
            {email.sent && (
              <div className="bg-green-950/20 border border-green-800/40 p-6 text-center">
                <div className="w-3 h-3 bg-green-500 mx-auto mb-3" />
                <div className="text-green-400 text-[10px] tracking-[0.3em] uppercase font-bold">Email Sent</div>
                <div className="text-[9px] text-[#555] mt-2">{row.email}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Database Page ─────────────────────────────── */

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
        row.company.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q)
      );
    }
    if (filter === "opened") r = r.filter((row) => row.opened);
    if (filter === "clicked") r = r.filter((row) => row.clicked);
    if (filter === "bounced") r = r.filter((row) => row.bounced);
    if (filter === "unread") r = r.filter((row) => row.delivered && !row.opened);

    return [...r].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === "sentAt") { av = a.sentAt; bv = b.sentAt; }
      else if (sortKey === "rank") { av = a.rank; bv = b.rank; }
      else if (sortKey === "company") { av = a.company; bv = b.company; }
      else if (sortKey === "opened") { av = a.opened ? 1 : 0; bv = b.opened ? 1 : 0; }
      else { av = a.clicked ? 1 : 0; bv = b.clicked ? 1 : 0; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, search, filter, sortKey, sortDir]);

  const SortArrow = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <span className="text-[#FF6B00] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : (
      <span className="text-[#2A2A2A] ml-1">↕</span>
    );

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#FF6B00] blink" />
          <span className="text-[10px] tracking-[0.3em] text-[#888] uppercase">Syncing Airtable + Brevo...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-[#0D0D0D] border border-red-900 p-6 text-red-500 text-xs font-mono">
          ERROR: {error}
        </div>
      </div>
    );
  }

  const openRate = summary && summary.delivered > 0
    ? ((summary.opened / summary.delivered) * 100).toFixed(1) : "0";
  const clickRate = summary && summary.delivered > 0
    ? ((summary.clicked / summary.delivered) * 100).toFixed(1) : "0";
  const bounceRate = summary && summary.total > 0
    ? ((summary.bounced / summary.total) * 100).toFixed(1) : "0";

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "opened", label: "Opened", count: summary?.opened },
    { key: "clicked", label: "Clicked", count: summary?.clicked },
    { key: "unread", label: "Unread" },
    { key: "bounced", label: "Bounced", count: summary?.bounced },
  ];

  return (
    <>
      {/* Company modal */}
      {selected && (
        <CompanyModal 
          row={selected} 
          onClose={() => setSelected(null)} 
          project={project || "kronos"}
          brandColor={brandColor}
        />
      )}

      <div className="space-y-8 fade-up">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-k blink" />
              <span className="text-[10px] tracking-[0.3em] text-[#999] uppercase">
                Database // Airtable × Brevo
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: "var(--font-mono), monospace" }}>
              LEAD<span className="text-k">BASE</span>
            </h1>
          </div>
          <div className="text-right text-[9px] text-[#444] tracking-widest uppercase">
            <div>{summary?.total ?? 0} records synced</div>
            <div className="text-[#222] mt-1">Brevo events live</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Sent" value={summary?.total ?? 0} />
          <StatCard label="Delivered" value={summary?.delivered ?? 0} />
          <StatCard label="Opened" value={summary?.opened ?? 0} sub={`${openRate}% rate`} accent />
          <StatCard label="Clicked" value={summary?.clicked ?? 0} sub={`${clickRate}% CTR`} accent />
          <StatCard label="Bounced" value={summary?.bounced ?? 0} sub={`${bounceRate}%`} />
        </div>

        {/* Funnel bar */}
        {summary && summary.total > 0 && (
          <div className="bg-k-card border border-k-border p-4">
            <div className="text-[9px] text-[#555] uppercase tracking-widest mb-2">Funnel</div>
            <div className="flex gap-0.5 h-2">
              <div className="h-full bg-[#2a2a2a]"
                style={{ width: `${(summary.delivered / summary.total) * 100}%` }} />
              <div className="h-full bg-k opacity-70"
                style={{ width: `${(summary.opened / summary.total) * 100}%` }} />
              <div className="h-full bg-k"
                style={{ width: `${(summary.clicked / summary.total) * 100}%` }} />
            </div>
            <div className="flex gap-5 mt-2">
              {[
                { label: "Delivered", color: "#2a2a2a", val: summary.delivered },
                { label: "Opened", color: "var(--color-k)", val: summary.opened },
                { label: "Clicked", color: "var(--color-k)", val: summary.clicked },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] text-[#555] uppercase tracking-widest">
                    {item.label} · {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters + Search */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-1 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
                  filter === tab.key
                    ? "border-[#FF6B00] text-[#FF6B00] bg-[#FF6B00]/5"
                    : "border-[#1A1A1A] text-[#444] hover:text-white hover:border-[#333]"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[8px] ${filter === tab.key ? "text-[#FF6B00]/70" : "text-[#333]"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, name, email, city..."
              className="bg-[#0A0A0A] border border-[#1A1A1A] text-white text-[10px] px-4 py-2 focus:outline-none focus:border-[#FF6B00]/50 w-72 placeholder-[#2A2A2A]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#444] hover:text-white transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1l8 8M9 1L1 9" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A1A1A]">
                  {([
                    { label: "Company", key: "company" as SortKey },
                    { label: "Contact", key: null },
                    { label: "Rank", key: "rank" as SortKey },
                    { label: "Sent", key: "sentAt" as SortKey },
                    { label: "Subject", key: null },
                    { label: "D", key: null },
                    { label: "O", key: "opened" as SortKey },
                    { label: "C", key: "clicked" as SortKey },
                    { label: "B", key: null },
                  ] as { label: string; key: SortKey | null }[]).map((col, i) => (
                    <th
                      key={i}
                      onClick={col.key ? () => toggleSort(col.key as SortKey) : undefined}
                      className={`text-left text-[9px] tracking-[0.2em] text-[#444] uppercase px-4 py-3 whitespace-nowrap ${
                        col.key ? "cursor-pointer hover:text-white select-none" : ""
                      }`}
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
                    <td colSpan={9} className="text-center py-16 text-[10px] text-[#333] uppercase tracking-widest">
                      No records match
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className={`border-b border-[#111] hover:bg-[#0F0F0F] transition-colors cursor-pointer ${
                        row.clicked
                          ? "border-l-2 border-l-[#FF6B00]"
                          : row.opened
                          ? "border-l-2 border-l-[#FF6B00]/40"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-[11px] font-bold text-white uppercase tracking-wide truncate max-w-[150px]">
                          {row.company}
                        </div>
                        {row.city && (
                          <div className="text-[9px] text-[#444] uppercase tracking-widest">{row.city}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] text-[#888]">{row.name}</div>
                        <div className="text-[9px] text-[#444] font-mono truncate max-w-[140px]">{row.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold ${
                          row.rank >= 8 ? "text-[#FF6B00]" : row.rank >= 6 ? "text-white" : "text-[#555]"
                        }`}>
                          {row.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[9px] text-[#555] whitespace-nowrap">
                        {row.sentAt
                          ? new Date(row.sentAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="text-[9px] text-[#555] truncate">{row.subject || "—"}</div>
                      </td>
                      <td className="px-4 py-3"><Dot on={row.delivered} color="#4ade80" /></td>
                      <td className="px-4 py-3">
                        <Dot on={row.opened} color="#FF6B00" />
                        {row.openedAt && (
                          <span className="text-[8px] text-[#333] block">
                            {new Date(row.openedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Dot on={row.clicked} color="#FF6B00" />
                        {row.clickedAt && (
                          <span className="text-[8px] text-[#333] block">
                            {new Date(row.clickedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3"><Dot on={row.bounced} color="#ef4444" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#1A1A1A] text-[9px] text-[#2A2A2A] uppercase tracking-widest flex items-center justify-between">
            <span>{filtered.length} of {rows.length} records</span>
            <span>Click any row to open · Generate &amp; send from card</span>
          </div>
        </div>
      </div>
    </>
  );
}
