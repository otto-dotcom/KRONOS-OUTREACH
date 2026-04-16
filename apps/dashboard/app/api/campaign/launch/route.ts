import { NextRequest, NextResponse } from "next/server";
import { runOutreach, type Project } from "@/lib/outreach";
import { log } from "@/lib/logger";
import { requireProjectFromBody } from "@/lib/project-scope";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_LEAD_LIMIT = 200;

// Module-level lock: prevents the same Vercel instance from running two
// concurrent launches. Combined with the per-lead Airtable re-check in
// outreach.ts, this prevents double-sends even across multiple instances.
let running = false;

export async function POST(req: NextRequest) {
  if (running) {
    log.info("launch_blocked", { reason: "concurrent_lock" });
    return NextResponse.json(
      { error: "A campaign is already running — wait for it to finish" },
      { status: 429 }
    );
  }

  let body: { leadLimit?: unknown; project?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const leadLimit = Math.min(
    Math.max(Math.floor(Number(body.leadLimit) || 10), 1),
    MAX_LEAD_LIMIT
  );
  const project = requireProjectFromBody(body as Record<string, unknown>) as Project | null;
  if (!project) {
    return NextResponse.json({ error: "Missing or invalid project in body. Use project=kronos|helios." }, { status: 400 });
  }

  log.api("/api/campaign/launch", "POST", { leadLimit, project });
  running = true;

  try {
    const result = await runOutreach(leadLimit, project);
    log.info("launch_complete", {
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    log.error("launch_failed", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    running = false;
  }
}
