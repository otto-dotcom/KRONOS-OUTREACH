import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AIRTABLE_API = "https://api.airtable.com/v0";
const BREVO_API = "https://api.brevo.com/v3";

const SYSTEM_PROMPT = `You are Otto, the operations intelligence agent for two consulting agencies run by the same operator:

KRONOS Automations — AI automation consulting for Swiss real estate agencies.
Pipeline: Airtable leads → GPT-4o-mini email copy → Brevo send → mark Sent.
Target: Swiss RE agencies (.ch domains), Rank >= 5, exclude Financial/Banking.
Sender: otto@kronosbusiness.com

HELIOS — Clean solar intelligence consulting for Swiss solar installers and energy companies.
Pipeline: Same architecture, separate Airtable base.
Sender: otto@heliosbusiness.it

Your capabilities (you have real tools — use them, never invent numbers):
- get_leads_stats: Live lead counts and pipeline state from Airtable
- get_email_analytics: Brevo delivery, open, click stats
- get_recent_sent: Last N emails sent (subject, company, date)
- search_leads: Find specific leads by name, company, city, or email
- preview_campaign: Generate email previews for N leads (does NOT send)
- launch_campaign: Actually send emails to N leads (REQUIRES explicit user confirmation)

Rules — non-negotiable:
1. NEVER invent stats, lead counts, email rates, or any numbers. If a tool fails, say so.
2. NEVER launch a campaign without the user explicitly saying "yes, launch" or "confirm send".
3. When showing lead data, show real field values — no placeholders.
4. Be concise. Operators are busy. Lead with the answer.
5. If you don't have a piece of data, say which tool would fetch it and offer to run it.
6. Airtable schema: EMAIL STATUS (Sent/Processing/Failed/pending), Rank (1-10), lead_status (priority/medium/low), City, URL, Category, company name, FULL NAME, EMAIL, score_reason.

Tone: Direct, executive-level. You are a smart ops analyst who happens to have system access.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_leads_stats",
      description: "Get live lead pipeline stats from Airtable: total, by status, top priority leads ready to send.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
        },
        required: ["project"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_email_analytics",
      description: "Get Brevo email delivery stats: sent count, open rate, click rate, bounce rate.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Days to look back (default 30)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_sent",
      description: "Fetch recently sent emails from Airtable: subject, company, city, date.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          limit: { type: "number", description: "Records to fetch (default 10, max 25)" },
        },
        required: ["project"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_leads",
      description: "Search Airtable for leads by name, company, city, or email.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          query: { type: "string" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["project", "query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "preview_campaign",
      description: "Generate email previews for N leads — does NOT send anything.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          leadLimit: { type: "number", description: "Leads to preview (default 5, max 20)" },
        },
        required: ["project"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "launch_campaign",
      description: "Send emails to N leads. ONLY call when user has explicitly confirmed. Irreversible.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          leadLimit: { type: "number", description: "Leads to send to (default 10, max 50)" },
        },
        required: ["project"],
      },
    },
  },
];

function airtableIds(project: string) {
  if (project === "helios") {
    return {
      baseId: process.env.HELIOS_AIRTABLE_BASE_ID ?? "",
      tableId: process.env.HELIOS_AIRTABLE_TABLE_ID ?? "",
    };
  }
  return {
    baseId: process.env.AIRTABLE_BASE_ID ?? "",
    tableId: process.env.AIRTABLE_TABLE_ID ?? "",
  };
}

async function airtableGet(url: string) {
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Airtable ${res.status}`);
  return res.json();
}

async function toolGetLeadsStats(project: string) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  try {
    const queries = [
      { label: "total", f: `{EMAIL} != ""` },
      { label: "sent", f: `{EMAIL STATUS} = "Sent"` },
      { label: "ready", f: `AND({EMAIL} != "", {EMAIL STATUS} != "Sent", {EMAIL STATUS} != "Processing ", {Rank} >= 5)` },
      { label: "priority", f: `AND({lead_status} = "priority", {EMAIL STATUS} != "Sent")` },
      { label: "failed", f: `{EMAIL STATUS} = "Failed "` },
    ];
    const counts: Record<string, number> = {};
    await Promise.all(queries.map(async ({ label, f }) => {
      const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(f)}&pageSize=100&fields[]=EMAIL`) as { records: unknown[] };
      counts[label] = data.records?.length ?? 0;
    }));
    const top = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`AND({EMAIL} != "", {EMAIL STATUS} != "Sent", {Rank} >= 7)`)}&maxRecords=5&sort[0][field]=Rank&sort[0][direction]=desc&fields[]=FULL NAME&fields[]=company name&fields[]=City&fields[]=Rank&fields[]=score_reason`) as { records: Array<{ fields: Record<string, unknown> }> };
    return {
      project, pipeline: counts,
      topLeads: top.records.map(r => ({ name: r.fields["FULL NAME"], company: r.fields["company name"], city: r.fields["City"], rank: r.fields["Rank"], reason: r.fields["score_reason"] })),
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolGetEmailAnalytics(days = 30) {
  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) return { error: "BREVO_API_KEY not configured" };
  const end = new Date().toISOString().split("T")[0];
  const start = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  try {
    const res = await fetch(`${BREVO_API}/smtp/statistics/aggregatedReport?startDate=${start}&endDate=${end}`, { headers: { "api-key": key } });
    if (!res.ok) return { error: `Brevo ${res.status}` };
    return { period: `${start} → ${end}`, stats: await res.json() };
  } catch (err) { return { error: String(err) }; }
}

async function toolGetRecentSent(project: string, limit = 10) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  const cap = Math.min(limit, 25);
  try {
    const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{EMAIL STATUS} = "Sent"`)}&maxRecords=${cap}&sort[0][field]=DATE_SENT&sort[0][direction]=desc&fields[]=FULL NAME&fields[]=company name&fields[]=City&fields[]=EMAIL_SUBJECT&fields[]=DATE_SENT&fields[]=Rank`) as { records: Array<{ fields: Record<string, unknown> }> };
    return {
      project, count: data.records.length,
      sent: data.records.map(r => ({ company: r.fields["company name"], city: r.fields["City"], subject: r.fields["EMAIL_SUBJECT"], date: r.fields["DATE_SENT"], rank: r.fields["Rank"] })),
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolSearchLeads(project: string, query: string, limit = 10) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  const safe = query.replace(/"/g, "");
  const f = `OR(FIND(LOWER("${safe}"),LOWER({company name}))>0,FIND(LOWER("${safe}"),LOWER({FULL NAME}))>0,FIND(LOWER("${safe}"),LOWER({City}))>0,FIND(LOWER("${safe}"),LOWER({EMAIL}))>0)`;
  try {
    const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(f)}&maxRecords=${Math.min(limit, 20)}`) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
    return {
      query, count: data.records.length,
      leads: data.records.map(r => ({ id: r.id, company: r.fields["company name"], name: r.fields["FULL NAME"], email: r.fields["EMAIL"], city: r.fields["City"], rank: r.fields["Rank"], status: r.fields["EMAIL STATUS"], leadStatus: r.fields["lead_status"], scoreReason: r.fields["score_reason"] })),
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolPreviewCampaign(project: string, leadLimit = 5) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/campaign/preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project, leadLimit: Math.min(leadLimit, 20) }) });
    const data = await res.json() as { ok?: boolean; previews?: Array<{ lead: { company: string; city: string; rank: string | number }; subject: string }>; error?: string };
    if (!data.ok) return { error: data.error ?? "Preview failed" };
    return { count: data.previews?.length ?? 0, previews: data.previews?.map(p => ({ company: p.lead.company, city: p.lead.city, rank: p.lead.rank, subject: p.subject })) };
  } catch (err) { return { error: String(err) }; }
}

async function toolLaunchCampaign(project: string, leadLimit = 10) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/campaign/launch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project, leadLimit: Math.min(leadLimit, 50) }) });
    const data = await res.json() as { ok?: boolean; sent?: number; failed?: number; skipped?: number; errors?: string[]; error?: string };
    if (!data.ok) return { error: data.error ?? "Launch failed" };
    return { sent: data.sent, failed: data.failed, skipped: data.skipped, errors: data.errors?.slice(0, 3) };
  } catch (err) { return { error: String(err) }; }
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "get_leads_stats": return toolGetLeadsStats(String(args.project ?? "kronos"));
    case "get_email_analytics": return toolGetEmailAnalytics(Number(args.days ?? 30));
    case "get_recent_sent": return toolGetRecentSent(String(args.project ?? "kronos"), Number(args.limit ?? 10));
    case "search_leads": return toolSearchLeads(String(args.project ?? "kronos"), String(args.query ?? ""), Number(args.limit ?? 10));
    case "preview_campaign": return toolPreviewCampaign(String(args.project ?? "kronos"), Number(args.leadLimit ?? 5));
    case "launch_campaign": return toolLaunchCampaign(String(args.project ?? "kronos"), Number(args.leadLimit ?? 10));
    default: return { error: `Unknown tool: ${name}` };
  }
}

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });

  const body = await req.json() as { messages: Array<{ role: string; content: string }>; project?: string };
  const project = body.project ?? "kronos";

  let msgs: unknown[] = [
    { role: "system", content: SYSTEM_PROMPT + `\n\nCurrent context: project="${project}". Default to this project for tool calls unless user specifies otherwise.` },
    ...body.messages,
  ];

  for (let round = 0; round < 5; round++) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kronos-outreach.vercel.app",
        "X-Title": "KRONOS Agent Otto",
      },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", messages: msgs, tools: TOOLS, tool_choice: "auto", temperature: 0.3 }),
    });

    if (!res.ok) return NextResponse.json({ error: `OpenRouter: ${await res.text()}` }, { status: 500 });

    const data = await res.json() as {
      choices: Array<{ message: { role: string; content: string | null; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> } }>;
    };
    const msg = data.choices[0].message;

    if (!msg.tool_calls?.length) {
      return NextResponse.json({ content: msg.content, role: "assistant" });
    }

    msgs.push({ role: "assistant", content: msg.content, tool_calls: msg.tool_calls });

    const results = await Promise.all(
      msg.tool_calls.map(async (tc) => {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(tc.function.arguments); } catch { /**/ }
        const result = await executeTool(tc.function.name, args);
        return { role: "tool", tool_call_id: tc.id, name: tc.function.name, content: JSON.stringify(result) };
      })
    );
    msgs = [...msgs, ...results];
  }

  return NextResponse.json({ content: "Reached tool call limit — please rephrase.", role: "assistant" });
}
