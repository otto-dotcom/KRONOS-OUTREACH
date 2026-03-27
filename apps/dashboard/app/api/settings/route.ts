import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API = "https://api.airtable.com/v0";

async function getAirtableConfig() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT;
  return { baseId, apiKey };
}

export async function GET() {
  const { baseId, apiKey } = await getAirtableConfig();
  if (!baseId || !apiKey) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 });
  }

  try {
    // We assume a table named "Settings" exists. 
    // If it doesn't, we'll return the default from lib/outreach.ts (via a future refactor)
    // For now, let's just try to fetch it.
    const url = `${AIRTABLE_API}/${baseId}/Settings?filterByFormula={Key}='copy_directives'`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
        // Table might not exist yet, return a helper message
        return NextResponse.json({ 
            value: "", 
            warning: "Settings table not found in Airtable. Please create a table named 'Settings' with 'Key' and 'Value' fields." 
        });
    }

    const data = await res.json();
    const record = data.records?.[0];
    return NextResponse.json({ value: record?.fields?.Value || "" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { baseId, apiKey } = await getAirtableConfig();
  const { value } = await req.json();

  if (!baseId || !apiKey) return NextResponse.json({ error: "Airtable not configured" }, { status: 500 });

  try {
    // 1. Find existing
    const searchUrl = `${AIRTABLE_API}/${baseId}/Settings?filterByFormula={Key}='copy_directives'`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const searchData = await searchRes.json();
    const existing = searchData.records?.[0];

    if (existing) {
      // Update
      const updateUrl = `${AIRTABLE_API}/${baseId}/Settings/${existing.id}`;
      await fetch(updateUrl, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { Value: value } }),
      });
    } else {
      // Create
      const createUrl = `${AIRTABLE_API}/${baseId}/Settings`;
      await fetch(createUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { Key: "copy_directives", Value: value } }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
