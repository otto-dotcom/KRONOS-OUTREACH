import { NextRequest, NextResponse } from "next/server";
import { generateEmailCopy, AirtableRecord } from "@/lib/outreach";
import { log } from "@/lib/logger";

export const maxDuration = 60;

const PLAIN_CONSTRAINT =
  "Rewrite this more conversationally. Maximum 2 short paragraphs. Only 1 link total (the Cal.com booking link — drop the website link). Use only <p> tags inside the wrapper div — no nested divs, no other HTML elements. Under 100 words total. Make it sound like a direct personal message, not an email template.";

export async function POST(req: NextRequest) {
  let body: { recordId?: string; leadData?: AirtableRecord["fields"]; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.recordId || !body.leadData) {
    return NextResponse.json({ error: "recordId and leadData required" }, { status: 400 });
  }

  const mode = body.mode === "plain" ? "plain" : "standard";
  log.api("/api/campaign/regenerate", "POST", { recordId: body.recordId, mode });
  log.regen(body.recordId, String(body.leadData["company name"] ?? ""), mode);

  // Reconstruct a minimal AirtableRecord for generateEmailCopy
  const mockRecord: AirtableRecord = {
    id: body.recordId,
    fields: body.leadData,
  };

  try {
    const copy = await generateEmailCopy(
      mockRecord,
      mode === "plain" ? PLAIN_CONSTRAINT : undefined
    );
    log.info("regenerate_complete", { recordId: body.recordId, mode });
    return NextResponse.json({ ok: true, subject: copy.subject, emailBody: copy.emailBody });
  } catch (err) {
    log.error("regenerate_failed", err, { recordId: body.recordId });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
