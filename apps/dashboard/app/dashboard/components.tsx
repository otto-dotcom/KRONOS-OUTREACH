"use client";

import React from "react";

/* ── Icons ───────────────────────────────────────────────────────────────── */
export function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function IconRocket() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.5-1 1-4c2 0 3 .5 3 .5" />
      <path d="M15 9V4s1 .5 4 1c0 2-.5 3-.5 3" />
    </svg>
  );
}

export function IconDatabase() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

/* ── Section label ───────────────────────────────────────────────────────── */
export function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ color: "var(--accent)", display: "flex" }}>{icon}</div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.02em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

/* ── KPI Metric card ─────────────────────────────────────────────────────── */
export function Metric({ value, label, highlight, large }: {
  value: string | number;
  label: string;
  highlight?: boolean;
  large?: boolean;
}) {
  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "16px 18px",
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-strong)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div style={{
        fontSize: large ? 36 : 28,
        fontWeight: 700,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        color: highlight ? "var(--accent)" : "var(--text-1)",
        marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ── KPI card with icon box (Image-2 style) ──────────────────────────────── */
export function KpiCard({
  label, value, delta, deltaType = "neutral", icon, iconVariant = "accent",
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconVariant?: "accent" | "success" | "danger" | "warning" | "info";
}) {
  return (
    <div style={{
      background: "var(--surface-1)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      transition: "border-color 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.25)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div className={`icon-box icon-box-${iconVariant}`}>{icon}</div>
        {delta && (
          <span className={`delta delta-${deltaType}`}>
            {deltaType === "up" ? "↑" : deltaType === "down" ? "↓" : ""}{delta}
          </span>
        )}
      </div>
      <div>
        <div className="kpi-value" style={{ marginBottom: 4 }}>{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

/* ── Detail row ──────────────────────────────────────────────────────────── */
export function DetailRow({ label, value, isLink, href, highlight }: {
  label: string; value: string; isLink?: boolean; href?: string; highlight?: boolean;
}) {
  return (
    <div>
      <span style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 3, fontWeight: 500 }}>{label}</span>
      {isLink && href && value && value !== "—" ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 600, color: highlight ? "var(--accent)" : "var(--text-1)", textDecoration: "underline", textDecorationColor: "var(--border-strong)", wordBreak: "break-all" }}>
          {value}
        </a>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 600, color: highlight ? "var(--accent)" : "var(--text-1)", wordBreak: "break-all" }}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}

/* ── Data block ──────────────────────────────────────────────────────────── */
export function DataBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "16px 18px",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--border)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

/* ── Range filter ────────────────────────────────────────────────────────── */
export function RangeFilter({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  return (
    <div style={{
      display: "flex", gap: 2, padding: 3,
      background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8,
    }}>
      {[7, 30, 90].map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          style={{
            padding: "4px 12px", border: "none", cursor: "pointer",
            borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: days === d ? "var(--accent)" : "transparent",
            color: days === d ? "#fff" : "var(--text-2)",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}

/* ── Donut chart ─────────────────────────────────────────────────────────── */
export function DonutChart({ segments, size = 120 }: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const r = 38;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        {/* Track */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="13" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const gap  = circ - dash;
          const cur  = offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-cur}
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dasharray 0.7s ease" }}
            />
          );
        })}
        <text x="50" y="46" textAnchor="middle" fill="var(--text-1)" fontSize="15" fontWeight="700" fontFamily="var(--font-sans)">
          {total}
        </text>
        <text x="50" y="58" textAnchor="middle" fill="var(--text-3)" fontSize="7" fontFamily="var(--font-sans)" letterSpacing="0.08em">
          TOTAL
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{seg.label}</span>
            <span style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 700, marginLeft: "auto", paddingLeft: 12 }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Bar chart ───────────────────────────────────────────────────────────── */
export function BarChart({ data, height = 100 }: {
  data: { label: string; bars: { value: number; color: string }[] }[];
  height?: number;
}) {
  const allValues = data.flatMap(d => d.bars.map(b => b.value));
  const max = Math.max(...allValues, 1);

  return (
    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "14px 12px 10px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, height: "100%", justifyContent: "flex-end" }}>
            {d.bars.map((bar, j) => {
              const pct = (bar.value / max) * 100;
              return (
                <div
                  key={j}
                  style={{
                    width: "100%",
                    height: `${Math.max(pct, bar.value > 0 ? 2 : 0)}%`,
                    background: bar.color,
                    borderRadius: "3px 3px 0 0",
                    minHeight: bar.value > 0 ? 3 : 0,
                    transition: "height 0.5s ease",
                    opacity: j === 0 ? 1 : 0.45,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Progress stat ───────────────────────────────────────────────────────── */
export function ProgressStat({ label, value, max, color = "var(--accent)" }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, width: 72, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: "var(--surface-3)", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 100, transition: "width 0.7s ease" }} />
      </div>
      <span style={{ fontSize: 12, color: "var(--text-1)", fontWeight: 700, width: 36, textAlign: "right", flexShrink: 0 }}>{value}</span>
    </div>
  );
}

/* ── Swiss badge ─────────────────────────────────────────────────────────── */
export function SwissBadge() {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "5px 10px",
      background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6,
    }}>
      <div style={{ width: 14, height: 14, background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2 }}>
        <span style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>+</span>
      </div>
      <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600 }}>Swiss-engineered</span>
    </div>
  );
}
