/**
 * Airtable Database Layer — KRONOS + HELIOS
 * ─────────────────────────────────────────
 * All Airtable reads and writes are centralised here.
 * No email sending. No stdout logging beyond critical errors.
 * Import and use these functions from the orchestration layer (outreach.ts).
 */

const AIRTABLE_API = "https://api.airtable.com/v0";

// ─── INTERNAL ──────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, init: RequestInit, ms = 15_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function apiKey(): string {
  return process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT ?? "";
}

function authHeaders() {
  return { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" };
}

async function patch(
  baseId: string,
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const res = await fetchWithTimeout(
    `${AIRTABLE_API}/${baseId}/${tableId}/${recordId}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ fields }),
    }
  );
  if (!res.ok) {
    throw new Error(`Airtable PATCH ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

// ─── STATUS CONSTANTS ──────────────────────────────────────────────────────────

export type Project = "kronos" | "helios";

/**
 * KRONOS singleSelect choices have trailing spaces baked into Airtable.
 * HELIOS uses plain text fields without trailing spaces.
 */
export function processingStatus(project: Project): string {
  return project === "helios" ? "Processing" : "Processing ";
}

export function failedStatus(project: Project): string {
  return project === "helios" ? "Failed" : "Failed ";
}

export const SENT_STATUS = "Sent";

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

// ─── READS ─────────────────────────────────────────────────────────────────────

/** Check the current EMAIL STATUS of a single record (used for dedup guard). */
export async function fetchEmailStatus(
  baseId: string,
  tableId: string,
  recordId: string
): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `${AIRTABLE_API}/${baseId}/${tableId}/${recordId}?fields[]=EMAIL%20STATUS`,
      { headers: { Authorization: `Bearer ${apiKey()}` } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { fields?: { "EMAIL STATUS"?: string } };
    return data.fields?.["EMAIL STATUS"] ?? null;
  } catch {
    return null;
  }
}

/** Fetch unsent leads matching a pre-built Airtable filter formula. */
export async function fetchLeads(
  baseId: string,
  tableId: string,
  leadFilter: string,
  limit: number
): Promise<AirtableRecord[]> {
  const url = `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${leadFilter}&maxRecords=${limit}`;
  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) {
    throw new Error(`Airtable fetchLeads failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records ?? [];
}

/** Fetch sent archive sorted by rank (for analytics cross-reference). */
export async function fetchSentArchive(
  baseId: string,
  tableId: string,
  limit = 100
): Promise<AirtableRecord[]> {
  const formula = encodeURIComponent(`{EMAIL STATUS} = "Sent"`);
  const url = `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${formula}&maxRecords=${limit}&sort[0][field]=Rank&sort[0][direction]=desc`;
  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) {
    throw new Error(`Archive fetch failed: ${res.status} — ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as { records: AirtableRecord[] };
  return data.records ?? [];
}

/** Fetch human-edited examples for few-shot learning in email generation. */
export async function fetchEditingExamples(
  baseId: string,
  tableId: string,
  limit = 3
): Promise<string> {
  const formula = encodeURIComponent(`AND({ORIGINAL_SUBJECT} != "", {ORIGINAL_SUBJECT} != {EMAIL_SUBJECT})`);
  const url = `${AIRTABLE_API}/${baseId}/${tableId}?filterByFormula=${formula}&maxRecords=${limit}&sort[0][field]=Rank&sort[0][direction]=desc`;
  try {
    const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${apiKey()}` } });
    if (!res.ok) return "";
    const data = (await res.json()) as { records: AirtableRecord[] };
    if (!data.records?.length) return "";
    return data.records
      .map((r) => {
        const f = r.fields;
        return [
          "### EXAMPLE IMPROVEMENT:",
          `Original Subject: ${f.ORIGINAL_SUBJECT}`,
          `Original Body: ${f.ORIGINAL_BODY}`,
          "",
          `Final Sent Subject (PREFERRED): ${f.EMAIL_SUBJECT}`,
          `Final Sent Body (PREFERRED): ${f["SENT MAIL"]}`,
          "---",
        ].join("\n");
      })
      .join("\n\n");
  } catch {
    return "";
  }
}

/** Fetch a dynamic system prompt override from the Settings table. */
export async function fetchPromptOverride(
  baseId: string,
  key: string
): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `${AIRTABLE_API}/${baseId}/Settings?filterByFormula={Key}='${key}'`,
      { headers: { Authorization: `Bearer ${apiKey()}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.records?.[0]?.fields?.Value ?? null;
  } catch {
    return null;
  }
}

// ─── WRITES ────────────────────────────────────────────────────────────────────

/**
 * Claim a lead record as being processed (distributed soft-lock).
 * Throws if Airtable update fails — caller should skip this lead.
 */
export async function markProcessing(
  baseId: string,
  tableId: string,
  recordId: string,
  project: Project
): Promise<void> {
  await patch(baseId, tableId, recordId, {
    "EMAIL STATUS": processingStatus(project),
  });
}

/**
 * Mark a record as successfully sent.
 * Stores the final subject + body. KRONOS also stores original copy for diff tracking.
 */
export async function markSent(
  baseId: string,
  tableId: string,
  recordId: string,
  subject: string,
  emailBody: string,
  project: Project,
  originalSubject?: string,
  originalBody?: string
): Promise<void> {
  const fields: Record<string, unknown> = {
    "EMAIL STATUS": SENT_STATUS,
    EMAIL_SUBJECT: subject,
    "SENT MAIL": emailBody,
  };

  // KRONOS-only tracking fields
  if (project !== "helios") {
    fields["DATE_SENT"] = new Date().toISOString();
    if (originalSubject && originalSubject !== subject) {
      fields["ORIGINAL_SUBJECT"] = originalSubject;
    }
    if (originalBody && originalBody !== emailBody) {
      fields["ORIGINAL_BODY"] = originalBody;
    }
  }

  await patch(baseId, tableId, recordId, fields);
}

/**
 * Release a processing lock on failure.
 * Never throws — a failed unlock is logged but does not mask the original error.
 */
export async function markFailed(
  baseId: string,
  tableId: string,
  recordId: string,
  project: Project
): Promise<void> {
  try {
    await patch(baseId, tableId, recordId, {
      "EMAIL STATUS": failedStatus(project),
    });
  } catch (err) {
    console.error(`[db] markFailed CRITICAL — could not release lock for ${recordId}`, err);
  }
}
