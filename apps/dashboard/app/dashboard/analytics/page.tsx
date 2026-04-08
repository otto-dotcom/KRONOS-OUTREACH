"use client";

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";
import {
  SectionLabel,
  Metric,
  DonutChart,
  BarChart,
  ProgressStat,
  RangeFilter,
  IconRocket,
  IconDatabase,
  IconMail
} from "../components";

interface HistoryItem {
  id: string;
  company: string;
  email: string;
  sentAt: string;
  subject: string;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({
    total_leads: 0,
    sent_emails: 0,
    open_rate: 0,
    click_rate: 0,
    bounce_rate: 0
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [statsRes, historyRes, leadsRes] = await Promise.all([
          fetch(`/api/analytics/email?days=${days}`),
          fetch(`/api/analytics/history`),
          fetch(`/api/analytics/leads`)
        ]);

        const statsData = await statsRes.json();
        const historyData = await historyRes.json();
        const leadsData = await leadsRes.json();

        if (statsRes.ok && leadsRes.ok) {
           setStats({
              total_leads: leadsData.total || 0,
              sent_emails: statsData.totals?.delivered || 0,
              open_rate: parseFloat(statsData.openRate || "0"),
              click_rate: parseFloat(statsData.clickRate || "0"),
              bounce_rate: statsData.totals?.delivered > 0
                ? parseFloat(((statsData.totals.bounces / statsData.totals.delivered) * 100).toFixed(1))
                : 0
           });
        }
        if (historyRes.ok) setHistory(historyData.history || []);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [days]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-k blink" />
          <span className="text-[10px] tracking-[0.3em] text-text-dim uppercase">
            Loading Intelligence Data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-up">
      {/* Header with Title - Remotron Style */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-k blink" />
            <span className="text-[10px] tracking-[0.3em] text-text-dim uppercase">ANALYTICS // v2.1.0</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: "var(--font-mono), monospace" }}>
            INTELLI<span className="text-k">GENCE</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-text-dim tracking-widest uppercase mb-2">Temporal Scope</div>
          <RangeFilter days={days} onChange={setDays} />
        </div>
      </div>

      {/* Stats Row - Remotron Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Leads", value: stats.total_leads.toLocaleString(), color: "text-white" },
          { label: "Emails Sent", value: stats.sent_emails.toLocaleString(), color: "text-k" },
          { label: "Open Rate", value: `${stats.open_rate}%`, color: "text-white" },
          { label: "Click Rate", value: `${stats.click_rate}%`, color: "text-k" },
        ].map((stat, i) => (
          <div key={i} className="bg-k-card border border-k-border p-6 glow fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-[9px] tracking-[0.2em] text-text-dim uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Area - Remotron Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Engagement Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs tracking-[0.4em] text-k uppercase font-bold">Engagement Metrics</h2>
            <div className="h-px bg-k-border flex-1 mx-4" />
          </div>

          <div className="bg-k-card border border-k-border p-8 glow">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="shrink-0">
                <DonutChart
                  segments={[
                    { label: "Opened", value: stats.open_rate, color: "var(--color-k)" },
                    { label: "Unopened", value: 100 - stats.open_rate, color: "#161616" }
                  ]}
                  size={180}
                />
              </div>
              <div className="flex-1 space-y-6 w-full">
                <ProgressStat label="Open Rate" value={stats.open_rate} max={100} color="var(--color-k)" />
                <ProgressStat label="Click Rate" value={stats.click_rate} max={100} color="var(--color-k)" />
                <ProgressStat label="Bounce Rate" value={stats.bounce_rate} max={100} color="var(--color-text-dim)" />
                <div className="pt-4 border-t border-k-border">
                  <p className="text-[9px] text-text-dim uppercase tracking-wider">
                    System Status: {stats.click_rate > 5 ? '✓ OPTIMAL' : '⚠ CALIBRATING'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-k-card border border-k-border p-6">
            <h3 className="text-xs tracking-[0.3em] text-text-dim uppercase font-bold mb-6">Campaign Velocity</h3>
            <BarChart
              height={180}
              data={[
                { label: "W1", bars: [{ value: 45, color: "var(--color-k)" }] },
                { label: "W2", bars: [{ value: 65, color: "var(--color-k)" }] },
                { label: "W3", bars: [{ value: 80, color: "var(--color-k)" }] },
                { label: "W4", bars: [{ value: 55, color: "var(--color-k)" }] },
              ]}
            />
            <div className="mt-4 flex justify-between items-center text-[9px] text-text-dim uppercase tracking-widest">
              <span>Weekly Distribution</span>
              <span className="text-k">{stats.sent_emails} Total</span>
            </div>
          </div>
        </div>

        {/* Right Column: System Stats */}
        <div className="space-y-6">
          <div className="bg-k-card border border-k-border p-6 glow">
            <h3 className="text-xs tracking-[0.3em] text-k uppercase font-bold mb-6">System Intelligence</h3>
            <div className="space-y-4">
              <div className="p-4 border border-k-border bg-black/20">
                <div className="text-[9px] text-text-dim uppercase tracking-widest mb-2">Database Size</div>
                <div className="text-2xl font-bold text-white">{stats.total_leads}</div>
              </div>
              <div className="p-4 border border-k-border bg-black/20">
                <div className="text-[9px] text-text-dim uppercase tracking-widest mb-2">Active Campaigns</div>
                <div className="text-2xl font-bold text-k">{Math.ceil(stats.sent_emails / 10)}</div>
              </div>
              <div className="p-4 border border-k-border bg-black/20">
                <div className="text-[9px] text-text-dim uppercase tracking-widest mb-2">Success Rate</div>
                <div className="text-2xl font-bold text-white">{(100 - stats.bounce_rate).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="bg-k-card border border-k-border p-6">
            <h3 className="text-xs tracking-[0.3em] text-text-dim uppercase font-bold mb-6">Protocol Status</h3>
            <div className="flex items-center justify-between p-3 border border-k-border bg-black/20 mb-4">
              <span className="text-[9px] text-text-dim uppercase tracking-widest">SMTP Engine</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 blink" />
                <span className="text-[9px] text-green-500 uppercase tracking-widest">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-k-border bg-black/20">
              <span className="text-[9px] text-text-dim uppercase tracking-widest">AI Copy Gen</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 blink" />
                <span className="text-[9px] text-green-500 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SENT HISTORY TABLE - Remotron Style */}
      <div className="bg-k-card border border-k-border p-6 glow">
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs tracking-[0.4em] text-k uppercase font-bold">Communication Log</h2>
            <div className="h-px bg-k-border flex-1 mx-4" />
            <div className="px-3 py-1 bg-black/20 border border-k-border text-k text-[9px] font-bold tracking-widest uppercase">
               {history.length} Records
            </div>
         </div>

         {history.length === 0 ? (
            <div className="py-16 text-center">
               <div className="text-[10px] text-text-dim tracking-[0.3em] uppercase">No Communications Logged</div>
            </div>
         ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
               {history.slice(0, 10).map((item, i) => (
                  <div key={item.id} className="bg-black/10 border border-k-border p-4 flex items-center gap-4 group hover:border-k/30 transition-all" style={{ animationDelay: `${i * 0.05}s` }}>
                     <div className="w-12 h-12 bg-black/20 border border-k-border flex items-center justify-center text-k font-bold text-[9px] uppercase tracking-widest ring-1 ring-transparent group-hover:ring-k/20 transition-all">
                        {new Date(item.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                           <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate">{item.company}</span>
                           <span className="text-[9px] text-text-dim uppercase font-mono">{new Date(item.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-[10px] text-text-dim truncate">{item.subject}</div>
                     </div>
                     <div className="text-right shrink-0">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-green-500" />
                           <span className="text-[9px] text-green-500 uppercase tracking-widest font-bold">Sent</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
