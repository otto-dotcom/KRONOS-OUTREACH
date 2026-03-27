"use client";

import { useState, useEffect } from "react";

export default function DirectivesPage() {
  const [directives, setDirectives] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const value = data.value || "";
        setDirectives(value);
        setCharCount(value.length);
        if (data.warning) setMessage(data.warning);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: directives }),
      });
      if (res.ok) {
        setMessage("✓ Directives deployed successfully");
      } else {
        setMessage("✗ Failed to save directives");
      }
    } catch {
      setMessage("✗ Connection error");
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDirectives(value);
    setCharCount(value.length);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#FF6B00] blink" />
          <span className="text-[10px] tracking-[0.3em] text-[#888] uppercase">
            Loading Directives Interface...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header - Remotron Style */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#FF6B00] blink" />
            <span className="text-[10px] tracking-[0.3em] text-[#999] uppercase">DIRECTIVES // v1.2.5</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: "var(--font-pixel), monospace" }}>
            AI COPY<span className="text-[#FF6B00]">WRITER</span>
          </h1>
          <p className="text-[#555] text-[10px] tracking-[0.2em] uppercase mt-3">System Instructions for GPT-4o Mini</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[#555] tracking-widest uppercase">Engine Status</div>
          <div className="flex items-center gap-2 justify-end mt-1">
            <div className="w-1.5 h-1.5 bg-green-500 blink" />
            <div className="text-green-500 font-mono text-sm tracking-tighter uppercase">Active</div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-5 glow">
          <div className="text-2xl font-bold text-white mb-1">{charCount.toLocaleString()}</div>
          <div className="text-[9px] tracking-[0.2em] text-[#555] uppercase">Characters</div>
        </div>
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-5 glow">
          <div className="text-2xl font-bold text-[#FF6B00] mb-1">GPT-4o-mini</div>
          <div className="text-[9px] tracking-[0.2em] text-[#555] uppercase">AI Model</div>
        </div>
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-5 glow">
          <div className="text-2xl font-bold text-white mb-1">Plain Text</div>
          <div className="text-[9px] tracking-[0.2em] text-[#555] uppercase">Output Style</div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`flex items-center gap-3 p-4 border ${
          message.includes("✓")
            ? "border-green-500/30 bg-green-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}>
          <div className={`w-1.5 h-1.5 ${message.includes("✓") ? "bg-green-500" : "bg-red-500"}`} />
          <span className={`text-[10px] tracking-[0.2em] uppercase font-bold ${
            message.includes("✓") ? "text-green-500" : "text-red-500"
          }`}>
            {message}
          </span>
        </div>
      )}

      {/* Main Editor */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6 glow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs tracking-[0.4em] text-[#FF6B00] uppercase font-bold">System Prompt Editor</h2>
          <div className="h-px bg-[#1A1A1A] flex-1 mx-4" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FF6B00] text-black font-bold px-6 py-2 text-[9px] tracking-[0.3em] hover:bg-[#E55F00] disabled:opacity-30 transition-all cursor-pointer uppercase"
          >
            {saving ? "Deploying..." : "Deploy Changes"}
          </button>
        </div>

        <textarea
          value={directives}
          onChange={handleChange}
          placeholder="Enter AI system instructions here...\n\nExample:\n- Write in plain text, no HTML\n- Be direct and professional\n- Focus on value proposition"
          className="w-full h-[500px] bg-[#0A0A0A] border border-[#161616] text-[#CCC] px-6 py-5 font-mono text-sm leading-relaxed focus:outline-none focus:border-[#FF6B00] transition-all resize-none"
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6">
          <h3 className="text-xs tracking-[0.3em] text-[#999] uppercase font-bold mb-4">Few-Shot Learning</h3>
          <p className="text-[10px] text-[#666] leading-relaxed">
            The agent automatically fetches recent human edits from Airtable to refine its style and improve output quality over time.
          </p>
        </div>
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6">
          <h3 className="text-xs tracking-[0.3em] text-[#999] uppercase font-bold mb-4">Deliverability Focus</h3>
          <p className="text-[10px] text-[#666] leading-relaxed">
            Instructions should prioritize clean HTML structure and direct, non-marketing language to maximize inbox delivery rates.
          </p>
        </div>
      </div>

      {/* Technical Specs */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-6">
        <h3 className="text-xs tracking-[0.3em] text-[#999] uppercase font-bold mb-4">Technical Specifications</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
          <div className="p-3 bg-[#0A0A0A] border border-[#161616]">
            <div className="text-[#555] uppercase tracking-wider mb-1">Provider</div>
            <div className="text-white font-bold">OpenRouter</div>
          </div>
          <div className="p-3 bg-[#0A0A0A] border border-[#161616]">
            <div className="text-[#555] uppercase tracking-wider mb-1">Model</div>
            <div className="text-white font-bold">GPT-4o-mini</div>
          </div>
          <div className="p-3 bg-[#0A0A0A] border border-[#161616]">
            <div className="text-[#555] uppercase tracking-wider mb-1">Temperature</div>
            <div className="text-white font-bold">0.7</div>
          </div>
          <div className="p-3 bg-[#0A0A0A] border border-[#161616]">
            <div className="text-[#555] uppercase tracking-wider mb-1">Max Tokens</div>
            <div className="text-white font-bold">2048</div>
          </div>
        </div>
      </div>
    </div>
  );
}
