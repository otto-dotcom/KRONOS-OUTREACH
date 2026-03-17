import { NextResponse } from "next/server";

export const runtime = "edge";

const BASE = "appLriEwWldpPTMPg";
const TABLE = "tblLZkFo7Th7uyfWB";
const AIRTABLE_API = "https://api.airtable.com/v0";

interface AirtableRecord {
  id: string;
  fields: {
    "FULL NAME"?: string;
    "company name"?: string;
    City?: string;
    EMAIL?: string;
    Rank?: number;
    lead_status?: string;
    "EMAIL STATUS"?: string;
  };
}

const FIELDS = ["lead_status", "EMAIL STATUS", "Rank", "FULL NAME", "company name", "City", "EMAIL"]
  .map((f) => `fields[]=${encodeURIComponent(f)}`)
  .join("&");

async function fetchAll(apiKey: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = `${AIRTABLE_API}/${BASE}/${TABLE}?pageSize=100&${FIELDS}${offset ? `&offset=${offset}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) throw new Error(`Airtable ${res.status}`);
    const data = (await res.json()) as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "Airtable API key not configured" }, { status: 500 });
  }

  try {
    const records = await fetchAll(apiKey);

    let priority = 0, medium = 0, low = 0, sent = 0, pending = 0;

    for (const r of records) {
      const ls = r.fields.lead_status;
      if (ls === "priority") priority++;
      else if (ls === "medium") medium++;
      else if (ls === "low") low++;

      const es = r.fields["EMAIL STATUS"];
      if (es === "Sent") sent++;
      else if (r.fields.EMAIL && (r.fields.Rank ?? 0) >= 5) pending++;
    }

    const topLeads = records
      .filter((r) => r.fields.EMAIL && r.fields.Rank)
      .sort((a, b) => (b.fields.Rank ?? 0) - (a.fields.Rank ?? 0))
      .slice(0, 15)
      .map((r) => ({
        name: r.fields["FULL NAME"] ?? "—",
        company: r.fields["company name"] ?? "—",
        city: r.fields.City ?? "—",
        rank: r.fields.Rank ?? 0,
        emailStatus: r.fields["EMAIL STATUS"] ?? "",
      }));

    return NextResponse.json(
      { total: records.length, by_status: { priority, medium, low }, by_email: { sent, pending }, top_leads: topLeads },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
