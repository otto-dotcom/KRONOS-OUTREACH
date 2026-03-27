"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function KronosLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: "pixelated" }}>
      {/* Pixel watch body */}
      <rect x="10" y="2" width="12" height="2" fill="var(--color-k)" />
      <rect x="8" y="4" width="2" height="2" fill="var(--color-k)" />
      <rect x="22" y="4" width="2" height="2" fill="var(--color-k)" />
      <rect x="6" y="6" width="2" height="2" fill="var(--color-k)" />
      <rect x="24" y="6" width="2" height="2" fill="var(--color-k)" />
      <rect x="4" y="8" width="2" height="4" fill="var(--color-k)" />
      <rect x="26" y="8" width="2" height="4" fill="var(--color-k)" />
      <rect x="4" y="12" width="2" height="4" fill="var(--color-k)" />
      <rect x="26" y="12" width="2" height="4" fill="var(--color-k)" />
      <rect x="4" y="16" width="2" height="4" fill="var(--color-k)" />
      <rect x="26" y="16" width="2" height="4" fill="var(--color-k)" />
      <rect x="4" y="20" width="2" height="2" fill="var(--color-k)" />
      <rect x="26" y="20" width="2" height="2" fill="var(--color-k)" />
      <rect x="6" y="22" width="2" height="2" fill="var(--color-k)" />
      <rect x="24" y="22" width="2" height="2" fill="var(--color-k)" />
      <rect x="8" y="24" width="2" height="2" fill="var(--color-k)" />
      <rect x="22" y="24" width="2" height="2" fill="var(--color-k)" />
      <rect x="10" y="26" width="12" height="2" fill="var(--color-k)" />
      {/* Watch face fill */}
      <rect x="8" y="6" width="16" height="18" fill="#0D0D0D" />
      <rect x="6" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="24" y="8" width="2" height="14" fill="#0D0D0D" />
      {/* Clock hands - hour (pointing up) */}
      <rect x="15" y="8" width="2" height="8" fill="var(--color-k)" />
      {/* Clock hands - minute (pointing right) */}
      <rect x="15" y="14" width="6" height="2" fill="var(--color-k)" opacity="0.7" />
      {/* Center dot */}
      <rect x="15" y="14" width="2" height="2" fill="#FFFFFF" />
      {/* Watch crown */}
      <rect x="28" y="13" width="2" height="4" fill="var(--color-k)" />
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
        <div className="flex flex-col items-center mb-10 fade-up">
          <div className="mb-6 pulse-glow">
            <KronosLogo size={72} />
          </div>
          <h1 className="text-k text-2xl font-cinzel tracking-[0.1em] mb-1">
            KRONOS
          </h1>
          <p className="text-[#666] text-[8px] tracking-[0.3em] font-pixel uppercase">
            Command Center
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-obsidian-strong p-10 fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-8">
            <span className="text-[7px] tracking-[0.3em] text-[#555] font-pixel uppercase">
              Secure Access Required
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER AUTH KEY"
              className="w-full bg-black/40 border border-white/10 text-white px-5 py-4 text-xs font-pixel placeholder:text-[#333] focus:outline-none focus:border-k transition-all shadow-inner"
              autoFocus
            />

            {error && (
              <div className="mt-4 text-red-500 text-xs tracking-wider">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-10 bg-k text-white font-pixel py-4.5 text-[9px] tracking-[0.2em] hover:bg-k-hover disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.2)]"
            >
              {loading ? "VERIFYING..." : "ACCESS GRANTED"}
            </button>
          </form>
        </div>

        <p className="text-center text-[#555] text-[9px] tracking-[0.15em] mt-6 uppercase">
          Client Acquisition Terminal
        </p>
      </div>
    </div>
  );
}
