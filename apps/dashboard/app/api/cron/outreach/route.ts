import { NextRequest, NextResponse } from "next/server";
import { runOutreach } from "@/lib/outreach";
import { parseProject } from "@/lib/project-scope";

export const runtime = "nodejs";
export const maxDuration = 300;

// Constant-time comparison — prevents timing-based secret brute-force
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a.padEnd(512));
  const bb = enc.encode(b.padEnd(512));
  let diff = 0;
  for (let i = 0; i < 512; i++) diff |= ba[i] ^ bb[i];
  return diff === 0 && a.length === b.length;
}

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// This route is intentionally excluded from cookie-auth middleware.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (!timingSafeEqual(auth, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cronProject = parseProject(process.env.CRON_PROJECT);
    if (!cronProject) {
      return NextResponse.json({ error: "CRON_PROJECT must be set to kronos or helios" }, { status: 500 });
    }

    const result = await runOutreach(10, cronProject);
    console.log("[cron/outreach]", result);
    return NextResponse.json({ ok: true, project: cronProject, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/outreach] fatal:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
