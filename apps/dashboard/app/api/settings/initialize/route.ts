import { NextRequest, NextResponse } from "next/server";
import { requireProjectFromQuery } from "@/lib/project-scope";

const AIRTABLE_API = "https://api.airtable.com/v0";
const ALLOWED_PROJECTS = new Set(["kronos", "helios"]);
const SETTINGS_KEYS = {
  email: "email_prompt",
  sms: "sms_prompt",
} as const;

function getAirtableConfig(project: string) {
  let baseId = process.env.AIRTABLE_BASE_ID ?? "";
  if (project === "helios" && process.env.HELIOS_AIRTABLE_BASE_ID) {
    baseId = process.env.HELIOS_AIRTABLE_BASE_ID;
  }
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT;
  return { baseId, apiKey };
}

function getDefaultPrompt(project: string) {
  if (project === "helios") {
    return `You are a cold outreach specialist writing on behalf of HELIOS Business.
HELIOS helps Italian businesses with automation, operational cleanup, and CRM workflows.

LANGUAGE RULE: Write in the language that best matches the prospect's market, but keep the message natural, concise, and human.
GOAL: 4 to 5 short sentences. No fluff, no hype.
CTA: Close with plain-text links only.

Response must be valid JSON only: {"subject":"...","emailBody":"..."}`;
  }

  return `You are a cold email specialist writing on behalf of KRONOS Automations.
KRONOS is an AI automation consultancy. We help Swiss real estate agencies reduce manual work and build repeatable CRM and outreach systems.

LANGUAGE RULE: Write 100% in English.
GOAL: 4 to 5 short sentences. Keep it grounded and specific.
CTA: Close with two plain-text links only.

Response must be valid JSON only: {"subject":"...","emailBody":"..."}`;
}

async function upsertSetting(baseId: string, apiKey: string, key: string, value: string) {
  const searchUrl = `${AIRTABLE_API}/${baseId}/Settings`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const searchData = await searchRes.json();
  const records = searchData.records || [];
  const existing = records.find((record: any) => record.fields?.Key === key);

  if (existing) {
    await fetch(`${AIRTABLE_API}/${baseId}/Settings/${existing.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { Value: value } }),
    });
    return;
  }

  await fetch(`${AIRTABLE_API}/${baseId}/Settings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { Key: key, Value: value } }),
  });
}

export async function POST(req: NextRequest) {
  const project = requireProjectFromQuery(req.nextUrl.searchParams.get("project"));
  if (!project || !ALLOWED_PROJECTS.has(project)) return NextResponse.json({ error: "Missing or invalid project. Use ?project=kronos|helios" }, { status: 400 });

  const { baseId, apiKey } = getAirtableConfig(project);
  if (!baseId || !apiKey) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 });
  }

  try {
    await upsertSetting(baseId, apiKey, SETTINGS_KEYS.email, getDefaultPrompt(project));
    await upsertSetting(baseId, apiKey, SETTINGS_KEYS.sms, "");
    return NextResponse.json({ ok: true, project, initialized: ["email_prompt", "sms_prompt"] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
