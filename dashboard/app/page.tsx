"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function KronosLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: "pixelated" }}>
      {/* Pixel watch body */}
      <rect x="10" y="2" width="12" height="2" fill="#FF6B00" />
      <rect x="8" y="4" width="2" height="2" fill="#FF6B00" />
      <rect x="22" y="4" width="2" height="2" fill="#FF6B00" />
      <rect x="6" y="6" width="2" height="2" fill="#FF6B00" />
      <rect x="24" y="6" width="2" height="2" fill="#FF6B00" />
      <rect x="4" y="8" width="2" height="4" fill="#FF6B00" />
      <rect x="26" y="8" width="2" height="4" fill="#FF6B00" />
      <rect x="4" y="12" width="2" height="4" fill="#FF6B00" />
      <rect x="26" y="12" width="2" height="4" fill="#FF6B00" />
      <rect x="4" y="16" width="2" height="4" fill="#FF6B00" />
      <rect x="26" y="16" width="2" height="4" fill="#FF6B00" />
      <rect x="4" y="20" width="2" height="2" fill="#FF6B00" />
      <rect x="26" y="20" width="2" height="2" fill="#FF6B00" />
      <rect x="6" y="22" width="2" height="2" fill="#FF6B00" />
      <rect x="24" y="22" width="2" height="2" fill="#FF6B00" />
      <rect x="8" y="24" width="2" height="2" fill="#FF6B00" />
      <rect x="22" y="24" width="2" height="2" fill="#FF6B00" />
      <rect x="10" y="26" width="12" height="2" fill="#FF6B00" />
      {/* Watch face fill */}
      <rect x="8" y="6" width="16" height="18" fill="#0D0D0D" />
      <rect x="6" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="24" y="8" width="2" height="14" fill="#0D0D0D" />
      {/* Clock hands - hour (pointing up) */}
      <rect x="15" y="8" width="2" height="8" fill="#FF6B00" />
      {/* Clock hands - minute (pointing right) */}
      <rect x="15" y="14" width="6" height="2" fill="#FF6B00" opacity="0.7" />
      {/* Center dot */}
      <rect x="15" y="14" width="2" height="2" fill="#FFFFFF" />
      {/* Watch crown */}
      <rect x="28" y="13" width="2" height="4" fill="#FF6B00" />
      {/* Strap top */}
      <rect x="13" y="0" width="6" height="2" fill="#333" />
      {/* Strap bottom */}
      <rect x="13" y="28" width="6" height="2" fill="#333" />
      <rect x="13" y="30" width="6" height="2" fill="#222" />
    </svg>
  );
}

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "Too many attempts. Try again later." ? "TOO MANY ATTEMPTS" : "ACCESS DENIED");
      }
    } catch {
      setError("CONNECTION ERROR");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8 fade-up">
          <div className="pulse-glow rounded-full p-4 mb-6">
            <KronosLogo size={72} />
          </div>
          <h1
            className="text-[#FF6B00] text-xs tracking-[0.3em] mb-1"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            KRONOS
          </h1>
          <p className="text-[#999] text-[10px] tracking-[0.2em] uppercase">
            Command Center
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-8 glow fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-[#FF6B00] blink" />
            <span className="text-[10px] tracking-[0.2em] text-[#999] uppercase">
              Authentication Required
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER ACCESS CODE"
              className="w-full bg-[#060606] border border-[#222] text-[#E0E0E0] px-4 py-3 text-sm tracking-wider placeholder:text-[#666] focus:outline-none focus:border-[#FF6B00] transition-colors"
              autoFocus
            />

            {error && (
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500" />
                <span className="text-red-400 text-xs tracking-wider">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-[#FF6B00] text-black font-bold py-3 text-xs tracking-[0.2em] hover:bg-[#E55F00] disabled:opacity-40 transition-all cursor-pointer"
            >
              {loading ? "VERIFYING..." : "AUTHENTICATE"}
            </button>
          </form>
        </div>

        <p className="text-center text-[#555] text-[9px] tracking-[0.15em] mt-6 uppercase">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
