import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not configured" }, { status: 500 });
  }

  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 20, 1), 100);

  try {
    // Fetch granular events for KRONOS_OUTREACH tag
    const eventsUrl = `https://api.brevo.com/v3/smtp/statistics/events?limit=${limit}&tags=KRONOS_OUTREACH&sort=desc`;
    const eventsRes = await fetch(eventsUrl, {
      headers: {
        "api-key": apiKey,
        "Accept": "application/json"
      },
    });

    if (eventsRes.ok) {
      const data = await eventsRes.json();
      return NextResponse.json(data);
    }

    const errText = await eventsRes.text();
    return NextResponse.json({
      error: "Failed to fetch Brevo events",
      details: errText
    }, { status: eventsRes.status });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
