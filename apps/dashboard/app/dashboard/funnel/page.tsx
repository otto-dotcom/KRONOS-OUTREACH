"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "../ProjectContext";
import { FunnelChart, KpiCard } from "../components";
import { RefreshCw, TrendingDown, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface FunnelData {
  total: number;
  scored: number;
  eligible: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  booked: number;
}

function pct(num: number, den: number): string {
  if (den === 0) return "0%";
  return `${((num / den) * 100).toFixed(1)}%`;
}

function ConversionCard({ label, num, den, icon }: {
  label: string; num: number; den: number; icon: React.ReactNode;
}) {
  const value = den > 0 ? ((num / den) * 100).toFixed(1) : "0.0";
  const numVal = parseFloat(value);
  const variant =
    numVal >= 40 ? "success" :
    numVal >= 15 ? "accent" :
    numVal >= 5  ? "warning" : "danger";

  return (
    <div style={{
      background: "var(--surface-1)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 10,
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className={`icon-box icon-box-${variant}`}>{icon}</div>
        <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          {num.toLocaleString()} / {den.toLocaleString()}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-1)", lineHeight: 1 }}>
          {value}%
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function FunnelPage() {
  const { project } = useProject();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [data, setData] = useState<FunnelData>({
    total: 0, scored: 0, eligible: 0, sent: 0,
    delivered: 0, opened: 0, clicked: 0, booked: 0,
  });

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      if (!project) {
        throw new Error("Project scope is not selected.");
      }
      const proj = project;
      const [leadsRes, emailRes] = await Promise.all([
        fetch(`/api/analytics/leads?project=${proj}`, { credentials: "include", signal }),
        fetch(`/api/analytics/email?days=365&project=${proj}`, { credentials: "include", signal }),
      ]);
      if (!leadsRes.ok) throw new Error(`Leads API: ${leadsRes.status}`);
      if (!emailRes.ok) throw new Error(`Email API: ${emailRes.status}`);
      const [leadsData, emailData] = await Promise.all([leadsRes.json(), emailRes.json()]);

      setData({
        total:     leadsData.total ?? 0,
        scored:    leadsData.scored ?? 0,
        eligible:  leadsData.eligible ?? 0,
        sent:      leadsData.by_email?.sent ?? 0,
        delivered: emailData.totals?.delivered ?? 0,
        opened:    emailData.totals?.unique_opens ?? emailData.totals?.opens ?? 0,
        clicked:   emailData.totals?.unique_clicks ?? emailData.totals?.clicks ?? 0,
        booked:    leadsData.booked ?? 0,
      });
      setLastRefresh(new Date());
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      console.error("Funnel load error:", e);
      setError(e instanceof Error ? e.message : "Failed to load funnel data");
    }
    setLoading(false);
  }, [project]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // 30-second auto-refresh
  useEffect(() => {
    const t = setInterval(() => load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const stages = [
    { label: "Total Leads",    value: data.total },
    { label: "Scored",         value: data.scored },
    { label: "Eligible",       value: data.eligible },
    { label: "Sent",           value: data.sent },
    { label: "Delivered",      value: data.delivered },
    { label: "Opened",         value: data.opened },
    { label: "Clicked",        value: data.clicked },
    { label: "Booked / Reply", value: data.booked },
  ];

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "8px 12px", background: "var(--surface-2)",
              border: "1px solid var(--border)", borderRadius: 8,
              color: "var(--text-2)", fontSize: 12, fontWeight: 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <TrendingDown size={20} style={{ color: "var(--accent)" }} />
              Pipeline Funnel
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 3 }}>
              Full conversion path · Lead pool → Booked calls
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastRefresh && (
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => load(undefined)}
            disabled={loading}
            style={{
              padding: "8px 14px", background: "var(--surface-2)",
              border: "1px solid var(--border)", borderRadius: 8,
              color: "var(--text-2)", fontSize: 12, fontWeight: 500,
              cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              opacity: loading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Conversion rate KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
        <ConversionCard label="Eligibility Rate"  num={data.eligible}  den={data.total}     icon={<span style={{ fontSize: 12 }}>⚡</span>} />
        <ConversionCard label="Send Rate"         num={data.sent}      den={data.eligible}  icon={<span style={{ fontSize: 12 }}>📤</span>} />
        <ConversionCard label="Delivery Rate"     num={data.delivered} den={data.sent}      icon={<span style={{ fontSize: 12 }}>✉️</span>} />
        <ConversionCard label="Open Rate"         num={data.opened}    den={data.delivered} icon={<span style={{ fontSize: 12 }}>👁</span>} />
        <ConversionCard label="Click Rate"        num={data.clicked}   den={data.opened}    icon={<span style={{ fontSize: 12 }}>🖱</span>} />
        <ConversionCard label="Booking Rate"      num={data.booked}    den={data.clicked}   icon={<span style={{ fontSize: 12 }}>📅</span>} />
      </div>

      {/* Main funnel */}
      <div style={{
        background: "var(--surface-1)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "24px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Full Pipeline</span>
            <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 10 }}>
              {data.total.toLocaleString()} leads total
            </span>
          </div>
          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "var(--text-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 5, background: "rgba(249,115,22,1)", borderRadius: 2 }} />
              <span>Top of funnel</span>
            </div>
            <ArrowRight size={12} />
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 5, background: "rgba(249,115,22,0.5)", borderRadius: 2 }} />
              <span>Bottom of funnel</span>
            </div>
          </div>
        </div>

        {error ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>Failed to load pipeline data</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{error}</span>
            <button onClick={() => load(undefined)} style={{ padding: "8px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-1)", fontSize: 12, cursor: "pointer", marginTop: 4 }}>
              Retry
            </button>
          </div>
        ) : loading ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <RefreshCw size={16} style={{ color: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>Loading pipeline data…</span>
          </div>
        ) : (
          <FunnelChart stages={stages} />
        )}
      </div>

      {/* Stage-by-stage breakdown table */}
      <div style={{
        background: "var(--surface-1)", border: "1px solid var(--border)",
        borderRadius: 16, overflow: "hidden",
      }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Stage Breakdown</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Stage", "Count", "% of Total", "% of Prev Stage", "Drop-off"].map(h => (
                  <th key={h} style={{
                    textAlign: h === "Stage" ? "left" : "right",
                    padding: "10px 18px", fontSize: 11, fontWeight: 600,
                    color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase",
                    borderBottom: "1px solid var(--border)", background: "var(--surface-2)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stages.map((s, i) => {
                const prevVal = stages[i - 1]?.value ?? s.value;
                const dropOff = i > 0 && prevVal > 0 ? prevVal - s.value : 0;
                const dropPct = i > 0 && prevVal > 0 ? (dropOff / prevVal * 100) : 0;
                const ofTotal = data.total > 0 ? (s.value / data.total * 100) : 0;
                const ofPrev  = i > 0 && prevVal > 0 ? (s.value / prevVal * 100) : 100;

                return (
                  <tr key={s.label} className="trow">
                    <td style={{ padding: "12px 18px", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                          background: `rgba(249,115,22,${1 - (i / Math.max(stages.length - 1, 1)) * 0.55})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: "#fff",
                        }}>{i + 1}</div>
                        {s.label}
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>
                      {s.value.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right", fontSize: 12, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>
                      {ofTotal.toFixed(1)}%
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right", fontSize: 12, color: i === 0 ? "var(--text-3)" : "var(--text-2)", fontFamily: "var(--font-mono)" }}>
                      {i === 0 ? "—" : `${ofPrev.toFixed(1)}%`}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "right" }}>
                      {i === 0 ? (
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>—</span>
                      ) : (
                        <span style={{
                          fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)",
                          color: dropPct > 80 ? "#EF4444" : dropPct > 50 ? "#F59E0B" : dropPct > 0 ? "var(--text-2)" : "var(--success)",
                        }}>
                          {dropOff > 0 ? `−${dropOff.toLocaleString()} (${dropPct.toFixed(0)}%)` : "0"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostic callouts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Bottleneck finder */}
        <div style={{
          background: "var(--surface-1)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "20px 22px",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", display: "block", marginBottom: 14 }}>
            Pipeline Health
          </span>
          {[
            {
              label: "Lead eligibility",
              ok: data.total > 0 && data.eligible / data.total > 0.3,
              msg: data.total > 0 && data.eligible / data.total > 0.3
                ? `${pct(data.eligible, data.total)} of DB is actionable`
                : `Only ${pct(data.eligible, data.total)} eligible — score more leads`,
            },
            {
              label: "Send coverage",
              ok: data.eligible > 0 && data.sent / data.eligible > 0.5,
              msg: data.eligible > 0 && data.sent / data.eligible > 0.5
                ? `${pct(data.sent, data.eligible)} of eligible pool sent`
                : `${pct(data.sent, data.eligible)} sent — large untapped pool remaining`,
            },
            {
              label: "Delivery rate",
              ok: data.sent > 0 && data.delivered / data.sent > 0.9,
              msg: data.sent > 0 && data.delivered / data.sent > 0.9
                ? "Strong deliverability"
                : `${pct(data.delivered, data.sent)} delivery — check domain reputation`,
            },
            {
              label: "Open rate",
              ok: data.delivered > 0 && data.opened / data.delivered > 0.25,
              msg: data.delivered > 0 && data.opened / data.delivered > 0.25
                ? `${pct(data.opened, data.delivered)} open rate — above benchmark`
                : `${pct(data.opened, data.delivered)} opens — test subject lines`,
            },
            {
              label: "Click-through",
              ok: data.opened > 0 && data.clicked / data.opened > 0.1,
              msg: data.opened > 0 && data.clicked / data.opened > 0.1
                ? `${pct(data.clicked, data.opened)} CTR — good engagement`
                : `${pct(data.clicked, data.opened)} CTR — strengthen CTAs`,
            },
          ].map(({ label, ok, msg }) => (
            <div key={label} style={{
              display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10,
              padding: "10px 12px", background: "var(--surface-2)", borderRadius: 8,
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                background: ok ? "var(--success)" : "#F59E0B",
                boxShadow: ok ? "0 0 6px var(--success)" : "0 0 6px #F59E0B",
              }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{msg}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Next actions */}
        <div style={{
          background: "var(--surface-1)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "20px 22px",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", display: "block", marginBottom: 14 }}>
            Recommended Actions
          </span>
          {(() => {
            const actions: { priority: "high" | "med" | "low"; text: string }[] = [];

            const unsent = data.eligible - data.sent;
            if (unsent > 10) actions.push({ priority: "high", text: `${unsent.toLocaleString()} eligible leads not yet contacted — launch a campaign` });
            if (data.sent > 0 && data.delivered / data.sent < 0.85) actions.push({ priority: "high", text: "Delivery rate below 85% — check Brevo domain/SPF settings" });
            if (data.delivered > 0 && data.opened / data.delivered < 0.15) actions.push({ priority: "med", text: "Opens below 15% — A/B test subject lines or send time" });
            if (data.opened > 0 && data.clicked / data.opened < 0.08) actions.push({ priority: "med", text: "CTR below 8% — rewrite CTA copy or shorten email body" });
            if (data.clicked > 0 && data.booked / data.clicked < 0.05) actions.push({ priority: "low", text: "Few bookings from clicks — review Cal.com landing page" });
            if (data.total > 0 && data.scored / data.total < 0.7) actions.push({ priority: "low", text: `${(data.total - data.scored).toLocaleString()} leads unscored — run the scoring script` });
            if (actions.length === 0) actions.push({ priority: "low", text: "Pipeline looks healthy — keep running campaigns" });

            const colors = { high: "#EF4444", med: "#F59E0B", low: "var(--success)" };
            const labels = { high: "HIGH", med: "MED", low: "LOW" };

            return actions.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10,
                padding: "10px 12px", background: "var(--surface-2)", borderRadius: 8,
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: colors[a.priority],
                  border: `1px solid ${colors[a.priority]}`,
                  borderRadius: 4, padding: "2px 5px", flexShrink: 0, marginTop: 1,
                  fontFamily: "var(--font-mono)", letterSpacing: "0.05em",
                }}>{labels[a.priority]}</span>
                <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{a.text}</span>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
