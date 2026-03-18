"use client";

import { useRouter } from "next/navigation";

function KronosLogoSmall() {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" fill="none" style={{ imageRendering: "pixelated" }}>
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
      <rect x="8" y="6" width="16" height="18" fill="#0D0D0D" />
      <rect x="6" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="24" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="15" y="8" width="2" height="8" fill="#FF6B00" />
      <rect x="15" y="14" width="6" height="2" fill="#FF6B00" opacity="0.7" />
      <rect x="15" y="14" width="2" height="2" fill="#FFFFFF" />
      <rect x="28" y="13" width="2" height="4" fill="#FF6B00" />
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KronosLogoSmall />
            <div className="flex items-center gap-2">
              <span
                className="text-[#FF6B00] text-[9px] tracking-[0.25em]"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                KRONOS
              </span>
              <span className="text-[#666] text-[9px]">//</span>
              <span className="text-[#999] text-[10px] tracking-[0.15em] uppercase font-light">
                Command Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6 mr-4">
              <a href="/dashboard" className="text-[10px] tracking-[0.2em] font-black uppercase text-[#FF6B00] border-b border-[#FF6B00] pb-0.5">Control</a>
              <a href="/dashboard/analytics" className="text-[10px] tracking-[0.2em] font-black uppercase text-[#444] hover:text-white transition-all">Intelligence</a>
            </nav>
            <div className="w-px h-4 bg-[#1A1A1A]" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full blink shadow-[0_0_8px_#22c55e]" />
                <span className="text-[9px] text-[#555] tracking-widest uppercase font-black">Online</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[9px] text-[#333] tracking-[0.2em] uppercase font-black hover:text-[#FF6B00] transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
