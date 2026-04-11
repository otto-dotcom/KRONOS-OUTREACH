import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";
import * as fs from "fs/promises";
import * as path from "path";

export const runtime = "nodejs";
export const maxDuration = 120;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AIRTABLE_API = "https://api.airtable.com/v0";
const BREVO_API = "https://api.brevo.com/v3";

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are JARVIS — the unified Operational Intelligence Layer for KRONOS and HELIOS, managed by Otto.

━━━ IDENTITY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DIRECTIVE: "Turn infinite ideas into executable systems."
You are Otto's second brain. You don't just retrieve data — you interpret it, surface the next action, and execute it when authorised.
You have full read/write access to Airtable (both projects) and Brevo (email platform).

━━━ PROJECTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KRONOS | Swiss Real Estate | .ch domains | orange brand | otto@kronosbusiness.com
  Airtable base: appLriEwWldpPTMPg  table: tblLZkFo7Th7uyfWB
  Lead fields: EMAIL STATUS (singleSelect: Sent/Processing/Failed/pending),
    Rank (1-10), lead_status (singleSelect: priority/medium/low),
    City, URL, Category, company name, FULL NAME, EMAIL,
    score_reason, SENT MAIL, EMAIL_SUBJECT, SMS STATUS.

HELIOS | Italian Solar Energy | Solar installers | green brand | otto@heliosbusiness.it
  Airtable base: appyqUHfwK33eisQu  table: tbl07Ub0WeVHOnujP
  Lead fields: EMAIL STATUS (text: Sent/Processing), Rank (1-10),
    lead_status (text), City, URL, Category, company name, FULL NAME,
    EMAIL, Phone, score_reason, SENT MAIL, EMAIL_SUBJECT, CALL STATUS.

CRITICAL: singleSelect values are case-sensitive. Never cross project data streams.

━━━ NON-NEGOTIABLE RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NEVER invent data. Call the tool or say you can't.
2. NEVER call launch_campaign or brevo_send_transactional without explicit "yes, send" / "confirm" from Otto.
3. NEVER mix project data — every tool call must be scoped to the active project.
4. STOP / ABORT / DO NOT SEND → halt all pending tool calls immediately.
5. Cross-check Airtable status with Brevo events before reporting analytics.

━━━ TOOL CATALOGUE (22 tools) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PIPELINE INTELLIGENCE
**get_leads_stats** (project)
  → Live pipeline snapshot: total leads, sent, ready-to-send, priority, failed.
  → Returns top 5 highest-ranked unsent leads with score reasons.
  → Use this first whenever Otto asks "what's the status" or "how many leads".

**get_recent_sent** (project, limit?)
  → Last N emails sent: company, city, subject, rank.
  → Use when Otto asks "what did we send?" or wants a sent history overview.

**search_leads** (project, query, limit?)
  → Fuzzy search across company name, full name, city, email.
  → Returns full lead profile: rank, status, score reason, email status.
  → Use when Otto mentions a specific company or person by name.

**airtable_list_records** (project, filter?, sort_field?, sort_dir?, fields?, limit?)
  → Raw Airtable query with full formula filter and sort control.
  → filter: Airtable formula string e.g. "AND({Rank} >= 8, {EMAIL STATUS} != 'Sent')"
  → Use for custom queries that search_leads or get_leads_stats don't cover.
  → Example: list all Zürich leads, list all bounced, list by category.

**airtable_update_lead** (project, record_id, fields)
  → Update any field on a specific lead record by its Airtable record ID (rec...).
  → fields: object of field name → new value e.g. {"lead_status": "priority", "Rank": 9}
  → Use when Otto says "mark this as priority", "update the rank", "flag this lead".
  → CRITICAL: singleSelect values must match exact case.

**airtable_create_lead** (project, fields)
  → Create a new lead record in Airtable.
  → fields: object with at minimum "company name" and "EMAIL".
  → Use when Otto wants to manually add a lead.

## EMAIL ANALYTICS (BREVO)
**get_email_analytics** (days?)
  → Aggregated Brevo stats: delivered, opens, clicks, bounces, open rate, click rate.
  → Covers the last N days (default 30). Use for high-level performance overview.

**get_brevo_logs** (email?, tag?)
  → Raw SMTP event log: delivered/opened/clicked/bounced events per email address or tag.
  → tag: "KRONOS_OUTREACH" or "HELIOS_OUTREACH"
  → Use when Otto asks why an email wasn't delivered or who specifically opened/clicked.

**get_database_engagement** (project)
  → Cross-references Airtable sent records with Brevo engagement data.
  → Returns top 10 leads who opened or clicked with timestamps.

**brevo_get_contact** (email)
  → Full Brevo contact profile: lists, attributes, open/click stats, blacklist status.
  → Use when Otto asks about a specific person's email history or status.

**brevo_list_contacts** (limit?, offset?, list_id?)
  → List all Brevo contacts with pagination. Optionally filter by list.
  → Use when Otto wants to review the contact database or a specific list.

**brevo_get_campaigns** (limit?, type?)
  → List all email campaigns: name, subject, sent count, open rate, status.
  → type: "classic" (default) or "trigger"
  → Use for a campaign history overview.

**brevo_get_campaign_report** (campaign_id)
  → Full stats for a single campaign: global stats + top clicked links + device breakdown.
  → Use when Otto asks for deep-dive on a specific campaign's performance.

**brevo_get_smtp_events** (email?, limit?, start_date?, end_date?)
  → Per-address SMTP event timeline: delivered, opened, clicked, bounced with exact timestamps.
  → Use for debugging delivery issues or tracking a specific lead's engagement journey.

**brevo_send_transactional** (to_email, to_name, subject, html_content, project?)
  → Send a single transactional email immediately via Brevo.
  → REQUIRES explicit Otto confirmation before calling.
  → Use for one-off emails, test sends, or re-engagement of a specific lead.

## CAMPAIGN OPS
**preview_campaign** (project, leadLimit?)
  → Generate AI email copy previews for N unsent leads — DOES NOT SEND.
  → Returns subject lines and preview text per lead.
  → Always run this before launch_campaign so Otto can review.

**launch_campaign** (project, leadLimit?)
  → Send emails to N leads. IRREVERSIBLE. Only call after explicit Otto confirmation.
  → Default 10 leads, max 50.

**update_email_prompt** (project, prompt)
  → Replace the AI email system prompt stored in Airtable Settings.
  → Changes instantly affect all future email generation.

**update_sms_prompt** (project, prompt)
  → Replace the AI SMS system prompt stored in Airtable Settings.

**send_sms** (project, to, body)
  → Send a single SMS via Twilio to a phone number in E.164 format (+41...).

## MEMORY & SYSTEM
**save_to_memory** (project, company, subject, body, notes?)
  → Save high-performing email copy to Obsidian vault as a Markdown file.
  → Use when Otto says "save this", "remember this copy", or after a strong open/click result.

**read_logs** (limit?)
  → Summary of recent system operations and tool call audit trail.

━━━ UI RENDERING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALWAYS render data using UI cards — never just dump raw JSON as text.
Multiple blocks are allowed in one response. Mix cards and markdown freely.

Lead card (for individual leads):
\`\`\`ui-lead
{"name":"Luca Ferrari","company":"Immobiliare Rossi","email":"luca@rossi.ch","city":"Zürich","rank":9,"id":"recXXX","status":"priority","opened":true,"clicked":false}
\`\`\`

Analytics card (for aggregate stats):
\`\`\`ui-analytics
{"sent":100,"opens":50,"clicks":10,"bounced":2,"openRate":50,"clickRate":10,"period":"last 30d"}
\`\`\`

Status card (for confirmations, errors, warnings):
\`\`\`ui-status
{"title":"Campaign Launched","status":"ok","message":"12 emails sent to KRONOS leads."}
\`\`\`

Table card (for lists of records, contacts, campaigns):
\`\`\`ui-table
{"columns":["Company","City","Rank","Status"],"rows":[["Immo AG","Zürich",9,"priority"],["Solar SRL","Milano",7,"medium"]]}
\`\`\`

Contact card (for Brevo contacts):
\`\`\`ui-contact
{"email":"luca@rossi.ch","name":"Luca Ferrari","opens":5,"clicks":2,"blacklisted":false,"lists":["KRONOS"],"lastActivity":"2026-04-10"}
\`\`\`

Campaign card (for Brevo campaign reports):
\`\`\`ui-campaign
{"name":"KRONOS April 2026","sent":87,"delivered":85,"opens":42,"clicks":11,"bounced":2,"openRate":48.8,"clickRate":12.6,"status":"sent"}
\`\`\`

━━━ THINKING MODEL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before every response (internal):
1. INTENT: What does Otto actually want? (underlying goal, not literal words)
2. DATA NEEDED: Which tools return that data, in what order?
3. RENDER: How should results be visualised? (which card types)
4. NEXT ACTION: What should Otto do next?

End every substantive response with a bold **→ Next action:** recommendation.

TONE: Executive. Direct. Lead with the answer. Numbers as 1,234. No filler.`;

// ─── TOOL DEFINITIONS ──────────────────────────────────────────────────────────

const TOOLS = [
  // ── Pipeline Intelligence ──────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_leads_stats",
      description: "Live pipeline snapshot from Airtable: total, sent, ready-to-send, priority, failed. Also returns top 5 highest-ranked unsent leads.",
      parameters: {
        type: "object",
        properties: { project: { type: "string", enum: ["kronos", "helios"] } },
        required: ["project"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_sent",
      description: "Last N sent emails from Airtable: company, city, email subject, rank.",
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
      description: "Search Airtable leads by company name, full name, city, or email. Returns full profile.",
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
      name: "airtable_list_records",
      description: "Flexible Airtable query with formula filter and sort. Use for custom queries: all Zürich leads, all bounced, by category, etc.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          filter: { type: "string", description: "Airtable formula e.g. \"AND({Rank} >= 8, {EMAIL STATUS} != 'Sent')\"" },
          sort_field: { type: "string", description: "Field name to sort by e.g. Rank" },
          sort_dir: { type: "string", enum: ["asc", "desc"], description: "Sort direction (default desc)" },
          fields: { type: "array", items: { type: "string" }, description: "Field names to return" },
          limit: { type: "number", description: "Max records (default 20, max 100)" },
        },
        required: ["project"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "airtable_update_lead",
      description: "Update any fields on a lead record by its Airtable record ID. Use to update rank, status, notes etc.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          record_id: { type: "string", description: "Airtable record ID starting with 'rec'" },
          fields: { type: "object", description: "Fields to update e.g. {\"lead_status\": \"priority\", \"Rank\": 9}", additionalProperties: true },
        },
        required: ["project", "record_id", "fields"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "airtable_create_lead",
      description: "Create a new lead record in Airtable. Requires at minimum company name and EMAIL.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          fields: { type: "object", description: "Lead fields e.g. {\"company name\": \"Immo AG\", \"EMAIL\": \"info@immo.ch\", \"City\": \"Zürich\", \"Rank\": 7}", additionalProperties: true },
        },
        required: ["project", "fields"],
      },
    },
  },

  // ── Email Analytics (Brevo) ────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_email_analytics",
      description: "Aggregated Brevo stats: delivered, opens, clicks, bounces, open rate, click rate. Last N days.",
      parameters: {
        type: "object",
        properties: { days: { type: "number", description: "Days to look back (default 30)" } },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_brevo_logs",
      description: "Raw Brevo SMTP events: delivered/opened/clicked/bounced per email address or campaign tag.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Specific email address to check" },
          tag: { type: "string", description: "e.g. KRONOS_OUTREACH or HELIOS_OUTREACH" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_database_engagement",
      description: "Cross-reference Airtable sent records with Brevo engagement. Returns top 10 leads who opened or clicked.",
      parameters: {
        type: "object",
        properties: { project: { type: "string", enum: ["kronos", "helios"] } },
        required: ["project"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "brevo_get_contact",
      description: "Full Brevo contact profile for one email: lists, attributes, stats, blacklist status.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Contact email address" },
        },
        required: ["email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "brevo_list_contacts",
      description: "List Brevo contacts with pagination. Optionally filter by list ID.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Contacts per page (default 25, max 50)" },
          offset: { type: "number", description: "Pagination offset" },
          list_id: { type: "number", description: "Filter by Brevo list ID" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "brevo_get_campaigns",
      description: "List all Brevo email campaigns: name, subject, sent count, open rate, status.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of campaigns to return (default 10)" },
          type: { type: "string", enum: ["classic", "trigger"], description: "Campaign type (default classic)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "brevo_get_campaign_report",
      description: "Full stats for a single Brevo campaign: opens, clicks, bounces, unsubscribes, top links.",
      parameters: {
        type: "object",
        properties: {
          campaign_id: { type: "number", description: "Brevo campaign ID" },
        },
        required: ["campaign_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "brevo_get_smtp_events",
      description: "Per-address SMTP event timeline with exact timestamps: delivered, opened, clicked, bounced.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Filter by email address" },
          limit: { type: "number", description: "Number of events (default 50, max 100)" },
          start_date: { type: "string", description: "Start date YYYY-MM-DD" },
          end_date: { type: "string", description: "End date YYYY-MM-DD" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "brevo_send_transactional",
      description: "Send a single transactional email immediately via Brevo. REQUIRES explicit Otto confirmation.",
      parameters: {
        type: "object",
        properties: {
          to_email: { type: "string" },
          to_name: { type: "string" },
          subject: { type: "string" },
          html_content: { type: "string", description: "Full HTML email body" },
          project: { type: "string", enum: ["kronos", "helios"], description: "Determines sender identity" },
        },
        required: ["to_email", "to_name", "subject", "html_content"],
      },
    },
  },

  // ── Campaign Ops ───────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "preview_campaign",
      description: "Generate AI email previews for N unsent leads — DOES NOT SEND. Always run before launch_campaign.",
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
      description: "Send emails to N leads. IRREVERSIBLE. Only call after explicit Otto confirmation ('yes send', 'confirm', 'launch').",
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
  {
    type: "function",
    function: {
      name: "update_email_prompt",
      description: "Replace the AI email system prompt in Airtable Settings. Changes affect all future email generation immediately.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          prompt: { type: "string", description: "Full new email system prompt" },
        },
        required: ["project", "prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_sms_prompt",
      description: "Replace the AI SMS system prompt in Airtable Settings.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          prompt: { type: "string" },
        },
        required: ["project", "prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_sms",
      description: "Send a single SMS via Twilio to a phone number in E.164 format.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "E.164 phone number e.g. +41791234567" },
          body: { type: "string", description: "SMS body (max 160 chars)" },
          project: { type: "string", enum: ["kronos", "helios"] },
        },
        required: ["to", "body", "project"],
      },
    },
  },

  // ── Memory & System ────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "save_to_memory",
      description: "Save high-performing email copy to Obsidian vault as Markdown for future few-shot learning.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          company: { type: "string" },
          subject: { type: "string" },
          body: { type: "string", description: "HTML email body" },
          notes: { type: "string", description: "Why this copy was flagged as high-performing" },
        },
        required: ["project", "company", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_logs",
      description: "Summary of recent system operations and tool call audit trail.",
      parameters: {
        type: "object",
        properties: { limit: { type: "number", description: "Log entries to return (default 20)" } },
        required: [],
      },
    },
  },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function airtableIds(project: string) {
  if (project === "helios") {
    return {
      baseId: process.env.HELIOS_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID || "",
      tableId: process.env.HELIOS_AIRTABLE_TABLE_ID || process.env.AIRTABLE_TABLE_ID || "",
    };
  }
  return {
    baseId: process.env.AIRTABLE_BASE_ID || "",
    tableId: process.env.AIRTABLE_TABLE_ID || "",
  };
}

async function airtableGet(url: string) {
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

async function airtablePatch(url: string, body: unknown) {
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Airtable PATCH ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

async function airtablePost(url: string, body: unknown) {
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Airtable POST ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

async function brevoGet(path: string) {
  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) throw new Error("BREVO_API_KEY not configured");
  const res = await fetch(`${BREVO_API}${path}`, { headers: { "api-key": key, "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

async function brevoPost(path: string, body: unknown) {
  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) throw new Error("BREVO_API_KEY not configured");
  const res = await fetch(`${BREVO_API}${path}`, {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Brevo POST ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

// ─── TOOL IMPLEMENTATIONS ──────────────────────────────────────────────────────

async function toolGetLeadsStats(project: string) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  try {
    log.info("tool_get_leads_stats", { project });
    const queries = [
      { label: "total", f: `{EMAIL} != ""` },
      { label: "sent", f: `{EMAIL STATUS} = "Sent"` },
      { label: "ready", f: `AND({EMAIL} != "", {EMAIL STATUS} != "Sent", {EMAIL STATUS} != "Processing ", {Rank} >= 5)` },
      { label: "priority", f: `AND({lead_status} = "priority", {EMAIL STATUS} != "Sent")` },
      { label: "failed", f: `{EMAIL STATUS} = "Failed "` },
    ];
    const counts: Record<string, number> = {};
    // Paginate to get accurate counts for large tables (KRONOS has 880+ records)
    await Promise.all(queries.map(async ({ label, f }) => {
      let total = 0;
      let offset: string | undefined;
      do {
        const params = new URLSearchParams({ filterByFormula: f, pageSize: "100", "fields[]": "EMAIL" });
        if (offset) params.set("offset", offset);
        const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?${params.toString()}`) as { records: unknown[]; offset?: string };
        total += data.records?.length ?? 0;
        offset = data.offset;
      } while (offset);
      counts[label] = total;
    }));
    const top = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`AND({EMAIL} != "", {EMAIL STATUS} != "Sent", {Rank} >= 7)`)}&maxRecords=5&sort[0][field]=Rank&sort[0][direction]=desc&fields[]=FULL NAME&fields[]=company name&fields[]=City&fields[]=Rank&fields[]=score_reason`) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
    return {
      project, pipeline: counts,
      topLeads: top.records.map(r => ({ id: r.id, name: r.fields["FULL NAME"], company: r.fields["company name"], city: r.fields["City"], rank: r.fields["Rank"], reason: r.fields["score_reason"] })),
    };
  } catch (err) {
    log.error("tool_get_leads_stats_failed", err, { project });
    return { error: String(err) };
  }
}

async function toolGetRecentSent(project: string, limit = 10) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  const cap = Math.min(limit, 25);
  try {
    log.info("tool_get_recent_sent", { project, limit: cap });
    const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{EMAIL STATUS} = "Sent"`)}&maxRecords=${cap}&sort[0][field]=Rank&sort[0][direction]=desc&fields[]=FULL NAME&fields[]=company name&fields[]=City&fields[]=EMAIL_SUBJECT&fields[]=SENT MAIL&fields[]=Rank`) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
    return {
      project, count: data.records.length,
      sent: data.records.map(r => ({ id: r.id, company: r.fields["company name"], city: r.fields["City"], subject: r.fields["EMAIL_SUBJECT"], sentAt: r.fields["SENT MAIL"], rank: r.fields["Rank"] })),
    };
  } catch (err) {
    log.error("tool_get_recent_sent_failed", err, { project });
    return { error: String(err) };
  }
}

async function toolSearchLeads(project: string, query: string, limit = 10) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  const safe = query.replace(/"/g, "");
  const f = `OR(FIND(LOWER("${safe}"),LOWER({company name}))>0,FIND(LOWER("${safe}"),LOWER({FULL NAME}))>0,FIND(LOWER("${safe}"),LOWER({City}))>0,FIND(LOWER("${safe}"),LOWER({EMAIL}))>0)`;
  try {
    log.info("tool_search_leads", { project, query, limit });
    const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(f)}&maxRecords=${Math.min(limit, 20)}`) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
    return {
      query, count: data.records.length,
      leads: data.records.map(r => ({ id: r.id, company: r.fields["company name"], name: r.fields["FULL NAME"], email: r.fields["EMAIL"], city: r.fields["City"], rank: r.fields["Rank"], status: r.fields["EMAIL STATUS"], leadStatus: r.fields["lead_status"], scoreReason: r.fields["score_reason"] })),
    };
  } catch (err) {
    log.error("tool_search_leads_failed", err, { project, query });
    return { error: String(err) };
  }
}

async function toolAirtableListRecords(project: string, filter?: string, sortField?: string, sortDir?: string, fields?: string[], limit = 20) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  try {
    log.info("tool_airtable_list_records", { project, filter, sortField, limit });
    const params = new URLSearchParams();
    if (filter) params.set("filterByFormula", filter);
    if (sortField) { params.set("sort[0][field]", sortField); params.set("sort[0][direction]", sortDir ?? "desc"); }
    params.set("maxRecords", String(Math.min(limit, 100)));
    if (fields?.length) fields.forEach(f => params.append("fields[]", f));
    const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?${params.toString()}`) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
    return {
      project, count: data.records.length,
      records: data.records.map(r => ({ id: r.id, ...r.fields })),
    };
  } catch (err) {
    log.error("tool_airtable_list_records_failed", err, { project });
    return { error: String(err) };
  }
}

async function toolAirtableUpdateLead(project: string, recordId: string, fields: Record<string, unknown>) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  if (!recordId.startsWith("rec")) return { error: "record_id must start with 'rec'" };
  if (!fields || Object.keys(fields).length === 0) return { error: "fields object is empty — nothing to update" };
  try {
    log.info("tool_airtable_update_lead", { project, recordId, fields });
    const data = await airtablePatch(`${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`, { fields }) as { id: string; fields: Record<string, unknown> };
    return { ok: true, id: data.id, updated: data.fields };
  } catch (err) {
    log.error("tool_airtable_update_lead_failed", err, { project, recordId });
    return { error: String(err) };
  }
}

async function toolAirtableCreateLead(project: string, fields: Record<string, unknown>) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  if (!fields["company name"] && !fields["EMAIL"]) return { error: "At minimum 'company name' or 'EMAIL' must be provided" };
  try {
    log.info("tool_airtable_create_lead", { project, fields });
    const data = await airtablePost(`${AIRTABLE_API}/${baseId}/${tableId}`, { fields }) as { id: string; fields: Record<string, unknown> };
    return { ok: true, id: data.id, created: data.fields };
  } catch (err) {
    log.error("tool_airtable_create_lead_failed", err, { project });
    return { error: String(err) };
  }
}

async function toolGetEmailAnalytics(days = 30) {
  const end = new Date().toISOString().split("T")[0];
  const start = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  try {
    log.info("tool_get_email_analytics", { days });
    const data = await brevoGet(`/smtp/statistics/aggregatedReport?startDate=${start}&endDate=${end}`);
    return { period: `${start} → ${end}`, stats: data };
  } catch (err) {
    log.error("tool_get_email_analytics_failed", err);
    return { error: String(err) };
  }
}

async function toolGetBrevoLogs(email?: string, tag?: string) {
  try {
    log.info("tool_get_brevo_logs", { email, tag });
    const query = new URLSearchParams({ limit: "100" });
    if (email) query.set("email", email);
    if (tag) query.set("tags", tag);
    const data = await brevoGet(`/smtp/statistics/events?${query.toString()}`);
    return {
      count: data.events?.length || 0,
      events: data.events?.map((e: any) => ({ event: e.event, email: e.email, date: e.date, subject: e.subject, reason: e.reason })),
    };
  } catch (err) {
    log.error("tool_get_brevo_logs_failed", err);
    return { error: String(err) };
  }
}

async function toolGetDatabaseEngagement(project: string) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    log.info("tool_get_database_engagement", { project });
    const res = await fetch(`${base}/api/analytics/database?project=${project}`);
    if (!res.ok) return { error: `Analytics API ${res.status}` };
    const data = await res.json();
    return {
      project,
      summary: data.summary,
      topEngaged: data.rows
        ?.filter((r: any) => r.clicked || r.opened)
        ?.slice(0, 10)
        ?.map((r: any) => ({ id: r.id, company: r.company, name: r.name, email: r.email, city: r.city, rank: r.rank, opened: r.opened, clicked: r.clicked, openedAt: r.openedAt, clickedAt: r.clickedAt })),
    };
  } catch (err) {
    log.error("tool_get_database_engagement_failed", err, { project });
    return { error: String(err) };
  }
}

async function toolBrevoGetContact(email: string) {
  try {
    log.info("tool_brevo_get_contact", { email });
    const data = await brevoGet(`/contacts/${encodeURIComponent(email)}`);
    return {
      email: data.email,
      id: data.id,
      blacklisted: data.emailBlacklisted,
      smsBlacklisted: data.smsBlacklisted,
      createdAt: data.createdAt,
      modifiedAt: data.modifiedAt,
      attributes: data.attributes,
      listIds: data.listIds,
      statistics: data.statistics,
    };
  } catch (err) {
    log.error("tool_brevo_get_contact_failed", err, { email });
    return { error: String(err) };
  }
}

async function toolBrevoListContacts(limit = 25, offset = 0, listId?: number) {
  try {
    log.info("tool_brevo_list_contacts", { limit, offset, listId });
    const params = new URLSearchParams({ limit: String(Math.min(limit, 50)), offset: String(offset) });
    if (listId) params.set("listId", String(listId));
    const data = await brevoGet(`/contacts?${params.toString()}`);
    return {
      total: data.count,
      contacts: data.contacts?.map((c: any) => ({
        email: c.email,
        id: c.id,
        blacklisted: c.emailBlacklisted,
        createdAt: c.createdAt,
        attributes: c.attributes,
      })),
    };
  } catch (err) {
    log.error("tool_brevo_list_contacts_failed", err);
    return { error: String(err) };
  }
}

async function toolBrevoGetCampaigns(limit = 10, type = "classic") {
  try {
    log.info("tool_brevo_get_campaigns", { limit, type });
    const data = await brevoGet(`/emailCampaigns?type=${type}&limit=${limit}&sort=modifiedDate&order=desc`);
    return {
      total: data.count,
      campaigns: data.campaigns?.map((c: any) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        status: c.status,
        sentDate: c.sentDate,
        stats: c.statistics?.globalStats,
      })),
    };
  } catch (err) {
    log.error("tool_brevo_get_campaigns_failed", err);
    return { error: String(err) };
  }
}

async function toolBrevoGetCampaignReport(campaignId: number) {
  try {
    log.info("tool_brevo_get_campaign_report", { campaignId });
    const data = await brevoGet(`/emailCampaigns/${campaignId}`);
    return {
      id: data.id,
      name: data.name,
      subject: data.subject,
      status: data.status,
      sentDate: data.sentDate,
      globalStats: data.statistics?.globalStats,
      linksStats: data.statistics?.linksStats?.slice(0, 5),
      devices: data.statistics?.deviceBrowserStats,
    };
  } catch (err) {
    log.error("tool_brevo_get_campaign_report_failed", err, { campaignId });
    return { error: String(err) };
  }
}

async function toolBrevoGetSmtpEvents(email?: string, limit = 50, startDate?: string, endDate?: string) {
  try {
    log.info("tool_brevo_get_smtp_events", { email, limit });
    const params = new URLSearchParams({ limit: String(Math.min(limit, 100)) });
    if (email) params.set("email", email);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const data = await brevoGet(`/smtp/statistics/events?${params.toString()}`);
    return {
      count: data.events?.length || 0,
      events: data.events?.map((e: any) => ({
        event: e.event,
        email: e.email,
        date: e.date,
        subject: e.subject,
        messageId: e.messageId,
        reason: e.reason,
        ip: e.ip,
      })),
    };
  } catch (err) {
    log.error("tool_brevo_get_smtp_events_failed", err);
    return { error: String(err) };
  }
}

async function toolBrevoSendTransactional(toEmail: string, toName: string, subject: string, htmlContent: string, project = "kronos") {
  if (!toEmail || !toEmail.includes("@")) return { error: "Invalid or missing to_email address" };
  if (!subject.trim()) return { error: "subject is required" };
  if (!htmlContent.trim()) return { error: "html_content is required" };
  const senderEmail = project === "helios" ? "otto@heliosbusiness.it" : "otto@kronosbusiness.com";
  const senderName = project === "helios" ? "Otto from HELIOS" : "Otto from KRONOS";
  try {
    log.info("tool_brevo_send_transactional", { project, toEmail, subject });
    const data = await brevoPost("/smtp/email", {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: toName }],
      subject,
      htmlContent,
      tags: [project === "helios" ? "HELIOS_OUTREACH" : "KRONOS_OUTREACH"],
    });
    log.info("brevo_transactional_sent", { project, toEmail, messageId: data.messageId });
    return { ok: true, messageId: data.messageId, to: toEmail, subject };
  } catch (err) {
    log.error("tool_brevo_send_transactional_failed", err, { project, toEmail });
    return { error: String(err) };
  }
}

async function toolPreviewCampaign(project: string, leadLimit = 5) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    log.info("tool_preview_campaign", { project, leadLimit });
    const res = await fetch(`${base}/api/campaign/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, leadLimit: Math.min(leadLimit, 20) }),
    });
    const data = await res.json() as { ok?: boolean; previews?: Array<{ lead: { company: string; city: string; rank: string | number }; subject: string }>; error?: string };
    if (!data.ok) return { error: data.error ?? "Preview failed" };
    return { count: data.previews?.length ?? 0, previews: data.previews?.map(p => ({ company: p.lead.company, city: p.lead.city, rank: p.lead.rank, subject: p.subject })) };
  } catch (err) {
    log.error("tool_preview_campaign_failed", err, { project });
    return { error: String(err) };
  }
}

async function toolLaunchCampaign(project: string, leadLimit = 10) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    log.info("tool_launch_campaign", { project, leadLimit });
    const res = await fetch(`${base}/api/campaign/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, leadLimit: Math.min(leadLimit, 50) }),
    });
    const data = await res.json() as { ok?: boolean; sent?: number; failed?: number; skipped?: number; errors?: string[]; error?: string };
    if (!data.ok) return { error: data.error ?? "Launch failed" };
    log.info("campaign_launched", { project, sent: data.sent, failed: data.failed });
    return { sent: data.sent, failed: data.failed, skipped: data.skipped, errors: data.errors?.slice(0, 3) };
  } catch (err) {
    log.error("tool_launch_campaign_failed", err, { project });
    return { error: String(err) };
  }
}

async function toolUpdatePrompt(project: string, key: string, prompt: string) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    log.info("tool_update_prompt", { project, key, promptLength: prompt.length });
    const res = await fetch(`${base}/api/settings?project=${project}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: prompt }),
    });
    if (!res.ok) return { error: `Settings API ${res.status}` };
    return { ok: true, message: `${key} updated for ${project}. Visible in Settings page.` };
  } catch (err) {
    log.error("tool_update_prompt_failed", err, { project, key });
    return { error: String(err) };
  }
}

async function toolSendSms(to: string, body: string, project: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return { error: "Twilio credentials not configured" };
  try {
    log.info("tool_send_sms", { project, to, bodyLength: body.length });
    const params = new URLSearchParams({ To: to, From: "+12135836915", Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || `Twilio ${res.status}` };
    log.info("sms_sent", { project, to, sid: data.sid });
    return { ok: true, sid: data.sid, to, status: data.status };
  } catch (err) {
    log.error("tool_send_sms_failed", err, { project, to });
    return { error: String(err) };
  }
}

async function toolSaveToMemory(project: string, company: string, subject: string, body: string, notes?: string) {
  try {
    log.info("tool_save_to_memory", { project, company });
    const memoryDir = path.join(process.cwd(), "..", "..", "data", "memory", project);
    await fs.mkdir(memoryDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = company.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const filename = `${timestamp}_${safeName}.md`;
    const content = `---\nproject: ${project}\ncompany: ${company}\nsubject: "${subject}"\nsaved_at: ${new Date().toISOString()}\ntype: high_performing_copy\n---\n\n# ${company}\n\n## Subject\n${subject}\n\n## Body\n\`\`\`html\n${body}\n\`\`\`\n\n## Notes\n${notes || "Flagged as high-performing copy for few-shot learning."}\n`;
    await fs.writeFile(path.join(memoryDir, filename), content, "utf-8");
    log.info("memory_saved", { project, company, filename });
    return { ok: true, filename, message: `Saved to JARVIS Memory: ${filename}` };
  } catch (err) {
    log.error("tool_save_to_memory_failed", err, { project, company });
    return { error: String(err) };
  }
}

async function toolReadLogs(limit = 20) {
  log.info("tool_read_logs", { limit });
  return {
    message: "All tool calls are logged with structured JSON to stdout.",
    tip: "Use get_brevo_logs for email delivery events, get_database_engagement for lead engagement. Check Vercel Dashboard → Functions → Logs for full audit trail.",
    limit,
  };
}

// ─── TOOL ROUTER ───────────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const startMs = Date.now();
  let result: unknown;

  switch (name) {
    // Pipeline
    case "get_leads_stats":           result = await toolGetLeadsStats(String(args.project ?? "kronos")); break;
    case "get_recent_sent":           result = await toolGetRecentSent(String(args.project ?? "kronos"), Number(args.limit ?? 10)); break;
    case "search_leads":              result = await toolSearchLeads(String(args.project ?? "kronos"), String(args.query ?? ""), Number(args.limit ?? 10)); break;
    case "airtable_list_records":     result = await toolAirtableListRecords(String(args.project ?? "kronos"), args.filter as string | undefined, args.sort_field as string | undefined, args.sort_dir as string | undefined, args.fields as string[] | undefined, Number(args.limit ?? 20)); break;
    case "airtable_update_lead":      result = await toolAirtableUpdateLead(String(args.project ?? "kronos"), String(args.record_id ?? ""), args.fields as Record<string, unknown> ?? {}); break;
    case "airtable_create_lead":      result = await toolAirtableCreateLead(String(args.project ?? "kronos"), args.fields as Record<string, unknown> ?? {}); break;
    // Brevo Analytics
    case "get_email_analytics":       result = await toolGetEmailAnalytics(Number(args.days ?? 30)); break;
    case "get_brevo_logs":            result = await toolGetBrevoLogs(args.email as string | undefined, args.tag as string | undefined); break;
    case "get_database_engagement":   result = await toolGetDatabaseEngagement(String(args.project ?? "kronos")); break;
    case "brevo_get_contact":         result = await toolBrevoGetContact(String(args.email ?? "")); break;
    case "brevo_list_contacts":       result = await toolBrevoListContacts(Number(args.limit ?? 25), Number(args.offset ?? 0), args.list_id as number | undefined); break;
    case "brevo_get_campaigns":       result = await toolBrevoGetCampaigns(Number(args.limit ?? 10), String(args.type ?? "classic")); break;
    case "brevo_get_campaign_report": result = await toolBrevoGetCampaignReport(Number(args.campaign_id ?? 0)); break;
    case "brevo_get_smtp_events":     result = await toolBrevoGetSmtpEvents(args.email as string | undefined, Number(args.limit ?? 50), args.start_date as string | undefined, args.end_date as string | undefined); break;
    case "brevo_send_transactional":  result = await toolBrevoSendTransactional(String(args.to_email ?? ""), String(args.to_name ?? ""), String(args.subject ?? ""), String(args.html_content ?? ""), String(args.project ?? "kronos")); break;
    // Campaign Ops
    case "preview_campaign":          result = await toolPreviewCampaign(String(args.project ?? "kronos"), Number(args.leadLimit ?? 5)); break;
    case "launch_campaign":           result = await toolLaunchCampaign(String(args.project ?? "kronos"), Number(args.leadLimit ?? 10)); break;
    case "update_email_prompt":       result = await toolUpdatePrompt(String(args.project ?? "kronos"), "email_prompt", String(args.prompt ?? "")); break;
    case "update_sms_prompt":         result = await toolUpdatePrompt(String(args.project ?? "kronos"), "sms_prompt", String(args.prompt ?? "")); break;
    case "send_sms":                  result = await toolSendSms(String(args.to ?? ""), String(args.body ?? ""), String(args.project ?? "kronos")); break;
    // Memory & System
    case "save_to_memory":            result = await toolSaveToMemory(String(args.project ?? "kronos"), String(args.company ?? ""), String(args.subject ?? ""), String(args.body ?? ""), args.notes as string | undefined); break;
    case "read_logs":                 result = await toolReadLogs(Number(args.limit ?? 20)); break;
    default: result = { error: `Unknown tool: ${name}` };
  }

  const durationMs = Date.now() - startMs;
  log.info("tool_execution_complete", { tool: name, durationMs, hasError: !!(result as any)?.error });
  return result;
}

// ─── POST HANDLER ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });

  const body = await req.json() as { messages: Array<{ role: string; content: string }>; project?: string };
  const project = body.project ?? "kronos";

  log.api("/api/agent/chat", "POST", { project, messageCount: body.messages.length });

  let msgs: unknown[] = [
    { role: "system", content: SYSTEM_PROMPT + `\n\nActive context: project="${project}". Default all tool calls to this project unless Otto specifies otherwise.` },
    ...body.messages,
  ];

  for (let round = 0; round < 6; round++) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kronos-outreach.vercel.app",
        "X-Title": "JARVIS Intelligence",
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
      const errText = await res.text();
      log.error("openrouter_api_error", new Error(errText), { project });
      return NextResponse.json({ error: `OpenRouter: ${errText}` }, { status: 500 });
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
      return NextResponse.json({ content: msg.content ?? "No response generated.", role: "assistant" });
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

  return NextResponse.json({ content: "Reached tool call limit — please rephrase your request.", role: "assistant" });
}
