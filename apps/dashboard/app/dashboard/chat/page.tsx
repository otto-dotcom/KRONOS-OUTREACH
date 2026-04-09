"use client";

import { useState, useEffect, useRef } from "react";
import { useProject } from "../ProjectContext";
import { Send, Bot, User, Sparkles, Database, Mail, ShieldAlert, Cpu, Activity, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AgentChat() {
  const { project, brandColor } = useProject();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: `System Online. I am Otto, Operations Intelligence Agent for ${project.toUpperCase()}.\n\nSecure neural link established. Ready to execute outreach commands, analyze lead pipelines, and control automated campaigns. How can we optimize operations today?` 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          project
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: "⚠️ System Error: Unable to reach core logic layer. Please verify network connection or environmental keys." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Parses text roughly to detect lists or code blocks and formats them simply.
  // In a real production app we'd use react-markdown, but we'll do lightweight custom rendering for aesthetics.
  function renderContent(content: string) {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} className="flex flex-row items-baseline gap-2 my-1">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: brandColor }} />
            <p className="text-sm font-medium opacity-90">{line.substring(2)}</p>
          </div>
        );
      }
      return <p key={i} className="mb-2 text-sm font-medium leading-relaxed opacity-90">{line}</p>;
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-5xl mx-auto">
      
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 mb-6 glass-panel rounded-xl border border-white/5"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex h-10 w-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-20" style={{ backgroundColor: brandColor }}></span>
            <div className="relative flex items-center justify-center rounded-full h-10 w-10 border border-white/10 bg-black/50 shadow-inner">
              <Cpu size={20} style={{ color: brandColor }} />
            </div>
          </div>
          <div>
            <h2 className="text-base font-black tracking-[0.2em] uppercase font-mono text-white/90">
              AGENT_INTERFACE // OTTO_V4
            </h2>
            <div className="flex flex-row items-center gap-2 mt-1">
              <Activity size={12} style={{ color: brandColor }} />
              <p className="text-[10px] text-white/50 tracking-[0.2em] font-mono uppercase">
                {project}_environment_active
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="text-[9px] text-white/40 tracking-widest uppercase mb-1">Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
              <span className="text-[10px] font-mono tracking-wider font-bold" style={{ color: brandColor }}>OPERATIONAL</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar glass-panel shadow-2xl rounded-xl border border-white/5 mb-6 relative"
      >
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`group flex max-w-[85%] md:max-w-[75%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"} gap-4 items-end`}
              >
                {/* Avatar */}
                <div className="shrink-0 mb-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    m.role === "user" ? "bg-white/10" : "bg-black/60 border border-white/5"
                  }`}>
                    {m.role === "user" ? (
                      <User size={14} className="opacity-70 text-white" />
                    ) : (
                      <Bot size={16} style={{ color: brandColor }} />
                    )}
                  </div>
                </div>

                {/* Message Bubble */}
                <div 
                  className={`relative p-5 rounded-2xl shadow-xl ${
                    m.role === "user" 
                      ? "text-black" // user message background depends on theme
                      : "bg-black/40 border border-white/10 text-white/90 rounded-bl-sm"
                  }`}
                  style={{
                    backgroundColor: m.role === "user" ? brandColor : undefined,
                    borderRadius: m.role === "user" ? "1rem 1rem 0 1rem" : "1rem 1rem 1rem 0",
                  }}
                >
                  <div className={`text-[9px] uppercase tracking-[0.2em] font-black mb-2 opacity-50`}>
                    {m.role === "user" ? "OPERATOR" : `OTTO_CORE // ${project.toUpperCase()}`}
                  </div>
                  <div className="whitespace-pre-wrap font-sans">
                    {renderContent(m.content)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start w-full mt-4"
          >
            <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-5 py-4 rounded-2xl rounded-bl-sm">
              <Bot size={14} style={{ color: brandColor }} className="animate-pulse" />
              <div className="flex gap-1">
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: brandColor }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.15 }}
                  />
                ))}
              </div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 ml-2">
                Processing...
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full relative"
      >
        {/* Quick Actions (Floating above input) */}
        <div className="absolute -top-12 left-0 right-0 flex gap-2 overflow-x-auto hide-scrollbar px-2 z-10 pb-2">
          {[
            { label: "Pipeline Status", icon: <Database size={12} />, prompt: "What is the current status of the lead pipeline?" },
            { label: "Email Analytics", icon: <Activity size={12} />, prompt: "Show me the email delivery and open rate analytics." },
            { label: "Recent Sends", icon: <Mail size={12} />, prompt: "What were the last 5 emails we sent? Show subjects." },
            { label: "Preview Campaign", icon: <Sparkles size={12} />, prompt: "Generate previews for the top 5 leads." },
          ].map((action, i) => (
            <button 
              key={i}
              onClick={() => {
                if (isLoading) return;
                setInput(action.prompt);
              }}
              className="flex items-center gap-2 whitespace-nowrap bg-black/80 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-[10px] tracking-widest text-white/70 hover:text-white transition-all font-mono uppercase backdrop-blur-md shadow-lg"
            >
              <span style={{ color: brandColor }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>

        <form 
          onSubmit={handleSubmit}
          className="relative glass-panel rounded-2xl shadow-2xl p-2 flex items-end gap-2 border border-white/10 focus-within:border-white/30 transition-colors bg-black/60"
        >
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Initialize command sequence..."
            className="w-full bg-transparent p-4 text-sm text-white focus:outline-none resize-none custom-scrollbar min-h-[60px] max-h-[200px]"
            rows={1}
            style={{ 
              fontFamily: "var(--font-inter), sans-serif",
            }}
          />
          <button 
            disabled={isLoading || !input.trim()}
            className="shrink-0 h-[50px] w-[50px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/20 transition-all disabled:opacity-20 disabled:hover:bg-white/5 text-white shadow-lg mb-1 mr-1"
            style={{ 
              background: input.trim() && !isLoading ? brandColor : undefined,
              color: input.trim() && !isLoading ? "black" : undefined
            }}
          >
            <Send size={18} className={input.trim() && !isLoading ? "ml-1" : ""} />
          </button>
        </form>
        
        {/* Safety Disclaimer */}
        <div className="flex items-center justify-center gap-2 mt-4 text-[9px] text-white/30 font-mono tracking-widest uppercase">
          <ShieldAlert size={10} />
          <span>Otto operates autonomously. Do not launch campaigns without verification.</span>
        </div>
      </motion.div>

    </div>
  );
}
