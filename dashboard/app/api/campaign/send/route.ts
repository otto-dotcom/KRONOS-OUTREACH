import { NextRequest, NextResponse } from "next/server";
import { sendPreviews, SendItem } from "@/lib/outreach";
import { log } from "@/lib/logger";

export const maxDuration = 300;

// Module-level lock — same protection as launch route.
// The real guard is the per-lead Airtable re-check inside sendPreviews().
let sending = false;

export async function POST(req: NextRequest) {
  let body: { emails?: unknown };
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
  log.api("/api/campaign/send", "POST", { count: emails.length });
  sending = true;

  // Log each email before sending for audit trail
  for (const item of emails) {
    log.sent(item.recordId, item.toEmail, item.toEmail, item.wasEdited, item.wasRegenerated);
  }

  try {
    const result = await sendPreviews(emails);
    log.info("send_complete", {
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      editedCount: emails.filter((e) => e.wasEdited).length,
      regeneratedCount: emails.filter((e) => e.wasRegenerated).length,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    log.error("send_failed", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    sending = false;
  }
}
