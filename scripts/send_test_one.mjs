/**
 * One-off test: pick a random priority lead, generate email copy, send to override address.
 * Usage: AIRTABLE_PAT=... OPENROUTER_KEY=... BREVO_KEY=... TO_EMAIL=... node scripts/send_test_one.mjs
 */
import https from 'https';

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const BREVO_KEY = process.env.BREVO_KEY;
const TO_EMAIL = process.env.TO_EMAIL;
const BASE = 'appLriEwWldpPTMPg', TABLE = 'tblLZkFo7Th7uyfWB';

if (!AIRTABLE_PAT || !OPENROUTER_KEY || !BREVO_KEY || !TO_EMAIL) {
  console.error('Missing env vars: AIRTABLE_PAT OPENROUTER_KEY BREVO_KEY TO_EMAIL');
  process.exit(1);
}

function httpReq(hostname, path, method, headers, body) {
  return new Promise((res, rej) => {
    const req = https.request(
      { hostname, path, method, headers },
      r => { const c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res(JSON.parse(c.join(''))); } catch { res({ raw: c.join('') }); } }); }
    );
    req.on('error', rej);
    if (body) req.write(body);
    req.end();
  });
}

// Fetch top priority leads and pick one randomly
const formula = encodeURIComponent(
  `AND({EMAIL} != "", {Rank} >= 8, OR(FIND(".ch", {URL}) > 0, {URL} = ""), NOT({Category} = "Financial Services"), NOT({Category} = "Banking"))`
);
const fields = ['FULL NAME','company name','City','EMAIL','URL','Rank','score_reason']
  .map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

const data = await httpReq(
  'api.airtable.com',
  `/v0/${BASE}/${TABLE}?filterByFormula=${formula}&${fields}&maxRecords=20&sort[0][field]=Rank&sort[0][direction]=desc`,
  'GET',
  { Authorization: `Bearer ${AIRTABLE_PAT}` }
);

if (data.error) { console.error('Airtable error:', JSON.stringify(data.error)); process.exit(1); }

const leads = data.records ?? [];
if (!leads.length) { console.error('No qualifying leads found'); process.exit(1); }

const lead = leads[Math.floor(Math.random() * leads.length)];
const f = lead.fields;

console.log('\n🎲 Random pick:');
console.log(`   Name:   ${f['FULL NAME'] || '—'}`);
console.log(`   Agency: ${f['company name'] || '—'}`);
console.log(`   City:   ${f['City'] || '—'}`);
console.log(`   Email:  ${f['EMAIL']}`);
console.log(`   Rank:   ${f['Rank']} | ${f['score_reason'] || '—'}\n`);

const SYSTEM_PROMPT = `You are a cold email specialist writing on behalf of KRONOS Automations.
KRONOS is an AI automation consultancy. We work with Swiss real estate agencies to map and automate the manual, repetitive parts of their business — follow-up sequences, lead qualification, client onboarding, mandate tracking — so their consultants spend time on work that actually requires a human.

LANGUAGE RULE — ABSOLUTE: Write 100% in English. No exceptions. Do not use French, German, Italian, or any other language regardless of the lead's city, region, or name. If you write in any other language you have failed this task.
GREETING: Hello {Name}, if name available, otherwise Hello,

GOAL: 4-5 sentences max. Reads like a real person sent it, not a marketing blast.

CONTENT PROTOCOL:
1. HOOK: One specific observation about their agency, city, or market segment. Show you know the Swiss RE space — mandate competition, referral dependency, follow-up gaps. NEVER open with I noticed, I came across, or I hope this email finds you well.
2. PROBLEM: One concrete operational pain — agents losing warm seller contacts because there is no follow-up system, time wasted on unqualified inquiries that never convert, or a mandate pipeline that resets to zero every quarter because it runs entirely on referrals.
3. SOLUTION: One sentence framing KRONOS as an automation consulting partner — we audit the workflow, identify what can be automated, and build it. The outcome is that your team handles fewer manual tasks and more high-value client conversations.
4. CTA: Close with two plain-text links — one to book a call, one to the website.

TONE: Direct, confident, no fluff. No buzzwords: no streamline, leverage, game-changer, innovative, cutting-edge, scalable, synergy. No exclamation marks. No ALL CAPS.

SUBJECT LINE: Max 50 chars, sentence case. Patterns: {Agency} automation audit, {Name} a question about your workflow, Reducing manual work at {Agency}, {City} RE agencies + AI automation.
NEVER: generic quick question, following up, touching base.

HTML FORMAT (plain-text style — no images, no styled buttons, no decorative borders):
- Outer wrapper: <div style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#111111;max-width:580px;">
- Body paragraphs: <p style="margin:0 0 16px 0;">content</p>
- CTA (plain text links, NOT buttons):
  <p style="margin:0 0 16px 0;"><a href="https://cal.com/kronosautomations/15min" style="color:#FF6B00;">Book a 15-min call</a><br>Or review our work first: <a href="https://kronosautomations.com" style="color:#FF6B00;">kronosautomations.com</a></p>
- Signature: <p style="margin-top:24px;padding-top:14px;border-top:1px solid #e0e0e0;font-size:13px;color:#555555;line-height:1.6;">Otto – KRONOS Automations<br>AI Automation Consulting · Switzerland<br><a href="mailto:otto@kronosbusiness.com" style="color:#FF6B00;text-decoration:none;">otto@kronosbusiness.com</a></p>

Response MUST be ONLY valid JSON no markdown fences: {"subject": "...", "emailBody": "..."}`;

const userPrompt = [
  'Lead:',
  `Name: ${f['FULL NAME'] || ''}`,
  `Agency: ${f['company name'] || ''}`,
  `City: ${f['City'] || ''}`,
  `URL: ${f['URL'] || ''}`,
  `Rank: ${f['Rank']}`,
  `Score Reason: ${f['score_reason'] || ''}`,
].join('\n');

console.log('Generating email copy via OpenRouter...');

const orBodyStr = JSON.stringify({
  model: 'openai/gpt-4o-mini',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ],
  temperature: 0.7,
  max_tokens: 1000,
  response_format: { type: 'json_object' },
});

const orResult = await httpReq(
  'openrouter.ai',
  '/api/v1/chat/completions',
  'POST',
  { Authorization: `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(orBodyStr) },
  orBodyStr
);

const content = orResult.choices?.[0]?.message?.content ?? '{}';
const copy = JSON.parse(content);

console.log(`\nSUBJECT: ${copy.subject}`);
console.log('\nBODY PREVIEW:');
const plain = (copy.emailBody || '').replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim().substring(0, 500);
console.log(plain);
console.log(`\n[HTML: ${copy.emailBody?.length ?? 0} chars]\n`);

console.log(`Sending to ${TO_EMAIL} via Brevo...`);

const brevoBodyStr = JSON.stringify({
  sender: { name: 'Otto from KRONOS', email: 'otto@kronosbusiness.com' },
  to: [{ email: TO_EMAIL }],
  subject: `[TEST — ${f['company name'] || f['FULL NAME']}] ${copy.subject}`,
  htmlContent: copy.emailBody,
});

const brevoResult = await httpReq(
  'api.brevo.com',
  '/v3/smtp/email',
  'POST',
  { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(brevoBodyStr) },
  brevoBodyStr
);

if (brevoResult.messageId) {
  console.log(`Sent. Message ID: ${brevoResult.messageId}`);
} else {
  console.error('Brevo error:', JSON.stringify(brevoResult));
  process.exit(1);
}
