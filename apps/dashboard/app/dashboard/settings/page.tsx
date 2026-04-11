"use client";

import { useState, useEffect } from "react";
import { useProject } from "../ProjectContext";

export default function SettingsPage() {
  const { project, brandColor } = useProject();
  const [emailPrompt, setEmailPrompt] = useState("");
  const [smsPrompt, setSmsPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState<"email" | "sms">("email");

  useEffect(() => {
    if (!project) return;
    setLoading(true);
    fetch(`/api/settings?project=${project}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setEmailPrompt(data.email_prompt || "");
        setSmsPrompt(data.sms_prompt || "");
        if (data.warning) setMessage(data.warning);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [project]);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/settings?project=${project}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email_prompt: emailPrompt, sms_prompt: smsPrompt }),
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

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 blink" style={{ backgroundColor: brandColor }} />
          <span className="text-[10px] tracking-[0.3em] text-[#888] uppercase">
            Loading Directives Interface...
          </span>
        </div>
      </div>
    );
  }

  const activeValue = activeTab === "email" ? emailPrompt : smsPrompt;

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 blink" style={{ backgroundColor: brandColor }} />
            <span className="text-[10px] tracking-[0.3em] text-[#999] uppercase">SETTINGS // v2.0.0</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: "var(--font-mono), monospace" }}>
            AGENT<span style={{ color: brandColor }}>_PROMPTS</span>
          </h1>
          <p className="text-text-dim text-[10px] tracking-[0.2em] uppercase mt-3">Control logic for AI Outreach Agents</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-text-dim tracking-widest uppercase">Target Scope</div>
          <div className="flex items-center gap-2 justify-end mt-1">
            <div className="w-1.5 h-1.5 bg-green-500 blink" />
            <div className="text-green-500 font-mono text-sm tracking-tighter uppercase">{project?.toUpperCase() || "LOADING"} DB</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-k-border pb-px">
        <button 
          onClick={() => setActiveTab("email")}
          className={`pb-2 px-1 text-[10px] tracking-widest uppercase font-bold transition-colors border-b-2`}
          style={{
            borderColor: activeTab === "email" ? brandColor : "transparent",
            color: activeTab === "email" ? "white" : "var(--text-2)"
          }}
        >
          Email Agent
        </button>
        <button 
          onClick={() => setActiveTab("sms")}
          className={`pb-2 px-1 text-[10px] tracking-widest uppercase font-bold transition-colors border-b-2`}
          style={{
            borderColor: activeTab === "sms" ? brandColor : "transparent",
            color: activeTab === "sms" ? "white" : "var(--text-2)"
          }}
        >
          SMS Agent
        </button>
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
      <div className="bg-k-card border border-k-border p-6 glow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs tracking-[0.4em] uppercase font-bold" style={{ color: brandColor }}>
            {activeTab.toUpperCase()} System Prompt
          </h2>
          <div className="h-px bg-k-border flex-1 mx-4" />
          <div className="text-[10px] text-text-dim tracking-widest uppercase mr-4">
            {activeValue.length} CHARS
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-black font-bold px-6 py-2 text-[9px] tracking-[0.3em] disabled:opacity-30 transition-all cursor-pointer uppercase"
            style={{ backgroundColor: brandColor }}
          >
            {saving ? "Deploying..." : "Save Config"}
          </button>
        </div>

        <textarea
          value={activeTab === "email" ? emailPrompt : smsPrompt}
          onChange={(e) => {
            if (activeTab === "email") setEmailPrompt(e.target.value);
            else setSmsPrompt(e.target.value);
          }}
          placeholder={`Enter ${activeTab} AI system instructions here...`}
          className="w-full h-[400px] bg-k-bg border border-k-border text-white px-6 py-5 font-mono text-sm leading-relaxed focus:outline-none transition-all resize-none"
          style={{ outlineColor: brandColor }}
        />
      </div>

    </div>
  );
}
