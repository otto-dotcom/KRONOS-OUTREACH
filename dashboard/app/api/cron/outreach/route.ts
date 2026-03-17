import { NextRequest, NextResponse } from "next/server";
import { runOutreach } from "@/lib/outreach";

// Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
// This route is intentionally excluded from the cookie-auth middleware.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runOutreach(10);
    console.log("[cron/outreach]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/outreach] fatal:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
