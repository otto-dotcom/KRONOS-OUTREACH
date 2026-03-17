import { NextRequest, NextResponse } from "next/server";
import { previewOutreach } from "@/lib/outreach";
import { log } from "@/lib/logger";

export const maxDuration = 300;

const MAX_LEAD_LIMIT = 50;

export async function POST(req: NextRequest) {
  let body: { leadLimit?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const leadLimit = Math.min(
    Math.max(Math.floor(Number(body.leadLimit) || 10), 1),
    MAX_LEAD_LIMIT
  );

  log.api("/api/campaign/preview", "POST", { leadLimit });

  try {
    const previews = await previewOutreach(leadLimit);
    log.info("preview_complete", { count: previews.length });
    return NextResponse.json({ ok: true, previews });
  } catch (err) {
    log.error("preview_failed", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
