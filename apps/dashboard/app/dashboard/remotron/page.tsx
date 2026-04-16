"use client";

import Link from "next/link";

export default function RemotronPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-amber-300">
          Legacy view
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Remotron has been retired</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-300">
          This route used to show simulated job-search data and placeholder operational stats.
          We keep it here as a safe archive, but it no longer presents fake live metrics.
        </p>
        <div className="mt-8 grid gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 text-sm text-neutral-300">
          <p>Current product surfaces are the CRM, outreach, analytics, database, chat, automations, and settings areas.</p>
          <p>If you want this idea revived, we should connect it to real data sources first.</p>
        </div>
        <div className="mt-8">
          <Link href="/dashboard" className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
