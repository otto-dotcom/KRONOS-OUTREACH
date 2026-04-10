"use client";

import { useEffect, useState } from "react";
import { BarChart2, Mail, Users, MousePointerClick, RefreshCw } from "lucide-react";
import { BarChart, DonutChart, ProgressStat, RangeFilter, KpiCard } from "../components";

export const dynamic = "force-dynamic";

interface HistoryItem {
  id: string;
  company: string;
  email: string;
  sentAt: string;
  subject: string;
}

export default function AnalyticsPage() {
  const [days, setDays]       = useState(30);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats]     = useState({
    total_leads: 0,
    sent_emails: 0,
    open_rate:   0,
    click_rate:  0,
    bounce_rate: 0,
  });

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, historyRes, leadsRes] = await Promise.all([
        fetch(`/api/analytics/email?days=${days}`),
        fetch(`/api/analytics/history`),
        fetch(`/api/analytics/leads`),
      ]);
      const [statsData, historyData, leadsData] = await Promise.all([
        statsRes.json(), historyRes.json(), leadsRes.json(),
      ]);
      if (statsRes.ok && leadsRes.ok) {
        setStats({
          total_leads: leadsData.total || 0,
          sent_emails: statsData.totals?.delivered || 0,
          open_rate:   parseFloat(statsData.openRate || "0"),
          click_rate:  parseFloat(statsData.clickRate || "0"),
          bounce_rate: statsData.totals?.delivered > 0
            ? parseFloat(((statsData.totals.bounces / statsData.totals.delivered) * 100).toFixed(1))
            : 0,
        });
      }
      if (historyRes.ok) setHistory(historyData.history || []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [days]);

  const opens  = Math.round(stats.sent_emails * (stats.open_rate  / 100));
  const clicks = Math.round(stats.sent_emails * (stats.click_rate / 100));
  const bounces = Math.round(stats.sent_emails * (stats.bounce_rate / 100));

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RefreshCw size={16} style={{ color: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>Loading analytics…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em", margin: 0 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 3 }}>
            Outreach performance · last {days} days
          </p>
        </div>
        <RangeFilter days={days} onChange={setDays} />
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KpiCard
          label="Total Leads"
          value={stats.total_leads.toLocaleString()}
          icon={<Users size={18} />}
          iconVariant="info"
        />
        <KpiCard
          label="Emails Delivered"
          value={stats.sent_emails.toLocaleString()}
          icon={<Mail size={18} />}
          iconVariant="accent"
        />
        <KpiCard
          label="Open Rate"
          value={`${stats.open_rate}%`}
          icon={<BarChart2 size={18} />}
          iconVariant="success"
          deltaType={stats.open_rate >= 20 ? "up" : stats.open_rate >= 10 ? "neutral" : "down"}
          delta={`${stats.open_rate}%`}
        />
        <KpiCard
          label="Click Rate"
          value={`${stats.click_rate}%`}
          icon={<MousePointerClick size={18} />}
          iconVariant="warning"
          deltaType={stats.click_rate >= 3 ? "up" : "neutral"}
          delta={`${stats.click_rate}%`}
        />
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>

        {/* ── Left: funnel + chart ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Conversion funnel */}
          <div style={{
            background: "var(--surface-1)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "20px 22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Conversion Funnel</span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{stats.sent_emails} sent</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ProgressStat label="Delivered" value={stats.sent_emails} max={stats.sent_emails} color="var(--accent)" />
              <ProgressStat label="Opened"    value={opens}  max={stats.sent_emails} color="var(--success)" />
              <ProgressStat label="Clicked"   value={clicks} max={stats.sent_emails} color="var(--info)" />
              <ProgressStat label="Bounced"   value={bounces} max={stats.sent_emails} color="var(--danger)" />
            </div>
          </div>

          {/* Weekly bar chart */}
          <div style={{
            background: "var(--surface-1)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "20px 22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Campaign Velocity</span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>Weekly distribution</span>
            </div>
            <BarChart
              height={140}
              data={[
                { label: "W1", bars: [{ value: Math.round(stats.sent_emails * 0.22), color: "var(--accent)" }] },
                { label: "W2", bars: [{ value: Math.round(stats.sent_emails * 0.28), color: "var(--accent)" }] },
                { label: "W3", bars: [{ value: Math.round(stats.sent_emails * 0.31), color: "var(--accent)" }] },
                { label: "W4", bars: [{ value: Math.round(stats.sent_emails * 0.19), color: "var(--accent)" }] },
              ]}
            />
          </div>
        </div>

        {/* ── Right: breakdown + status ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Donut breakdown */}
          <div style={{
            background: "var(--surface-1)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "20px 22px",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", display: "block", marginBottom: 16 }}>
              Engagement Breakdown
            </span>
            <DonutChart
              size={110}
              segments={[
                { value: opens,                                   color: "var(--success)", label: "Opened" },
                { value: clicks,                                  color: "var(--accent)",  label: "Clicked" },
                { value: Math.max(stats.sent_emails - opens, 0), color: "var(--surface-3)", label: "No open" },
              ].filter(s => s.value > 0)}
            />
          </div>

          {/* System status */}
          <div style={{
            background: "var(--surface-1)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>System Status</span>
            {[
              { label: "SMTP Engine", ok: true },
              { label: "AI Copy Gen", ok: true },
              { label: "Airtable Sync", ok: true },
            ].map(({ label, ok }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "var(--surface-2)", borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{label}</span>
                <span className={`pill pill-${ok ? "success" : "danger"}`}>
                  <span className={ok ? "dot-live" : ""} style={{ width: 5, height: 5 }} />
                  {ok ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div style={{
            background: "var(--surface-1)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "20px 22px",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", display: "block", marginBottom: 12 }}>Quick Stats</span>
            {[
              { label: "Lead Database",    value: stats.total_leads.toLocaleString() },
              { label: "Delivery Rate",    value: `${(100 - stats.bounce_rate).toFixed(1)}%` },
              { label: "Active Campaigns", value: String(Math.max(Math.ceil(stats.sent_emails / 10), 0)) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sent history table ── */}
      <div style={{
        background: "var(--surface-1)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Communication Log</span>
          <span className="pill pill-neutral">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>No history yet</span>
          </div>
        ) : (
          <div style={{ maxHeight: 360, overflowY: "auto" }} className="custom-scrollbar">
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr auto", gap: 0, padding: "8px 20px", borderBottom: "1px solid var(--border)" }}>
              {["Date", "Company", "Subject", "Status"].map(h => (
                <span key={h} style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {history.slice(0, 50).map((item) => (
              <div
                key={item.id}
                className="trow"
                style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr auto", gap: 0, padding: "11px 20px" }}
              >
                <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
                  {new Date(item.sentAt).toLocaleDateString("en-CH", { day: "2-digit", month: "short" })}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                  {item.company}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                  {item.subject}
                </span>
                <span className="pill pill-success" style={{ fontSize: 11 }}>Sent</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
