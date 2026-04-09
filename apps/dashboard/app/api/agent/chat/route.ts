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

LEAD INTELLIGENCE:
- get_leads_stats: Live lead counts and pipeline state
- get_lead_detail: Full profile for a specific lead — all fields, history, tech stack, LinkedIn
- search_leads: Find leads by name, company, city, or email
- get_leads_by_filter: Advanced filter by rank range, city, category, status, or lead priority

LEAD MANAGEMENT:
- update_lead: Update a lead's Rank, lead_status, or EMAIL STATUS in Airtable
- retry_failed_leads: Reset all Failed leads back to Pending for retry

EMAIL ANALYTICS:
- get_email_analytics: Brevo delivery, open, click, bounce stats (aggregated)
- get_email_events: Detailed Brevo events — individual opens, clicks, bounces, spam reports
- get_recent_sent: Last N emails sent with subjects, companies, dates
- get_brevo_account: Brevo plan, daily send quota, credits remaining

CAMPAIGN OPERATIONS:
- preview_campaign: Generate email previews for N leads (does NOT send)
- launch_campaign: Actually send emails to N leads (REQUIRES explicit user confirmation)

Rules — non-negotiable:
1. NEVER invent stats, lead counts, email rates, or any numbers. If a tool fails, say so.
2. NEVER launch a campaign without the user explicitly saying "yes, launch" or "confirm send".
3. NEVER update a lead's status without confirming the record ID and change with the user.
4. When showing lead data, show real field values — no placeholders.
5. Be concise. Operators are busy. Lead with the answer.
6. If you don't have a piece of data, say which tool would fetch it and offer to run it.
7. Airtable schema: EMAIL STATUS (Sent / Processing / Failed / Pending), Rank (1-10), lead_status (priority/medium/low), City, URL, Category, company name, FULL NAME, EMAIL, score_reason.

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
      name: "get_lead_detail",
      description: "Get full profile for a specific lead — all fields including tech, LinkedIn, revenue, score reason, email history.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          identifier: { type: "string", description: "Company name, email address, or Airtable record ID (rec...)" },
        },
        required: ["project", "identifier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_email_analytics",
      description: "Get aggregated Brevo email stats: sent count, open rate, click rate, bounce rate for a time period.",
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
      name: "get_email_events",
      description: "Get detailed Brevo email events: individual opens, clicks, bounces, spam reports. Use to investigate delivery issues.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Days to look back (default 7)" },
          event: { type: "string", description: "Filter by event type: opened, clicks, softBounces, hardBounces, spam, unsubscribed" },
          limit: { type: "number", description: "Max events to return (default 20, max 100)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_sent",
      description: "Fetch recently sent emails from Airtable: subject, company, city, date sent.",
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
      name: "get_leads_by_filter",
      description: "Fetch leads with advanced filters: rank range, city, category, email status, lead priority. Returns sorted by rank.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          min_rank: { type: "number", description: "Minimum rank (0-10)" },
          max_rank: { type: "number", description: "Maximum rank (0-10)" },
          email_status: { type: "string", description: "Filter by EMAIL STATUS: Sent, Failed, Pending, Processing" },
          lead_status: { type: "string", description: "Filter by lead priority: priority, medium, low" },
          city: { type: "string", description: "Filter by city (partial match)" },
          category: { type: "string", description: "Filter by category (partial match)" },
          limit: { type: "number", description: "Max results (default 15, max 50)" },
        },
        required: ["project"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_lead",
      description: "Update a lead record in Airtable. Can change Rank, lead_status, or reset EMAIL STATUS. Requires record ID.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          record_id: { type: "string", description: "Airtable record ID (starts with rec)" },
          rank: { type: "number", description: "New rank value (0-10)" },
          lead_status: { type: "string", enum: ["priority", "medium", "low"], description: "New lead priority" },
          email_status: { type: "string", description: "New EMAIL STATUS — use 'Pending' to reset for retry" },
        },
        required: ["project", "record_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "retry_failed_leads",
      description: "Reset all Failed leads back to Pending so they can be retried in the next campaign run.",
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
      name: "get_brevo_account",
      description: "Get Brevo account info: plan, daily send limit, credits remaining, sender addresses.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

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
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

async function airtablePatch(url: string, body: unknown) {
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Airtable PATCH ${res.status}: ${await res.text()}`);
  return res.json();
}

function mapAllFields(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;
  return {
    id: record.id,
    name: f["FULL NAME"],
    email: f["EMAIL"],
    company: f["company name"],
    city: f["City"],
    url: f["URL"],
    rank: f["Rank"],
    score_reason: f["score_reason"],
    lead_status: f["lead_status"],
    email_status: f["EMAIL STATUS"],
    email_subject: f["EMAIL_SUBJECT"],
    date_sent: f["DATE_SENT"],
    category: f["Category"],
    technology: f["TECHNOLOGY"],
    linkedin: f["LINKEDIN"],
    revenue: f["REVENUE"],
    phone: f["Phone"],
    postal_code: f["Postal code"],
    company_size: f["COMPANY SIZE"],
    company_description: f["COMPANY DESCRIPTION"],
    sector: f["SECTOR"],
    keywords: f["KEYWORDS"],
    address: f["Address"],
    instagram: f["INSTAGRAM"],
    job_title: f["JOB TITLE"],
    headline: f["HEADLINE"],
  };
}

// ─── TOOL IMPLEMENTATIONS ────────────────────────────────────────────────────

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
    const top = await airtableGet(
      `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`AND({EMAIL} != "", {EMAIL STATUS} != "Sent", {Rank} >= 7)`)}&maxRecords=5&sort[0][field]=Rank&sort[0][direction]=desc&fields[]=FULL NAME&fields[]=company name&fields[]=City&fields[]=Rank&fields[]=score_reason`
    ) as { records: Array<{ fields: Record<string, unknown> }> };
    return {
      project, pipeline: counts,
      topLeads: top.records.map(r => ({
        name: r.fields["FULL NAME"],
        company: r.fields["company name"],
        city: r.fields["City"],
        rank: r.fields["Rank"],
        reason: r.fields["score_reason"],
      })),
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolGetLeadDetail(project: string, identifier: string) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  try {
    // Direct record ID lookup
    if (identifier.startsWith("rec")) {
      const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}/${identifier}`) as { id: string; fields: Record<string, unknown> };
      return { lead: mapAllFields(data) };
    }
    // Search by company or email
    const safe = identifier.replace(/"/g, "");
    const f = `OR(FIND(LOWER("${safe}"),LOWER({company name}))>0,FIND(LOWER("${safe}"),LOWER({EMAIL}))>0,FIND(LOWER("${safe}"),LOWER({FULL NAME}))>0)`;
    const data = await airtableGet(
      `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(f)}&maxRecords=5`
    ) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
    if (!data.records?.length) return { error: `No lead found matching "${identifier}"` };
    return { count: data.records.length, leads: data.records.map(r => mapAllFields(r)) };
  } catch (err) { return { error: String(err) }; }
}

async function toolGetEmailAnalytics(days = 30) {
  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) return { error: "BREVO_API_KEY not configured" };
  const end = new Date().toISOString().split("T")[0];
  const start = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  try {
    const res = await fetch(`${BREVO_API}/smtp/statistics/aggregatedReport?startDate=${start}&endDate=${end}`, {
      headers: { "api-key": key },
    });
    if (!res.ok) return { error: `Brevo ${res.status}` };
    return { period: `${start} → ${end}`, stats: await res.json() };
  } catch (err) { return { error: String(err) }; }
}

async function toolGetEmailEvents(days = 7, event?: string, limit = 20) {
  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) return { error: "BREVO_API_KEY not configured" };
  const end = new Date().toISOString().split("T")[0];
  const start = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const cap = Math.min(limit, 100);
  let url = `${BREVO_API}/smtp/statistics/events?startDate=${start}&endDate=${end}&limit=${cap}`;
  if (event) url += `&event=${encodeURIComponent(event)}`;
  try {
    const res = await fetch(url, { headers: { "api-key": key } });
    if (!res.ok) return { error: `Brevo ${res.status}: ${await res.text()}` };
    const data = await res.json() as { events?: unknown[] };
    return {
      period: `${start} → ${end}`,
      event_filter: event ?? "all",
      count: Array.isArray(data.events) ? data.events.length : 0,
      events: data,
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolGetRecentSent(project: string, limit = 10) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  const cap = Math.min(limit, 25);
  try {
    const data = await airtableGet(
      `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{EMAIL STATUS} = "Sent"`)}&maxRecords=${cap}&sort[0][field]=DATE_SENT&sort[0][direction]=desc&fields[]=FULL NAME&fields[]=company name&fields[]=City&fields[]=EMAIL_SUBJECT&fields[]=DATE_SENT&fields[]=Rank`
    ) as { records: Array<{ fields: Record<string, unknown> }> };
    return {
      project, count: data.records.length,
      sent: data.records.map(r => ({
        company: r.fields["company name"],
        city: r.fields["City"],
        subject: r.fields["EMAIL_SUBJECT"],
        date: r.fields["DATE_SENT"],
        rank: r.fields["Rank"],
      })),
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolSearchLeads(project: string, query: string, limit = 10) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  const safe = query.replace(/"/g, "");
  const f = `OR(FIND(LOWER("${safe}"),LOWER({company name}))>0,FIND(LOWER("${safe}"),LOWER({FULL NAME}))>0,FIND(LOWER("${safe}"),LOWER({City}))>0,FIND(LOWER("${safe}"),LOWER({EMAIL}))>0)`;
  try {
    const data = await airtableGet(
      `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(f)}&maxRecords=${Math.min(limit, 20)}`
    ) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
    return {
      query, count: data.records.length,
      leads: data.records.map(r => ({
        id: r.id,
        company: r.fields["company name"],
        name: r.fields["FULL NAME"],
        email: r.fields["EMAIL"],
        city: r.fields["City"],
        rank: r.fields["Rank"],
        status: r.fields["EMAIL STATUS"],
        lead_status: r.fields["lead_status"],
        score_reason: r.fields["score_reason"],
        category: r.fields["Category"],
        technology: r.fields["TECHNOLOGY"],
        linkedin: r.fields["LINKEDIN"],
      })),
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolGetLeadsByFilter(project: string, args: {
  min_rank?: number;
  max_rank?: number;
  email_status?: string;
  lead_status?: string;
  city?: string;
  category?: string;
  limit?: number;
}) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };

  const conditions: string[] = [];
  if (args.min_rank !== undefined) conditions.push(`{Rank} >= ${args.min_rank}`);
  if (args.max_rank !== undefined) conditions.push(`{Rank} <= ${args.max_rank}`);
  if (args.email_status) conditions.push(`{EMAIL STATUS} = "${args.email_status}"`);
  if (args.lead_status) conditions.push(`{lead_status} = "${args.lead_status}"`);
  if (args.city) conditions.push(`FIND(LOWER("${args.city.replace(/"/g, "")}"),LOWER({City}))>0`);
  if (args.category) conditions.push(`FIND(LOWER("${args.category.replace(/"/g, "")}"),LOWER({Category}))>0`);

  const formula = conditions.length > 1
    ? `AND(${conditions.join(",")})`
    : conditions[0] || `{EMAIL} != ""`;
  const limit = Math.min(args.limit ?? 15, 50);

  try {
    const data = await airtableGet(
      `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=${limit}&sort[0][field]=Rank&sort[0][direction]=desc`
    ) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
    return {
      count: data.records.length,
      filter: args,
      leads: data.records.map(r => ({
        id: r.id,
        company: r.fields["company name"],
        name: r.fields["FULL NAME"],
        email: r.fields["EMAIL"],
        city: r.fields["City"],
        rank: r.fields["Rank"],
        email_status: r.fields["EMAIL STATUS"],
        lead_status: r.fields["lead_status"],
        category: r.fields["Category"],
        score_reason: r.fields["score_reason"],
        technology: r.fields["TECHNOLOGY"],
      })),
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolUpdateLead(project: string, recordId: string, args: {
  rank?: number;
  lead_status?: string;
  email_status?: string;
}) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  if (!recordId.startsWith("rec")) return { error: "record_id must be an Airtable record ID starting with 'rec'" };

  const fields: Record<string, unknown> = {};
  if (args.rank !== undefined) fields["Rank"] = args.rank;
  if (args.lead_status) fields["lead_status"] = args.lead_status;
  if (args.email_status) fields["EMAIL STATUS"] = args.email_status;

  if (Object.keys(fields).length === 0) {
    return { error: "No fields to update. Provide at least one of: rank, lead_status, email_status" };
  }

  try {
    const data = await airtablePatch(`${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`, { fields }) as { id: string; fields: Record<string, unknown> };
    return { success: true, updated_fields: fields, record: mapAllFields(data) };
  } catch (err) { return { error: String(err) }; }
}

async function toolRetryFailedLeads(project: string) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  try {
    // "Failed " has a trailing space per Airtable choice values
    const data = await airtableGet(
      `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{EMAIL STATUS} = "Failed "`)}&fields[]=EMAIL&fields[]=company name`
    ) as { records: Array<{ id: string; fields: Record<string, unknown> }> };

    if (!data.records?.length) return { message: "No failed leads to retry", reset: 0 };

    const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
    const BATCH = 10;
    let reset = 0;

    for (let i = 0; i < data.records.length; i += BATCH) {
      const batch = data.records.slice(i, i + BATCH);
      const res = await fetch(`${AIRTABLE_API}/${baseId}/${tableId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          records: batch.map(r => ({ id: r.id, fields: { "EMAIL STATUS": "Pending" } })),
        }),
      });
      if (res.ok) reset += batch.length;
    }

    return {
      success: true,
      reset,
      total_found: data.records.length,
      companies: data.records.slice(0, 10).map(r => r.fields["company name"]),
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolGetBrevoAccount() {
  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) return { error: "BREVO_API_KEY not configured" };
  try {
    const res = await fetch(`${BREVO_API}/account`, { headers: { "api-key": key } });
    if (!res.ok) return { error: `Brevo ${res.status}` };
    return await res.json();
  } catch (err) { return { error: String(err) }; }
}

async function toolPreviewCampaign(project: string, leadLimit = 5) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/campaign/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, leadLimit: Math.min(leadLimit, 20) }),
    });
    const data = await res.json() as { ok?: boolean; previews?: Array<{ lead: { company: string; city: string; rank: string | number }; subject: string }>; error?: string };
    if (!data.ok) return { error: data.error ?? "Preview failed" };
    return {
      count: data.previews?.length ?? 0,
      previews: data.previews?.map(p => ({ company: p.lead.company, city: p.lead.city, rank: p.lead.rank, subject: p.subject })),
    };
  } catch (err) { return { error: String(err) }; }
}

async function toolLaunchCampaign(project: string, leadLimit = 10) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/campaign/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, leadLimit: Math.min(leadLimit, 50) }),
    });
    const data = await res.json() as { ok?: boolean; sent?: number; failed?: number; skipped?: number; errors?: string[]; error?: string };
    if (!data.ok) return { error: data.error ?? "Launch failed" };
    return { sent: data.sent, failed: data.failed, skipped: data.skipped, errors: data.errors?.slice(0, 3) };
  } catch (err) { return { error: String(err) }; }
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "get_leads_stats":
      return toolGetLeadsStats(String(args.project ?? "kronos"));
    case "get_lead_detail":
      return toolGetLeadDetail(String(args.project ?? "kronos"), String(args.identifier ?? ""));
    case "get_email_analytics":
      return toolGetEmailAnalytics(Number(args.days ?? 30));
    case "get_email_events":
      return toolGetEmailEvents(Number(args.days ?? 7), args.event ? String(args.event) : undefined, Number(args.limit ?? 20));
    case "get_recent_sent":
      return toolGetRecentSent(String(args.project ?? "kronos"), Number(args.limit ?? 10));
    case "search_leads":
      return toolSearchLeads(String(args.project ?? "kronos"), String(args.query ?? ""), Number(args.limit ?? 10));
    case "get_leads_by_filter":
      return toolGetLeadsByFilter(String(args.project ?? "kronos"), {
        min_rank: args.min_rank !== undefined ? Number(args.min_rank) : undefined,
        max_rank: args.max_rank !== undefined ? Number(args.max_rank) : undefined,
        email_status: args.email_status ? String(args.email_status) : undefined,
        lead_status: args.lead_status ? String(args.lead_status) : undefined,
        city: args.city ? String(args.city) : undefined,
        category: args.category ? String(args.category) : undefined,
        limit: args.limit !== undefined ? Number(args.limit) : undefined,
      });
    case "update_lead":
      return toolUpdateLead(String(args.project ?? "kronos"), String(args.record_id ?? ""), {
        rank: args.rank !== undefined ? Number(args.rank) : undefined,
        lead_status: args.lead_status ? String(args.lead_status) : undefined,
        email_status: args.email_status ? String(args.email_status) : undefined,
      });
    case "retry_failed_leads":
      return toolRetryFailedLeads(String(args.project ?? "kronos"));
    case "get_brevo_account":
      return toolGetBrevoAccount();
    case "preview_campaign":
      return toolPreviewCampaign(String(args.project ?? "kronos"), Number(args.leadLimit ?? 5));
    case "launch_campaign":
      return toolLaunchCampaign(String(args.project ?? "kronos"), Number(args.leadLimit ?? 10));
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json() as { messages: Array<{ role: string; content: string }>; project?: string };
  const project = body.project ?? "kronos";

  let msgs: unknown[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT + `\n\nCurrent context: project="${project}". Default to this project for tool calls unless user specifies otherwise.`,
    },
    ...body.messages,
  ];

  for (let round = 0; round < 8; round++) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kronos-outreach.vercel.app",
        "X-Title": "KRONOS Agent Otto",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: msgs,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `OpenRouter: ${await res.text()}` }, { status: 500 });
    }

    const data = await res.json() as {
      choices: Array<{
        message: {
          role: string;
          content: string | null;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
      }>;
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

  return NextResponse.json({ content: "Reached reasoning limit — please rephrase or break into smaller steps.", role: "assistant" });
}
