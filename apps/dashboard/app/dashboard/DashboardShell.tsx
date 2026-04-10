"use client";

import { useRouter, usePathname } from "next/navigation";
import { useProject } from "./ProjectContext";
import { useState } from "react";
import {
  LayoutDashboard, BarChart2, Database, MessageSquare,
  Settings, Zap, LogOut, ChevronRight, ArrowLeftRight
} from "lucide-react";

/* ── Logos ───────────────────────────────────────────────────────────────── */
function KronosLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="10" y="2" width="12" height="2" fill="#F97316" />
      <rect x="8"  y="4" width="2"  height="2" fill="#F97316" />
      <rect x="22" y="4" width="2"  height="2" fill="#F97316" />
      <rect x="6"  y="6" width="2"  height="2" fill="#F97316" />
      <rect x="24" y="6" width="2"  height="2" fill="#F97316" />
      <rect x="4"  y="8" width="2"  height="4" fill="#F97316" />
      <rect x="26" y="8" width="2"  height="4" fill="#F97316" />
      <rect x="4"  y="12" width="2" height="4" fill="#F97316" />
      <rect x="26" y="12" width="2" height="4" fill="#F97316" />
      <rect x="4"  y="16" width="2" height="4" fill="#F97316" />
      <rect x="26" y="16" width="2" height="4" fill="#F97316" />
      <rect x="4"  y="20" width="2" height="2" fill="#F97316" />
      <rect x="26" y="20" width="2" height="2" fill="#F97316" />
      <rect x="6"  y="22" width="2" height="2" fill="#F97316" />
      <rect x="24" y="22" width="2" height="2" fill="#F97316" />
      <rect x="8"  y="24" width="2" height="2" fill="#F97316" />
      <rect x="22" y="24" width="2" height="2" fill="#F97316" />
      <rect x="10" y="26" width="12" height="2" fill="#F97316" />
      <rect x="8"  y="6"  width="16" height="18" fill="#09090B" />
      <rect x="6"  y="8"  width="2"  height="14" fill="#09090B" />
      <rect x="24" y="8"  width="2"  height="14" fill="#09090B" />
      <rect x="15" y="8"  width="2"  height="8"  fill="#F97316" />
      <rect x="15" y="14" width="6"  height="2"  fill="#F97316" opacity="0.7" />
      <rect x="15" y="14" width="2"  height="2"  fill="#fff" />
    </svg>
  );
}

function HeliosLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ imageRendering: "pixelated" }}>
      <circle cx="16" cy="16" r="6"   fill="#16A34A" />
      <rect x="15" y="4"  width="2" height="6" fill="#16A34A" />
      <rect x="15" y="22" width="2" height="6" fill="#16A34A" />
      <rect x="4"  y="15" width="6" height="2" fill="#16A34A" />
      <rect x="22" y="15" width="6" height="2" fill="#16A34A" />
      <rect x="7"  y="7"  width="2" height="2" fill="#16A34A" opacity="0.55" />
      <rect x="23" y="7"  width="2" height="2" fill="#16A34A" opacity="0.55" />
      <rect x="7"  y="23" width="2" height="2" fill="#16A34A" opacity="0.55" />
      <rect x="23" y="23" width="2" height="2" fill="#16A34A" opacity="0.55" />
    </svg>
  );
}

/* ── JARVIS mini-chat ─────────────────────────────────────────────────────── */
function JarvisMiniChat({ onSelectProject }: { onSelectProject: (p: "kronos" | "helios") => void }) {
  const [input, setInput] = useState("");
  const [log, setLog]   = useState<string[]>(["JARVIS online — which operation today?"]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const val = input.trim().toLowerCase();
    if (!val) return;
    setLog(prev => [...prev, `> ${input}`]);
    setInput("");
    setTimeout(() => {
      if (val.includes("kronos") || val.includes("swiss") || val.includes("re")) {
        setLog(prev => [...prev, "Initialising KRONOS — Swiss RE outreach."]);
        setTimeout(() => onSelectProject("kronos"), 700);
      } else if (val.includes("helios") || val.includes("solar") || val.includes("ital")) {
        setLog(prev => [...prev, "Initialising HELIOS — Solar intelligence."]);
        setTimeout(() => onSelectProject("helios"), 700);
      } else {
        setLog(prev => [...prev, "Specify: KRONOS or HELIOS."]);
      }
    }, 280);
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div style={{
        background: "rgba(9,9,11,0.92)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 12,
        overflow: "hidden",
        backdropFilter: "blur(24px)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#FF5F57","#FFBD2E","#28C840"].map(c => (
              <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.18em", marginLeft: 4 }}>
            JARVIS // COMMAND
          </span>
        </div>
        <div style={{ padding: "10px 14px", minHeight: 64, maxHeight: 100, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
          {log.map((line, i) => (
            <div key={i} style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: line.startsWith(">") ? "rgba(255,255,255,0.75)" : "#22C55E",
            }}>
              {line}
            </div>
          ))}
        </div>
        <form onSubmit={submit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px 12px" }}>
          <span style={{ color: "#22C55E", fontFamily: "var(--font-mono)", fontSize: 13 }}>›</span>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="type 'kronos' or 'helios'…"
            autoFocus
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-mono)", fontSize: 11,
            }}
          />
        </form>
      </div>
    </div>
  );
}

/* ── Business Selector ───────────────────────────────────────────────────── */
function BusinessSelector({ onSelect }: { onSelect: (p: "kronos" | "helios") => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#09090B", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Subtle top line */}
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />

      {/* Version tag */}
      <div style={{ position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)", fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: "0.45em", textTransform: "uppercase", zIndex: 20, whiteSpace: "nowrap" }}>
        UNIFIED OUTREACH ARCHITECTURE · v5.1
      </div>

      {/* Split panels */}
      <div style={{ display: "flex", flex: 1, marginTop: 48 }}>

        {/* KRONOS */}
        <div className="selector-side" onClick={() => onSelect("kronos")} style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ position: "absolute", inset: 0, background: "#0A0A0C" }} />
          <div className="group-kronos" style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.5s", background: "radial-gradient(ellipse at 20% 45%, rgba(249,115,22,0.12) 0%, transparent 60%)" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
          />
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, padding: "0 40px", textAlign: "center" }}>
            <div className="fade-up" style={{
              marginBottom: 32, padding: 18,
              background: "#09090B", border: "1px solid rgba(249,115,22,0.15)",
              borderRadius: 16, transition: "border-color 0.4s, box-shadow 0.4s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.5)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 48px rgba(249,115,22,0.12)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.15)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <KronosLogo size={64} />
            </div>
            <div className="slide-in">
              <h2 style={{ fontSize: "clamp(40px,7vw,72px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#F4F4F5", lineHeight: 1, margin: 0, fontFamily: "var(--font-sans)" }}>
                KRONOS
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#52525B", letterSpacing: "0.25em", textTransform: "uppercase", marginTop: 12, lineHeight: 1.8 }}>
                Swiss Real Estate<br />Autonomous Outreach Ops
              </p>
            </div>
          </div>
        </div>

        {/* HELIOS */}
        <div className="selector-side" onClick={() => onSelect("helios")}>
          <div style={{ position: "absolute", inset: 0, background: "#F0FDF4" }} />
          <div style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.5s", background: "radial-gradient(ellipse at 80% 55%, rgba(22,163,74,0.10) 0%, transparent 60%)" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
          />
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, padding: "0 40px", textAlign: "center" }}>
            <div className="fade-up" style={{
              marginBottom: 32, padding: 18,
              background: "#fff", border: "1px solid rgba(22,163,74,0.18)",
              borderRadius: 16, transition: "border-color 0.4s, box-shadow 0.4s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(22,163,74,0.55)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 48px rgba(22,163,74,0.10)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(22,163,74,0.18)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <HeliosLogo size={64} />
            </div>
            <div className="slide-in">
              <h2 style={{ fontSize: "clamp(40px,7vw,72px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#111827", lineHeight: 1, margin: 0, fontFamily: "var(--font-sans)" }}>
                HELIOS
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6B7280", letterSpacing: "0.25em", textTransform: "uppercase", marginTop: 12, lineHeight: 1.8 }}>
                Italian Solar Intelligence<br />Clean Energy Pipeline
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* JARVIS command input */}
      <div className="fade-in" style={{ position: "absolute", bottom: 32, left: 0, right: 0, padding: "0 24px", zIndex: 20 }}>
        <JarvisMiniChat onSelectProject={onSelect} />
      </div>

      {/* Center divider mark */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, pointerEvents: "none", zIndex: 20 }}>
        <div style={{ width: 1, height: 60, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08))" }} />
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
        <div style={{ width: 1, height: 60, background: "linear-gradient(to top, transparent, rgba(255,255,255,0.08))" }} />
      </div>
    </div>
  );
}

/* ── Nav config ──────────────────────────────────────────────────────────── */
const NAV = [
  { icon: LayoutDashboard, label: "Overview",    path: "/dashboard" },
  { icon: BarChart2,       label: "Analytics",   path: "/dashboard/analytics" },
  { icon: Database,        label: "Lead Base",   path: "/dashboard/database" },
  { icon: MessageSquare,   label: "JARVIS",      path: "/dashboard/chat" },
  { icon: Zap,             label: "Automations", path: "/dashboard/automations" },
  { icon: Settings,        label: "Settings",    path: "/dashboard/settings" },
];

/* ── Sidebar tooltip ─────────────────────────────────────────────────────── */
function NavItem({ icon: Icon, label, path, active }: {
  icon: React.ElementType; label: string; path: string; active: boolean;
}) {
  return (
    <a
      href={path}
      title={label}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 40, height: 40, borderRadius: 10,
        background: active ? "var(--accent-dim)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-3)",
        transition: "background 0.15s, color 0.15s",
        position: "relative",
        textDecoration: "none",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
        }
      }}
    >
      <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
      {/* Active indicator */}
      {active && (
        <div style={{
          position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 20, background: "var(--accent)", borderRadius: 2,
        }} />
      )}
    </a>
  );
}

/* ── Dashboard Shell ─────────────────────────────────────────────────────── */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { project, setProject } = useProject();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (project === null) {
    return <BusinessSelector onSelect={setProject} />;
  }

  const isHelios = project === "helios";
  const activeLabel = NAV.find(n => pathname === n.path)?.label ?? "Overview";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: 64, display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 14, paddingBottom: 14, gap: 0, flexShrink: 0,
        background: "var(--surface-1)",
        borderRight: "1px solid var(--border)",
        zIndex: 50,
      }}>
        {/* Logo */}
        <div
          style={{ padding: "6px 0 18px", cursor: "pointer" }}
          onClick={() => router.push("/dashboard")}
          title={project === "kronos" ? "KRONOS" : "HELIOS"}
        >
          {isHelios ? <HeliosLogo size={28} /> : <KronosLogo size={28} />}
        </div>

        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, width: "100%", padding: "0 12px" }}>
          {NAV.map(({ icon, label, path }) => (
            <NavItem key={path} icon={icon} label={label} path={path} active={pathname === path} />
          ))}
        </div>

        {/* Project toggle + logout */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", padding: "0 12px" }}>
          <button
            onClick={() => setProject(isHelios ? "kronos" : "helios")}
            title={`Switch to ${isHelios ? "KRONOS" : "HELIOS"}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: "var(--text-3)",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
          >
            <ArrowLeftRight size={16} strokeWidth={1.75} />
          </button>

          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: "var(--text-3)",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.10)"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <header style={{
          height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
          background: "var(--surface-1)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
              {activeLabel}
            </span>
          </div>

          {/* Right: status + project toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="dot-live" />
              <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>Operational</span>
            </div>

            <div style={{ width: 1, height: 16, background: "var(--border)" }} />

            {/* Project switcher pills */}
            <div style={{
              display: "flex", gap: 2, padding: 3,
              background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8,
            }}>
              {(["kronos","helios"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setProject(p)}
                  style={{
                    padding: "3px 10px", border: "none", cursor: "pointer",
                    borderRadius: 6, fontSize: 11, fontWeight: 600,
                    textTransform: "capitalize",
                    background: project === p ? "var(--accent)" : "transparent",
                    color: project === p ? "#fff" : "var(--text-2)",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
