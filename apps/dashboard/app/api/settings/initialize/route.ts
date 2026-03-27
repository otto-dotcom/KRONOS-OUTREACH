import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT;
  const AIRTABLE_API = "https://api.airtable.com/v0";

  if (!baseId || !apiKey) return NextResponse.json({ error: "Airtable not configured" }, { status: 500 });

  try {
    const defaultPrompt = `You are a cold email specialist writing on behalf of KRONOS Automations.
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

Response MUST be ONLY valid JSON (no markdown fences): {"subject": "...", "emailBody": "..."}`;

    // Create the record in Settings table
    const createUrl = `${AIRTABLE_API}/${baseId}/Settings`;
    const res = await fetch(createUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { Key: "copy_directives", Value: defaultPrompt } }),
    });

    if (!res.ok) throw new Error(await res.text());

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
