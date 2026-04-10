/**
 * KRONOS + HELIOS Outreach Pipeline
 * Airtable → OpenRouter (GPT-4o-mini) → Brevo → Airtable update
 * No n8n dependency. Project-aware: pass project="kronos"|"helios" to all public functions.
 */

const AIRTABLE_API = "https://api.airtable.com/v0";
const OPENROUTER_API = "https://openrouter.ai/api/v1";
const BREVO_API = "https://api.brevo.com/v3";

// ─── PROJECT CONFIG ────────────────────────────────────────────────────────────

export type Project = "kronos" | "helios";

interface ProjectConfig {
  baseId: string;
  tableId: string;
  senderName: string;
  senderEmail: string;
  bccEmail: string;
  tag: string;
  systemPrompt: string;
  leadFilter: string; // URL-encoded Airtable formula
}

const KRONOS_SYSTEM_PROMPT = `You are a cold email specialist writing on behalf of KRONOS Automations.
KRONOS is an AI automation consultancy. We work with Swiss real estate agencies to map and automate the manual, repetitive parts of their business — follow-up sequences, lead qualification, client onboarding, mandate tracking — so their consultants spend time on work that actually requires a human.

LANGUAGE RULE — ABSOLUTE: Write 100% in English. No exceptions. Do not use French, German, Italian, or any other language regardless of the lead's city, region, or name. If you write in any other language you have failed this task.
GREETING: 'Hello {Name},' if name available, otherwise 'Hello,'

GOAL: 4-5 sentences max. Reads like a real person sent it, not a marketing blast.

CONTENT PROTOCOL:
1. HOOK: One specific observation about their agency, city, or market segment. Show you know the Swiss RE space — mandate competition, referral dependency, follow-up gaps. NEVER open with 'I noticed', 'I came across', or 'I hope this email finds you well'.
2. PROBLEM: One concrete operational pain — agents losing warm seller contacts because there is no follow-up system, time wasted on unqualified inquiries that never convert, or a mandate pipeline that resets to zero every quarter because it runs entirely on referrals.
3. SOLUTION: One sentence framing KRONOS as an automation consulting partner — we audit the workflow, identify what can be automated, and build it. The outcome is that your team handles fewer manual tasks and more high-value client conversations.
4. CTA: Close with two plain-text links — one to book a call, one to the website.

TONE: Direct, confident, no fluff. No exclamation marks. No ALL CAPS.

SUBJECT LINE: Max 50 chars, sentence case. Patterns: '{Agency} automation audit', '{Name}, a question about your workflow', 'Reducing manual work at {Agency}', '{City} RE agencies + AI automation'.
NEVER: generic 'quick question', 'following up', 'touching base'.

DELIVERABILITY RULES (non-negotiable — Gmail Primary tab placement depends on these):
- Maximum 2 hyperlinks total in the entire email (Cal.com booking link + website link only)
- Body must be under 150 words
- HTML: only <p> tags inside the outer <div>. No nested divs, no tables, no background colors, no inline background styles.
- NEVER use any of these words: 'automate', 'automation', 'streamline', 'efficiency', 'leverage', 'results', 'ROI', 'save time', 'quick question', 'following up', 'touching base', 'reach out', 'free consultation', 'schedule a call', 'game-changer', 'solution', 'solutions', 'growth', 'scale', 'boost', 'seamless', 'innovative', 'cutting-edge', 'synergy'
- Subject: never start with the word "I". Use the agency name or city, not the recipient name alone.
- The email must read as if written by a single person to one recipient, not as marketing copy.

HTML FORMAT (plain-text style — no images, no styled buttons, no decorative borders):
- Outer wrapper: <div style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#111111;max-width:580px;">
- Body paragraphs: <p style="margin:0 0 16px 0;">content</p>
- CTA (plain text links, NOT buttons):
  <p style="margin:0 0 16px 0;"><a href="https://cal.com/kronosautomations/15min" style="color:#FF6B00;">Book a 15-min call</a><br>Or review our work first: <a href="https://kronosautomations.com" style="color:#FF6B00;">kronosautomations.com</a></p>
- Signature: <p style="margin-top:24px;padding-top:14px;border-top:1px solid #e0e0e0;font-size:13px;color:#555555;line-height:1.6;">Otto – KRONOS Automations<br>AI Automation Consulting · Switzerland<br><a href="mailto:otto@kronosbusiness.com" style="color:#FF6B00;text-decoration:none;">otto@kronosbusiness.com</a></p>

Response MUST be ONLY valid JSON (no markdown fences): {"subject": "...", "emailBody": "..."}`;

const HELIOS_SYSTEM_PROMPT = `You are a cold email specialist writing on behalf of HELIOS.
HELIOS is a clean solar intelligence consultancy. We work with Swiss solar installers, energy companies, and property developers to map and operationalise their client acquisition and project pipeline — lead qualification, quote follow-up, installation scheduling, subsidy tracking — so their teams focus on technical work, not admin.

LANGUAGE RULE — ABSOLUTE: Write 100% in English. No exceptions. Do not use French, German, Italian, or any other language regardless of the lead's city, region, or name. If you write in any other language you have failed this task.
GREETING: 'Hello {Name},' if name available, otherwise 'Hello,'

GOAL: 4-5 sentences max. Reads like a real person sent it, not a marketing blast.

CONTENT PROTOCOL:
1. HOOK: One specific observation about their company, region, or the Swiss solar market. Show you understand the space — subsidy complexity (Pronovo, cantonal programs), quote-to-install conversion gaps, or the volume of unqualified inbound inquiries. NEVER open with 'I noticed', 'I came across', or 'I hope this email finds you well'.
2. PROBLEM: One concrete operational pain — teams spending hours on subsidy paperwork instead of installations, losing warm leads because there is no follow-up after the initial site visit, or project timelines slipping because handoffs between sales and technical teams are manual.
3. SOLUTION: One sentence framing HELIOS as an intelligence and process consulting partner — we map the pipeline, identify where time is lost, and build the systems to fix it. The outcome is faster project cycles and fewer dropped leads.
4. CTA: Close with two plain-text links — one to book a call, one to the website.

TONE: Direct, grounded, technically credible. No exclamation marks. No ALL CAPS.

SUBJECT LINE: Max 50 chars, sentence case. Patterns: '{Company} pipeline audit', '{Name}, a question about your install flow', 'Reducing admin at {Company}', '{City} solar companies + process intelligence'.
NEVER: generic 'quick question', 'following up', 'touching base'.

DELIVERABILITY RULES (non-negotiable — Gmail Primary tab placement depends on these):
- Maximum 2 hyperlinks total in the entire email (Cal.com booking link + website link only)
- Body must be under 150 words
- HTML: only <p> tags inside the outer <div>. No nested divs, no tables, no background colors, no inline background styles.
- NEVER use any of these words: 'automate', 'automation', 'streamline', 'efficiency', 'leverage', 'results', 'ROI', 'save time', 'quick question', 'following up', 'touching base', 'reach out', 'free consultation', 'schedule a call', 'game-changer', 'solution', 'solutions', 'growth', 'scale', 'boost', 'seamless', 'innovative', 'cutting-edge', 'synergy', 'renewable', 'sustainable', 'green energy'
- Subject: never start with the word "I". Use the company name or city, not the recipient name alone.
- The email must read as if written by a single person to one recipient, not as marketing copy.

HTML FORMAT (plain-text style — no images, no styled buttons, no decorative borders):
- Outer wrapper: <div style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#111111;max-width:580px;">
- Body paragraphs: <p style="margin:0 0 16px 0;">content</p>
- CTA (plain text links, NOT buttons):
  <p style="margin:0 0 16px 0;"><a href="https://cal.com/helios/15min" style="color:#22C55E;">Book a 15-min call</a><br>Or review our work first: <a href="https://helios-solare.com" style="color:#22C55E;">helios-solare.com</a></p>
- Signature: <p style="margin-top:24px;padding-top:14px;border-top:1px solid #e0e0e0;font-size:13px;color:#555555;line-height:1.6;">Otto – HELIOS<br>Clean Solar Intelligence · Switzerland<br><a href="mailto:otto@heliosbusiness.it" style="color:#22C55E;text-decoration:none;">otto@heliosbusiness.it</a></p>

Response MUST be ONLY valid JSON (no markdown fences): {"subject": "...", "emailBody": "..."}`;

function getProjectConfig(project: Project): ProjectConfig {
  const airtableKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";

  if (project === "helios") {
    const baseId = process.env.HELIOS_AIRTABLE_BASE_ID ?? "";
    const tableId = process.env.HELIOS_AIRTABLE_TABLE_ID ?? "";
    if (!baseId || !tableId) throw new Error("HELIOS_AIRTABLE_BASE_ID / HELIOS_AIRTABLE_TABLE_ID not set");
    if (!airtableKey) throw new Error("AIRTABLE_API_KEY or AIRTABLE_PAT not set");
    if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not set");
    if (!process.env.BREVO_API_KEY) throw new Error("BREVO_API_KEY not set");

    const senderEmail = process.env.HELIOS_SENDER_EMAIL ?? "otto@heliosbusiness.it";
    return {
      baseId,
      tableId,
      senderName: "Otto from HELIOS",
      senderEmail,
      bccEmail: senderEmail,
      tag: "HELIOS_OUTREACH",
      systemPrompt: HELIOS_SYSTEM_PROMPT,
      leadFilter: encodeURIComponent(
        `AND(
          {EMAIL} != "",
          {EMAIL STATUS} != "Sent",
          {EMAIL STATUS} != "Processing ",
          {Rank} >= 5
        )`
      ),
    };
  }

  // KRONOS (default)
  const baseId = process.env.AIRTABLE_BASE_ID ?? "";
  const tableId = process.env.AIRTABLE_TABLE_ID ?? "";
  if (!baseId || !tableId) throw new Error("AIRTABLE_BASE_ID / AIRTABLE_TABLE_ID not set");
  if (!airtableKey) throw new Error("AIRTABLE_API_KEY or AIRTABLE_PAT not set");
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not set");
  if (!process.env.BREVO_API_KEY) throw new Error("BREVO_API_KEY not set");

  return {
    baseId,
    tableId,
    senderName: "Otto from KRONOS",
    senderEmail: "otto@kronosbusiness.com",
    bccEmail: "otto@kronosbusiness.com",
    tag: "KRONOS_OUTREACH",
    systemPrompt: KRONOS_SYSTEM_PROMPT,
    leadFilter: encodeURIComponent(
      `AND(
        {EMAIL} != "",
        {EMAIL STATUS} != "Sent",
        {EMAIL STATUS} != "Processing ",
        {Rank} >= 5,
        OR(FIND(".ch", {URL}) > 0, {URL} = ""),
        NOT({Category} = "Financial Services"),
        NOT({Category} = "Investment Management"),
        NOT({Category} = "Banking")
      )`
    ),
  };
}

// ─── TYPES ─────────────────────────────────────────────────────────────────────

export interface AirtableRecord {
  id: string;
  fields: {
    "FULL NAME"?: string;
    EMAIL?: string;
    "company name"?: string;
    City?: string;
    URL?: string;
    Rank?: string | number;
    score_reason?: string;
    lead_status?: string;
    [key: string]: unknown;
  };
}

export interface EmailCopy {
  subject: string;
  emailBody: string;
}

export interface EmailPreview {
  recordId: string;
  lead: {
    id: string;
    name: string;
    company: string;
    city: string;
    email: string;
    phone: string;
    category: string;
    url: string;
    rank: string | number;
    scoreReason: string;
    leadStatus: string;
    emailStatus?: string;
    tech?: string;
    postalCode?: string;
    state?: string;
    keywords?: string;
    linkedin?: string;
    revenue?: string;
    jobTitle?: string;
    headline?: string;
    seniority?: string;
    companySize?: string;
    companyDesc?: string;
    instagram?: string;
    sector?: string;
    address?: string;
    street?: string;
  };
  subject: string;
  emailBody: string;
}

export interface OutreachResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface SendItem {
  recordId: string;
  toEmail: string;
  subject: string;
  emailBody: string;
  originalSubject?: string;
  originalBody?: string;
  wasEdited: boolean;
  wasRegenerated: boolean;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, init: RequestInit, ms = 15_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLeads(config: ProjectConfig, limit: number): Promise<AirtableRecord[]> {
  const airtableKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const url = `${AIRTABLE_API}/${config.baseId}/${config.tableId}?filterByFormula=${config.leadFilter}&maxRecords=${limit}`;

  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${airtableKey}` },
  });
  if (!res.ok) throw new Error(`Airtable fetch failed: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records ?? [];
}

/** Fetch all leads marked as "Sent" for historical analysis. */
export async function fetchSentArchive(limit = 100, project: Project = "kronos"): Promise<AirtableRecord[]> {
  const config = getProjectConfig(project);
  const airtableKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const formula = encodeURIComponent(`{EMAIL STATUS} = "Sent"`);
  const url = `${AIRTABLE_API}/${config.baseId}/${config.tableId}?filterByFormula=${formula}&maxRecords=${limit}&sort[0][field]=last_modified&sort[0][direction]=desc`;

  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${airtableKey}` },
  });
  if (!res.ok) throw new Error(`Archive fetch failed: ${res.status}`);

  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records ?? [];
}

/** Fetch recent examples of human-edited emails for few-shot learning */
async function fetchEditingExamples(config: ProjectConfig, limit = 3): Promise<string> {
  const airtableKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const formula = encodeURIComponent(`AND({ORIGINAL_SUBJECT} != "", {ORIGINAL_SUBJECT} != {EMAIL_SUBJECT})`);
  const url = `${AIRTABLE_API}/${config.baseId}/${config.tableId}?filterByFormula=${formula}&maxRecords=${limit}&sort[0][field]=last_modified&sort[0][direction]=desc`;

  try {
    const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${airtableKey}` } });
    if (!res.ok) return "";
    const data = (await res.json()) as { records: AirtableRecord[] };
    if (!data.records?.length) return "";

    return data.records.map(r => {
      const f = r.fields;
      return `### EXAMPLE IMPROVEMENT:
Original Subject: ${f.ORIGINAL_SUBJECT}
Original Body: ${f.ORIGINAL_BODY}

Final Sent Subject (PREFERRED): ${f.EMAIL_SUBJECT}
Final Sent Body (PREFERRED): ${f["SENT MAIL"]}
---`;
    }).join("\n\n");
  } catch {
    return "";
  }
}

export async function generateEmailCopy(
  record: AirtableRecord,
  project: Project = "kronos",
  extraConstraint?: string
): Promise<EmailCopy> {
  const f = record.fields;
  const config = getProjectConfig(project);
  const airtableKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";

  // 1. Fetch dynamic directives from Settings table (project-specific key)
  let systemPrompt = config.systemPrompt;
  try {
    const key = "email_prompt";
    const settingsUrl = `${AIRTABLE_API}/${config.baseId}/Settings?filterByFormula={Key}='${key}'`;
    const settingsRes = await fetchWithTimeout(settingsUrl, {
      headers: { Authorization: `Bearer ${airtableKey}` },
    });
    if (settingsRes.ok) {
      const settingsData = await settingsRes.json();
      const dynamicPrompt = settingsData.records?.[0]?.fields?.Value;
      if (dynamicPrompt) systemPrompt = dynamicPrompt;
    }
  } catch {
    // fall through to static prompt
  }

  // 2. Few-shot learning from human edits
  const examples = await fetchEditingExamples(config);
  const feedbackContext = examples
    ? `\n\nBELOW ARE EXAMPLES OF HOW A HUMAN EDITED PREVIOUS OUTPUTS. LEARN FROM THESE PREFERENCES:\n${examples}`
    : "";

  const userPrompt = [
    `Lead:`,
    `Name: ${f["FULL NAME"] ?? ""}`,
    `Email: ${f.EMAIL ?? ""}`,
    `Company: ${f["company name"] ?? ""}`,
    `City: ${f.City ?? ""}`,
    `URL: ${f.URL ?? ""}`,
    `Rank: ${f.Rank ?? ""}`,
    `Score Reason: ${f.score_reason ?? ""}`,
    extraConstraint ? `\nExtra constraint: ${extraConstraint}` : "",
    feedbackContext,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetchWithTimeout(`${OPENROUTER_API}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter failed: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const copy = JSON.parse(content) as EmailCopy;

  if (!copy.subject || !copy.emailBody) throw new Error("OpenRouter returned incomplete copy");
  return copy;
}

async function sendEmail(toEmail: string, copy: EmailCopy, config: ProjectConfig, attempt = 0): Promise<void> {
  const res = await fetchWithTimeout(`${BREVO_API}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: config.senderName, email: config.senderEmail },
      to: [{ email: toEmail }],
      bcc: [{ email: config.bccEmail }],
      subject: copy.subject,
      htmlContent: copy.emailBody,
      tags: [config.tag],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      return sendEmail(toEmail, copy, config, attempt + 1);
    }
    throw new Error(`Brevo failed (${res.status}): ${body}`);
  }
}

// Airtable EMAIL STATUS choice values
const STATUS_SENT       = "Sent";
const STATUS_PROCESSING = "Processing ";  // trailing space — existing Airtable choice
const STATUS_FAILED     = "Failed ";      // trailing space — existing Airtable choice

async function fetchEmailStatus(baseId: string, tableId: string, recordId: string): Promise<string | null> {
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  try {
    const res = await fetchWithTimeout(
      `${AIRTABLE_API}/${baseId}/${tableId}/${recordId}?fields[]=EMAIL%20STATUS`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { fields?: { "EMAIL STATUS"?: string } };
    return data.fields?.["EMAIL STATUS"] ?? null;
  } catch {
    return null;
  }
}

async function markProcessing(baseId: string, tableId: string, recordId: string): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetchWithTimeout(`${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { "EMAIL STATUS": STATUS_PROCESSING } }),
  });
  if (!res.ok) throw new Error(`markProcessing failed: ${res.status}`);
}

async function markFailed(baseId: string, tableId: string, recordId: string): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  try {
    const res = await fetchWithTimeout(`${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { "EMAIL STATUS": STATUS_FAILED } }),
    });
    if (!res.ok) {
      console.error(`markFailed CRITICAL: could not release lock for ${recordId} (${res.status})`);
    }
  } catch (err) {
    console.error(`markFailed CRITICAL: network error releasing lock for ${recordId}`, err);
  }
}

async function markSent(
  baseId: string,
  tableId: string,
  recordId: string,
  subject: string,
  emailBody: string,
  originalSubject?: string,
  originalBody?: string
): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const fields: Record<string, unknown> = {
    "EMAIL STATUS": STATUS_SENT,
    EMAIL_SUBJECT: subject,
    "SENT MAIL": emailBody,
    DATE_SENT: new Date().toISOString(),
  };
  if (originalSubject && originalSubject !== subject) fields["ORIGINAL_SUBJECT"] = originalSubject;
  if (originalBody && originalBody !== emailBody) fields["ORIGINAL_BODY"] = originalBody;

  const res = await fetchWithTimeout(`${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Airtable markSent failed: ${res.status}`);
}

function mapLeadFields(lead: AirtableRecord): EmailPreview["lead"] {
  const f = lead.fields;
  return {
    id: lead.id,
    name: String(f["FULL NAME"] ?? ""),
    company: String(f["company name"] ?? ""),
    city: String(f.City ?? ""),
    email: String(f.EMAIL ?? ""),
    phone: String((f as Record<string, unknown>).Phone ?? ""),
    category: String((f as Record<string, unknown>).Category ?? ""),
    url: String(f.URL ?? ""),
    rank: f.Rank ?? "",
    scoreReason: String(f.score_reason ?? ""),
    leadStatus: String(f.lead_status ?? ""),
    emailStatus: String(f["EMAIL STATUS"] ?? "Pending"),
    tech: String((f as Record<string, unknown>).TECHNOLOGY ?? ""),
    postalCode: String((f as Record<string, unknown>)["Postal code"] ?? ""),
    state: String((f as Record<string, unknown>).State ?? ""),
    keywords: String((f as Record<string, unknown>).KEYWORDS ?? ""),
    linkedin: String((f as Record<string, unknown>).LINKEDIN ?? ""),
    revenue: String((f as Record<string, unknown>).REVENUE ?? ""),
    jobTitle: String((f as Record<string, unknown>)["JOB TITLE"] ?? ""),
    headline: String((f as Record<string, unknown>).HEADLINE ?? ""),
    seniority: String((f as Record<string, unknown>).SENIORITY ?? ""),
    companySize: String((f as Record<string, unknown>)["COMPANY SIZE"] ?? ""),
    companyDesc: String((f as Record<string, unknown>)["COMPANY DESCRIPTION"] ?? ""),
    instagram: String((f as Record<string, unknown>).INSTAGRAM ?? ""),
    sector: String((f as Record<string, unknown>).SECTOR ?? ""),
    address: String((f as Record<string, unknown>).Address ?? ""),
    street: String((f as Record<string, unknown>).Street ?? ""),
  };
}

// ─── PUBLIC API ────────────────────────────────────────────────────────────────

/** Generate email copy for all leads without sending. Returns previews for gallery review. */
export async function previewOutreach(leadLimit = 10, project: Project = "kronos"): Promise<EmailPreview[]> {
  const config = getProjectConfig(project);
  const leads = await fetchLeads(config, leadLimit);

  const results = await Promise.all(
    leads.map(async (lead) => {
      if (!lead.fields.EMAIL) return null;
      const leadFields = mapLeadFields(lead);
      try {
        const copy = await generateEmailCopy(lead, project);
        return { recordId: lead.id, lead: leadFields, subject: copy.subject, emailBody: copy.emailBody };
      } catch (err) {
        return {
          recordId: lead.id,
          lead: leadFields,
          subject: `[GENERATION FAILED] ${err instanceof Error ? err.message : String(err)}`,
          emailBody: "",
        };
      }
    })
  );

  return results.filter((p): p is EmailPreview => p !== null);
}

/** Send a pre-approved set of emails (from gallery review). */
export async function sendPreviews(items: SendItem[], project: Project = "kronos"): Promise<OutreachResult> {
  const config = getProjectConfig(project);
  const result: OutreachResult = { sent: 0, failed: 0, skipped: 0, errors: [] };

  const BATCH_SIZE = 5;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (item) => {
      if (!item.toEmail || !item.subject || !item.emailBody) {
        result.skipped++;
        return;
      }

      const currentStatus = await fetchEmailStatus(config.baseId, config.tableId, item.recordId);
      const normalizedStatus = currentStatus?.trim();
      if (normalizedStatus === "Sent" || normalizedStatus === "Processing") {
        result.skipped++;
        result.errors.push(`${item.toEmail}: already ${normalizedStatus} — skipped`);
        return;
      }

      try {
        await markProcessing(config.baseId, config.tableId, item.recordId);
      } catch {
        result.skipped++;
        result.errors.push(`${item.toEmail}: could not claim record — skipped`);
        return;
      }

      try {
        await sendEmail(item.toEmail, { subject: item.subject, emailBody: item.emailBody }, config);
        await markSent(config.baseId, config.tableId, item.recordId, item.subject, item.emailBody, item.originalSubject, item.originalBody);
        result.sent++;
      } catch (err) {
        await markFailed(config.baseId, config.tableId, item.recordId);
        result.failed++;
        result.errors.push(`${item.toEmail}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }));
  }

  return result;
}

/** Run the full pipeline in one go (used by cron + direct launch). */
export async function runOutreach(leadLimit = 10, project: Project = "kronos"): Promise<OutreachResult> {
  const config = getProjectConfig(project);
  const result: OutreachResult = { sent: 0, failed: 0, skipped: 0, errors: [] };
  const leads = await fetchLeads(config, leadLimit);

  const BATCH_SIZE = 5;
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (lead) => {
      const email = lead.fields.EMAIL;
      if (!email) { result.skipped++; return; }

      const currentStatus = await fetchEmailStatus(config.baseId, config.tableId, lead.id);
      const normalizedStatus = currentStatus?.trim();
      if (normalizedStatus === "Sent" || normalizedStatus === "Processing") {
        result.skipped++;
        return;
      }

      try {
        await markProcessing(config.baseId, config.tableId, lead.id);
      } catch {
        result.skipped++;
        return;
      }

      try {
        const copy = await generateEmailCopy(lead, project);
        await sendEmail(email, copy, config);
        await markSent(config.baseId, config.tableId, lead.id, copy.subject, copy.emailBody);
        result.sent++;
      } catch (err) {
        await markFailed(config.baseId, config.tableId, lead.id);
        result.failed++;
        result.errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }));
  }

  return result;
}
