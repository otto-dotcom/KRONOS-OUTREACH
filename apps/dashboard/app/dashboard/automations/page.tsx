"use client";

import { useState } from "react";
import { useProject } from "../ProjectContext";

export default function AutomationsPage() {
  const { project } = useProject();
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent?: number; failed?: number; skipped?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function triggerOutreach() {
    setIsRunning(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await fetch("/api/campaign/launch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: project ?? "kronos", leadLimit: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger");
      setLastResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-12">
      <div className="reveal">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-[1px] bg-k" />
          <span className="text-[10px] tracking-[0.5em] text-[#555] uppercase font-mono font-bold">
            01 // OPERATIONS CENTER
          </span>
        </div>
        <h1 className="text-7xl font-black tracking-tighter text-white uppercase font-mono leading-none">
          AUTO<span className="text-k">MATA</span>
        </h1>
        <p className="text-[10px] text-[#444] tracking-[0.2em] uppercase mt-4 max-w-xl leading-relaxed">
          Centralized orchestration layer for autonomous outreach pipelines. 
          Manage neural copy generation, lead validation, and high-frequency dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 reveal [animation-delay:200ms]">
        {/* Outreach Card */}
        <div className="glass-panel p-10 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
             <div className={`cyber-tag ${isRunning ? "animate-pulse" : "bg-[#111] text-[#333]"}`}>
               {isRunning ? "STATUS: ACTIVE" : "STATUS: IDLE"}
             </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white uppercase font-mono tracking-tight">Outreach_v1.0</h3>
            <div className="flex gap-4">
              <div className="text-[8px] text-[#444] tracking-widest uppercase">Target: Swiss_Real_Estate</div>
              <div className="text-[8px] text-[#444] tracking-widest uppercase">Node: Zurich_DC_01</div>
            </div>
          </div>

          <div className="p-6 bg-k-bg border border-k/10 space-y-4">
            <p className="text-[11px] text-[#666] leading-relaxed font-medium">
              Executes the full outreach cycle: 
              <span className="text-white"> Fetching</span>, 
              <span className="text-white"> Scoring</span>, 
              <span className="text-white"> Generation</span>, 
              and <span className="text-white"> Dispatch</span>.
            </p>
          </div>

          <button 
            onClick={triggerOutreach}
            disabled={isRunning}
            className="w-full py-6 bg-k text-black font-black text-xs tracking-[0.4em] uppercase hover:bg-white transition-all disabled:opacity-20 relative group overflow-hidden"
          >
            <span className="relative z-10">{isRunning ? "ORCHESTRATING_PIPELINE..." : "INVOKE_PIPELINE"}</span>
            <div className="absolute inset-0 bg-white translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-500 ease-out" />
          </button>

          {error && (
            <div className="p-5 glass-panel-accent border border-red-500/20 text-red-500 text-[10px] font-mono leading-relaxed">
              <span className="font-bold mr-2">[SYSTEM_FAULT]</span> {error}
            </div>
          )}

          {lastResult && (
            <div className="p-5 glass-panel-accent border border-k/20 text-[10px] font-mono leading-relaxed">
              <span className="font-bold block mb-3 text-white tracking-widest">[PIPELINE COMPLETE]</span>
              <div className="flex gap-6">
                <div>
                  <div className="text-[8px] text-[#555] uppercase tracking-widest mb-1">Sent</div>
                  <div className="text-green-400 text-lg font-black">{lastResult.sent ?? 0}</div>
                </div>
                <div>
                  <div className="text-[8px] text-[#555] uppercase tracking-widest mb-1">Failed</div>
                  <div className="text-red-400 text-lg font-black">{lastResult.failed ?? 0}</div>
                </div>
                <div>
                  <div className="text-[8px] text-[#555] uppercase tracking-widest mb-1">Skipped</div>
                  <div className="text-[#555] text-lg font-black">{lastResult.skipped ?? 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="glass-panel p-10 flex flex-col justify-between border-k/5">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-10 h-[1px] bg-[#1A1A1A]" />
               <h4 className="text-[10px] font-black tracking-[0.4em] text-[#333] uppercase">Logistical_Metadata</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-[8px] text-[#444] tracking-[0.3em] uppercase mb-2">Internal_Scheduler</div>
                <div className="text-[10px] text-red-500/50 line-through font-mono uppercase">Vercel_Crons: Disabled</div>
              </div>
              <div>
                <div className="text-[8px] text-[#444] tracking-[0.3em] uppercase mb-2">External_Interface</div>
                <div className="text-[10px] text-green-500 font-mono uppercase">Webhooks: Active</div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-[#1A1A1A]">
              <div className="text-[8px] text-[#444] tracking-[0.3em] uppercase font-bold">API_ENDPOINT_ROOT</div>
              <div className="p-4 bg-k-bg border border-k/5 text-[10px] text-k font-mono select-all break-all leading-relaxed">
                POST /api/campaign/launch
              </div>
            </div>
          </div>

          <div className="pt-8 text-[7px] text-[#222] tracking-[0.5em] uppercase font-mono">
            Authorization_Req: HMAC_SIGNED_COOKIE // OTTO_AUTH_SECURE
          </div>
        </div>
      </div>
    </div>
  );
}
