import { NextRequest, NextResponse } from "next/server";

const MAX_LEAD_LIMIT = 200;

export async function POST(req: NextRequest) {
  let body: { leadLimit?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const leadLimit = Math.min(Math.max(Math.floor(Number(body.leadLimit) || 10), 1), MAX_LEAD_LIMIT);

  const baseUrl = process.env.N8N_BASE_URL;
  const dashboardPassword = process.env.DASHBOARD_PASSWORD;

  if (!baseUrl) {
    return NextResponse.json({ error: "N8N_BASE_URL not configured" }, { status: 500 });
  }

  const webhookUrl = `${baseUrl}/webhook/KRONOS%20APP`;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(dashboardPassword && { "X-KRONOS-AUTH": dashboardPassword }),
      },
      body: JSON.stringify({ leadLimit, contactMethod: "both" }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `n8n returned ${res.status}: ${text}` },
        { status: 502 }
      );
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
