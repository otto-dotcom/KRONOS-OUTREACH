import { NextRequest, NextResponse } from "next/server";
import { generateEmailCopy, AirtableRecord, type Project } from "@/lib/outreach";
import { log } from "@/lib/logger";
import { requireProjectFromBody } from "@/lib/project-scope";

export const maxDuration = 60;

const PLAIN_CONSTRAINT =
  "Rewrite this more conversationally. Maximum 2 short paragraphs. Only 1 link total (the Cal.com booking link — drop the website link). Use only <p> tags inside the wrapper div — no nested divs, no other HTML elements. Under 100 words total. Make it sound like a direct personal message, not an email template.";

export async function POST(req: NextRequest) {
  let body: { recordId?: string; leadData?: AirtableRecord["fields"]; mode?: string; project?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.recordId || !body.leadData) {
    return NextResponse.json({ error: "recordId and leadData required" }, { status: 400 });
  }

  const mode = body.mode === "plain" ? "plain" : "standard";
  const project = requireProjectFromBody(body as Record<string, unknown>) as Project | null;
  if (!project) {
    return NextResponse.json({ error: "Missing or invalid project in body. Use project=kronos|helios." }, { status: 400 });
  }
  log.api("/api/campaign/regenerate", "POST", { recordId: body.recordId, mode, project });
  log.regen(body.recordId, String(body.leadData["company name"] ?? ""), mode);

  const mockRecord: AirtableRecord = { id: body.recordId, fields: body.leadData };

  try {
    const copy = await generateEmailCopy(
      mockRecord,
      project,
      mode === "plain" ? PLAIN_CONSTRAINT : undefined
    );
    log.info("regenerate_complete", { recordId: body.recordId, mode, project });
    return NextResponse.json({ ok: true, subject: copy.subject, emailBody: copy.emailBody });
  } catch (err) {
    log.error("regenerate_failed", err, { recordId: body.recordId });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
