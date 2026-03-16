import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not configured" }, { status: 500 });
  }

  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days")) || 7, 1), 365);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  try {
    const statsUrl = `https://api.brevo.com/v3/smtp/statistics/reports?startDate=${fmt(startDate)}&endDate=${fmt(endDate)}`;
    const statsRes = await fetch(statsUrl, {
      headers: {
        "api-key": apiKey,
        "Accept": "application/json"
      },
    });

    if (statsRes.ok) {
      const data = await statsRes.json();

      const totals = {
        requests: 0, delivered: 0, opens: 0, unique_opens: 0,
        clicks: 0, unique_clicks: 0, bounces: 0, spam_reports: 0,
      };
      const daily: { date: string; delivered: number; opens: number }[] = [];

      const reports = data.reports || [];

      for (const day of reports) {
        totals.requests += day.requests || 0;
        totals.delivered += day.delivered || 0;
        totals.opens += day.opens || 0;
        totals.unique_opens += day.uniqueOpens || 0;
        totals.clicks += day.clicks || 0;
        totals.unique_clicks += day.uniqueClicks || 0;
        totals.bounces += (day.hardBounces || 0) + (day.softBounces || 0);
        totals.spam_reports += day.spamReports || 0;

        daily.push({ date: day.date, delivered: day.delivered || 0, opens: day.opens || 0 });
      }

      const openRate = totals.delivered > 0
        ? ((totals.unique_opens / totals.delivered) * 100).toFixed(1) : "0";
      const clickRate = totals.delivered > 0
        ? ((totals.unique_clicks / totals.delivered) * 100).toFixed(1) : "0";

      return NextResponse.json({ totals, openRate, clickRate, daily, days });
    }

    return NextResponse.json({
      error: "Brevo API key missing or invalid.",
    }, { status: 403 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
