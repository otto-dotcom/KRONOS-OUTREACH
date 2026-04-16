import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const AIRTABLE_API = "https://api.airtable.com/v0";

function getAirtableIds(project: string): { base: string; table: string } {
  if (project === "helios") {
    const base  = process.env.HELIOS_AIRTABLE_BASE_ID  ?? "";
    const table = process.env.HELIOS_AIRTABLE_TABLE_ID ?? "";
    if (!base || !table) throw new Error("HELIOS_AIRTABLE_BASE_ID / HELIOS_AIRTABLE_TABLE_ID not configured");
    return { base, table };
  }
  const base  = process.env.AIRTABLE_BASE_ID  ?? "";
  const table = process.env.AIRTABLE_TABLE_ID ?? "";
  if (!base || !table) throw new Error("AIRTABLE_BASE_ID / AIRTABLE_TABLE_ID not configured");
  return { base, table };
}

interface AirtableRecord {
  id: string;
  fields: {
    "FULL NAME"?: string;
    "company name"?: string;
    City?: string;
    EMAIL?: string;
    Phone?: string;
    Category?: string;
    Rank?: number;
    lead_status?: string;
    "EMAIL STATUS"?: string;
    URL?: string;
    score_reason?: string;
    TECHNOLOGY?: string;
    "Postal code"?: string;
    State?: string;
    KEYWORDS?: string;
    LINKEDIN?: string;
    REVENUE?: string;
    "JOB TITLE"?: string;
    HEADLINE?: string;
    SENIORITY?: string;
    "COMPANY SIZE"?: string;
    "COMPANY DESCRIPTION"?: string;
    INSTAGRAM?: string;
    SECTOR?: string;
    Address?: string;
    Street?: string;
  };
}

const FIELDS = [
  "lead_status", "EMAIL STATUS", "Rank", "FULL NAME", "company name", "City",
  "EMAIL", "Phone", "Category", "URL", "score_reason", "TECHNOLOGY",
  "Postal code", "State", "KEYWORDS", "LINKEDIN", "REVENUE", "JOB TITLE",
  "HEADLINE", "SENIORITY", "COMPANY SIZE", "COMPANY DESCRIPTION", "INSTAGRAM",
  "SECTOR", "Address", "Street"
]
  .map((f) => `fields[]=${encodeURIComponent(f)}`)
  .join("&");

async function fetchAll(apiKey: string, base: string, table: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = `${AIRTABLE_API}/${base}/${table}?pageSize=100&${FIELDS}${offset ? `&offset=${offset}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) throw new Error(`Airtable ${res.status}`);
    const data = (await res.json()) as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "Airtable API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const project = searchParams.get("project") ?? "kronos";
  const { base, table } = getAirtableIds(project);

  try {
    const records = await fetchAll(apiKey, base, table);

    let priority = 0, medium = 0, low = 0, sent = 0, pending = 0;
    let scored = 0, eligible = 0, booked = 0;
    const EXCLUDE_CATS = new Set(["Financial Services", "Investment Management", "Banking"]);

    for (const r of records) {
      const ls = r.fields.lead_status;
      if (ls === "priority") priority++;
      else if (ls === "medium") medium++;
      else if (ls === "low") low++;

      const es = r.fields["EMAIL STATUS"];
      const rank = r.fields.Rank ?? 0;
      const hasEmail = !!r.fields.EMAIL;
      const url = r.fields.URL ?? "";
      const cat = r.fields.Category ?? "";

      if (rank > 0) scored++;
      if (es === "Sent") sent++;
      else if (hasEmail && rank >= 5) pending++;

      // Eligible = has email, rank >= 5, swiss domain or no URL, not finance
      const isSwiss = url === "" || url.includes(".ch");
      const isFinance = EXCLUDE_CATS.has(cat);
      if (hasEmail && rank >= 5 && isSwiss && !isFinance) eligible++;

      // Booked = any terminal positive status
      const BOOKED = new Set(["RESPOND", "CALL FIXED", "GOLD"]);
      if (es && BOOKED.has(es)) booked++;
    }

    const topLeads = records
      .filter((r) => r.fields.EMAIL && r.fields.Rank)
      .sort((a, b) => (b.fields.Rank ?? 0) - (a.fields.Rank ?? 0))
      .slice(0, 30) // Increased to 30 for better visibility
      .map((r) => ({
        id: r.id,
        name: r.fields["FULL NAME"] ?? "—",
        company: r.fields["company name"] ?? "—",
        city: r.fields.City ?? "—",
        rank: r.fields.Rank ?? 0,
        emailStatus: r.fields["EMAIL STATUS"] ?? "Pending",
        email: r.fields.EMAIL ?? "",
        phone: r.fields.Phone ?? "",
        category: r.fields.Category ?? "",
        url: r.fields.URL ?? "",
        scoreReason: r.fields.score_reason ?? "",
        leadStatus: r.fields.lead_status ?? "low",
        tech: r.fields.TECHNOLOGY ?? "",
        postalCode: r.fields["Postal code"] ?? "",
        state: r.fields.State ?? "",
        keywords: r.fields.KEYWORDS ?? "",
        linkedin: r.fields.LINKEDIN ?? "",
        revenue: r.fields.REVENUE ?? "",
        jobTitle: r.fields["JOB TITLE"] ?? "",
        headline: r.fields.HEADLINE ?? "",
        seniority: r.fields.SENIORITY ?? "",
        companySize: r.fields["COMPANY SIZE"] ?? "",
        companyDesc: r.fields["COMPANY DESCRIPTION"] ?? "",
        instagram: r.fields.INSTAGRAM ?? "",
        sector: r.fields.SECTOR ?? "",
        address: r.fields.Address ?? "",
        street: r.fields.Street ?? "",
      }));

    return NextResponse.json(
      { total: records.length, scored, eligible, booked, by_status: { priority, medium, low }, by_email: { sent, pending }, top_leads: topLeads },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
