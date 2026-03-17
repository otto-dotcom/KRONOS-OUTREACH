/**
 * KRONOS Outreach Pipeline
 * Airtable → OpenRouter (GPT-4o-mini) → Brevo → Airtable update
 * No n8n dependency.
 */

const AIRTABLE_API = "https://api.airtable.com/v0";
const OPENROUTER_API = "https://openrouter.ai/api/v1";
const BREVO_API = "https://api.brevo.com/v3";

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

TONE: Direct, confident, no fluff. No buzzwords: no 'streamline', 'leverage', 'game-changer', 'innovative', 'cutting-edge', 'scalable', 'synergy'. No exclamation marks. No ALL CAPS.

SUBJECT LINE: Max 50 chars, sentence case. Patterns: '{Agency} automation audit', '{Name}, a question about your workflow', 'Reducing manual work at {Agency}', '{City} RE agencies + AI automation'.
NEVER: generic 'quick question', 'following up', 'touching base'.

HTML FORMAT (plain-text style — no images, no styled buttons, no decorative borders):
- Outer wrapper: <div style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#111111;max-width:580px;">
- Body paragraphs: <p style="margin:0 0 16px 0;">content</p>
- CTA (plain text links, NOT buttons):
  <p style="margin:0 0 16px 0;"><a href="https://cal.com/kronosautomations/15min" style="color:#FF6B00;">Book a 15-min call</a><br>Or review our work first: <a href="https://kronosautomations.com" style="color:#FF6B00;">kronosautomations.com</a></p>
- Signature: <p style="margin-top:24px;padding-top:14px;border-top:1px solid #e0e0e0;font-size:13px;color:#555555;line-height:1.6;">Otto – KRONOS Automations<br>AI Automation Consulting · Switzerland<br><a href="mailto:otto@kronosbusiness.com" style="color:#FF6B00;text-decoration:none;">otto@kronosbusiness.com</a></p>

Response MUST be ONLY valid JSON (no markdown fences): {"subject": "...", "emailBody": "..."}`;

interface AirtableRecord {
  id: string;
  fields: {
    "FULL NAME"?: string;
    EMAIL?: string;
    "company name"?: string;
    City?: string;
    URL?: string;
    Rank?: string;
    score_reason?: string;
    [key: string]: unknown;
  };
}

interface EmailCopy {
  subject: string;
  emailBody: string;
}

export interface OutreachResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

async function fetchLeads(
  baseId: string,
  tableId: string,
  limit: number
): Promise<AirtableRecord[]> {
  // Only target Swiss RE agencies: must have .ch URL or no URL (local),
  // exclude known non-RE categories, exclude if already sent
  const formula = encodeURIComponent(
    `AND(
      {EMAIL} != "",
      OR({EMAIL STATUS} = BLANK(), NOT({EMAIL STATUS} = "Sent")),
      {Rank} >= 5,
      OR(FIND(".ch", {URL}) > 0, {URL} = ""),
      NOT({Category} = "Financial Services"),
      NOT({Category} = "Investment Management"),
      NOT({Category} = "Banking")
    )`
  );
  const url = `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${formula}&maxRecords=${limit}`;

  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Airtable fetch failed: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records ?? [];
}

async function generateEmailCopy(record: AirtableRecord): Promise<EmailCopy> {
  const f = record.fields;
  const userPrompt = [
    `Lead:`,
    `Name: ${f["FULL NAME"] ?? ""}`,
    `Email: ${f.EMAIL ?? ""}`,
    `Agency: ${f["company name"] ?? ""}`,
    `City: ${f.City ?? ""}`,
    `URL: ${f.URL ?? ""}`,
    `Rank: ${f.Rank ?? ""}`,
    `Score Reason: ${f.score_reason ?? ""}`,
  ].join("\n");

  const res = await fetch(`${OPENROUTER_API}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: EMAIL_SYSTEM_PROMPT },
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
  return copy;
}

async function sendEmail(toEmail: string, copy: EmailCopy): Promise<void> {
  const res = await fetch(`${BREVO_API}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Otto from KRONOS", email: "otto@kronosbusiness.com" },
      to: [{ email: toEmail }],
      bcc: [{ email: "consulting@kronosautomations.com" }],
      subject: copy.subject,
      htmlContent: copy.emailBody,
    }),
  });

  if (!res.ok) throw new Error(`Brevo failed: ${res.status} ${await res.text()}`);
}

async function markSent(
  baseId: string,
  tableId: string,
  recordId: string,
  subject: string,
  emailBody: string
): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
  const res = await fetch(`${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        "EMAIL STATUS": "Sent",   // must match singleSelect choice exactly
        "EMAIL_SUBJECT": subject,
        "SENT MAIL": emailBody,   // actual field name in KRONOS SVIZZERA
      },
    }),
  });

  if (!res.ok) throw new Error(`Airtable update failed: ${res.status}`);
}

export async function runOutreach(leadLimit = 10): Promise<OutreachResult> {
  const baseId = process.env.AIRTABLE_BASE_ID ?? "";
  const tableId = process.env.AIRTABLE_TABLE_ID ?? "";

  if (!baseId || !tableId) throw new Error("AIRTABLE_BASE_ID / AIRTABLE_TABLE_ID not set");
  if (!process.env.AIRTABLE_API_KEY && !process.env.AIRTABLE_PAT) throw new Error("AIRTABLE_API_KEY or AIRTABLE_PAT not set");
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not set");
  if (!process.env.BREVO_API_KEY) throw new Error("BREVO_API_KEY not set");

  const result: OutreachResult = { sent: 0, failed: 0, skipped: 0, errors: [] };
  const leads = await fetchLeads(baseId, tableId, leadLimit);

  for (const lead of leads) {
    const email = lead.fields.EMAIL;
    if (!email) {
      result.skipped++;
      continue;
    }

    try {
      const copy = await generateEmailCopy(lead);
      await sendEmail(email, copy);
      await markSent(baseId, tableId, lead.id, copy.subject, copy.emailBody);
      result.sent++;
    } catch (err) {
      result.failed++;
      result.errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
