"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ── JARVIS boot sequence lines ─────────────────────────────────────────── */
const BOOT_LINES = [
  { text: "JARVIS INTELLIGENCE CORE v5.1", delay: 0,   color: "rgba(255,255,255,0.9)", mono: true },
  { text: "Initialising secure neural link...", delay: 300, color: "rgba(255,255,255,0.35)", mono: true },
  { text: "KRONOS-OUTREACH COMMAND TERMINAL", delay: 700, color: "#F97316", mono: true },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 900, color: "rgba(249,115,22,0.25)", mono: true },
  { text: "System: ONLINE  ·  Auth: REQUIRED", delay: 1100, color: "rgba(255,255,255,0.3)", mono: true },
  { text: "", delay: 1300, color: "", mono: false },
  { text: "Enter access key to proceed.", delay: 1500, color: "rgba(255,255,255,0.55)", mono: false },
];

function KronosIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 32 32" fill="none" style={{ imageRendering: "pixelated" }}>
      <rect x="10" y="2"  width="12" height="2"  fill="#F97316" />
      <rect x="8"  y="4"  width="2"  height="2"  fill="#F97316" />
      <rect x="22" y="4"  width="2"  height="2"  fill="#F97316" />
      <rect x="6"  y="6"  width="2"  height="2"  fill="#F97316" />
      <rect x="24" y="6"  width="2"  height="2"  fill="#F97316" />
      <rect x="4"  y="8"  width="2"  height="4"  fill="#F97316" />
      <rect x="26" y="8"  width="2"  height="4"  fill="#F97316" />
      <rect x="4"  y="12" width="2"  height="4"  fill="#F97316" />
      <rect x="26" y="12" width="2"  height="4"  fill="#F97316" />
      <rect x="4"  y="16" width="2"  height="4"  fill="#F97316" />
      <rect x="26" y="16" width="2"  height="4"  fill="#F97316" />
      <rect x="4"  y="20" width="2"  height="2"  fill="#F97316" />
      <rect x="26" y="20" width="2"  height="2"  fill="#F97316" />
      <rect x="6"  y="22" width="2"  height="2"  fill="#F97316" />
      <rect x="24" y="22" width="2"  height="2"  fill="#F97316" />
      <rect x="8"  y="24" width="2"  height="2"  fill="#F97316" />
      <rect x="22" y="24" width="2"  height="2"  fill="#F97316" />
      <rect x="10" y="26" width="12" height="2"  fill="#F97316" />
      <rect x="8"  y="6"  width="16" height="18" fill="#09090B" />
      <rect x="6"  y="8"  width="2"  height="14" fill="#09090B" />
      <rect x="24" y="8"  width="2"  height="14" fill="#09090B" />
      <rect x="15" y="8"  width="2"  height="8"  fill="#F97316" />
      <rect x="15" y="14" width="6"  height="2"  fill="#F97316" opacity="0.7" />
      <rect x="15" y="14" width="2"  height="2"  fill="#fff" />
    </svg>
  );
}

interface LogLine {
  text: string;
  color: string;
  mono: boolean;
  isInput?: boolean;
  isError?: boolean;
}

export default function LoginPage() {
  const [visibleLines, setVisibleLines]   = useState<typeof BOOT_LINES>([]);
  const [showInput, setShowInput]         = useState(false);
  const [password, setPassword]           = useState("");
  const [loading, setLoading]             = useState(false);
  const [log, setLog]                     = useState<LogLine[]>([]);
  const [booted, setBooted]               = useState(false);
  const inputRef                          = useRef<HTMLInputElement>(null);
  const scrollRef                         = useRef<HTMLDivElement>(null);
  const router                            = useRouter();

  /* ── Boot sequence ── */
  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line]);
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => { setShowInput(true); setBooted(true); }, 300);
        }
      }, line.delay);
    });
  }, []);

  /* ── Auto-focus input when ready ── */
  useEffect(() => {
    if (showInput) setTimeout(() => inputRef.current?.focus(), 100);
  }, [showInput]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visibleLines, log]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || loading) return;

    const entered = password;
    setPassword("");
    setLog(prev => [...prev, { text: `> ${entered.replace(/./g, "·")}`, color: "rgba(255,255,255,0.4)", mono: true, isInput: true }]);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: entered }),
      });

      if (res.ok) {
        setLog(prev => [...prev,
          { text: "Authentication successful.", color: "#22C55E", mono: true },
          { text: "Loading intelligence core...", color: "rgba(255,255,255,0.35)", mono: true },
        ]);
        setTimeout(() => router.push("/dashboard"), 900);
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.error === "Too many attempts. Try again later."
          ? "RATE LIMIT EXCEEDED — try again later."
          : "ACCESS DENIED — invalid key.";
        setLog(prev => [...prev, { text: msg, color: "#EF4444", mono: true, isError: true }]);
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch {
      setLog(prev => [...prev, { text: "CONNECTION ERROR — neural link disrupted.", color: "#EF4444", mono: true, isError: true }]);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#09090B", position: "relative", overflow: "hidden", padding: 24,
    }}>
      {/* Background orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)", top: -200, left: -100 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)", bottom: -100, right: 0 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 520, position: "relative", zIndex: 1 }}>

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32, justifyContent: "center" }} className="fade-up">
          <div className="pulse-glow"><KronosIcon /></div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.01em", color: "#F4F4F5", fontFamily: "var(--font-sans)" }}>
              KRONOS
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-mono)", letterSpacing: "0.35em", textTransform: "uppercase", marginTop: 2 }}>
              Command Terminal
            </div>
          </div>
        </div>

        {/* Terminal window */}
        <div className="fade-up" style={{ animationDelay: "0.1s" }}>
          <div style={{
            background: "rgba(9,9,11,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            overflow: "hidden",
            backdropFilter: "blur(24px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.06)",
          }}>

            {/* Title bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#FF5F57","#FFBD2E","#28C840"].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.8 }} />
                ))}
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.3em" }}>
                JARVIS // AUTH
              </span>
              <div style={{ width: 54 }} />
            </div>

            {/* Output area */}
            <div
              ref={scrollRef}
              style={{
                padding: "20px 20px 8px",
                minHeight: 200,
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
              className="hide-scrollbar"
            >
              {/* Boot lines */}
              {visibleLines.map((line, i) => (
                <div key={i} style={{
                  fontFamily: line.mono ? "var(--font-mono)" : "var(--font-sans)",
                  fontSize: line.mono ? 11 : 13,
                  color: line.color || "transparent",
                  lineHeight: line.text ? 1.7 : 0.8,
                  letterSpacing: line.mono ? "0.04em" : "0",
                }}>
                  {line.text || "\u00a0"}
                </div>
              ))}

              {/* Dynamic log lines */}
              {log.map((line, i) => (
                <div key={`log-${i}`} style={{
                  fontFamily: line.mono ? "var(--font-mono)" : "var(--font-sans)",
                  fontSize: 11,
                  color: line.color,
                  lineHeight: 1.7,
                  letterSpacing: "0.04em",
                }}>
                  {line.text}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 4, height: 4, borderRadius: "50%", background: "#F97316",
                        animation: "blinkAnim 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
                    Verifying...
                  </span>
                </div>
              )}
            </div>

            {/* Input row */}
            {showInput && !loading && (
              <form onSubmit={handleSubmit} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 20px 20px",
                borderTop: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ color: "#F97316", fontFamily: "var(--font-mono)", fontSize: 13, flexShrink: 0 }}>›</span>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="enter access key..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                  }}
                />
                <button
                  type="submit"
                  disabled={!password.trim() || loading}
                  style={{
                    padding: "6px 14px",
                    background: password.trim() ? "#F97316" : "rgba(255,255,255,0.05)",
                    border: "none",
                    borderRadius: 6,
                    color: password.trim() ? "#000" : "rgba(255,255,255,0.2)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    cursor: password.trim() ? "pointer" : "default",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  AUTH
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: "rgba(255,255,255,0.1)",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          marginTop: 20,
        }}>
          KRONOS-OUTREACH · SECURE ACCESS · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
