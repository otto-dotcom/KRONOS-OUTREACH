import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API = "https://api.airtable.com/v0";

// Standardize directive keys
const KEYS = {
  EMAIL: "email_prompt",
  SMS: "sms_prompt"
};

function getAirtableConfig(project: string) {
  let baseId = process.env.AIRTABLE_BASE_ID ?? "";
  if (project === "helios" && process.env.HELIOS_AIRTABLE_BASE_ID) {
    baseId = process.env.HELIOS_AIRTABLE_BASE_ID;
  }
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT;
  return { baseId, apiKey };
}

export async function GET(req: NextRequest) {
  const project = req.nextUrl.searchParams.get("project") ?? "kronos";
  const { baseId, apiKey } = getAirtableConfig(project);
  
  if (!baseId || !apiKey) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 });
  }

  try {
    const url = `${AIRTABLE_API}/${baseId}/Settings`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
        return NextResponse.json({ 
            email_prompt: "", 
            sms_prompt: "",
            warning: "Settings table not found in Airtable for this project." 
        });
    }

    const data = await res.json();
    const records = data.records || [];
    
    // Support legacy "copy_directives" key falling back to EMAIL
    const legacyEmail = records.find((r: any) => r.fields?.Key === (project === "helios" ? "helios_copy_directives" : "copy_directives"))?.fields?.Value || "";
    
    const emailPrompt = records.find((r: any) => r.fields?.Key === KEYS.EMAIL)?.fields?.Value || legacyEmail;
    const smsPrompt = records.find((r: any) => r.fields?.Key === KEYS.SMS)?.fields?.Value || "";

    return NextResponse.json({ email_prompt: emailPrompt, sms_prompt: smsPrompt });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const project = req.nextUrl.searchParams.get("project") ?? "kronos";
  const { baseId, apiKey } = getAirtableConfig(project);
  const { email_prompt, sms_prompt } = await req.json();

  if (!baseId || !apiKey) return NextResponse.json({ error: "Airtable not configured" }, { status: 500 });

  try {
    const searchUrl = `${AIRTABLE_API}/${baseId}/Settings`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const searchData = await searchRes.json();
    const records = searchData.records || [];

    const syncKey = async (key: string, value: string) => {
      const existing = records.find((r: any) => r.fields?.Key === key);
      if (existing) {
        await fetch(`${AIRTABLE_API}/${baseId}/Settings/${existing.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { Value: value } }),
        });
      } else {
        await fetch(`${AIRTABLE_API}/${baseId}/Settings`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { Key: key, Value: value } }),
        });
      }
    };

    if (email_prompt !== undefined) await syncKey(KEYS.EMAIL, email_prompt);
    if (sms_prompt !== undefined) await syncKey(KEYS.SMS, sms_prompt);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
