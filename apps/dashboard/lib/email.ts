/**
 * Email Sending Layer — Brevo SMTP
 * ─────────────────────────────────
 * Single responsibility: POST to Brevo and return success/failure.
 * No Airtable calls. No logging. No business logic.
 * Retry on 5xx (up to 2 attempts with back-off).
 */

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

export interface EmailPayload {
  subject: string;
  emailBody: string;
}

export interface SenderConfig {
  senderName: string;
  senderEmail: string;
  bccEmail: string;
  tag: string;
}

/**
 * Send a single email via Brevo SMTP.
 * Throws on permanent failure (4xx) or after exhausting retries (5xx).
 */
export async function sendEmail(
  toEmail: string,
  payload: EmailPayload,
  sender: SenderConfig,
  attempt = 0
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY ?? "";
  if (!apiKey) throw new Error("BREVO_API_KEY not configured");

  const res = await fetchWithTimeout(`${BREVO_API}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: sender.senderName, email: sender.senderEmail },
      to: [{ email: toEmail }],
      bcc: [{ email: sender.bccEmail }],
      subject: payload.subject,
      htmlContent: payload.emailBody,
      tags: [sender.tag],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    // Retry on server errors (502, 503, 504) with exponential back-off
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1_000 * (attempt + 1)));
      return sendEmail(toEmail, payload, sender, attempt + 1);
    }
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }
}

/**
 * Send a single transactional email (used by agent / one-off sends).
 * Same behaviour as sendEmail but accepts a flat config object.
 */
export async function sendTransactional(opts: {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  senderName: string;
  senderEmail: string;
  tag: string;
}): Promise<{ messageId: string }> {
  const apiKey = process.env.BREVO_API_KEY ?? "";
  if (!apiKey) throw new Error("BREVO_API_KEY not configured");

  const res = await fetchWithTimeout(`${BREVO_API}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: opts.senderName, email: opts.senderEmail },
      to: [{ email: opts.toEmail, name: opts.toName }],
      subject: opts.subject,
      htmlContent: opts.htmlContent,
      tags: [opts.tag],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo transactional failed (${res.status}): ${body}`);
  }

  return (await res.json()) as { messageId: string };
}
