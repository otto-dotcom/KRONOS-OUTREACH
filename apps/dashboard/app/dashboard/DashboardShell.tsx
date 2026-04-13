"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useProject } from "./ProjectContext";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, BarChart2, Database, MessageSquare,
  Settings, Zap, LogOut, ChevronRight, ArrowLeftRight, Menu, X,
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
        <div style={{ padding: "10px 14px", minHeight: 56, maxHeight: 90, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
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

/* ── Business Selector ────────────────────────────────────────────────────── */
function BusinessSelector({ onSelect }: { onSelect: (p: "kronos" | "helios") => void }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#09090B", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top line */}
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />

      {/* Version tag */}
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: "0.4em", textTransform: "uppercase", zIndex: 20, whiteSpace: "nowrap" }}>
        UNIFIED OUTREACH · v5.1
      </div>

      {/* Panels — row on desktop, column on mobile */}
      <div style={{ display: "flex", flex: 1, flexDirection: isMobile ? "column" : "row", marginTop: isMobile ? 40 : 48, marginBottom: isMobile ? 160 : 0 }}>

        {/* KRONOS */}
        <div
          className={isMobile ? "selector-panel-mobile" : "selector-side"}
          onClick={() => onSelect("kronos")}
          style={{ borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.05)", borderBottom: isMobile ? "1px solid rgba(255,255,255,0.05)" : "none", position: "relative" }}
        >
          <div style={{ position: "absolute", inset: 0, background: "#0A0A0C" }} />
          {!isMobile && (
            <div style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.5s", background: "radial-gradient(ellipse at 20% 45%, rgba(249,115,22,0.12) 0%, transparent 60%)" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
            />
          )}
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: "center", justifyContent: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 0, padding: isMobile ? "20px 24px" : "0 40px", textAlign: isMobile ? "left" : "center" }}>
            <div style={{
              padding: isMobile ? 12 : 18,
              marginBottom: isMobile ? 0 : 32,
              background: "#09090B", border: "1px solid rgba(249,115,22,0.18)",
              borderRadius: 14, flexShrink: 0,
            }}>
              <KronosLogo size={isMobile ? 36 : 64} />
            </div>
            <div>
              <h2 style={{ fontSize: isMobile ? 28 : "clamp(40px,7vw,72px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#F4F4F5", lineHeight: 1, margin: 0, fontFamily: "var(--font-sans)" }}>
                KRONOS
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: isMobile ? 9 : 10, color: "#52525B", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 8, lineHeight: 1.7 }}>
                Swiss Real Estate<br />Outreach Ops
              </p>
            </div>
          </div>
        </div>

        {/* HELIOS */}
        <div
          className={isMobile ? "selector-panel-mobile" : "selector-side"}
          onClick={() => onSelect("helios")}
          style={{ position: "relative" }}
        >
          <div style={{ position: "absolute", inset: 0, background: "#F0FDF4" }} />
          {!isMobile && (
            <div style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.5s", background: "radial-gradient(ellipse at 80% 55%, rgba(22,163,74,0.10) 0%, transparent 60%)" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
            />
          )}
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: "center", justifyContent: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 0, padding: isMobile ? "20px 24px" : "0 40px", textAlign: isMobile ? "left" : "center" }}>
            <div style={{
              padding: isMobile ? 12 : 18,
              marginBottom: isMobile ? 0 : 32,
              background: "#fff", border: "1px solid rgba(22,163,74,0.18)",
              borderRadius: 14, flexShrink: 0,
            }}>
              <HeliosLogo size={isMobile ? 36 : 64} />
            </div>
            <div>
              <h2 style={{ fontSize: isMobile ? 28 : "clamp(40px,7vw,72px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#111827", lineHeight: 1, margin: 0, fontFamily: "var(--font-sans)" }}>
                HELIOS
              </h2>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: isMobile ? 9 : 10, color: "#6B7280", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 8, lineHeight: 1.7 }}>
                Italian Solar Intelligence<br />Clean Energy Pipeline
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* JARVIS input — pinned to bottom */}
      <div className="fade-in" style={{ position: "absolute", bottom: isMobile ? 20 : 28, left: 0, right: 0, padding: "0 20px", zIndex: 20 }}>
        <JarvisMiniChat onSelectProject={onSelect} />
      </div>

      {/* Center divider mark (desktop only) */}
      {!isMobile && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, pointerEvents: "none", zIndex: 20 }}>
          <div style={{ width: 1, height: 60, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08))" }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
          <div style={{ width: 1, height: 60, background: "linear-gradient(to top, transparent, rgba(255,255,255,0.08))" }} />
        </div>
      )}
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

/* ── Nav item ─────────────────────────────────────────────────────────────── */
function NavItem({ icon: Icon, label, path, active, onClick }: {
  icon: React.ElementType; label: string; path: string; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={path}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10,
        background: active ? "rgba(249,115,22,0.12)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-3)",
        transition: "background 0.15s, color 0.15s",
        position: "relative",
        textDecoration: "none",
        width: "100%",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
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
      {active && (
        <div style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 20, background: "var(--accent)", borderRadius: "0 2px 2px 0",
        }} />
      )}
      <Icon size={16} strokeWidth={active ? 2.25 : 1.75} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{label}</span>
    </Link>
  );
}

/* ── Dashboard Shell ─────────────────────────────────────────────────────── */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { project, setProject } = useProject();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
  }

  if (project === null) {
    return <BusinessSelector onSelect={setProject} />;
  }

  const isHelios  = project === "helios";
  const activeLabel = NAV.find(n => pathname === n.path)?.label ?? "Overview";

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--bg)", position: "relative" }}>

      {/* ── Ambient orbs ────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0.08) 35%, transparent 70%)", top: -300, left: -200, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)", bottom: -250, right: -100, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.04) 50%, transparent 70%)", top: "35%", right: "15%", filter: "blur(30px)" }} />
      </div>

      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="shell-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)", zIndex: 190,
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`shell-sidebar${sidebarOpen ? " open" : ""}`}
        style={{
          width: 220, display: "flex", flexDirection: "column",
          paddingTop: 16, paddingBottom: 16, gap: 0, flexShrink: 0,
          background: "rgba(9,9,11,0.90)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          zIndex: 200, position: "relative",
        }}
      >
        {/* Top shine */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)", pointerEvents: "none" }} />

        {/* Logo + project name + mobile close */}
        <div style={{ padding: "4px 12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
            onClick={() => { router.push("/dashboard"); setSidebarOpen(false); }}
          >
            {isHelios ? <HeliosLogo size={26} /> : <KronosLogo size={26} />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--text-1)" }}>
                {isHelios ? "HELIOS" : "KRONOS"}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 1 }}>
                {isHelios ? "Solar Intel" : "RE Outreach"}
              </div>
            </div>
          </div>
          {/* Close button — CSS shows only on mobile */}
          <button
            className="shell-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--text-3)", padding: 4, borderRadius: 6,
              display: "none", // overridden by CSS on mobile
            }}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 16px 12px" }} />

        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, padding: "0 8px", overflowY: "auto" }}>
          {NAV.map(({ icon, label, path }) => (
            <NavItem key={path} icon={icon} label={label} path={path} active={pathname === path} onClick={() => setSidebarOpen(false)} />
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 16px 8px" }} />

        {/* Bottom: project switcher + logout */}
        <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          <button
            onClick={() => { setProject(isHelios ? "kronos" : "helios"); setSidebarOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: "var(--text-3)", width: "100%",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
          >
            <ArrowLeftRight size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Switch to {isHelios ? "KRONOS" : "HELIOS"}</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: "var(--text-3)", width: "100%",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.10)"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
          >
            <LogOut size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1, minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
          background: "rgba(9,9,11,0.60)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0, gap: 8,
        }}>
          {/* Left: hamburger (mobile) + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {/* Hamburger — CSS shows only on mobile */}
            <button
              className="shell-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "var(--text-2)", padding: "4px 2px", borderRadius: 6,
                display: "none", // overridden by CSS on mobile
                flexShrink: 0,
              }}
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>

            {/* Logo + breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
              {/* Inline logo on mobile (when sidebar is hidden) */}
              <div className="shell-mobile-logo" style={{ display: "none", flexShrink: 0 }}>
                {isHelios ? <HeliosLogo size={20} /> : <KronosLogo size={20} />}
              </div>
              <span className="shell-breadcrumb-app" style={{ fontSize: 12, color: "var(--text-3)", whiteSpace: "nowrap" }}>
                {isHelios ? "HELIOS" : "KRONOS"}
              </span>
              <ChevronRight size={12} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeLabel}
              </span>
            </div>
          </div>

          {/* Right: status + project badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Status dot — hidden on very small screens via CSS */}
            <div className="shell-status" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span className="dot-live" />
              <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, fontFamily: "var(--font-mono)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>LIVE</span>
            </div>

            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

            {/* Project badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px 4px 6px",
              background: "var(--accent-dim)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 20,
              flexShrink: 0,
            }}>
              {isHelios ? <HeliosLogo size={14} /> : <KronosLogo size={14} />}
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em" }}>
                {isHelios ? "HELIOS" : "KRONOS"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{ flex: 1, overflowY: "auto", padding: "16px" }}
          className="custom-scrollbar shell-main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
