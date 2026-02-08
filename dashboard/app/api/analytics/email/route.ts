import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SENDGRID_API_KEY not configured" }, { status: 500 });
  }

  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days")) || 7, 1), 365);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  try {
    const statsUrl = `https://api.sendgrid.com/v3/stats?start_date=${fmt(startDate)}&end_date=${fmt(endDate)}&aggregated_by=day`;
    const statsRes = await fetch(statsUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (statsRes.ok) {
      const data = await statsRes.json();

      const totals = {
        requests: 0, delivered: 0, opens: 0, unique_opens: 0,
        clicks: 0, unique_clicks: 0, bounces: 0, spam_reports: 0,
      };
      const daily: { date: string; delivered: number; opens: number }[] = [];

      for (const day of data) {
        const m = day.stats?.[0]?.metrics;
        if (!m) continue;
        totals.requests += m.requests || 0;
        totals.delivered += m.delivered || 0;
        totals.opens += m.opens || 0;
        totals.unique_opens += m.unique_opens || 0;
        totals.clicks += m.clicks || 0;
        totals.unique_clicks += m.unique_clicks || 0;
        totals.bounces += m.bounces || 0;
        totals.spam_reports += m.spam_reports || 0;
        daily.push({ date: day.date, delivered: m.delivered || 0, opens: m.opens || 0 });
      }

      const openRate = totals.delivered > 0
        ? ((totals.unique_opens / totals.delivered) * 100).toFixed(1) : "0";
      const clickRate = totals.delivered > 0
        ? ((totals.unique_clicks / totals.delivered) * 100).toFixed(1) : "0";

      return NextResponse.json({ totals, openRate, clickRate, daily, days });
    }

    return NextResponse.json({
      error: "API key missing 'Stats Read' permission. Update key scopes in SendGrid Settings > API Keys.",
      needsScope: "stats.read",
    }, { status: 403 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
