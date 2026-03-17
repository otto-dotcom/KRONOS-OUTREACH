import { NextRequest, NextResponse } from "next/server";
import { runOutreach } from "@/lib/outreach";

const MAX_LEAD_LIMIT = 200;

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

  try {
    const result = await runOutreach(leadLimit);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
