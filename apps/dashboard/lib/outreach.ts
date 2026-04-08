/**
 * KRONOS Outreach Pipeline
 * Airtable → OpenRouter (GPT-4o-mini) → Brevo → Airtable update
 * No n8n dependency.
 */

const AIRTABLE_API = "https://api.airtable.com/v0";
const OPENROUTER_API = "https://openrouter.ai/api/v1";
const BREVO_API = "https://api.brevo.com/v3";

async function fetchWithTimeout(url: string, init: RequestInit, ms = 15_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const EMAIL_SYSTEM_PROMPT = `You are a cold email specialist writing on behalf of KRONOS Automations.
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
-  use any of these words: 'automate', 'automation', 'streamline', 'efficiency', 'leverage', 'results', 'ROI', 'save time', 'quick question', 'following up', 'touching base', 'reach out', 'free consultation', 'schedule a call', 'game-changer', 'solution', 'solutions', 'growth', 'scale', 'boost', 'seamless', 'innovative', 'cutting-edge', 'synergy'
- Subject: never start with the word "I". Use the agency name or city, not the recipient name alone.
- The email must read as if written by a single person to one recipient, not as marketing copy.

HTML FORMAT (plain-text style — no images, no styled buttons, no decorative borders):
- Outer wrapper: <div style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#111111;max-width:580px;">
- Body paragraphs: <p style="margin:0 0 16px 0;">content</p>
- CTA (plain text links, NOT buttons):
  <p style="margin:0 0 16px 0;"><a href="https://cal.com/kronosautomations/15min" style="color:#FF6B00;">Book a 15-min call</a><br>Or review our work first: <a href="https://kronosautomations.com" style="color:#FF6B00;">kronosautomations.com</a></p>
- Signature: <p style="margin-top:24px;padding-top:14px;border-top:1px solid #e0e0e0;font-size:13px;color:#555555;line-height:1.6;">Otto – KRONOS Automations<br>AI Automation Consulting · Switzerland<br><a href="mailto:otto@kronosbusiness.com" style="color:#FF6B00;text-decoration:none;">otto@kronosbusiness.com</a></p>

Response MUST be ONLY valid JSON (no markdown fences): {"subject": "...", "emailBody": "..."}`;

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

async function fetchLeads(
  baseId: string,
  tableId: string,
  limit: number
): Promise<AirtableRecord[]> {
  // Only target Swiss RE agencies: must have .ch URL or no URL (local),
  // exclude known non-RE categories, exclude if already sent
  // Exclude Sent and Processing — Processing means another instance is currently handling it
  const formula = encodeURIComponent(
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
  );
  const url = `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${formula}&maxRecords=${limit}`;

  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Airtable fetch failed: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records ?? [];
}

/** Fetch all leads marked as "Sent" for historical analysis. */
export async function fetchSentArchive(limit = 100): Promise<AirtableRecord[]> {
  const { baseId, tableId, apiKey } = requireEnv();
  const formula = encodeURIComponent(`{EMAIL STATUS} = "Sent"`);
  // Sort by Last Modified to get recent sends first
  const url = `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${formula}&maxRecords=${limit}&sort[0][field]=last_modified&sort[0][direction]=desc`;

  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Archive fetch failed: ${res.status}`);

  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records ?? [];
}

/** Fetch recent examples of human-edited emails for few-shot learning */
async function fetchEditingExamples(limit = 3): Promise<string> {
  const { baseId, tableId } = requireEnv();
  // Filter for records that was edited (original != sent)
  // Fields might vary, assuming ORIGINAL_SUBJECT and EMAIL_SUBJECT (sent)
  const formula = encodeURIComponent(`AND({ORIGINAL_SUBJECT} != "", {ORIGINAL_SUBJECT} != {EMAIL_SUBJECT})`);
  const url = `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${formula}&maxRecords=${limit}&sort[0][field]=last_modified&sort[0][direction]=desc`;

  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  try {
    const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${apiKey}` } });
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
  extraConstraint?: string
): Promise<EmailCopy> {
  const f = record.fields;
  const { baseId, apiKey: airtableKey } = requireEnv();
  
  // 1. Fetch Dynamic Directives from Settings table
  let systemPrompt = EMAIL_SYSTEM_PROMPT;
  try {
    const settingsUrl = `https://api.airtable.com/v0/${baseId}/Settings?filterByFormula={Key}='copy_directives'`;
    const settingsRes = await fetchWithTimeout(settingsUrl, {
      headers: { Authorization: `Bearer ${airtableKey}` },
    });
    if (settingsRes.ok) {
      const settingsData = await settingsRes.json();
      const dynamicPrompt = settingsData.records?.[0]?.fields?.Value;
      if (dynamicPrompt) systemPrompt = dynamicPrompt;
    }
  } catch (err) {
    console.error("Failed to fetch dynamic directives:", err);
  }

  // 2. Get self-bettering examples
  const examples = await fetchEditingExamples();
  const feedbackContext = examples ? `\n\nBELOW ARE EXAMPLES OF HOW A HUMAN EDITED PREVIOUS OUTPUTS. LEARN FROM THESE PREFERENCES:\n${examples}` : "";

  const userPrompt = [
    `Lead:`,
    `Name: ${f["FULL NAME"] ?? ""}`,
    `Email: ${f.EMAIL ?? ""}`,
    `Agency: ${f["company name"] ?? ""}`,
    `City: ${f.City ?? ""}`,
    `URL: ${f.URL ?? ""}`,
    `Rank: ${f.Rank ?? ""}`,
    `Score Reason: ${f.score_reason ?? ""}`,
    extraConstraint ? `\nExtra constraint: ${extraConstraint}` : "",
    feedbackContext
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

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const copy = JSON.parse(content) as EmailCopy;

  if (!copy.subject || !copy.emailBody) {
    throw new Error("OpenRouter returned incomplete copy");
  }

  // Prepend current instructions as meta-context if needed or just return
  return copy;
}

async function sendEmail(toEmail: string, copy: EmailCopy, attempt = 0): Promise<void> {
  const res = await fetchWithTimeout(`${BREVO_API}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Otto from KRONOS", email: "otto@kronosbusiness.com" },
      to: [{ email: toEmail }],
      bcc: [{ email: "otto@kronosbusiness.com" }],
      subject: copy.subject,
      htmlContent: copy.emailBody,
      tags: ["KRONOS_OUTREACH"],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      return sendEmail(toEmail, copy, attempt + 1);
    }
    throw new Error(`Brevo failed (${res.status}): ${body}`);
  }
}

// Airtable EMAIL STATUS choice values (must match exactly, including trailing space quirks)
const STATUS_SENT       = "Sent";
const STATUS_PROCESSING = "Processing ";   // trailing space — existing choice in Airtable
const STATUS_FAILED     = "Failed ";       // trailing space — existing choice in Airtable

/**
 * Fetch the current EMAIL STATUS for a single record.
 * Used to guard against double-sends across concurrent Vercel instances.
 */
async function fetchEmailStatus(
  baseId: string,
  tableId: string,
  recordId: string
): Promise<string | null> {
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
    return null; // fail open
  }
}

/** Mark record as Processing to claim it before generation/send. */
async function markProcessing(
  baseId: string,
  tableId: string,
  recordId: string
): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetchWithTimeout(`${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { "EMAIL STATUS": STATUS_PROCESSING } }),
  });
  if (!res.ok) throw new Error(`markProcessing failed: ${res.status}`);
}

/** Reset record status to allow retry (called on send failure). */
async function markFailed(
  baseId: string,
  tableId: string,
  recordId: string
): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  try {
    const res = await fetchWithTimeout(`${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { "EMAIL STATUS": STATUS_FAILED } }),
    });
    if (!res.ok) {
      console.error(`[KRONOS] markFailed CRITICAL: could not release lock for ${recordId} (${res.status}) — record stuck as Processing`);
    }
  } catch (err) {
    console.error(`[KRONOS] markFailed CRITICAL: network error releasing lock for ${recordId} — record stuck as Processing`, err);
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
  
  const fields: Record<string, any> = {
    "EMAIL STATUS": "Sent",
    "EMAIL_SUBJECT": subject,
    "SENT MAIL": emailBody,
    "DATE_SENT": new Date().toISOString(),
  };

  // If this was an edited version, store the original for the "bettering engine"
  if (originalSubject && originalSubject !== subject) {
    fields["ORIGINAL_SUBJECT"] = originalSubject;
  }
  if (originalBody && originalBody !== emailBody) {
    fields["ORIGINAL_BODY"] = originalBody;
  }

  const res = await fetchWithTimeout(`${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) throw new Error(`Airtable update failed: ${res.status}`);
}

function requireEnv() {
  const baseId = process.env.AIRTABLE_BASE_ID ?? "";
  const tableId = process.env.AIRTABLE_TABLE_ID ?? "";
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  if (!baseId || !tableId) throw new Error("AIRTABLE_BASE_ID / AIRTABLE_TABLE_ID not set");
  if (!apiKey) throw new Error("AIRTABLE_API_KEY or AIRTABLE_PAT not set");
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not set");
  if (!process.env.BREVO_API_KEY) throw new Error("BREVO_API_KEY not set");
  return { baseId, tableId, apiKey };
}

function mapLeadFields(lead: AirtableRecord): EmailPreview["lead"] {
  const f = lead.fields;
  return {
    id: lead.id,
    name: String(f["FULL NAME"] ?? ""),
    company: String(f["company name"] ?? ""),
    city: String(f.City ?? ""),
    email: String(f.EMAIL ?? ""),
    phone: String((f as any).Phone ?? ""),
    category: String((f as any).Category ?? ""),
    url: String(f.URL ?? ""),
    rank: f.Rank ?? "",
    scoreReason: String(f.score_reason ?? ""),
    leadStatus: String(f.lead_status ?? ""),
    emailStatus: String(f["EMAIL STATUS"] ?? "Pending"),
    tech: String((f as any).TECHNOLOGY ?? ""),
    postalCode: String((f as any)["Postal code"] ?? ""),
    state: String((f as any).State ?? ""),
    keywords: String((f as any).KEYWORDS ?? ""),
    linkedin: String((f as any).LINKEDIN ?? ""),
    revenue: String((f as any).REVENUE ?? ""),
    jobTitle: String((f as any)["JOB TITLE"] ?? ""),
    headline: String((f as any).HEADLINE ?? ""),
    seniority: String((f as any).SENIORITY ?? ""),
    companySize: String((f as any)["COMPANY SIZE"] ?? ""),
    companyDesc: String((f as any)["COMPANY DESCRIPTION"] ?? ""),
    instagram: String((f as any).INSTAGRAM ?? ""),
    sector: String((f as any).SECTOR ?? ""),
    address: String((f as any).Address ?? ""),
    street: String((f as any).Street ?? ""),
  };
}

/** Generate email copy for all leads without sending. Returns previews for gallery review. */
export async function previewOutreach(leadLimit = 10): Promise<EmailPreview[]> {
  const { baseId, tableId } = requireEnv();
  const leads = await fetchLeads(baseId, tableId, leadLimit);

  const previewPromises = leads.map(async (lead) => {
    const email = lead.fields.EMAIL;
    if (!email) return null;

    const leadFields = mapLeadFields(lead);
    try {
      const copy = await generateEmailCopy(lead);
      return { recordId: lead.id, lead: leadFields, subject: copy.subject, emailBody: copy.emailBody };
    } catch (err) {
      return {
        recordId: lead.id,
        lead: leadFields,
        subject: `[GENERATION FAILED] ${err instanceof Error ? err.message : String(err)}`,
        emailBody: "",
      };
    }
  });

  const results = await Promise.all(previewPromises);
  return (results.filter((p) => p !== null) as EmailPreview[]);
}

/** Send a pre-approved set of emails (from gallery review). */
export async function sendPreviews(items: SendItem[]): Promise<OutreachResult> {
  const { baseId, tableId } = requireEnv();
  const result: OutreachResult = { sent: 0, failed: 0, skipped: 0, errors: [] };

  // Process in batches of 5 to respect Airtable rate limits (5 rps)
  const BATCH_SIZE = 5;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (item) => {
      if (!item.toEmail || !item.subject || !item.emailBody) {
        result.skipped++;
        return;
      }

      // Guard 1: check current status — skip if Sent or already Processing
      const currentStatus = await fetchEmailStatus(baseId, tableId, item.recordId);
      const normalizedStatus = currentStatus?.trim();
      if (normalizedStatus === "Sent" || normalizedStatus === "Processing") {
        result.skipped++;
        result.errors.push(`${item.toEmail}: already ${normalizedStatus} — skipped`);
        return;
      }

      // Guard 2: atomically claim the record by marking Processing
      try {
        await markProcessing(baseId, tableId, item.recordId);
      } catch {
        result.skipped++;
        result.errors.push(`${item.toEmail}: could not claim record — skipped`);
        return;
      }

      try {
        // If it was already generated but not sent, we use the provided copy.
        // If we need to regenerate, we'd do it here, but sendPreviews implies approved copy.
        await sendEmail(item.toEmail, { subject: item.subject, emailBody: item.emailBody });
        await markSent(
          baseId, 
          tableId, 
          item.recordId, 
          item.subject, 
          item.emailBody, 
          item.originalSubject, 
          item.originalBody
        );
        result.sent++;
      } catch (err) {
        await markFailed(baseId, tableId, item.recordId);
        result.failed++;
        result.errors.push(
          `${item.toEmail}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }));
  }

  return result;
}

/** Legacy: run the full pipeline in one go (used by cron). */
export async function runOutreach(leadLimit = 10): Promise<OutreachResult> {
  const { baseId, tableId } = requireEnv();

  const result: OutreachResult = { sent: 0, failed: 0, skipped: 0, errors: [] };
  const leads = await fetchLeads(baseId, tableId, leadLimit);

  // Use batching to avoid timeouts and rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (lead) => {
      const email = lead.fields.EMAIL;
      if (!email) {
        result.skipped++;
        return;
      }

      // Guard 1: check current status
      const currentStatus = await fetchEmailStatus(baseId, tableId, lead.id);
      const normalizedStatus = currentStatus?.trim();
      if (normalizedStatus === "Sent" || normalizedStatus === "Processing") {
        result.skipped++;
        return;
      }

      // Guard 2: claim the record immediately (BEFORE generation)
      try {
        await markProcessing(baseId, tableId, lead.id);
      } catch {
        result.skipped++;
        return;
      }

      try {
        const copy = await generateEmailCopy(lead);
        await sendEmail(email, copy);
        await markSent(baseId, tableId, lead.id, copy.subject, copy.emailBody);
        result.sent++;
      } catch (err) {
        await markFailed(baseId, tableId, lead.id);
        result.failed++;
        result.errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }));
  }

  return result;
}
