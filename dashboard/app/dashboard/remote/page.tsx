"use client";

import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════
   PREMIUM REMOTE DASHBOARD
   ═══════════════════════════════════════════════════════ */

export default function RemoteDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#060606] text-[#E0E0E0] p-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-12 fade-up">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#FF6B00] blink" />
            <span className="text-[10px] tracking-[0.3em] text-[#999] uppercase">Global Career AI</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: "var(--font-pixel), monospace" }}>
            REMOTE <span className="text-[#FF6B00]">PILOT</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#555] tracking-widest uppercase">System Status</div>
          <div className="text-green-500 font-mono text-sm tracking-tighter uppercase">Scraping Background ACTIVE</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Platforms Tracked", value: "50+", color: "text-white" },
          { label: "Jobs Scanned (24h)", value: "1,248", color: "text-[#FF6B00]" },
          { label: "AI Matches", value: "42", color: "text-white" },
          { label: "Applications Sent", value: "12", color: "text-[#FF6B00]" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 glow fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-[9px] tracking-[0.2em] text-[#555] uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs tracking-[0.4em] text-[#FF6B00] uppercase font-bold">Live Career Feed</h2>
            <div className="h-px bg-[#1A1A1A] flex-1 mx-4" />
            <button className="text-[9px] text-[#555] hover:text-[#FF6B00] transition-colors uppercase tracking-widest cursor-pointer">Re-Sync Engine</button>
          </div>

          <div className="space-y-4">
            {[
              { company: "Toptal", role: "Senior Full Stack", match: 98, date: "2m ago", status: "Scoring" },
              { company: "Upwork", role: "Next.js + AI Expert", match: 92, date: "15m ago", status: "Applied" },
              { company: "WeWorkRemotely", role: "Lead Node.js Architect", match: 89, date: "1h ago", status: "Queued" },
              { company: "Bonsai", role: "Systems Automation Lead", match: 85, date: "3h ago", status: "Drafting" },
            ].map((job, i) => (
              <div key={i} className="bg-[#0A0A0A] border border-[#161616] p-5 flex items-center gap-6 group hover:border-[#FF6B00]/30 transition-all fade-up" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                <div className="w-12 h-12 bg-[#060606] border border-[#222] flex items-center justify-center text-[#FF6B00] font-bold text-xs ring-1 ring-transparent group-hover:ring-[#FF6B00]/20 transition-all">
                  {job.match}%
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">{job.company}</span>
                    <span className="text-[9px] text-[#555] uppercase font-mono">{job.date}</span>
                  </div>
                  <div className="text-sm font-medium text-white/80">{job.role}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[9px] px-2 py-1 inline-block border ${job.status === "Applied" ? "border-green-900/40 text-green-500 bg-green-950/20" : "border-[#FF6B00]/40 text-[#FF6B00] bg-[#FF6B00]/10"} tracking-wider uppercase font-bold`}>
                    {job.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 glow">
            <h3 className="text-xs tracking-[0.3em] text-[#FF6B00] uppercase font-bold mb-6">AI Scouting Directives</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] text-[#555] uppercase tracking-widest block mb-2">Target Salary Range (USD)</label>
                <input type="text" defaultValue="$80k - $150k" className="w-full bg-[#060606] border border-[#222] p-3 text-xs text-white focus:outline-none focus:border-[#FF6B00]" />
              </div>
              <div>
                <label className="text-[9px] text-[#555] uppercase tracking-widest block mb-2">Excluded Keywords</label>
                <input type="text" defaultValue="PHP, Entry Level" className="w-full bg-[#060606] border border-[#222] p-3 text-xs text-white focus:outline-none focus:border-[#FF6B00]" />
              </div>
              <button className="w-full bg-[#FF6B00] text-black font-bold py-3 text-[10px] tracking-[0.3em] hover:bg-[#E55F00] transition-all cursor-pointer">
                UPDATE SCOUT
              </button>
            </div>
          </div>

          <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6">
            <h3 className="text-xs tracking-[0.3em] text-[#999] uppercase font-bold mb-6">Automated Application Logic</h3>
            <div className="flex items-center justify-between p-3 border border-[#1A1A1A] bg-[#0A0A0A] mb-4">
              <span className="text-[9px] text-[#888] uppercase tracking-widest">Background Auto-Apply</span>
              <div className="w-10 h-5 bg-[#FF6B00] p-1 flex justify-end items-center cursor-pointer">
                <div className="w-4 h-3 bg-black" />
              </div>
            </div>
            <p className="text-[9px] text-[#555] leading-relaxed uppercase">
              Application is sent automatically if AI confidence {">"} 95%. Others queued for your review!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
