import { NextRequest, NextResponse } from "next/server";

interface TwilioMessage {
  status: string;
  date_sent: string;
  direction: string;
  to: string;
  body: string;
  error_code: number | null;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4);
}

export async function GET(req: NextRequest) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 });
  }

  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days")) || 30, 1), 365);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateSent = startDate.toISOString().split("T")[0];

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  try {
    const baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const params = new URLSearchParams();
    params.set("DateSent>", dateSent);
    params.set("PageSize", "1000");

    const res = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Twilio ${res.status}: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    const allMessages: TwilioMessage[] = data.messages || [];

    // Only count outbound messages
    const messages = allMessages.filter(
      (m: TwilioMessage) => m.direction === "outbound-api" || m.direction === "outbound-call"
    );

    const totals = { sent: 0, delivered: 0, failed: 0, undelivered: 0, queued: 0 };
    const dailyMap: Record<string, { sent: number; delivered: number; failed: number }> = {};
    const recipients: { to: string; status: string; date: string; error: number | null }[] = [];

    for (const msg of messages) {
      const parsedDate = msg.date_sent ? new Date(msg.date_sent) : null;
      const date = parsedDate && !isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Unknown";
      const dateKey = parsedDate && !isNaN(parsedDate.getTime())
        ? parsedDate.toISOString().split("T")[0]
        : "unknown";

      if (!dailyMap[dateKey]) dailyMap[dateKey] = { sent: 0, delivered: 0, failed: 0 };

      switch (msg.status) {
        case "delivered":
          totals.delivered++;
          totals.sent++;
          dailyMap[dateKey].delivered++;
          dailyMap[dateKey].sent++;
          break;
        case "sent":
          totals.sent++;
          dailyMap[dateKey].sent++;
          break;
        case "failed":
          totals.failed++;
          dailyMap[dateKey].failed++;
          break;
        case "undelivered":
          totals.undelivered++;
          dailyMap[dateKey].failed++;
          break;
        case "queued":
        case "sending":
          totals.queued++;
          break;
        default:
          totals.sent++;
          dailyMap[dateKey].sent++;
      }

      recipients.push({
        to: maskPhone(msg.to),
        status: msg.status,
        date,
        error: msg.error_code,
      });
    }

    // Sort daily data
    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    const totalAttempted = totals.sent + totals.failed + totals.undelivered;
    const deliveryRate = totalAttempted > 0
      ? ((totals.delivered / totalAttempted) * 100).toFixed(1)
      : "0";

    return NextResponse.json({
      totals,
      deliveryRate,
      total: messages.length,
      days,
      daily,
      recent: recipients.slice(0, 10),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
