"use client";

import { useState, useEffect, useRef } from "react";
import { log } from "@/lib/logger";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello, I am Otto. Your KRONOS operations agent. How can I help you optimize your outreach today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ System Error: Unable to reach brain core. Please check environmental variables." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 glass-panel reveal">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-k ring-4 ring-k/20" />
          <div>
            <h2 className="text-sm font-black tracking-[0.4em] uppercase font-mono">NEURAL_INTERFACE // OTTO_V4</h2>
            <p className="text-[8px] text-[#444] tracking-[0.2em] uppercase mt-1">Direct Neural Link Established // Zurich_Node_01</p>
          </div>
        </div>
        <div className="flex gap-8 items-center">
          <div className="flex flex-col items-end">
            <div className="text-[7px] text-[#333] tracking-widest uppercase mb-1">Response Latency</div>
            <div className="text-[9px] text-k font-mono">14ms_STABLE</div>
          </div>
          <div className="w-10 h-10 glass-panel flex items-center justify-center">
            <div className="w-1 h-1 bg-k rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-10 space-y-8 glass-panel-accent glass-panel custom-scrollbar reveal [animation-delay:150ms]"
      >
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} reveal`}
            style={{ animationDelay: `${i * 0.1 + 0.3}s` }}
          >
            <div className={`max-w-[70%] p-6 ${
              m.role === "user" 
                ? "bg-k text-black font-bold" 
                : "bg-k-card border border-k/10 text-k-text"
            } relative group`}>
              <div className={`text-[7px] uppercase tracking-[0.3em] font-black mb-3 ${
                m.role === "user" ? "text-black/60" : "text-k"
              }`}>
                {m.role === "user" ? "OPERATOR_01" : "OTTO_CORE"}
              </div>
              <div className="text-sm leading-relaxed font-medium whitespace-pre-wrap">
                {m.content}
              </div>
              {m.role === "assistant" && (
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-1 h-1 bg-k" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start reveal">
            <div className="bg-k-card border border-k/10 p-6 max-w-[70%] flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-k animate-bounce" />
                <div className="w-1.5 h-1.5 bg-k animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-k animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-[9px] text-[#444] uppercase tracking-[0.4em] font-black">Synthesizing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="relative reveal [animation-delay:300ms]">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="SEND DIRECTIVE TO CORE..."
          className="w-full bg-k-card border border-k/10 p-8 pr-32 text-xs text-white focus:outline-none focus:border-k transition-all font-mono placeholder:text-[#222]"
        />
        <button 
          disabled={isLoading || !input.trim()}
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-k px-8 py-3 text-black text-[9px] font-black tracking-[0.4em] hover:bg-white transition-all disabled:opacity-20 uppercase"
        >
          EXECUTE
        </button>
      </form>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 reveal [animation-delay:450ms]">
        {["Campaign Analytics", "Verify Brevo Quota", "Scrape ZRH Leads", "Audit DB Rules"].map((action, i) => (
          <button 
            key={i}
            onClick={() => setInput(action)}
            className="py-3 glass-panel-accent glass-panel text-[8px] tracking-[0.3em] text-[#555] hover:text-k hover:border-k/40 transition-all uppercase font-black"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
