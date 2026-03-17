/**
 * KRONOS Test Email Generator — dry-run only, no sends
 * Fetches top-scored real estate agency leads, generates copy, prints to console.
 * Usage: AIRTABLE_PAT=... OPENROUTER_KEY=... node scripts/test_email_gen.mjs [--limit N]
 */
import https from 'https';

const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] ?? '3');
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const BASE = 'appLriEwWldpPTMPg', TABLE = 'tblLZkFo7Th7uyfWB';

if (!AIRTABLE_PAT || !OPENROUTER_KEY) {
  console.error('Missing AIRTABLE_PAT or OPENROUTER_KEY'); process.exit(1);
}

function atGet(qs) {
  return new Promise((res, rej) => {
    const req = https.get(
      `https://api.airtable.com/v0/${BASE}/${TABLE}?${qs}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } },
      r => { const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(JSON.parse(c.join('')))); }
    );
    req.on('error', rej);
  });
}

function orChat(messages) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });
    const req = https.request(
      { hostname: 'openrouter.ai', path: '/api/v1/chat/completions', method: 'POST',
        headers: { Authorization: `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      r => { const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(JSON.parse(c.join('')))); }
    );
    req.on('error', rej);
    req.write(body); req.end();
  });
}

const SYSTEM_PROMPT = `You are a cold email specialist writing on behalf of KRONOS Automations.
KRONOS is an AI automation consultancy. We work with Swiss real estate agencies to map and automate the manual, repetitive parts of their business — follow-up sequences, lead qualification, client onboarding, mandate tracking — so their consultants spend time on work that actually requires a human.

LANGUAGE: English only. Always.
GREETING: 'Hello {Name},' if name available, otherwise 'Hello,'

GOAL: 4-5 sentences max. Reads like a real person sent it, not a marketing blast.

CONTENT PROTOCOL:
1. HOOK: One specific observation about their agency, city, or market segment. Show you know the Swiss RE space — mandate competition, referral dependency, follow-up gaps. NEVER open with 'I noticed', 'I came across', or 'I hope this email finds you well'.
2. PROBLEM: One concrete operational pain — agents losing warm seller contacts because there is no follow-up system, time wasted on unqualified inquiries that never convert, or a mandate pipeline that resets to zero every quarter because it runs entirely on referrals.
3. SOLUTION: One sentence framing KRONOS as an automation consulting partner — we audit the workflow, identify what can be automated, and build it. The outcome is that your team handles fewer manual tasks and more high-value client conversations.
4. DUAL CTA: Close with both options — a quick call to explore fit, or the website to review our work first.

TONE: Direct, confident, no fluff. No buzzwords: no 'streamline', 'leverage', 'game-changer', 'innovative', 'cutting-edge', 'scalable', 'synergy'. No exclamation marks. No ALL CAPS.

SUBJECT LINE: Max 50 chars, sentence case. Patterns: '{Agency} – automation audit', '{Name}, a question about your workflow', 'Reducing manual work at {Agency}', '{City} RE agencies + AI automation'.
NEVER: generic 'quick question', 'following up', 'touching base'.

HTML BRANDING:
- Wrapper: <div style="max-width:550px;margin:auto;padding:30px;border:2px solid #1A1A1A;border-top:10px solid #FF6B00;font-family:'Inter',sans-serif;color:#1A1A1A;line-height:1.6;">
- Logo: <div style="text-align:center;padding:20px 0;"><img src="https://kronosautomations.com/logo.png" alt="KRONOS" width="120" style="image-rendering:pixelated;"></div>
- Body: <p> tags only, clean HTML.
- DUAL CTA (use exactly):
  <p style="margin-top:20px;"><a href="https://cal.com/othman-zraidi-o24jj1/15min" style="display:inline-block;background:#FF6B00;color:#fff;font-weight:bold;padding:10px 20px;text-decoration:none;border-radius:3px;margin-right:10px;">Book a 15-min call</a><a href="https://kronosautomations.com" style="display:inline-block;color:#FF6B00;font-weight:bold;padding:10px 4px;text-decoration:underline;">See our work →</a></p>
- Signature: <div style="border-top:2px dotted #FF6B00;margin-top:25px;padding-top:10px;font-size:14px;"><strong>Otto – KRONOS Automations</strong><br>AI Automation Consulting · Switzerland<br><a href="mailto:otto@kronosbusiness.com" style="color:#FF6B00;text-decoration:none;">otto@kronosbusiness.com</a> | <a href="https://kronosautomations.com" style="color:#FF6B00;text-decoration:none;">kronosautomations.com</a></div>

Response MUST be ONLY valid JSON (no markdown fences): {"subject": "...", "emailBody": "..."}`;

// Fetch top-scored Swiss RE agency leads (exclude non-CH domains, non-RE categories)
const formula = encodeURIComponent(
  `AND({EMAIL} != "", OR({EMAIL STATUS} = BLANK(), NOT({EMAIL STATUS} = "Sent")), {Rank} >= 5, OR(FIND(".ch", {URL}) > 0, {URL} = ""), NOT({Category} = "Financial Services"), NOT({Category} = "Investment Management"), NOT({Category} = "Banking"))`
);
const fields = ['FULL NAME', 'company name', 'City', 'EMAIL', 'Phone', 'URL', 'Rank', 'score_reason', 'Category']
  .map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
const sort = `sort[0][field]=Rank&sort[0][direction]=desc`;

const data = await atGet(`filterByFormula=${formula}&${fields}&${sort}&maxRecords=${LIMIT}`);
if (data.error) { console.error('Airtable error:', JSON.stringify(data.error)); process.exit(1); }

const leads = data.records ?? [];
console.log(`\n╔══════════════════════════════════════════════════════════╗`);
console.log(`║  KRONOS TEST EMAIL GENERATOR — ${leads.length} leads (dry run)${' '.repeat(Math.max(0,13-leads.length.toString().length))}║`);
console.log(`╚══════════════════════════════════════════════════════════╝\n`);

if (leads.length === 0) {
  console.log('No scored leads found. Run the scorer first.');
  process.exit(0);
}

for (let i = 0; i < leads.length; i++) {
  const lead = leads[i];
  const f = lead.fields;
  const name = f['FULL NAME'] || '';
  const agency = f['company name'] || '';

  console.log(`── Lead ${i + 1}/${leads.length} ──────────────────────────────────────`);
  console.log(`Name:   ${name}`);
  console.log(`Agency: ${agency}`);
  console.log(`City:   ${f['City'] || '—'}`);
  console.log(`Email:  ${f['EMAIL']}`);
  console.log(`Rank:   ${f['Rank']} | ${f['score_reason'] || '—'}`);
  console.log(`\nGenerating email copy...`);

  const userPrompt = [
    `Lead:`,
    `Name: ${name}`,
    `Email: ${f['EMAIL']}`,
    `Agency: ${agency}`,
    `City: ${f['City'] || ''}`,
    `URL: ${f['URL'] || ''}`,
    `Rank: ${f['Rank']}`,
    `Score Reason: ${f['score_reason'] || ''}`,
  ].join('\n');

  try {
    const result = await orChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);
    const content = result.choices?.[0]?.message?.content ?? '{}';
    const copy = JSON.parse(content);

    console.log(`\nSUBJECT: ${copy.subject}`);
    console.log(`\nBODY (plain text extract):`);
    // Strip HTML for readable preview
    const plain = (copy.emailBody || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 400);
    console.log(plain + (copy.emailBody?.length > 400 ? '...' : ''));
    console.log(`\n[Full HTML body: ${copy.emailBody?.length ?? 0} chars]\n`);
  } catch (e) {
    console.log(`ERROR generating copy: ${e.message}\n`);
  }
}

console.log(`══════════════════════════════════════════════════════════`);
console.log(`Done. No emails were sent (dry run).`);
console.log(`To send real emails, trigger the Vercel API: POST /api/campaign/launch`);
