"use client";

import React from "react";

export function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function IconRocket() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.5-1 1-4c2 0 3 .5 3 .5" />
      <path d="M15 9V4s1 .5 4 1c0 2-.5 3-.5 3" />
    </svg>
  );
}

export function IconDatabase() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

export function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="text-k">{icon}</div>
      <span className="text-[10px] tracking-[0.2em] text-[#666] uppercase font-pixel font-normal">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5 ml-2" />
    </div>
  );
}

export function Metric({ value, label, highlight, large }: {
  value: string | number; label: string; highlight?: boolean; large?: boolean;
}) {
  return (
    <div className="border border-white/5 p-8 transition-all hover:bg-white/[0.02] glass-obsidian">
      <div className={`font-cinzel tracking-tighter ${highlight ? "text-k" : "text-white"} ${large ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl"}`}>
        {value}
      </div>
      <div className="text-[8px] tracking-[0.2em] text-[#666] uppercase mt-4 font-pixel">{label}</div>
    </div>
  );
}

export function DetailRow({ label, value, isLink, href, highlight }: { label: string, value: string, isLink?: boolean, href?: string, highlight?: boolean }) {
  return (
    <div className="group/row">
      <span className="text-[7px] tracking-[0.3em] text-[#333] uppercase block mb-1.5 font-pixel group-hover/row:text-[#555] transition-colors">{label}</span>
      {isLink && href && value && value !== "—" ? (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`text-[13px] font-bold transition-all break-all ${highlight ? "text-k underline decoration-k/30" : "text-[#AAA] hover:text-k"}`}
        >
          {value}
        </a>
      ) : (
        <span className={`text-[13px] font-bold break-all transition-colors ${highlight ? "text-k" : "text-[#AAA] group-hover/row:text-white"}`}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}

export function DataBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/5 p-6 transition-all hover:border-white/10 glass-obsidian">
       <div className="text-[8px] tracking-[0.2em] text-[#666] uppercase mb-6 font-pixel pb-2 border-b border-white/5">
         {title}
       </div>
       <div className="space-y-6">
         {children}
       </div>
    </div>
  );
}

export function RangeFilter({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  return (
    <div className="flex gap-1.5 p-1 glass-obsidian border border-white/5 rounded-sm">
      {[7, 30, 90].map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-4 py-1.5 text-[8px] tracking-[0.2em] transition-all cursor-pointer font-pixel ${days === d
            ? "bg-k text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            : "text-[#888] hover:text-white hover:bg-white/5"
            }`}
        >
          {d}D
        </button>
      ))}
    </div>
  );
}

export function SwissBadge() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border border-white/5 glass-obsidian">
      <div className="w-4 h-4 bg-[#FF0000] flex items-center justify-center font-bold text-white text-[10px] leading-none shrink-0">
        +
      </div>
      <span className="text-[7px] tracking-[0.3em] text-[#666] uppercase font-pixel leading-none mt-0.5">
        Engineered in Switzerland
      </span>
    </div>
  );
}

export function DonutChart({ segments, size = 120 }: {
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

export function BarChart({ data, height = 80 }: {
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

export function ProgressStat({ label, value, max, color = "#FF6B00" }: {
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
