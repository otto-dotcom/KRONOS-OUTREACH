import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";
import * as fs from "fs/promises";
import * as path from "path";

export const runtime = "nodejs";
export const maxDuration = 120;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AIRTABLE_API = "https://api.airtable.com/v0";
const BREVO_API = "https://api.brevo.com/v3";

// ─── JARVIS CORE IDENTITY ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are JARVIS — Operational Intelligence Layer for two outreach operations managed by Otto.

━━━ PROJECTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KRONOS | Swiss Real Estate | .ch domains | Rank ≥ 5 | otto@kronosbusiness.com
HELIOS | Italian Solar Energy | Solar installers | otto@heliosbusiness.it
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORE DIRECTIVE: "Turn infinite ideas into executable systems."

━━━ TOOLS (13 active) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTELLIGENCE:
  get_leads_stats          → pipeline counts from Airtable (total/sent/ready/priority/failed)
  get_database_engagement  → who opened/clicked (Airtable + Brevo cross-ref)
  get_email_analytics      → Brevo delivery, open rate, click rate, bounce rate
  get_brevo_logs           → raw SMTP events per email or tag
  get_recent_sent          → last N sent emails (subject, company, date)
  search_leads             → find leads by company/name/city/email

CAMPAIGN OPS:
  preview_campaign         → generate email copy previews — DOES NOT SEND
  launch_campaign          → send to N leads — IRREVERSIBLE, REQUIRES CONFIRMATION
  update_email_prompt      → update AI email instructions in Settings
  update_sms_prompt        → update AI SMS instructions in Settings
  send_sms                 → send single SMS via Twilio

MEMORY & LOGS:
  save_to_memory           → persist high-performing copy to Obsidian vault
  read_logs                → system operation log summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ NON-NEGOTIABLE RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NEVER invent stats, counts, rates, or lead names. Call the tool or say you can't.
2. NEVER launch_campaign without "yes, launch" or "confirm send" from Otto.
3. NO DATA BLEED: Every tool call must be scoped to active project. Never cross streams.
   If project is null or unknown → output ui-status error, ask Otto to confirm project.
4. VERIFICATION: Cross-check Airtable status with Brevo logs before reporting analytics.
5. Prompt changes → ALWAYS use update_email_prompt / update_sms_prompt tools.
6. After a STOP / ABORT / DO NOT SEND command → halt all tool calls immediately.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ UI RENDERING (required for data) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lead card:    \`\`\`ui-lead\n{"name":"...","company":"...","email":"...","city":"...","rank":8,"id":"rec...", "opened":false,"clicked":false}\n\`\`\`
Analytics:    \`\`\`ui-analytics\n{"sent":100,"opens":50,"clicks":10,"bounced":2,"period":"last 30d"}\n\`\`\`
Status card:  \`\`\`ui-status\n{"title":"...","status":"ok|warn|error","message":"..."}\n\`\`\`
Multiple blocks are allowed. Lead cards with "id" link to the Lead Base page.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ AIRTABLE SCHEMA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fields: EMAIL STATUS (Sent/Processing/Failed/pending), Rank (1-10),
        lead_status (priority/medium/low), City, URL, Category,
        company name, FULL NAME, EMAIL, score_reason, DATE_SENT, EMAIL_SUBJECT.
singleSelect values are case-sensitive — use exact case.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ THINKING MODEL (internal, before every response) ━━━━━━━━━━━━━━━━
1. INTENT: What does Otto actually want? (underlying goal, not literal words)
2. SYSTEM: Which tools are needed, in what order?
3. EXECUTION: What is the single next concrete action for Otto?
End every substantive response with a recommended next action.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TONE: Executive. Direct. No filler. Lead with the answer. Numbers formatted as 1,234.`;

// ─── TOOL DEFINITIONS ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_leads_stats",
      description: "Get live lead pipeline stats from Airtable: total, by status, top priority leads ready to send.",
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
      name: "get_database_engagement",
      description: "Fetch real-time engagement data for sent leads: who opened, who clicked, delivery status. Returns top engaged leads.",
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
      name: "get_email_analytics",
      description: "Get Brevo email delivery stats: sent count, open rate, click rate, bounce rate.",
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
      description: "Get all granular Brevo events (delivered, opened, clicked, bounced) for an email or tag.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Specific email address to check" },
          tag: { type: "string", description: "E.g., KRONOS_OUTREACH or HELIOS_OUTREACH" }
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
  {
    type: "function",
    function: {
      name: "update_email_prompt",
      description: "Update the email agent system prompt in Airtable Settings. Changes will be reflected in the Settings page.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          prompt: { type: "string", description: "The full new email system prompt" },
        },
        required: ["project", "prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_sms_prompt",
      description: "Update the SMS agent system prompt in Airtable Settings. Changes will be reflected in the Settings page.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          prompt: { type: "string", description: "The full new SMS system prompt" },
        },
        required: ["project", "prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_sms",
      description: "Send an SMS message via Twilio to a phone number.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient phone number in E.164 format (e.g. +41791234567)" },
          body: { type: "string", description: "The SMS message body (max 160 chars recommended)" },
          project: { type: "string", enum: ["kronos", "helios"], description: "Project context for sender identity" },
        },
        required: ["to", "body", "project"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_to_memory",
      description: "Save high-performing email copy to persistent memory (local Obsidian vault) for future few-shot learning.",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", enum: ["kronos", "helios"] },
          company: { type: "string", description: "Company name" },
          subject: { type: "string", description: "Email subject line" },
          body: { type: "string", description: "Email body HTML" },
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
      description: "Access recent system operation logs (last N entries).",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of log entries to return (default 20)" },
        },
        required: [],
      },
    },
  },
];

// ─── HELPER: AIRTABLE ──────────────────────────────────────────────────────────

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

function getAirtableBaseId(project: string) {
  if (project === "helios" && process.env.HELIOS_AIRTABLE_BASE_ID) {
    return process.env.HELIOS_AIRTABLE_BASE_ID;
  }
  return process.env.AIRTABLE_BASE_ID || "";
}

async function airtableGet(url: string) {
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Airtable ${res.status}`);
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
    await Promise.all(queries.map(async ({ label, f }) => {
      const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(f)}&pageSize=100&fields[]=EMAIL`) as { records: unknown[] };
      counts[label] = data.records?.length ?? 0;
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

async function toolGetEmailAnalytics(days = 30) {
  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) return { error: "BREVO_API_KEY not configured" };
  const end = new Date().toISOString().split("T")[0];
  const start = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  try {
    log.info("tool_get_email_analytics", { days });
    const res = await fetch(`${BREVO_API}/smtp/statistics/aggregatedReport?startDate=${start}&endDate=${end}`, { headers: { "api-key": key } });
    if (!res.ok) return { error: `Brevo ${res.status}` };
    return { period: `${start} → ${end}`, stats: await res.json() };
  } catch (err) {
    log.error("tool_get_email_analytics_failed", err);
    return { error: String(err) };
  }
}

async function toolGetBrevoLogs(email?: string, tag?: string) {
  const key = process.env.BREVO_API_KEY ?? "";
  if (!key) return { error: "BREVO_API_KEY not configured" };
  try {
    log.info("tool_get_brevo_logs", { email, tag });
    const query = new URLSearchParams();
    query.set("limit", "100");
    if (email) query.set("email", email);
    if (tag) query.set("tags", tag);
    const res = await fetch(`${BREVO_API}/smtp/statistics/events?${query.toString()}`, { headers: { "api-key": key } });
    if (!res.ok) return { error: `Brevo ${res.status}` };
    const data = await res.json();
    return { count: data.events?.length || 0, events: data.events?.map((e: any) => ({ event: e.event, email: e.email, date: e.date, subject: e.subject })) };
  } catch (err) {
    log.error("tool_get_brevo_logs_failed", err);
    return { error: String(err) };
  }
}

async function toolGetRecentSent(project: string, limit = 10) {
  const { baseId, tableId } = airtableIds(project);
  if (!baseId || !tableId) return { error: `${project} Airtable not configured` };
  const cap = Math.min(limit, 25);
  try {
    log.info("tool_get_recent_sent", { project, limit: cap });
    const data = await airtableGet(`${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${encodeURIComponent(`{EMAIL STATUS} = "Sent"`)}&maxRecords=${cap}&sort[0][field]=DATE_SENT&sort[0][direction]=desc&fields[]=FULL NAME&fields[]=company name&fields[]=City&fields[]=EMAIL_SUBJECT&fields[]=DATE_SENT&fields[]=Rank`) as { records: Array<{ id: string; fields: Record<string, unknown> }> };
    return {
      project, count: data.records.length,
      sent: data.records.map(r => ({ id: r.id, company: r.fields["company name"], city: r.fields["City"], subject: r.fields["EMAIL_SUBJECT"], date: r.fields["DATE_SENT"], rank: r.fields["Rank"] })),
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

async function toolPreviewCampaign(project: string, leadLimit = 5) {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  try {
    log.info("tool_preview_campaign", { project, leadLimit });
    const res = await fetch(`${base}/api/campaign/preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project, leadLimit: Math.min(leadLimit, 20) }) });
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
    const res = await fetch(`${base}/api/campaign/launch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project, leadLimit: Math.min(leadLimit, 50) }) });
    const data = await res.json() as { ok?: boolean; sent?: number; failed?: number; skipped?: number; errors?: string[]; error?: string };
    if (!data.ok) return { error: data.error ?? "Launch failed" };
    log.info("campaign_launched", { project, sent: data.sent, failed: data.failed });
    return { sent: data.sent, failed: data.failed, skipped: data.skipped, errors: data.errors?.slice(0, 3) };
  } catch (err) {
    log.error("tool_launch_campaign_failed", err, { project });
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
        ?.map((r: any) => ({
          id: r.id,
          company: r.company,
          name: r.name,
          email: r.email,
          city: r.city,
          rank: r.rank,
          opened: r.opened,
          clicked: r.clicked,
          openedAt: r.openedAt,
          clickedAt: r.clickedAt,
        }))
    };
  } catch (err) {
    log.error("tool_get_database_engagement_failed", err, { project });
    return { error: String(err) };
  }
}

// ─── NEW TOOLS: CONFIG, SMS, MEMORY, LOGS ──────────────────────────────────────

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
    return { ok: true, message: `${key} updated successfully for ${project}. Changes are now visible in Settings page.` };
  } catch (err) {
    log.error("tool_update_prompt_failed", err, { project, key });
    return { error: String(err) };
  }
}

async function toolSendSms(to: string, body: string, project: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return { error: "Twilio credentials not configured" };

  const from = project === "helios" ? "+12135836915" : "+12135836915"; // Same Twilio number for now
  try {
    log.info("tool_send_sms", { project, to, bodyLength: body.length });
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams();
    params.set("To", to);
    params.set("From", from);
    params.set("Body", body);

    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      log.error("tool_send_sms_failed", new Error(data.message || "Twilio error"), { project, to });
      return { error: data.message || `Twilio ${res.status}` };
    }
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
    // Save to local filesystem — data/memory/{project}/
    const memoryDir = path.join(process.cwd(), "..", "..", "data", "memory", project);
    await fs.mkdir(memoryDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = company.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const filename = `${timestamp}_${safeName}.md`;

    const content = `---
project: ${project}
company: ${company}
subject: "${subject}"
saved_at: ${new Date().toISOString()}
type: high_performing_copy
---

# ${company}

## Subject
${subject}

## Body
\`\`\`html
${body}
\`\`\`

## Notes
${notes || "Flagged as high-performing copy for few-shot learning."}
`;

    await fs.writeFile(path.join(memoryDir, filename), content, "utf-8");
    log.info("memory_saved", { project, company, filename });
    return { ok: true, filename, message: `Saved to Jarvis Memory: ${filename}` };
  } catch (err) {
    log.error("tool_save_to_memory_failed", err, { project, company });
    return { error: String(err) };
  }
}

async function toolReadLogs(limit = 20) {
  log.info("tool_read_logs", { limit });
  return {
    message: "Log reading is available via Vercel Function Logs or local stdout. Use 'get_brevo_logs' for email delivery events, 'get_database_engagement' for lead engagement tracking.",
    tip: "All tool calls are logged with structured JSON to stdout. Check Vercel dashboard → Functions → Logs for full audit trail."
  };
}


// ─── TOOL ROUTER ───────────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const startMs = Date.now();
  let result: unknown;

  switch (name) {
    case "get_leads_stats": result = await toolGetLeadsStats(String(args.project ?? "kronos")); break;
    case "get_database_engagement": result = await toolGetDatabaseEngagement(String(args.project ?? "kronos")); break;
    case "get_email_analytics": result = await toolGetEmailAnalytics(Number(args.days ?? 30)); break;
    case "get_brevo_logs": result = await toolGetBrevoLogs(args.email as string | undefined, args.tag as string | undefined); break;
    case "get_recent_sent": result = await toolGetRecentSent(String(args.project ?? "kronos"), Number(args.limit ?? 10)); break;
    case "search_leads": result = await toolSearchLeads(String(args.project ?? "kronos"), String(args.query ?? ""), Number(args.limit ?? 10)); break;
    case "preview_campaign": result = await toolPreviewCampaign(String(args.project ?? "kronos"), Number(args.leadLimit ?? 5)); break;
    case "launch_campaign": result = await toolLaunchCampaign(String(args.project ?? "kronos"), Number(args.leadLimit ?? 10)); break;
    case "update_email_prompt": result = await toolUpdatePrompt(String(args.project ?? "kronos"), "email_prompt", String(args.prompt ?? "")); break;
    case "update_sms_prompt": result = await toolUpdatePrompt(String(args.project ?? "kronos"), "sms_prompt", String(args.prompt ?? "")); break;
    case "send_sms": result = await toolSendSms(String(args.to ?? ""), String(args.body ?? ""), String(args.project ?? "kronos")); break;
    case "save_to_memory": result = await toolSaveToMemory(String(args.project ?? "kronos"), String(args.company ?? ""), String(args.subject ?? ""), String(args.body ?? ""), args.notes as string | undefined); break;
    case "read_logs": result = await toolReadLogs(Number(args.limit ?? 20)); break;
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
        "X-Title": "JARVIS Intelligence",
      },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", messages: msgs, tools: TOOLS, tool_choice: "auto", temperature: 0.3 }),
    });

    if (!res.ok) {
      log.error("openrouter_api_error", new Error(await res.text()), { project });
      return NextResponse.json({ error: `OpenRouter: ${await res.text()}` }, { status: 500 });
    }

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
