import { NextResponse } from "next/server";
import { fetchSentArchive } from "@/lib/outreach";

export const runtime = "nodejs";

const BREVO_API = "https://api.brevo.com/v3";

interface BrevoEvent {
  email: string;
  event: string;
  date: string;
  subject?: string;
  messageId?: string;
}

interface Engagement {
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
  openedAt?: string;
  clickedAt?: string;
}

/** Paginate Brevo events for KRONOS_OUTREACH tag (cap at 500). */
async function fetchAllBrevoEvents(apiKey: string): Promise<BrevoEvent[]> {
  const events: BrevoEvent[] = [];
  let offset = 0;
  const limit = 100;

  while (offset < 500) {
    const url = `${BREVO_API}/smtp/statistics/events?limit=${limit}&offset=${offset}&tags=KRONOS_OUTREACH&sort=desc`;
    const res = await fetch(url, {
      headers: { "api-key": apiKey, Accept: "application/json" },
    });
    if (!res.ok) break;
    const data = (await res.json()) as { events?: BrevoEvent[] };
    const batch = data.events ?? [];
    events.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return events;
}

export async function GET() {
  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not set" }, { status: 500 });
  }

  try {
    const [brevoEvents, sentLeads] = await Promise.all([
      fetchAllBrevoEvents(brevoKey),
      fetchSentArchive(300),
    ]);

    // Group Brevo events by recipient email
    const engagementMap: Record<string, Engagement> = {};
    for (const ev of brevoEvents) {
      const key = ev.email.toLowerCase();
      if (!engagementMap[key]) {
        engagementMap[key] = { delivered: false, opened: false, clicked: false, bounced: false };
      }
      const eng = engagementMap[key];
      if (ev.event === "delivered") eng.delivered = true;
      if (ev.event === "opened") {
        eng.opened = true;
        if (!eng.openedAt) eng.openedAt = ev.date;
      }
      if (ev.event === "clicks") {
        eng.clicked = true;
        if (!eng.clickedAt) eng.clickedAt = ev.date;
      }
      if (ev.event === "hardBounces" || ev.event === "softBounces") {
        eng.bounced = true;
      }
    }

    const rows = sentLeads.map((lead) => {
      const f = lead.fields;
      const emailKey = ((f.EMAIL as string) ?? "").toLowerCase();
      const eng = engagementMap[emailKey] ?? {
        delivered: false,
        opened: false,
        clicked: false,
        bounced: false,
      };
      return {
        id: lead.id,
        company: (f["company name"] as string) ?? "—",
        name: (f["FULL NAME"] as string) ?? "—",
        email: (f.EMAIL as string) ?? "",
        subject: ((f as Record<string, unknown>).EMAIL_SUBJECT as string) ?? "",
        sentAt: ((f as Record<string, unknown>).DATE_SENT as string) ?? "",
        rank: (f.Rank as number) ?? 0,
        leadStatus: (f.lead_status as string) ?? "",
        city: (f.City as string) ?? "",
        // Extended fields for company card
        url: (f.URL as string) ?? "",
        phone: ((f as Record<string, unknown>).Phone as string) ?? "",
        category: ((f as Record<string, unknown>).Category as string) ?? "",
        scoreReason: (f.score_reason as string) ?? "",
        tech: (f.TECHNOLOGY as string) ?? "",
        keywords: (f.KEYWORDS as string) ?? "",
        linkedin: (f.LINKEDIN as string) ?? "",
        revenue: (f.REVENUE as string) ?? "",
        jobTitle: ((f as Record<string, unknown>)["JOB TITLE"] as string) ?? "",
        headline: (f.HEADLINE as string) ?? "",
        seniority: (f.SENIORITY as string) ?? "",
        companySize: ((f as Record<string, unknown>)["COMPANY SIZE"] as string) ?? "",
        companyDesc: ((f as Record<string, unknown>)["COMPANY DESCRIPTION"] as string) ?? "",
        instagram: (f.INSTAGRAM as string) ?? "",
        sector: (f.SECTOR as string) ?? "",
        address: (f.Address as string) ?? "",
        street: (f.Street as string) ?? "",
        postalCode: ((f as Record<string, unknown>)["Postal code"] as string) ?? "",
        state: (f.State as string) ?? "",
        ...eng,
      };
    });

    const summary = {
      total: rows.length,
      delivered: rows.filter((r) => r.delivered).length,
      opened: rows.filter((r) => r.opened).length,
      clicked: rows.filter((r) => r.clicked).length,
      bounced: rows.filter((r) => r.bounced).length,
    };

    return NextResponse.json(
      { rows, summary },
      { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=30" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
