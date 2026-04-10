"use client";

import { useRouter, usePathname } from "next/navigation";
import { useProject } from "./ProjectContext";
import { useState } from "react";

/* ── Pixel Logos ─────────────────────────────────────────────────────────── */

function KronosLogoSmall() {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="10" y="2" width="12" height="2" fill="#FF6B00" />
      <rect x="8" y="4" width="2" height="2" fill="#FF6B00" />
      <rect x="22" y="4" width="2" height="2" fill="#FF6B00" />
      <rect x="6" y="6" width="2" height="2" fill="#FF6B00" />
      <rect x="24" y="6" width="2" height="2" fill="#FF6B00" />
      <rect x="4" y="8" width="2" height="4" fill="#FF6B00" />
      <rect x="26" y="8" width="2" height="4" fill="#FF6B00" />
      <rect x="4" y="12" width="2" height="4" fill="#FF6B00" />
      <rect x="26" y="12" width="2" height="4" fill="#FF6B00" />
      <rect x="4" y="16" width="2" height="4" fill="#FF6B00" />
      <rect x="26" y="16" width="2" height="4" fill="#FF6B00" />
      <rect x="4" y="20" width="2" height="2" fill="#FF6B00" />
      <rect x="26" y="20" width="2" height="2" fill="#FF6B00" />
      <rect x="6" y="22" width="2" height="2" fill="#FF6B00" />
      <rect x="24" y="22" width="2" height="2" fill="#FF6B00" />
      <rect x="8" y="24" width="2" height="2" fill="#FF6B00" />
      <rect x="22" y="24" width="2" height="2" fill="#FF6B00" />
      <rect x="10" y="26" width="12" height="2" fill="#FF6B00" />
      <rect x="8" y="6" width="16" height="18" fill="#0D0D0D" />
      <rect x="6" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="24" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="15" y="8" width="2" height="8" fill="#FF6B00" />
      <rect x="15" y="14" width="6" height="2" fill="#FF6B00" opacity="0.7" />
      <rect x="15" y="14" width="2" height="2" fill="#FFFFFF" />
      <rect x="28" y="13" width="2" height="4" fill="#FF6B00" />
    </svg>
  );
}

function KronosLogoLarge() {
  return (
    <svg width={72} height={72} viewBox="0 0 32 32" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="10" y="2" width="12" height="2" fill="#FF6B00" />
      <rect x="8" y="4" width="2" height="2" fill="#FF6B00" />
      <rect x="22" y="4" width="2" height="2" fill="#FF6B00" />
      <rect x="6" y="6" width="2" height="2" fill="#FF6B00" />
      <rect x="24" y="6" width="2" height="2" fill="#FF6B00" />
      <rect x="4" y="8" width="2" height="4" fill="#FF6B00" />
      <rect x="26" y="8" width="2" height="4" fill="#FF6B00" />
      <rect x="4" y="12" width="2" height="4" fill="#FF6B00" />
      <rect x="26" y="12" width="2" height="4" fill="#FF6B00" />
      <rect x="4" y="16" width="2" height="4" fill="#FF6B00" />
      <rect x="26" y="16" width="2" height="4" fill="#FF6B00" />
      <rect x="4" y="20" width="2" height="2" fill="#FF6B00" />
      <rect x="26" y="20" width="2" height="2" fill="#FF6B00" />
      <rect x="6" y="22" width="2" height="2" fill="#FF6B00" />
      <rect x="24" y="22" width="2" height="2" fill="#FF6B00" />
      <rect x="8" y="24" width="2" height="2" fill="#FF6B00" />
      <rect x="22" y="24" width="2" height="2" fill="#FF6B00" />
      <rect x="10" y="26" width="12" height="2" fill="#FF6B00" />
      <rect x="8" y="6" width="16" height="18" fill="#0D0D0D" />
      <rect x="6" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="24" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="15" y="8" width="2" height="8" fill="#FF6B00" />
      <rect x="15" y="14" width="6" height="2" fill="#FF6B00" opacity="0.7" />
      <rect x="15" y="14" width="2" height="2" fill="#FFFFFF" />
      <rect x="28" y="13" width="2" height="4" fill="#FF6B00" />
    </svg>
  );
}

function HeliosLogoSmall() {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" fill="none" style={{ imageRendering: "pixelated" }}>
      <circle cx="16" cy="16" r="6" fill="#22C55E" />
      <rect x="15" y="4" width="2" height="6" fill="#22C55E" />
      <rect x="15" y="22" width="2" height="6" fill="#22C55E" />
      <rect x="4" y="15" width="6" height="2" fill="#22C55E" />
      <rect x="22" y="15" width="6" height="2" fill="#22C55E" />
      <rect x="7" y="7" width="2" height="2" fill="#22C55E" opacity="0.6" />
      <rect x="23" y="7" width="2" height="2" fill="#22C55E" opacity="0.6" />
      <rect x="7" y="23" width="2" height="2" fill="#22C55E" opacity="0.6" />
      <rect x="23" y="23" width="2" height="2" fill="#22C55E" opacity="0.6" />
    </svg>
  );
}

function HeliosLogoLarge() {
  return (
    <svg width={72} height={72} viewBox="0 0 32 32" fill="none" style={{ imageRendering: "pixelated" }}>
      <circle cx="16" cy="16" r="6" fill="#22C55E" />
      <rect x="15" y="4" width="2" height="6" fill="#22C55E" />
      <rect x="15" y="22" width="2" height="6" fill="#22C55E" />
      <rect x="4" y="15" width="6" height="2" fill="#22C55E" />
      <rect x="22" y="15" width="6" height="2" fill="#22C55E" />
      <rect x="7" y="7" width="2" height="2" fill="#22C55E" opacity="0.6" />
      <rect x="23" y="7" width="2" height="2" fill="#22C55E" opacity="0.6" />
      <rect x="7" y="23" width="2" height="2" fill="#22C55E" opacity="0.6" />
      <rect x="23" y="23" width="2" height="2" fill="#22C55E" opacity="0.6" />
    </svg>
  );
}

/* ── Jarvis Mini-Chat ────────────────────────────────────────────────────── */
function JarvisMiniChat({ onSelectProject }: { onSelectProject: (p: "kronos" | "helios") => void }) {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string[]>([
    "Jarvis online. Which operation are we running today?"
  ]);

  function handleInput(e: React.FormEvent) {
    e.preventDefault();
    const val = input.trim().toLowerCase();
    if (!val) return;
    setLog(prev => [...prev, `> ${input}`]);
    setInput("");

    setTimeout(() => {
      if (val.includes("kronos") || val.includes("real estate") || val.includes("swiss") || val.includes("re")) {
        setLog(prev => [...prev, "Initializing KRONOS node — Swiss Real Estate Outreach Ops."]);
        setTimeout(() => onSelectProject("kronos"), 800);
      } else if (val.includes("helios") || val.includes("solar") || val.includes("italian") || val.includes("energy")) {
        setLog(prev => [...prev, "Initializing HELIOS lab — Clean Solar Intelligence."]);
        setTimeout(() => onSelectProject("helios"), 800);
      } else {
        setLog(prev => [...prev, "Specify project: KRONOS (Swiss RE) or HELIOS (Solar)."]);
      }
    }, 300);
  }

  return (
    <div className="w-full max-w-md mx-auto mt-10">
      <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[9px] text-white/30 font-mono tracking-widest uppercase ml-2">JARVIS // COMMAND INTERFACE</span>
        </div>
        {/* Log */}
        <div className="p-4 min-h-[80px] max-h-[120px] overflow-y-auto font-mono text-[11px] space-y-1">
          {log.map((line, i) => (
            <div key={i} className={line.startsWith(">") ? "text-white/80" : "text-[#22C55E]/80"}>
              {line}
            </div>
          ))}
        </div>
        {/* Input */}
        <form onSubmit={handleInput} className="flex items-center gap-2 px-4 pb-4">
          <span className="text-[#22C55E] font-mono text-xs">›</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="type 'kronos' or 'helios'..."
            className="flex-1 bg-transparent text-white text-xs font-mono focus:outline-none placeholder:text-white/20"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}

/* ── Business Selector ──────────────────────────────────────────────────── */
function BusinessSelector({ onSelect }: { onSelect: (p: "kronos" | "helios") => void }) {
  return (
    <div className="fixed inset-0 bg-[#020202] overflow-hidden flex flex-col">
      {/* Ambient top glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Header tag */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-[8px] tracking-[0.5em] text-white/20 uppercase font-mono">
        UNIFIED OUTREACH ARCHITECTURE · v5.0.0
      </div>

      {/* Main selector — horizontal split */}
      <div className="flex flex-col md:flex-row flex-1 mt-12 md:mt-0">
        {/* KRONOS – left panel */}
        <div
          onClick={() => onSelect("kronos")}
          className="relative flex-1 group cursor-pointer overflow-hidden border-r border-white/5 transition-all duration-700"
        >
          {/* Gradient glow */}
          <div className="absolute inset-0 bg-[#050505]" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_20%_40%,rgba(255,107,0,0.15)_0%,transparent_60%)]" />
          {/* Grid paper */}
          <div className="absolute inset-0 grid-paper opacity-[0.04]" />
          {/* Scanline at right edge */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#FF6B00]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative h-full flex flex-col items-center justify-center p-12 text-center">
            {/* Logo orb */}
            <div className="mb-8 p-5 rounded-2xl bg-black border border-[#FF6B00]/15 shadow-[0_0_60px_rgba(255,107,0,0.05)] group-hover:border-[#FF6B00]/50 group-hover:shadow-[0_0_80px_rgba(255,107,0,0.15)] transition-all duration-700 fade-up">
              <KronosLogoLarge />
            </div>

            <div className="space-y-3 slide-in">
              <h2 className="text-5xl md:text-7xl font-black tracking-[0.35em] font-mono text-white">KRONOS</h2>
              <div className="text-[10px] tracking-[0.3em] uppercase font-mono text-[#555] leading-loose">
                Autonomous Outreach Ops<br />
                Swiss Real Estate Intelligence
              </div>
              <div className="text-[8px] tracking-[0.4em] text-[#333] font-mono mt-4">[ ACCESS_NODE_ZURICH ]</div>
            </div>

            <div className="mt-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-3 group-hover:translate-y-0">
              <div className="px-8 py-3 bg-[#FF6B00] text-black text-[10px] font-black tracking-[0.3em] uppercase">
                Initialize Session
              </div>
            </div>
          </div>
        </div>

        {/* HELIOS – right panel */}
        <div
          onClick={() => onSelect("helios")}
          className="relative flex-1 group cursor-pointer overflow-hidden transition-all duration-700"
        >
          <div className="absolute inset-0 bg-[#F7FFFC]" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_80%_60%,rgba(34,197,94,0.12)_0%,transparent_60%)]" />
          {/* Subtle dot grid */}
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, #D1EAD8 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.4 }} />
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#22C55E]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative h-full flex flex-col items-center justify-center p-12 text-center text-[#0F2319]">
            <div className="mb-8 p-5 rounded-2xl bg-white border border-[#22C55E]/20 shadow-[0_0_60px_rgba(34,197,94,0.06)] group-hover:border-[#22C55E]/60 group-hover:shadow-[0_0_80px_rgba(34,197,94,0.18)] transition-all duration-700 fade-up">
              <HeliosLogoLarge />
            </div>

            <div className="space-y-3 slide-in">
              <h2 className="text-5xl md:text-7xl font-black tracking-[0.35em] font-mono text-[#0F2319]">HELIOS</h2>
              <div className="text-[10px] tracking-[0.3em] uppercase font-mono text-[#7A9E84] leading-loose">
                Clean Solar Intelligence<br />
                Italian Energy Lab
              </div>
              <div className="text-[8px] tracking-[0.4em] text-[#AABDAD] font-mono mt-4">[ ACCESS_NODE_BIEL ]</div>
            </div>

            <div className="mt-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-3 group-hover:translate-y-0">
              <div className="px-8 py-3 bg-[#22C55E] text-white text-[10px] font-black tracking-[0.3em] uppercase">
                Initialize Session
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Jarvis mini-chat */}
      <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 z-20 fade-in">
        <JarvisMiniChat onSelectProject={onSelect} />
      </div>

      {/* Center divider dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-2 z-20 pointer-events-none">
        <div className="w-px h-20 bg-gradient-to-b from-transparent to-white/10" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <div className="w-px h-20 bg-gradient-to-t from-transparent to-white/10" />
      </div>
    </div>
  );
}

/* ── Dashboard Shell ─────────────────────────────────────────────────────── */

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { project, setProject } = useProject();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const isActive = (path: string) => pathname === path;

  // ── Business Selector (project not chosen yet) ──
  if (project === null) {
    return <BusinessSelector onSelect={setProject} />;
  }

  // ── Full Dashboard Shell ──
  return (
    <div className="min-h-screen bg-k-bg mesh-bg grid-paper">
      <div className="fixed top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-k to-transparent opacity-30 z-[60]" />

      <header className="fixed top-0 left-0 w-full z-50 px-8 py-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between glass-panel px-6 py-4 reveal">
          <div className="flex items-center gap-5 cursor-pointer group" onClick={() => router.push("/dashboard")}>
            <div className="relative">
              {project === "kronos" ? <KronosLogoSmall /> : <HeliosLogoSmall />}
              <div className="absolute -inset-2 bg-k/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-k text-xs tracking-[0.4em] font-mono font-black">{project.toUpperCase()}</span>
              <span className="text-k-text opacity-40 text-[8px] tracking-[0.2em] uppercase font-medium">
                {project === "kronos" ? "Autonomous Outreach Ops" : "Clean Solar Intelligence"}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            {[
              { label: "Control", path: "/dashboard" },
              { label: "Intelligence", path: "/dashboard/analytics" },
              { label: "Settings", path: "/dashboard/settings" },
              { label: "Automations", path: "/dashboard/automations" },
              { label: "LeadBase", path: "/dashboard/database" },
              { label: "Jarvis", path: "/dashboard/chat" },
            ].map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`text-[9px] tracking-[0.3em] font-mono transition-all uppercase font-bold relative group ${
                  isActive(item.path) ? "text-k" : "text-text-dim hover:text-white"
                }`}
              >
                {item.label}
                {isActive(item.path) && <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-k" />}
                <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white group-hover:w-full transition-all" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Project switcher */}
            <div className="flex items-center gap-1 p-1 bg-black/20 border border-white/5">
              <button
                onClick={() => setProject("kronos")}
                className={`px-3 py-1 text-[7px] tracking-widest uppercase font-mono transition-all ${project === "kronos" ? "bg-k text-black" : "text-text-dim hover:text-white"}`}
              >
                Kronos
              </button>
              <button
                onClick={() => setProject("helios")}
                className={`px-3 py-1 text-[7px] tracking-widest uppercase font-mono transition-all ${project === "helios" ? "bg-k text-black" : "text-text-dim hover:text-white"}`}
              >
                Helios
              </button>
            </div>

            <div className="hidden lg:flex flex-col items-end">
              <div className="cyber-tag mb-1">Status: Operational</div>
              <div className="text-[7px] text-text-dim tracking-[0.3em] uppercase">
                {project === "kronos" ? "Zurich // HQ" : "Biel // Solar Lab"}
              </div>
            </div>

            {/* Logout */}
            <div className="w-10 h-10 flex items-center justify-center border border-k/10 hover:border-k/40 transition-colors cursor-pointer" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim hover:text-k transition-colors">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-8 max-w-[1600px] mx-auto min-h-screen">
        {children}
      </main>

      <div className="fixed left-4 bottom-8 rotate-90 origin-left text-[8px] text-text-dim tracking-[0.4em] uppercase font-mono pointer-events-none">
        JARVIS_Core: V.5.0.0 // Outreach_Engine
      </div>
    </div>
  );
}
