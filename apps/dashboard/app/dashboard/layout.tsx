"use client";

import { useRouter, usePathname } from "next/navigation";

function KronosLogoSmall() {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" fill="none" style={{ imageRendering: "pixelated" }}>
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
      <rect x="8" y="6" width="16" height="18" fill="#0D0D0D" />
      <rect x="6" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="24" y="8" width="2" height="14" fill="#0D0D0D" />
      <rect x="15" y="8" width="2" height="8" fill="var(--color-k)" />
      <rect x="15" y="14" width="6" height="2" fill="var(--color-k)" opacity="0.7" />
      <rect x="15" y="14" width="2" height="2" fill="#FFFFFF" />
      <rect x="28" y="13" width="2" height="4" fill="var(--color-k)" />
    </svg>
  );
}

import { SwissBadge } from "./components";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-[#060606]">
      {/* Header */}
      <header className="border-b border-[#1A1A1A] bg-[#0A0A0A] sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push("/dashboard")}>
            <div className="pulse-glow">
              <KronosLogoSmall />
            </div>
            <div className="flex flex-col">
              <span className="text-k text-[10px] tracking-[0.3em] font-pixel">
                KRONOS
              </span>
              <span className="text-[#555] text-[7px] tracking-[0.15em] uppercase font-light">
                Outreach Command
              </span>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <nav className="flex items-center gap-8">
              <a
                href="/dashboard"
                className={`text-[9px] tracking-[0.25em] font-pixel transition-all pb-1.5 uppercase font-bold ${
                  isActive("/dashboard")
                    ? "text-[#FF6B00] border-b-2 border-[#FF6B00]"
                    : "text-[#444] hover:text-white border-b-2 border-transparent"
                }`}
              >
                Control
              </a>
              <a
                href="/dashboard/analytics"
                className={`text-[9px] tracking-[0.25em] font-pixel transition-all pb-1.5 uppercase font-bold ${
                  isActive("/dashboard/analytics")
                    ? "text-[#FF6B00] border-b-2 border-[#FF6B00]"
                    : "text-[#444] hover:text-white border-b-2 border-transparent"
                }`}
              >
                Intelligence
              </a>
              <a
                href="/dashboard/directives"
                className={`text-[9px] tracking-[0.25em] font-pixel transition-all pb-1.5 uppercase font-bold ${
                  isActive("/dashboard/directives")
                    ? "text-[#FF6B00] border-b-2 border-[#FF6B00]"
                    : "text-[#444] hover:text-white border-b-2 border-transparent"
                }`}
              >
                Directives
              </a>
              <a
                href="/dashboard/remotron"
                className={`text-[9px] tracking-[0.25em] font-pixel transition-all pb-1.5 uppercase font-bold ${
                  isActive("/dashboard/remotron")
                    ? "text-[#FF6B00] border-b-2 border-[#FF6B00]"
                    : "text-[#444] hover:text-white border-b-2 border-transparent"
                }`}
              >
                Remotron
              </a>
            </nav>
            <div className="w-px h-5 bg-[#1A1A1A]" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 blink" />
                <span className="text-[8px] text-[#666] tracking-widest font-pixel uppercase">
                  Live
                </span>
              </div>
              <SwissBadge />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">{children}</main>
    </div>
  );
}
