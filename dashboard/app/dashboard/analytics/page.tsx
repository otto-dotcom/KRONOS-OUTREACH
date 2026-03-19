"use client";

import { useEffect, useState, useMemo } from "react";
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

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header with Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#111] pb-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3 bg-[#FF6B00]" />
            <span className="text-[10px] tracking-[0.5em] text-[#444] font-black uppercase">Operation_Intelligence_Matrix</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase pixel-mega leading-[0.85]">
            Global<br/>
            <span className="text-[#FF6B00]">Analytics</span>
          </h1>
          <p className="mt-6 text-[#555] text-[10px] tracking-[0.3em] font-black uppercase">Real-time KRONOS lead processing & conversion telemetry</p>
        </div>
        
        <div className="glass-obsidian p-6 border-orange-500/20">
          <span className="text-[8px] tracking-[0.3em] text-[#333] uppercase block mb-4 font-black">Temporal Scope Optimization</span>
          <RangeFilter days={days} onChange={setDays} />
        </div>
      </div>

      {/* Primary Metrics Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Metric 
          label="Cumulative Leads Matrix" 
          value={stats.total_leads.toLocaleString()} 
          large 
          highlight 
        />
        <Metric 
          label="Protocol Deliveries // SMTP" 
          value={stats.sent_emails.toLocaleString()} 
          large 
        />
        <Metric 
          label="Conversion Probability" 
          value={`${stats.open_rate}%`} 
          large 
          highlight 
        />
        <Metric 
          label="Interaction Volatility" 
          value={`${stats.click_rate}%`} 
          large 
        />
      </div>

      {/* Visual Data Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Engagement Matrix */}
        <div className="lg:col-span-2 glass-obsidian p-10 cyber-border">
          <SectionLabel icon={<IconMail />} label="Engagement_Trajectory" glow />
          <div className="mt-8 flex flex-col md:flex-row gap-12 items-center">
            <div className="shrink-0 scale-125">
               <DonutChart segments={[
                 { label: "Converted", value: stats.open_rate, color: "#FF6B00" },
                 { label: "Pending", value: 100 - stats.open_rate, color: "#111" }
               ]} size={220} />
            </div>
            <div className="flex-1 space-y-10 w-full">
               <ProgressStat label="Email_Open_Index" value={stats.open_rate} max={100} color="#FF6B00" />
               <ProgressStat label="CT_Rate_Signal" value={stats.click_rate} max={100} color="#FF6B00" />
               <ProgressStat label="Bounce_Inhibition" value={stats.bounce_rate} max={100} color="#333" />
               <div className="pt-6 border-t border-white/5">
                  <p className="text-[10px] text-[#444] italic leading-relaxed">Telemetry indicates a {stats.click_rate > 5 ? 'STABLE' : 'CALIBRATING'} outreach sequence. Conversion vectors are optimized for the Swiss RE market segment.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Reach Volume */}
        <div className="glass-obsidian p-10">
          <SectionLabel icon={<IconDatabase />} label="Outreach_Frequency" />
          <div className="mt-10 h-64 flex items-end px-4">
             <BarChart height={220} data={[
               { label: "Mon", bars: [{ value: 45, color: "#222" }] },
               { label: "Tue", bars: [{ value: 65, color: "#FF6B00" }] },
               { label: "Wed", bars: [{ value: 80, color: "#FF6B00" }] },
               { label: "Thu", bars: [{ value: 55, color: "#222" }] },
               { label: "Fri", bars: [{ value: 95, color: "#FF6B00" }] },
             ]} />
          </div>
          <div className="mt-10 flex justify-between items-end border-t border-white/5 pt-6">
             <div className="text-[9px] text-[#333] font-black uppercase tracking-widest leading-none">Sequence_Active</div>
             <div className="text-xl font-bold text-white font-mono leading-none tracking-tighter">742.8ms_AVG</div>
          </div>
        </div>
      </div>

      {/* FULL SENT HISTORY TABLE */}
      <div className="glass-obsidian p-10 cyber-border">
         <div className="flex items-center justify-between mb-10">
            <div>
               <SectionLabel icon={<IconDatabase />} label="Historical_Audit_Log" glow />
               <p className="text-[10px] text-[#333] tracking-[0.2em] font-black uppercase -mt-4 ml-12">Comprehensive telemetry of all outgoing communications</p>
            </div>
            <div className="flex gap-4">
               <div className="px-5 py-2 glass-obsidian border-orange-500/20 text-[#FF6B00] text-[9px] font-black tracking-widest">
                  {history.length} RECORDS_LOCALIZED
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-[#1A1A1A] text-[9px] text-[#333] font-black uppercase tracking-[0.3em]">
                     <th className="pb-5 pl-4">Timestamp_ID</th>
                     <th className="pb-5">Target_Agency</th>
                     <th className="pb-5">Communication_Vector</th>
                     <th className="pb-5">Protocol_Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#111]">
                  {history.map((item, i) => (
                     <tr key={item.id} className="group hover:bg-[#FF6B00]/5 transition-all">
                        <td className="py-6 pl-4">
                           <span className="text-[11px] text-[#555] font-mono group-hover:text-[#FF6B00] transition-colors">
                              {new Date(item.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }).toUpperCase()}
                           </span>
                        </td>
                        <td className="py-6">
                           <div className="flex flex-col">
                              <span className="text-[13px] text-white font-bold tracking-tight uppercase group-hover:text-[#FF6B00] transition-colors">
                                 {item.company}
                              </span>
                              <span className="text-[9px] text-[#333] font-mono tracking-widest">{item.email}</span>
                           </div>
                        </td>
                        <td className="py-6">
                           <div className="flex flex-col max-w-sm">
                              <span className="text-[10px] text-[#888] font-black uppercase overflow-hidden text-ellipsis whitespace-nowrap">
                                 {item.subject}
                              </span>
                           </div>
                        </td>
                        <td className="py-6">
                           <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_#22c55e]" />
                              <span className="text-[9px] text-green-400 font-black tracking-[0.2em] ml-1">SUCCESS_DELIVERY</span>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {history.length === 0 && !loading && (
            <div className="py-20 text-center glass-obsidian mt-4">
               <div className="text-[10px] text-[#333] font-black tracking-[0.5em] uppercase">No sent records detected in the current matrix</div>
            </div>
         )}
      </div>

      {/* Footer System Credits */}
      <div className="flex items-center justify-between opacity-20 hover:opacity-100 transition-opacity pt-20 border-t border-[#111]">
         <div className="text-[8px] text-[#444] font-mono tracking-widest">KRONOS_ANALYTICS_V9.0_REPRO</div>
         <div className="flex gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
               <div key={i} className="w-1 h-3 bg-white/10" style={{ opacity: Math.random() }} />
            ))}
         </div>
      </div>
    </div>
  );
}
