/**
 * KRONOS + HELIOS Outreach Pipeline — Orchestration Layer
 * ────────────────────────────────────────────────────────
 * Coordinates: DB reads (lib/db.ts) → AI generation → Email sends (lib/email.ts) → DB writes (lib/db.ts)
 * This file has ZERO direct Airtable or Brevo fetch calls.
 * Logging (lib/logger.ts) fires AFTER each action completes — never before.
 */

import * as db from "./db";
import { sendEmail } from "./email";
import { log } from "./logger";

export type Project = db.Project;

const OPENROUTER_API = "https://openrouter.ai/api/v1";

// ─── PROJECT CONFIG ────────────────────────────────────────────────────────────

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
KRONOS is an AI lead generation consultancy. We work with Swiss real estate agencies that have an inconsistent or insufficient flow of seller and buyer leads. We audit their acquisition setup, create content for them, and run Meta ads and other paid campaigns with their budget — generating a predictable flow of seller and buyer consultations. We also build custom tools, analytics dashboards, and other automations tailored to their business.

LANGUAGE RULE — ABSOLUTE: Write 100% in English. No exceptions. Do not use French, German, Italian, or any other language regardless of the lead's city, region, or name. If you write in any other language you have failed this task.
GREETING: 'Hello {Name},' if name available, otherwise 'Hello,'

GOAL: 4-5 sentences max. Reads like a real person sent it, not a marketing blast.

CONTENT PROTOCOL:
1. HOOK: One specific observation about their agency, city, or local market. Show you know the Swiss RE space — how competitive mandates are, how saturated the portals are, how dependent most agencies are on referrals. NEVER open with 'I noticed', 'I came across', or 'I hope this email finds you well'.
2. PROBLEM: Describe ONE specific moment when the lead generation pain actually happens — not the category, but the scene. Pick one and make it feel real:
   - It's the start of a new quarter and the pipeline is empty. The last three mandates came from referrals that won't repeat. There's no lever to pull to change that.
   - They're paying for Homegate and ImmoScout listings but waiting for sellers to come to them — every month the budget goes out and the number of inbound seller inquiries stays unpredictable.
   - A competitor agency in the same city is picking up mandates they should be winning. They're running ads, showing up in feeds, generating consultations. Meanwhile this agency has no paid acquisition in place at all.
   Choose the scene that fits the lead's city, size, or profile. Write it as if you observed their situation specifically, not as a generic industry problem.
3. SOLUTION: One sentence — KRONOS consults their acquisition strategy, runs their paid campaigns (Meta + other channels), and builds the digital infrastructure to turn ad spend into a consistent flow of seller and buyer consultations.
4. CTA: Close with two plain-text links — one to book a call, one to the website.

TONE: Direct, confident, no fluff. No exclamation marks. No ALL CAPS.

SUBJECT LINE: Max 50 chars, sentence case. Patterns: '{Agency} — seller lead acquisition', '{Name}, where are your seller leads coming from?', 'Paid acquisition for {Agency}', '{City} agencies running Meta ads for mandates'.
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
2. PROBLEM: Describe ONE specific moment when the pain actually happens — not the category of pain, but the scene. Pick one from below and make it feel real:
   - A homeowner books a site visit, your technician drives out, measures the roof, and sends the quote — then silence. Two weeks later the homeowner installed with a competitor who followed up the next day.
   - Your sales team closes a quote and hands it to installation — but the installer doesn't have the Pronovo paperwork ready, so the project sits for three weeks waiting on a form that should have been triggered automatically at close.
   - Someone submits an inquiry from your website about a 12kWp system. Your team calls them back two days later and learns they already went with someone else — because you had no same-day response in place.
   Choose the scene that fits the lead's profile. Write it as if you watched it happen at their company, not as a general industry problem.
3. SOLUTION: One sentence framing HELIOS as an intelligence and process consulting partner — we map where the pipeline breaks, build the fix, and hand it back to your team. The outcome: fewer dropped leads, faster installs, less time on paperwork.
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
- Signature: <p style="margin-top:24px;padding-top:14px;border-top:1px solid #e0e0e0;font-size:13px;color:#555555;line-height:1.6;">Otto – HELIOS<br>Clean Solar Intelligence · Switzerland<br><a href="mailto:otto@heliosbusiness.com" style="color:#22C55E;text-decoration:none;">otto@heliosbusiness.com</a></p>

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

    const senderEmail = process.env.HELIOS_SENDER_EMAIL ?? "otto@heliosbusiness.com";
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
          {EMAIL STATUS} != "Processing",
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

export type AirtableRecord = db.AirtableRecord;

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
  company?: string;
  subject: string;
  emailBody: string;
  originalSubject?: string;
  originalBody?: string;
  wasEdited: boolean;
  wasRegenerated: boolean;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function mapLeadFields(lead: db.AirtableRecord): EmailPreview["lead"] {
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

// ─── AI EMAIL GENERATION ───────────────────────────────────────────────────────

export async function generateEmailCopy(
  record: db.AirtableRecord,
  project: Project = "kronos",
  extraConstraint?: string
): Promise<EmailCopy> {
  const f = record.fields;
  const config = getProjectConfig(project);

  // 1. Try to load a dynamic system prompt override from Airtable Settings
  let systemPrompt = config.systemPrompt;
  const override = await db.fetchPromptOverride(config.baseId, "email_prompt");
  if (override) systemPrompt = override;

  // 2. Few-shot examples from human-edited emails
  const examples = await db.fetchEditingExamples(config.baseId, config.tableId);
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

  const res = await fetch(`${OPENROUTER_API}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
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

// ─── PUBLIC API ────────────────────────────────────────────────────────────────

/** Fetch sent archive for analytics cross-reference. */
export async function fetchSentArchive(limit = 100, project: Project = "kronos"): Promise<db.AirtableRecord[]> {
  const config = getProjectConfig(project);
  return db.fetchSentArchive(config.baseId, config.tableId, limit);
}

/** Generate email copy for all leads without sending. Returns previews for gallery review. */
export async function previewOutreach(leadLimit = 10, project: Project = "kronos"): Promise<EmailPreview[]> {
  const config = getProjectConfig(project);
  const leads = await db.fetchLeads(config.baseId, config.tableId, config.leadFilter, leadLimit);

  const results = await Promise.all(
    leads.map(async (lead) => {
      if (!lead.fields.EMAIL) return null;
      const leadFields = mapLeadFields(lead);
      try {
        const copy = await generateEmailCopy(lead, project);
        return { recordId: lead.id, lead: leadFields, subject: copy.subject, emailBody: copy.emailBody };
      } catch (err) {
        log.error("preview_generation_failed", err, { recordId: lead.id, project });
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

/**
 * Send a pre-approved set of emails (from gallery review).
 * Logging fires AFTER each action — never before.
 */
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

      // Guard: skip if already sent or being processed
      const currentStatus = await db.fetchEmailStatus(config.baseId, config.tableId, item.recordId);
      const normalizedStatus = currentStatus?.trim();
      if (normalizedStatus === "Sent" || normalizedStatus === "Processing") {
        result.skipped++;
        result.errors.push(`${item.toEmail}: already ${normalizedStatus} — skipped`);
        return;
      }

      // Claim the record (distributed soft-lock)
      try {
        await db.markProcessing(config.baseId, config.tableId, item.recordId, project);
      } catch {
        result.skipped++;
        result.errors.push(`${item.toEmail}: could not claim record — skipped`);
        return;
      }

      try {
        // 1. Send email via Brevo
        await sendEmail(
          item.toEmail,
          { subject: item.subject, emailBody: item.emailBody },
          { senderName: config.senderName, senderEmail: config.senderEmail, bccEmail: config.bccEmail, tag: config.tag }
        );

        // 2. Log AFTER successful send (not before)
        log.sent(item.recordId, item.company ?? item.toEmail, item.toEmail, item.wasEdited, item.wasRegenerated);

        // 3. Update Airtable record
        await db.markSent(
          config.baseId, config.tableId, item.recordId,
          item.subject, item.emailBody, project,
          item.originalSubject, item.originalBody
        );

        result.sent++;
      } catch (err) {
        // Release lock and log failure
        log.error("send_item_failed", err, { recordId: item.recordId, toEmail: item.toEmail, project });
        await db.markFailed(config.baseId, config.tableId, item.recordId, project);
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
  const leads = await db.fetchLeads(config.baseId, config.tableId, config.leadFilter, leadLimit);

  const BATCH_SIZE = 5;
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (lead) => {
      const email = lead.fields.EMAIL;
      if (!email) { result.skipped++; return; }

      const currentStatus = await db.fetchEmailStatus(config.baseId, config.tableId, lead.id);
      const normalizedStatus = currentStatus?.trim();
      if (normalizedStatus === "Sent" || normalizedStatus === "Processing") {
        result.skipped++;
        return;
      }

      try {
        await db.markProcessing(config.baseId, config.tableId, lead.id, project);
      } catch {
        result.skipped++;
        return;
      }

      try {
        const copy = await generateEmailCopy(lead, project);

        await sendEmail(
          email,
          { subject: copy.subject, emailBody: copy.emailBody },
          { senderName: config.senderName, senderEmail: config.senderEmail, bccEmail: config.bccEmail, tag: config.tag }
        );

        const company = String(lead.fields["company name"] ?? email);
        log.sent(lead.id, company, email, false, false);

        await db.markSent(config.baseId, config.tableId, lead.id, copy.subject, copy.emailBody, project);

        result.sent++;
      } catch (err) {
        log.error("run_outreach_item_failed", err, { recordId: lead.id, email, project });
        await db.markFailed(config.baseId, config.tableId, lead.id, project);
        result.failed++;
        result.errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }));
  }

  return result;
}
