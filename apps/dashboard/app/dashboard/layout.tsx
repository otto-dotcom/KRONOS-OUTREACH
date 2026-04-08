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
    <div className="min-h-screen bg-k-bg mesh-bg grid-paper">
      {/* Dynamic Navigation Line */}
      <div className="fixed top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-k to-transparent opacity-30 z-[60]" />

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between glass-panel px-6 py-4 reveal">
          <div className="flex items-center gap-6 cursor-pointer group" onClick={() => router.push("/dashboard")}>
            <div className="relative">
              <KronosLogoSmall />
              <div className="absolute -inset-2 bg-k/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-k text-xs tracking-[0.4em] font-mono font-black">
                KRONOS
              </span>
              <span className="text-[#444] text-[8px] tracking-[0.2em] uppercase font-medium">
                Autonomous Outreach Ops
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-12">
            {[
              { label: "Control", path: "/dashboard" },
              { label: "Intelligence", path: "/dashboard/analytics" },
              { label: "Directives", path: "/dashboard/directives" },
              { label: "Automations", path: "/dashboard/automations" },
              { label: "LeadBase", path: "/dashboard/database" },
              { label: "Agent", path: "/dashboard/chat" },
            ].map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`text-[9px] tracking-[0.3em] font-mono transition-all uppercase font-bold relative group ${
                  isActive(item.path) ? "text-k" : "text-[#555] hover:text-white"
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-k" />
                )}
                <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white group-hover:w-full transition-all" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <div className="cyber-tag mb-1">Status: Operational</div>
              <div className="text-[7px] text-[#333] tracking-[0.3em] uppercase">Zurich // HQ</div>
            </div>
            <div className="w-10 h-10 flex items-center justify-center border border-k/10 hover:border-k/40 transition-colors cursor-pointer" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#444] hover:text-k transition-colors">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-32 pb-20 px-8 max-w-[1600px] mx-auto min-h-screen">
        {children}
      </main>

      {/* Side Aesthetics */}
      <div className="fixed left-4 bottom-8 rotate-90 origin-left text-[8px] text-[#222] tracking-[0.4em] uppercase font-mono pointer-events-none">
        System_Version: V.4.0.8 // Outreach_Engine
      </div>
    </div>
  );
}
