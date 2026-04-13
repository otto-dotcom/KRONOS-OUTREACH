import { NextRequest, NextResponse } from "next/server";
import { sendPreviews, SendItem, type Project } from "@/lib/outreach";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

let sending = false;

export async function POST(req: NextRequest) {
  let body: { emails?: unknown; project?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.emails) || body.emails.length === 0) {
    return NextResponse.json({ error: "emails array required" }, { status: 400 });
  }

  if (sending) {
    log.info("send_blocked", { reason: "concurrent_lock" });
    return NextResponse.json(
      { error: "A send is already in progress — wait for it to finish" },
      { status: 429 }
    );
  }

  const emails = body.emails as SendItem[];
  const project: Project = body.project === "helios" ? "helios" : "kronos";

  log.api("/api/campaign/send", "POST", { count: emails.length, project });

  // NOTE: Individual email logging happens inside sendPreviews (lib/outreach.ts)
  // AFTER each send succeeds — not here before sends are attempted.
  sending = true;

  try {
    const result = await sendPreviews(emails, project);
    log.info("send_complete", {
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      project,
      editedCount: emails.filter((e) => e.wasEdited).length,
      regeneratedCount: emails.filter((e) => e.wasRegenerated).length,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    log.error("send_failed", err, { project });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    sending = false;
  }
}
