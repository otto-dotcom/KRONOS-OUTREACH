"use client";

import React from "react";

export function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="1" y="3" width="14" height="10" stroke="#FF6B00" strokeWidth="1" fill="none" />
      <path d="M1 3 L8 9 L15 3" stroke="#FF6B00" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function IconRocket() {
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

export function IconDatabase() {
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

export function SectionLabel({ icon, label, glow }: { icon: React.ReactNode; label: string; glow?: boolean }) {
  return (
    <div className="flex items-center gap-6 mb-12 group">
      <div className={`p-4 glass-obsidian transition-all border border-white/5 scale-125 ${glow ? 'glow-orange' : 'group-hover:glow-orange'}`}>
        <div className="text-[#FF6B00]">{icon}</div>
      </div>
      <div className="flex flex-col">
        <span className="text-[12px] tracking-[0.6em] text-white uppercase font-black">
          {label}
        </span>
        <div className="h-1 w-24 bg-[#FF6B00] mt-2 opacity-80" />
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-[#1A1A1A] to-transparent ml-4" />
    </div>
  );
}

export function Metric({ value, label, highlight, large }: {
  value: string | number; label: string; highlight?: boolean; large?: boolean;
}) {
  return (
    <div className="glass-obsidian p-10 transition-all hover:bg-white/[0.02] hover:scale-[1.02] group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-8 h-8 opacity-20">
         <div className="w-px h-full bg-white absolute right-0" />
         <div className="h-px w-full bg-white absolute top-0" />
      </div>
      <div className={`pixel-mega tracking-tighter transition-all ${highlight ? "text-[#FF6B00]" : "text-white group-hover:text-[#FF6B00]"} ${large ? "text-7xl md:text-8xl" : "text-5xl md:text-6xl"}`}>
        {value}
      </div>
      <div className="text-[10px] tracking-[0.4em] text-[#888] uppercase mt-6 font-bold group-hover:text-white transition-colors">{label}</div>
    </div>
  );
}

export function DetailRow({ label, value, isLink, href, highlight }: { label: string, value: string, isLink?: boolean, href?: string, highlight?: boolean }) {
  return (
    <div className="group/row">
      <span className="text-[8px] tracking-[0.3em] text-[#333] uppercase block mb-1.5 font-black group-hover/row:text-[#555] transition-colors">{label}</span>
      {isLink && href && value && value !== "—" ? (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`text-[13px] font-bold transition-all break-all ${highlight ? "neon-text underline decoration-orange-500/30" : "text-[#AAA] hover:text-[#FF6B00]"}`}
        >
          {value}
        </a>
      ) : (
        <span className={`text-[13px] font-bold break-all transition-colors ${highlight ? "neon-text focus:glow-orange" : "text-[#AAA] group-hover/row:text-white"}`}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}

export function DataBlock({ title, children, glow }: { title: string; children: React.ReactNode; glow?: boolean }) {
  return (
    <div className={`glass-obsidian p-6 border relative group transition-all ${glow ? "glow-orange border-orange-500/20" : "border-white/5 hover:border-orange-500/10"}`}>
       <div className="absolute top-0 right-0 w-12 h-px bg-gradient-to-l from-orange-500/40 to-transparent opacity-40" />
       <div className="absolute bottom-0 left-0 w-12 h-px bg-gradient-to-r from-orange-500/40 to-transparent opacity-40" />
       <div className="text-[9px] tracking-[0.4em] text-[#888] uppercase mb-6 font-bold group-hover:text-white transition-colors border-b border-white/5 pb-2">
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
    <div className="flex gap-1.5 p-1 glass-obsidian border border-white/5">
      {[7, 30, 90].map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-4 py-1.5 text-[9px] tracking-[0.2em] transition-all cursor-pointer font-bold uppercase ${days === d
            ? "bg-[#FF6B00] text-black"
            : "text-[#888] hover:text-white hover:bg-white/5"
            }`}
        >
          {d}D
        </button>
      ))}
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
