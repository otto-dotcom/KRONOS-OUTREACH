"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { scoreDeliverability } from "@/lib/deliverability";
import type { DeliverabilityReport } from "@/lib/deliverability";
import type { EmailPreview } from "@/lib/outreach";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface SmsData {
  totals: { sent: number; delivered: number; failed: number; undelivered: number; queued: number };
  deliveryRate: string;
  total: number;
  days: number;
  daily: { date: string; sent: number; delivered: number; failed: number }[];
  recent: { to: string; status: string; date: string; error: number | null }[];
}

interface EmailData {
  totals: { requests: number; delivered: number; opens: number; unique_opens: number; clicks: number; unique_clicks: number; bounces: number; spam_reports: number };
  openRate: string;
  clickRate: string;
  daily: { date: string; delivered: number; opens: number }[];
  days: number;
}

interface LeadsData {
  total: number;
  by_status: { priority: number; medium: number; low: number };
  by_email: { sent: number; pending: number };
  top_leads: LeadInfo[];
}

interface LaunchResult {
  ok: boolean;
  message?: string;
  sent?: number;
  failed?: number;
  skipped?: number;
}

type GalleryMode = "launcher" | "previewing" | "gallery" | "sending" | "done";

interface LeadInfo {
  id: string;
  name: string;
  company: string;
  city: string;
  email: string;
  phone: string;
  category: string;
  url: string;
  rank: string | number;
  scoreReason: string;
  leadStatus: string;
  emailStatus?: string;
  tech?: string;
  postalCode?: string;
  state?: string;
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
}

interface GalleryEmail {
  recordId: string;
  lead: LeadInfo;
  subject: string;
  emailBody: string;
  originalSubject: string;
  originalBody: string;
  edited: boolean;
  regenerated: boolean;
  regenerating: boolean;
  failed: boolean;
}

interface SendResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/* ═══════════════════════════════════════════════════════
   PIXEL ICONS
   ═══════════════════════════════════════════════════════ */

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="1" y="3" width="14" height="10" stroke="#FF6B00" strokeWidth="1" fill="none" />
      <path d="M1 3 L8 9 L15 3" stroke="#FF6B00" strokeWidth="1" fill="none" />
    </svg>
  );
}

function IconSms() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="2" y="2" width="12" height="9" stroke="#FF6B00" strokeWidth="1" fill="none" />
      <rect x="4" y="11" width="2" height="2" fill="#FF6B00" />
      <rect x="2" y="13" width="2" height="1" fill="#FF6B00" />
    </svg>
  );
}

function IconRocket() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="7" y="1" width="2" height="2" fill="#FF6B00" />
      <rect x="6" y="3" width="4" height="2" fill="#FF6B00" />
      <rect x="5" y="5" width="6" height="4" fill="#FF6B00" />
      <rect x="6" y="9" width="4" height="2" fill="#FF6B00" />
      <rect x="3" y="7" width="2" height="3" fill="#FF6B00" opacity="0.5" />
      <rect x="11" y="7" width="2" height="3" fill="#FF6B00" opacity="0.5" />
      <rect x="7" y="11" width="1" height="2" fill="#FF6B00" opacity="0.4" />
      <rect x="8" y="12" width="1" height="2" fill="#FF6B00" opacity="0.3" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ imageRendering: "pixelated" }}>
      <ellipse cx="8" cy="4" rx="5" ry="2" stroke="#FF6B00" strokeWidth="1" fill="none" />
      <line x1="3" y1="4" x2="3" y2="12" stroke="#FF6B00" strokeWidth="1" />
      <line x1="13" y1="4" x2="13" y2="12" stroke="#FF6B00" strokeWidth="1" />
      <ellipse cx="8" cy="8" rx="5" ry="2" stroke="#FF6B00" strokeWidth="1" fill="none" />
      <ellipse cx="8" cy="12" rx="5" ry="2" stroke="#FF6B00" strokeWidth="1" fill="none" />
    </svg>
  );
}

function IconWarn() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="6" y="1" width="2" height="2" fill="#FF6B00" />
      <rect x="5" y="3" width="4" height="2" fill="#FF6B00" />
      <rect x="4" y="5" width="6" height="2" fill="#FF6B00" />
      <rect x="3" y="7" width="8" height="2" fill="#FF6B00" />
      <rect x="2" y="9" width="10" height="2" fill="#FF6B00" />
      <rect x="1" y="11" width="12" height="2" fill="#FF6B00" />
      <rect x="6" y="4" width="2" height="4" fill="#0D0D0D" />
      <rect x="6" y="9" width="2" height="2" fill="#0D0D0D" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="2" y="2" width="2" height="2" fill="currentColor" />
      <rect x="10" y="2" width="2" height="2" fill="currentColor" />
      <rect x="4" y="4" width="2" height="2" fill="currentColor" />
      <rect x="8" y="4" width="2" height="2" fill="currentColor" />
      <rect x="6" y="6" width="2" height="2" fill="currentColor" />
      <rect x="4" y="8" width="2" height="2" fill="currentColor" />
      <rect x="8" y="8" width="2" height="2" fill="currentColor" />
      <rect x="2" y="10" width="2" height="2" fill="currentColor" />
      <rect x="10" y="10" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════ */

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] tracking-[0.25em] text-[#FF6B00] uppercase font-semibold">
          {label}
        </span>
      </div>
      <div className="flex-1 h-px bg-[#1A1A1A]" />
    </div>
  );
}

function Metric({ value, label, highlight, large }: {
  value: string | number; label: string; highlight?: boolean; large?: boolean;
}) {
  return (
    <div className="bg-[#0A0A0A] border border-[#161616] p-4 fade-up">
      <div className={`font-bold tracking-tight ${highlight ? "text-[#FF6B00]" : "text-white"} ${large ? "text-3xl" : "text-2xl"}`}>
        {value}
      </div>
      <div className="text-[10px] tracking-[0.15em] text-[#888] uppercase mt-1">{label}</div>
    </div>
  );
}

function RangeFilter({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  return (
    <div className="flex gap-1">
      {[7, 30, 90].map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1 text-[10px] tracking-wider transition-all cursor-pointer border ${days === d
            ? "bg-[#FF6B00] text-black border-[#FF6B00] font-bold"
            : "bg-transparent text-[#888] border-[#1A1A1A] hover:border-[#FF6B00] hover:text-[#FF6B00]"
            }`}
        >
          {d}D
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CHARTS
   ═══════════════════════════════════════════════════════ */

function DonutChart({ segments, size = 120 }: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const r = 40;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#161616" strokeWidth="14" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-currentOffset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-700"
            />
          );
        })}
        <text x="50" y="48" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
          {total}
        </text>
        <text x="50" y="60" textAnchor="middle" fill="#999" fontSize="7" letterSpacing="0.1em">
          TOTAL
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] text-[#AAA] tracking-wider uppercase">{seg.label}</span>
            <span className="text-[11px] text-white font-bold ml-auto pl-3">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, height = 80 }: {
  data: { label: string; bars: { value: number; color: string }[] }[];
  height?: number;
}) {
  const allValues = data.flatMap((d) => d.bars.map((b) => b.value));
  const max = Math.max(...allValues, 1);

  return (
    <div className="bg-[#0A0A0A] border border-[#161616] p-4">
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-[1px] h-full justify-end">
            {d.bars.map((bar, j) => (
              <div
                key={j}
                className="w-full transition-all duration-500"
                style={{
                  height: `${(bar.value / max) * 100}%`,
                  backgroundColor: bar.color,
                  minHeight: bar.value > 0 ? "2px" : "0",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[8px] text-[#777] truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressStat({ label, value, max, color = "#FF6B00" }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[#888] tracking-wider uppercase w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[#161616]">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-white font-bold w-8 text-right">{value}</span>
    </div>
  );
}

function RankMeter({ rank }: { rank: number | string }) {
  const val = typeof rank === 'number' ? rank : parseInt(String(rank)) || 0;
  const stars = Array.from({ length: 10 }).map((_, i) => i < val);
  
  return (
    <div className="flex gap-0.5">
      {stars.map((filled, i) => (
        <div 
          key={i} 
          className={`w-1.5 h-3 ${filled ? 'bg-[#FF6B00]' : 'bg-[#1A1A1A]'} transition-colors duration-500`}
          style={{ transitionDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}

function LeadModal({ lead, onClose }: { lead: LeadInfo; onClose: () => void }) {
  const priorityBadge =
    lead.leadStatus === "priority"
      ? { cls: "bg-green-500 text-black", label: "HIGH INTENT" }
      : lead.leadStatus === "medium"
      ? { cls: "bg-yellow-500 text-black", label: "WARM LEAD" }
      : { cls: "bg-[#222] text-[#888]", label: "EXPLORATORY" };

  const initials = (lead.name || "UN").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] w-full max-w-6xl h-fit max-h-[92vh] shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col md:flex-row overflow-hidden relative animate-in zoom-in-95 duration-500">
        
        {/* Sidebar: Profile & Critical Pulse */}
        <div className="w-full md:w-80 bg-[#0D0D0D] border-r border-[#1A1A1A] p-8 flex flex-col overflow-y-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#FF6B00] to-[#E55F00] flex items-center justify-center text-3xl font-black text-black mb-6 shadow-[0_0_30px_rgba(255,107,0,0.15)] flex-shrink-0">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-white mb-1 leading-tight tracking-wide">{lead.company || "Unnamed Agency"}</h2>
            <p className="text-[#888] text-sm uppercase tracking-widest font-bold">{lead.name || "Anonymous Contact"}</p>
            {lead.jobTitle && <p className="text-[#FF6B00] text-[10px] mt-1 tracking-wider font-semibold uppercase">{lead.jobTitle}</p>}
          </div>
          
          <div className="space-y-6 pt-6 border-t border-[#1A1A1A]">
            <div className="flex flex-col items-center">
              <span className="text-[9px] tracking-[0.2em] text-[#444] uppercase mb-2 font-black">AI Lead Score</span>
              <RankMeter rank={lead.rank} />
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-white">{lead.rank}</span>
                <span className="text-[10px] text-[#333] font-bold">/10</span>
              </div>
            </div>
            
            <div className={`py-2 px-4 text-[9px] font-black tracking-[0.3em] text-center border ${priorityBadge.cls}`}>
              {priorityBadge.label}
            </div>

            <div className="space-y-4 pt-4">
              <DetailRow label="Pipeline" value={lead.emailStatus || "In Queue"} />
              <DetailRow label="Sector" value={lead.sector || lead.category || "General"} />
            </div>
          </div>

          <div className="mt-8">
            <button onClick={onClose} className="w-full py-3 bg-white/5 border border-white/10 text-[9px] tracking-[0.3em] text-white hover:bg-white/10 transition-all font-black uppercase">
              Close Record
            </button>
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 relative bg-gradient-to-b from-[#0A0A0A] to-[#080808]">
          <div className="max-w-3xl">
            {/* Header / Intro */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <IconRocket />
                <span className="text-[10px] tracking-[0.4em] text-[#FF6B00] uppercase font-black">Lead Intelligence Report</span>
              </div>
              <div className="bg-[#000] border-l-4 border-[#FF6B00] p-8 shadow-inner">
                 <span className="text-[9px] tracking-[0.2em] text-[#555] uppercase block mb-4 font-black">GPT-4o Scoring Rationale</span>
                 <p className="text-white text-xl leading-relaxed italic font-serif">
                   "{lead.scoreReason || "No intelligence analysis generated for this record."}"
                 </p>
                 {lead.headline && <p className="mt-6 text-[11px] text-[#444] border-t border-[#111] pt-4 font-mono">{lead.headline}</p>}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 mb-12">
              {/* Box 1: Verified Contact */}
              <div>
                <SectionLabel icon={<IconMail />} label="Communication" />
                <div className="space-y-6">
                  <DetailRow label="Primary Email" value={lead.email} isLink href={`mailto:${lead.email}`} />
                  <DetailRow label="Direct Phone" value={lead.phone || "N/A"} />
                  <div className="flex gap-4 pt-2">
                    {lead.linkedin && (
                      <a href={lead.linkedin} target="_blank" rel="noreferrer" className="text-[10px] text-[#0077b5] border border-[#0077b5]/30 px-3 py-1 hover:bg-[#0077b5]/10 transition-all font-bold">LINKEDIN</a>
                    )}
                    {lead.instagram && (
                      <a href={lead.instagram} target="_blank" rel="noreferrer" className="text-[10px] text-[#e1306c] border border-[#e1306c]/30 px-3 py-1 hover:bg-[#e1306c]/10 transition-all font-bold">INSTAGRAM</a>
                    )}
                  </div>
                </div>
              </div>

              {/* Box 2: Enterprise Firmographics */}
              <div>
                <SectionLabel icon={<IconDatabase />} label="Firmographics" />
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Company Size" value={lead.companySize || "Unknown"} />
                    <DetailRow label="Estimated Revenue" value={lead.revenue || "N/A"} />
                  </div>
                  <DetailRow label="Seniority Level" value={lead.seniority || "Individual"} />
                  <DetailRow label="Agency Website" value={lead.url || "No link"} isLink href={lead.url} />
                </div>
              </div>

              {/* Box 3: Technical Stack & SEO */}
              <div>
                 <SectionLabel icon={<IconDatabase />} label="Tech & Keywords" />
                 <div className="space-y-6">
                    <DetailRow label="Technology Stack" value={lead.tech || "Standard"} />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(lead.keywords || "").split(",").slice(0, 6).map((k, i) => (
                        <span key={i} className="text-[8px] px-2 py-0.5 bg-[#111] border border-[#222] text-[#555] font-bold uppercase tracking-widest">{k.trim()}</span>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Box 4: Geometry & Location */}
              <div>
                <SectionLabel icon={<IconDatabase />} label="Location" />
                <div className="space-y-6">
                  <DetailRow label="Address" value={`${lead.street || ""} ${lead.address || ""}`.trim() || "Address on file"} />
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="City / Region" value={`${lead.city || ""}, ${lead.state || ""}`.trim().replace(/^,/, "") || "CH Territory"} />
                    <DetailRow label="Post Code" value={lead.postalCode || "—"} />
                  </div>
                </div>
              </div>
            </div>

            {/* Extended Bio */}
            {lead.companyDesc && (
              <div className="mb-12 border-t border-[#111] pt-10">
                <span className="text-[9px] tracking-[0.2em] text-[#333] uppercase block mb-4 font-black">Agency Description</span>
                <p className="text-sm text-[#777] leading-relaxed line-clamp-4 hover:line-clamp-none transition-all duration-500 cursor-pointer">
                  {lead.companyDesc}
                </p>
              </div>
            )}

            {/* Footer Attribution */}
            <div className="pt-10 border-t border-[#1A1A1A] flex flex-col md:flex-row items-center justify-between gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
               <div className="flex gap-4">
                 <div className="px-3 py-1 bg-[#111] border border-[#1A1A1A] text-[9px] text-[#555] tracking-widest uppercase font-black">KRONOS-OUTREACH-CORE v4.2</div>
                 <div className="px-3 py-1 bg-[#111] border border-[#1A1A1A] text-[9px] text-[#555] tracking-widest uppercase font-black">RECORD ID: {lead.id.toUpperCase()}</div>
               </div>
               <span className="text-[10px] text-[#222] font-black italic">PROCESSED BY ANTIGRAVITY ENGINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, isLink, href }: { label: string, value: string, isLink?: boolean, href?: string }) {
  return (
    <div>
      <span className="text-[9px] tracking-[0.15em] text-[#444] uppercase block mb-1">{label}</span>
      {isLink && href && value !== "—" ? (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm text-white hover:text-[#FF6B00] transition-colors break-all"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm text-white break-all">{value}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CAMPAIGN LAUNCHER + EMAIL GALLERY
   ═══════════════════════════════════════════════════════ */

const TIER_COLOR = {
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
} as const;

function DeliverabilitySection({ report }: { report: DeliverabilityReport }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] tracking-[0.2em] text-[#555] uppercase">Deliverability</span>
        <div className="flex-1 h-px bg-[#1A1A1A]" />
        <span className="text-[11px] font-bold" style={{ color: TIER_COLOR[report.tier] }}>
          {report.score}
        </span>
      </div>
      <div className="h-1.5 bg-[#111] mb-3">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${report.score}%`, backgroundColor: TIER_COLOR[report.tier] }}
        />
      </div>
      {report.flags.length > 0 && (
        <div className="space-y-1">
          {report.flags.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="text-[8px] mt-0.5 shrink-0"
                style={{ color: f.level === "error" ? TIER_COLOR.red : TIER_COLOR.yellow }}
              >
                ●
              </span>
              <span className="text-[10px] text-[#777] tracking-wide">{f.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailCard({
  email,
  onUpdate,
  onRegenerate,
}: {
  email: GalleryEmail;
  onUpdate: (updates: Partial<GalleryEmail>) => void;
  onRegenerate: (mode: "standard" | "plain") => void;
}) {
  const report = useMemo(
    () => scoreDeliverability(email.subject, email.emailBody),
    [email.subject, email.emailBody]
  );
  const [expanded, setExpanded] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [localSubject, setLocalSubject] = useState(email.subject);
  const [localBody, setLocalBody] = useState(email.emailBody);

  useEffect(() => {
    setLocalSubject(email.subject);
    setLocalBody(email.emailBody);
    setEditingBody(false);
  }, [email.subject, email.emailBody]);

  function commitSubject() {
    const changed = localSubject !== email.originalSubject;
    onUpdate({ subject: localSubject, edited: email.edited || changed });
  }

  function commitBody() {
    const changed = localBody !== email.originalBody;
    onUpdate({ emailBody: localBody, edited: email.edited || changed });
    setEditingBody(false);
  }

  const priorityBadge =
    email.lead.leadStatus === "priority"
      ? { cls: "bg-green-950/40 border-green-800/50 text-green-400", label: "★ PRIORITY" }
      : email.lead.leadStatus === "medium"
      ? { cls: "bg-yellow-950/40 border-yellow-800/50 text-yellow-500", label: "MEDIUM" }
      : { cls: "bg-[#111] border-[#222] text-[#555]", label: "LOW" };

  return (
    <div
      className="bg-[#0D0D0D] border border-[#1A1A1A] transition-all hover:border-[#333] group"
      style={{ borderTopColor: TIER_COLOR[report.tier], borderTopWidth: "3px" }}
    >
      {/* Lead header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <span className="text-white font-bold tracking-tight text-base leading-tight group-hover:text-[#FF6B00] transition-colors">
            {email.lead.company || "(no company)"}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="bg-[#0A0A0A] border border-[#1A1A1A] px-2 py-0.5 flex items-center gap-1.5">
               <span className="text-[9px] text-[#444] font-bold">RANK</span>
               <span className="text-[#FF6B00] text-[10px] font-black">{email.lead.rank}</span>
            </div>
          </div>
        </div>
        
        <div className="text-[11px] text-[#444] tracking-wide mb-4 flex items-center gap-2">
           <span className="uppercase">{email.lead.city || "Unknown"}</span>
           <span>·</span>
           <span className="lowercase opacity-60">{email.lead.url ? new URL(email.lead.url).hostname : "no-link"}</span>
        </div>

        {/* Info Tiles */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#0A0A0A] border border-[#161616] p-2">
            <span className="text-[8px] text-[#333] uppercase block mb-0.5 tracking-[0.1em]">Lead Representative</span>
            <span className="text-[10px] text-[#888] truncate block font-medium uppercase">{email.lead.name || "N/A"}</span>
          </div>
          <div className="bg-[#0A0A0A] border border-[#161616] p-2">
            <span className="text-[8px] text-[#333] uppercase block mb-0.5 tracking-[0.1em]">Category</span>
            <span className="text-[10px] text-[#888] truncate block font-medium uppercase">{email.lead.category || "General"}</span>
          </div>
        </div>

        {email.lead.scoreReason && (
          <div className="bg-[#080808] border border-[#141414] p-3 text-[10px] text-[#666] leading-relaxed italic border-l-2 border-l-[#1A1A1A] group-hover:border-l-[#FF6B00] transition-all">
            "{email.lead.scoreReason}"
          </div>
        )}
      </div>

      {/* Deliverability */}
      {!email.failed && (
        <div className="px-5 pb-4 border-t border-[#1A1A1A] pt-4">
          <DeliverabilitySection report={report} />
        </div>
      )}

      {/* Subject */}
      <div className="px-5 pb-4 border-t border-[#1A1A1A] pt-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] tracking-[0.2em] text-[#555] uppercase">Subject</span>
          <div className="flex-1 h-px bg-[#1A1A1A]" />
          {email.edited && (
            <span className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] text-[9px] tracking-[0.12em] px-2 py-0.5">
              ● EDITED
            </span>
          )}
        </div>
        {email.failed ? (
          <p className="text-[11px] text-red-400 tracking-wide">{email.subject}</p>
        ) : (
          <input
            type="text"
            value={localSubject}
            onChange={(e) => setLocalSubject(e.target.value)}
            onBlur={commitSubject}
            className="w-full bg-[#060606] border border-[#222] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B00] transition-colors"
          />
        )}
      </div>

      {/* Body */}
      {!email.failed && (
        <div className="px-5 pb-4 border-t border-[#1A1A1A] pt-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] tracking-[0.2em] text-[#555] uppercase">Email Body</span>
            <div className="flex-1 h-px bg-[#1A1A1A]" />
            <button
              onClick={() => {
                setExpanded(!expanded);
                if (editingBody) setEditingBody(false);
              }}
              className="text-[9px] tracking-[0.15em] text-[#444] hover:text-[#FF6B00] transition-colors cursor-pointer"
            >
              {expanded ? "▲ COLLAPSE" : "▼ EXPAND"}
            </button>
          </div>
          {!expanded && (
            <p className="text-[11px] text-[#444] italic line-clamp-2">
              {email.emailBody
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 120)}
              ...
            </p>
          )}
          {expanded && !editingBody && (
            <div>
              <iframe
                srcDoc={email.emailBody}
                sandbox="allow-same-origin"
                className="w-full border border-[#1A1A1A] bg-white"
                style={{ height: "280px" }}
                title="Email preview"
              />
              <button
                onClick={() => setEditingBody(true)}
                className="mt-2 text-[9px] tracking-[0.15em] text-[#555] hover:text-[#FF6B00] border border-[#1A1A1A] px-3 py-1.5 hover:border-[#FF6B00] transition-colors cursor-pointer"
              >
                EDIT RAW HTML
              </button>
            </div>
          )}
          {expanded && editingBody && (
            <div>
              <textarea
                value={localBody}
                onChange={(e) => setLocalBody(e.target.value)}
                className="w-full h-48 bg-[#060606] border border-[#222] text-[#AAA] text-[11px] px-3 py-2 font-mono resize-none focus:outline-none focus:border-[#FF6B00] transition-colors"
              />
              <button
                onClick={commitBody}
                className="mt-1.5 text-[9px] tracking-[0.15em] text-[#FF6B00] border border-[#FF6B00]/30 bg-[#FF6B00]/10 px-3 py-1.5 hover:bg-[#FF6B00]/20 transition-colors cursor-pointer"
              >
                SAVE CHANGES
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 border-t border-[#1A1A1A] flex items-center gap-2 flex-wrap">
        {email.failed ? (
          <span className="text-[10px] text-red-400 tracking-wider">Generation failed — cannot send</span>
        ) : (
          <>
            <button
              onClick={() => onRegenerate("standard")}
              disabled={email.regenerating}
              className="text-[9px] tracking-[0.15em] px-3 py-1.5 border border-[#1A1A1A] text-[#777] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors cursor-pointer disabled:opacity-30"
            >
              {email.regenerating ? "GENERATING..." : "REGENERATE"}
            </button>
            <button
              onClick={() => onRegenerate("plain")}
              disabled={email.regenerating}
              className="text-[9px] tracking-[0.15em] px-3 py-1.5 border border-[#1A1A1A] text-[#777] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors cursor-pointer disabled:opacity-30"
            >
              REGENERATE: PLAIN
            </button>
            {email.regenerated && (
              <span className="ml-auto text-[9px] tracking-[0.15em] text-[#444]">↺ REGENERATED</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CampaignLauncher() {
  const [mode, setMode] = useState<GalleryMode>("launcher");
  const [leadLimit, setLeadLimit] = useState(10);
  const [emails, setEmails] = useState<GalleryEmail[]>([]);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [previewError, setPreviewError] = useState("");

  function updateEmail(recordId: string, updates: Partial<GalleryEmail>) {
    setEmails((prev) =>
      prev.map((e) => (e.recordId === recordId ? { ...e, ...updates } : e))
    );
  }

  async function handlePreview() {
    setMode("previewing");
    setPreviewError("");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const res = await fetch("/api/campaign/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadLimit }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Server returned non-JSON response (${res.status}). Check server logs.`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");

      const gallery: GalleryEmail[] = (
        data.previews as EmailPreview[]
      ).map((p) => ({
        recordId: p.recordId,
        lead: {
          id: p.lead.id,
          name: p.lead.name,
          company: p.lead.company,
          city: p.lead.city,
          email: p.lead.email,
          phone: p.lead.phone,
          category: p.lead.category,
          url: p.lead.url,
          rank: p.lead.rank,
          scoreReason: p.lead.scoreReason,
          leadStatus: p.lead.leadStatus,
          emailStatus: p.lead.emailStatus,
          tech: p.lead.tech,
          postalCode: p.lead.postalCode,
          state: p.lead.state,
          keywords: p.lead.keywords,
          linkedin: p.lead.linkedin,
          revenue: p.lead.revenue,
          jobTitle: p.lead.jobTitle,
          headline: p.lead.headline,
          seniority: p.lead.seniority,
          companySize: p.lead.companySize,
          companyDesc: p.lead.companyDesc,
          instagram: p.lead.instagram,
          sector: p.lead.sector,
          address: p.lead.address,
          street: p.lead.street,
        },
        subject: p.subject,
        emailBody: p.emailBody,
        originalSubject: p.subject,
        originalBody: p.emailBody,
        edited: false,
        regenerated: false,
        regenerating: false,
        failed: p.subject.startsWith("[GENERATION FAILED]"),
      }));

      // Lowest deliverability score first — needs attention at top
      gallery.sort((a, b) => {
        if (a.failed !== b.failed) return a.failed ? -1 : 1;
        const sa = scoreDeliverability(a.subject, a.emailBody).score;
        const sb = scoreDeliverability(b.subject, b.emailBody).score;
        return sa - sb;
      });

      setEmails(gallery);
      setMode("gallery");
    } catch (err: unknown) {
      console.error("Preview error:", err);
      let message = "Connection error — check Vercel function logs";
      
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          message = "Request timed out (OpenRouter took too long to respond). Try a lower lead limit.";
        } else if (err.message === "Failed to fetch") {
          message = "Network error: Failed to fetch. Is the server running? Check for CORS/content-blockers.";
        } else {
          message = err.message;
        }
      }
      
      setPreviewError(message);
      setMode("launcher");
    }
  }

  async function handleRegenerate(recordId: string, regenMode: "standard" | "plain") {
    const email = emails.find((e) => e.recordId === recordId);
    if (!email) return;
    updateEmail(recordId, { regenerating: true });
    try {
      const leadData = {
        "FULL NAME": email.lead.name,
        "company name": email.lead.company,
        City: email.lead.city,
        EMAIL: email.lead.email,
        Phone: email.lead.phone,
        Category: email.lead.category,
        URL: email.lead.url,
        Rank: email.lead.rank,
        score_reason: email.lead.scoreReason,
        lead_status: email.lead.leadStatus,
      };
      const res = await fetch("/api/campaign/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, leadData, mode: regenMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regeneration failed");
      updateEmail(recordId, {
        subject: data.subject,
        emailBody: data.emailBody,
        regenerated: true,
        regenerating: false,
        edited: false,
        failed: false,
      });
    } catch {
      updateEmail(recordId, { regenerating: false });
    }
  }

  async function handleSendAll() {
    setMode("sending");
    const payload = emails
      .filter((e) => !e.failed && e.emailBody)
      .map((e) => ({
        recordId: e.recordId,
        toEmail: e.lead.email,
        subject: e.subject,
        emailBody: e.emailBody,
        wasEdited: e.edited,
        wasRegenerated: e.regenerated,
      }));
    try {
      const res = await fetch("/api/campaign/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSendResult({
        sent: data.sent,
        failed: data.failed,
        skipped: data.skipped,
        errors: data.errors ?? [],
      });
    } catch (err) {
      setSendResult({
        sent: 0,
        failed: payload.length,
        skipped: 0,
        errors: [err instanceof Error ? err.message : "Connection error"],
      });
    }
    setMode("done");
  }

  const editedCount = emails.filter((e) => e.edited).length;
  const regenCount = emails.filter((e) => e.regenerated).length;
  const validCount = emails.filter((e) => !e.failed).length;

  /* ── GENERATING ── */
  if (mode === "previewing") {
    return (
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-12 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#FF6B00] blink" />
          <span className="text-[10px] tracking-[0.3em] text-[#888] uppercase">
            Generating email copy for {leadLimit} leads...
          </span>
        </div>
        <p className="text-[10px] text-[#333] tracking-wider">This may take 30–90 seconds</p>
      </div>
    );
  }

  /* ── SENDING ── */
  if (mode === "sending") {
    return (
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-12 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#FF6B00] blink" />
          <span className="text-[10px] tracking-[0.3em] text-[#888] uppercase">
            Sending {validCount} emails via Brevo...
          </span>
        </div>
      </div>
    );
  }

  /* ── DONE ── */
  if (mode === "done" && sendResult) {
    const editedEmails = emails.filter((e) => e.edited);
    return (
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 space-y-4">
        <SectionLabel icon={<IconRocket />} label="Campaign Complete" />
        <div className="flex items-center gap-2 p-4 border border-green-900/50 bg-green-950/20">
          <div className="w-2 h-2 bg-green-500 shrink-0" />
          <span className="text-xs tracking-wider text-green-400">
            SENT <span className="font-bold text-white">{sendResult.sent}</span>
            {" // "}FAILED{" "}
            <span className={`font-bold ${sendResult.failed ? "text-red-400" : "text-white"}`}>
              {sendResult.failed}
            </span>
            {" // "}SKIPPED <span className="font-bold text-[#888]">{sendResult.skipped}</span>
          </span>
        </div>
        {editedEmails.length > 0 && (
          <div className="border border-[#1A1A1A] p-4">
            <div className="text-[10px] tracking-[0.2em] text-[#FF6B00] uppercase mb-3">
              Copy Edit Log — {editedEmails.length} email{editedEmails.length > 1 ? "s" : ""} modified
            </div>
            <div className="space-y-1.5">
              {editedEmails.map((e) => (
                <div key={e.recordId} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#FF6B00]" />
                  <span className="text-[10px] text-[#AAA] tracking-wider">
                    {e.lead.company || e.lead.email}
                  </span>
                  {e.regenerated && (
                    <span className="text-[9px] text-[#444] ml-auto">↺ regenerated</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#333] mt-3 tracking-wider">
              Review Vercel logs for copyedit events → use to improve the system prompt.
            </p>
          </div>
        )}
        {sendResult.errors.length > 0 && (
          <div className="border border-red-900/30 p-4 space-y-1">
            {sendResult.errors.map((err, i) => (
              <p key={i} className="text-[10px] text-red-400 tracking-wider">{err}</p>
            ))}
          </div>
        )}
        <button
          onClick={() => {
            setMode("launcher");
            setEmails([]);
            setSendResult(null);
          }}
          className="w-full border border-[#1A1A1A] text-[10px] tracking-[0.3em] py-3 text-[#666] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-all cursor-pointer"
        >
          START NEW CAMPAIGN
        </button>
      </div>
    );
  }

  /* ── GALLERY ── */
  if (mode === "gallery") {
    return (
      <div>
        <div className="bg-[#080808] border border-[#1A1A1A] px-5 py-3 flex items-center gap-4 mb-4 sticky top-0 z-10">
          <button
            onClick={() => {
              setMode("launcher");
              setEmails([]);
            }}
            className="text-[9px] tracking-[0.2em] text-[#444] hover:text-[#FF6B00] transition-colors cursor-pointer"
          >
            ← BACK
          </button>
          <div className="flex-1 flex items-center gap-3 text-[9px] tracking-[0.15em] text-[#444]">
            <span className="text-white font-bold">{validCount}</span> EMAILS
            {editedCount > 0 && (
              <>
                <span className="text-[#222]">·</span>
                <span className="text-[#FF6B00] font-bold">{editedCount}</span> EDITED
              </>
            )}
            {regenCount > 0 && (
              <>
                <span className="text-[#222]">·</span>
                <span className="text-[#888] font-bold">{regenCount}</span> REGENERATED
              </>
            )}
          </div>
          <button
            onClick={handleSendAll}
            disabled={validCount === 0}
            className="bg-[#FF6B00] text-black font-bold px-5 py-2 text-[9px] tracking-[0.3em] hover:bg-[#E55F00] disabled:opacity-30 transition-all cursor-pointer"
          >
            SEND ALL →
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {emails.map((email) => (
            <EmailCard
              key={email.recordId}
              email={email}
              onUpdate={(updates) => updateEmail(email.recordId, updates)}
              onRegenerate={(m) => handleRegenerate(email.recordId, m)}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── LAUNCHER (default) ── */
  return (
    <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 glow">
      <SectionLabel icon={<IconRocket />} label="Launch Campaign" />
      <div className="flex items-end gap-6">
        <div className="flex-1">
          <label className="block text-[10px] tracking-[0.2em] text-[#888] uppercase mb-2">
            Lead Limit
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={leadLimit}
            onChange={(e) => setLeadLimit(Number(e.target.value))}
            className="w-full bg-[#060606] border border-[#222] text-white px-4 py-3 text-lg font-bold tracking-wide focus:outline-none focus:border-[#FF6B00] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 pb-3">
          <div className="px-3 py-1.5 bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[10px] text-[#FF6B00] tracking-wider font-bold">
            EMAIL
          </div>
        </div>
      </div>
      <button
        onClick={handlePreview}
        className="w-full mt-6 bg-[#FF6B00] text-black font-bold py-4 text-xs tracking-[0.3em] hover:bg-[#E55F00] transition-all cursor-pointer"
      >
        PREVIEW EMAILS
      </button>
      {previewError && (
        <div className="mt-4 flex items-center gap-2 p-3 border border-red-900/50 bg-red-950/20">
          <div className="w-2 h-2 bg-red-500 shrink-0" />
          <span className="text-xs tracking-wider text-red-400">{previewError}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LEADS / DATABASE ANALYTICS
   ═══════════════════════════════════════════════════════ */

function LeadsAnalytics({ onSelectLead }: { onSelectLead: (lead: LeadInfo) => void }) {
  const [data, setData] = useState<LeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics/leads");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <IconDatabase />
            <span className="text-[10px] tracking-[0.25em] text-[#FF6B00] uppercase font-semibold">Database</span>
          </div>
          <div className="flex-1 h-px bg-[#1A1A1A] min-w-8" />
        </div>
        <button onClick={fetchStats} className="text-[10px] text-[#777] hover:text-[#FF6B00] transition-colors cursor-pointer tracking-wider">SYNC</button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center">
          <div className="w-2 h-2 bg-[#FF6B00] blink" />
          <span className="text-[10px] text-[#888] tracking-wider">FETCHING DATA...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 py-8">
          <div className="w-2 h-2 bg-red-500" />
          <span className="text-xs text-red-400">{error}</span>
        </div>
      ) : data ? (
        <>
          {/* Top row: total + email pipeline */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Metric value={data.total} label="Total Leads" highlight large />
            <Metric value={data.by_email.sent} label="Emails Sent" highlight />
            <Metric value={data.by_email.pending} label="Pending (≥5)" />
          </div>

          {/* Lead scoring breakdown */}
          <div className="bg-[#0A0A0A] border border-[#161616] p-5 mb-4">
            <div className="text-[10px] tracking-[0.15em] text-[#999] uppercase font-semibold mb-4">Lead Score Breakdown</div>
            <DonutChart
              segments={[
                { value: data.by_status.priority, color: "#FF6B00", label: "Priority (≥7)" },
                { value: data.by_status.medium, color: "#FF8C33", label: "Medium (5–6)" },
                { value: data.by_status.low, color: "#333333", label: "Low (<5)" },
              ].filter((s) => s.value > 0)}
            />
          </div>

          {/* Email pipeline progress */}
          <div className="bg-[#0A0A0A] border border-[#161616] p-4 mb-4 space-y-3">
            <div className="text-[10px] tracking-[0.15em] text-[#999] uppercase font-semibold mb-2">Outreach Pipeline</div>
            <ProgressStat label="Sent" value={data.by_email.sent} max={data.total} color="#22C55E" />
            <ProgressStat label="Pending" value={data.by_email.pending} max={data.total} color="#FF6B00" />
          </div>

          {/* Top leads table */}
          {data.top_leads.length > 0 && (
            <div className="bg-[#0A0A0A] border border-[#161616] p-4">
              <div className="text-[10px] tracking-[0.15em] text-[#999] uppercase font-semibold mb-3">Top Leads by Rank</div>
              <div className="space-y-0 max-h-64 overflow-y-auto">
                {/* Header */}
                <div className="grid grid-cols-[2rem_1fr_auto_4rem] gap-2 pb-2 border-b border-[#161616] text-[9px] text-[#555] tracking-wider uppercase">
                  <span>Rnk</span>
                  <span>Agency</span>
                  <span>City</span>
                  <span className="text-right">Status</span>
                </div>
                {data.top_leads.map((lead, i) => (
                  <div 
                    key={i} 
                    onClick={() => onSelectLead(lead)}
                    className="grid grid-cols-[2rem_1fr_auto_4rem] gap-2 py-2 border-b border-[#0D0D0D] last:border-0 items-center cursor-pointer hover:bg-[#FF6B00]/5 transition-colors group"
                  >
                    <span className="text-[11px] font-bold text-[#555] group-hover:text-[#FF6B00] truncate">{lead.rank}</span>
                    <span className="text-[11px] text-[#AAA] group-hover:text-white truncate font-medium">{lead.company}</span>
                    <span className="text-[10px] text-[#444] truncate">{lead.city}</span>
                    <div className="flex justify-end">
                      {lead.emailStatus === "Sent" ? (
                        <span className="text-[8px] px-1.5 py-0.5 bg-green-950/20 border border-green-900/40 text-green-500 tracking-wider">SENT</span>
                      ) : (
                        <span className="text-[8px] px-1.5 py-0.5 bg-[#111] border border-[#222] text-[#555] tracking-wider">QUEUE</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EMAIL ANALYTICS
   ═══════════════════════════════════════════════════════ */

function IconEye() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="3" y="5" width="8" height="4" stroke="currentColor" strokeWidth="1" fill="none" />
      <rect x="6" y="6" width="2" height="2" fill="currentColor" />
      <rect x="1" y="6" width="2" height="2" fill="currentColor" opacity="0.4" />
      <rect x="11" y="6" width="2" height="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

const EMAIL_TEMPLATE_HTML = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#111111;max-width:580px;">
  <p style="margin:0 0 16px 0;">Hello {Name},</p>
  <p style="margin:0 0 16px 0;">[Hook — specific observation about their agency or market segment.]</p>
  <p style="margin:0 0 16px 0;">[Problem — one concrete operational pain point.]</p>
  <p style="margin:0 0 16px 0;">[Solution — KRONOS as automation consulting partner.]</p>
  <p style="margin:0 0 16px 0;"><a href="https://cal.com/kronosautomations/15min" style="color:#FF6B00;">Book a 15-min call</a><br>Or review our work first: <a href="https://kronosautomations.com" style="color:#FF6B00;">kronosautomations.com</a></p>
  <p style="margin-top:24px;padding-top:14px;border-top:1px solid #e0e0e0;font-size:13px;color:#555555;line-height:1.6;">Otto – KRONOS Automations<br>AI Automation Consulting · Switzerland<br><a href="mailto:otto@kronosbusiness.com" style="color:#FF6B00;text-decoration:none;">otto@kronosbusiness.com</a></p>
</div>`;

function EmailTemplatePreview() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="bg-[#0A0A0A] border border-[#161616] p-4 mt-4">
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center gap-2 w-full cursor-pointer group"
      >
        <IconEye />
        <span className="text-[10px] tracking-[0.15em] text-[#999] uppercase font-semibold group-hover:text-[#FF6B00] transition-colors">
          Email Template Preview
        </span>
        <span className="text-[10px] text-[#555] ml-auto">
          {showPreview ? "HIDE" : "SHOW"}
        </span>
      </button>

      {showPreview && (
        <div className="mt-4 space-y-3 fade-up">
          <div className="flex items-center gap-2 p-2 border border-[#1A1A1A] bg-[#060606]">
            <div className="w-1.5 h-1.5 bg-[#FF6B00] blink" />
            <span className="text-[9px] text-[#888] tracking-wider uppercase">
              AI-Generated via GPT-4o-mini // Plain-text style for inbox delivery
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 border border-[#161616]">
              <span className="text-[#666] uppercase tracking-wider">From</span>
              <p className="text-white mt-0.5 font-mono text-[11px]">otto@kronosbusiness.com</p>
            </div>
            <div className="p-2 border border-[#161616]">
              <span className="text-[#666] uppercase tracking-wider">Subject</span>
              <p className="text-[#FF6B00] mt-0.5 font-mono text-[11px]">AI-generated per lead</p>
            </div>
          </div>

          <div className="border border-[#222] overflow-hidden">
            <div className="bg-[#1A1A1A] px-3 py-1.5 flex items-center justify-between">
              <span className="text-[9px] text-[#666] tracking-wider uppercase">HTML Preview</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#333]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#333]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#333]" />
              </div>
            </div>
            <div
              className="bg-[#f9f9f9] p-6"
              dangerouslySetInnerHTML={{ __html: EMAIL_TEMPLATE_HTML }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Structure", value: "Hook→Pain→CTA" },
              { label: "Style", value: "Plain-text" },
              { label: "CTA", value: "Cal.com + Site" },
            ].map((item) => (
              <div key={item.label} className="p-2 border border-[#161616] text-center">
                <div className="text-[9px] text-[#666] tracking-wider uppercase">{item.label}</div>
                <div className="text-[10px] text-white mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmailAnalytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/analytics/email?days=${days}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error);
      } else {
        setData(json);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <IconMail />
            <span className="text-[10px] tracking-[0.25em] text-[#FF6B00] uppercase font-semibold">Email</span>
          </div>
          <div className="flex-1 h-px bg-[#1A1A1A] min-w-8" />
        </div>
        <div className="flex items-center gap-3">
          <RangeFilter days={days} onChange={setDays} />
          <button onClick={fetchStats} className="text-[10px] text-[#777] hover:text-[#FF6B00] transition-colors cursor-pointer tracking-wider">SYNC</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center">
          <div className="w-2 h-2 bg-[#FF6B00] blink" />
          <span className="text-[10px] text-[#888] tracking-wider">FETCHING DATA...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 py-8">
          <div className="w-2 h-2 bg-red-500" />
          <span className="text-xs text-red-400">{error}</span>
        </div>
      ) : data ? (
        <>
          <div className="mb-4">
            <Metric value={data.totals.requests} label="Total Emails Sent" highlight large />
          </div>

          <div className="bg-[#0A0A0A] border border-[#161616] p-4 mb-4 space-y-3">
            <div className="text-[10px] tracking-[0.15em] text-[#999] uppercase font-semibold mb-2">Conversion Funnel</div>
            <ProgressStat label="Delivered" value={data.totals.delivered} max={data.totals.requests} color="#FF6B00" />
            <ProgressStat label="Opened" value={data.totals.opens} max={data.totals.requests} color="#FF8C33" />
            <ProgressStat label="Clicked" value={data.totals.clicks} max={data.totals.requests} color="#FFB366" />
            <ProgressStat label="Bounced" value={data.totals.bounces} max={data.totals.requests} color="#FF3333" />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Metric value={`${data.openRate}%`} label="Open Rate" highlight />
            <Metric value={`${data.clickRate}%`} label="Click Rate" />
          </div>

          {data.daily.length > 1 && (
            <div>
              <div className="text-[10px] tracking-[0.15em] text-[#888] uppercase mb-2">Daily Activity</div>
              <BarChart
                data={data.daily.map((d) => ({
                  label: d.date.slice(5),
                  bars: [
                    { value: d.delivered, color: "#FF6B00" },
                    { value: d.opens, color: "#FF6B0066" },
                  ],
                }))}
              />
            </div>
          )}

          <EmailTemplatePreview />
        </>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SMS ANALYTICS
   ═══════════════════════════════════════════════════════ */

function SmsAnalytics() {
  const [days, setDays] = useState(90);
  const [data, setData] = useState<SmsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/analytics/sms?days=${days}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <IconSms />
            <span className="text-[10px] tracking-[0.25em] text-[#FF6B00] uppercase font-semibold">SMS</span>
          </div>
          <div className="flex-1 h-px bg-[#1A1A1A] min-w-8" />
        </div>
        <div className="flex items-center gap-3">
          <RangeFilter days={days} onChange={setDays} />
          <button onClick={fetchStats} className="text-[10px] text-[#777] hover:text-[#FF6B00] transition-colors cursor-pointer tracking-wider">SYNC</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center">
          <div className="w-2 h-2 bg-[#FF6B00] blink" />
          <span className="text-[10px] text-[#888] tracking-wider">FETCHING DATA...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 py-8">
          <div className="w-2 h-2 bg-red-500" />
          <span className="text-xs text-red-400">{error}</span>
        </div>
      ) : data ? (
        <>
          <div className="mb-4">
            <Metric value={data.total} label="Total SMS Sent" highlight large />
          </div>

          <div className="bg-[#0A0A0A] border border-[#161616] p-5 mb-4">
            <div className="text-[10px] tracking-[0.15em] text-[#999] uppercase font-semibold mb-4">Delivery Breakdown</div>
            <DonutChart
              segments={[
                { value: data.totals.delivered, color: "#22C55E", label: "Delivered" },
                { value: data.totals.sent - data.totals.delivered, color: "#FF6B00", label: "In Transit" },
                { value: data.totals.failed, color: "#EF4444", label: "Failed" },
                { value: data.totals.undelivered, color: "#666666", label: "Undelivered" },
              ].filter((s) => s.value > 0)}
            />
          </div>

          <div className="bg-[#0A0A0A] border border-[#161616] p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.15em] text-[#888] uppercase">Delivery Rate</span>
              <span className="text-xl font-bold text-[#FF6B00]">{data.deliveryRate}%</span>
            </div>
            <div className="h-3 bg-[#161616] w-full">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{
                  width: `${data.deliveryRate}%`,
                  background: "linear-gradient(90deg, #FF6B00, #FF8C33)",
                }}
              />
            </div>
          </div>

          {data.daily.length > 1 && (
            <div className="mb-4">
              <div className="text-[10px] tracking-[0.15em] text-[#888] uppercase mb-2">Daily Activity</div>
              <BarChart
                data={data.daily.map((d) => ({
                  label: d.date.slice(5),
                  bars: [
                    { value: d.delivered, color: "#22C55E" },
                    { value: d.failed, color: "#EF4444" },
                  ],
                }))}
              />
            </div>
          )}

          {data.recent && data.recent.length > 0 && (
            <div className="bg-[#0A0A0A] border border-[#161616] p-4">
              <div className="text-[10px] tracking-[0.15em] text-[#999] uppercase font-semibold mb-3">Recent Messages</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.recent.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#111] last:border-0">
                    <div className={`w-1.5 h-1.5 mt-1.5 shrink-0 ${msg.status === "delivered" ? "bg-green-500" : "bg-red-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-white font-mono truncate">{msg.to}</span>
                        <span className="text-[9px] text-[#777] shrink-0">{msg.date}</span>
                      </div>
                      <p className="text-[10px] text-[#888] mt-0.5">{msg.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.totals.queued > 0 && (
            <div className="mt-3 flex items-center gap-2 p-3 border border-yellow-900/30 bg-yellow-950/10">
              <div className="w-2 h-2 bg-yellow-500 blink" />
              <span className="text-[10px] text-yellow-400 tracking-wider">{data.totals.queued} IN QUEUE</span>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const [selectedLead, setSelectedLead] = useState<LeadInfo | null>(null);

  return (
    <div className="space-y-6">
      <CampaignLauncher />
      <LeadsAnalytics onSelectLead={setSelectedLead} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmailAnalytics />
        <SmsAnalytics />
      </div>

      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      <div className="flex items-center justify-center gap-2 pt-4 pb-2">
        <div className="w-1 h-1 bg-[#1A1A1A]" />
        <span className="text-[9px] tracking-[0.2em] text-[#1A1A1A] uppercase">Kronos Automations</span>
        <div className="w-1 h-1 bg-[#1A1A1A]" />
      </div>
    </div>
  );
}
