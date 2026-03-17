/**
 * KRONOS Lead Scorer — standalone Node.js script
 * Reads config from INDUSTRY_CONFIG env var (JSON string) or local file via CONFIG_PATH
 * Usage: AIRTABLE_PAT=... OPENROUTER_KEY=... node scripts/run_scorer.mjs [--dry-run]
 */
import https from 'https';

const DRY_RUN = process.argv.includes('--dry-run');
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const BASE = 'appLriEwWldpPTMPg', TABLE = 'tblLZkFo7Th7uyfWB';
const config = JSON.parse(process.env.INDUSTRY_CONFIG);

if (!AIRTABLE_PAT) { console.error('Missing AIRTABLE_PAT'); process.exit(1); }
if (!OPENROUTER_KEY) { console.error('Missing OPENROUTER_KEY'); process.exit(1); }

function atReq(path, opts = {}) {
  return new Promise((res, rej) => {
    const body = opts.body ? JSON.stringify(opts.body) : undefined;
    const req = https.request(
      { hostname: 'api.airtable.com', path: '/v0/' + path, method: opts.method || 'GET',
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) } },
      r => { const c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res(JSON.parse(c.join(''))); } catch { res({ raw: c.join('') }); } }); }
    );
    req.on('error', rej);
    if (body) req.write(body);
    req.end();
  });
}

function orReq(messages) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({ model: 'openai/gpt-4o-mini', messages, temperature: 0.3, max_tokens: 2000 });
    const req = https.request(
      { hostname: 'openrouter.ai', path: '/api/v1/chat/completions', method: 'POST',
        headers: { Authorization: `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      r => { const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(JSON.parse(c.join('')))); }
    );
    req.on('error', rej);
    req.write(body);
    req.end();
  });
}

async function fetchUnscored() {
  const formula = encodeURIComponent(`OR({Rank} = BLANK(), {Rank} = 0)`);
  const fields = ['company name', 'FULL NAME', 'EMAIL', 'Phone', 'City', 'Category']
    .map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
  let all = [], offset = '';
  do {
    const qs = `filterByFormula=${formula}&${fields}&pageSize=100${offset ? '&offset=' + offset : ''}`;
    const d = await atReq(`${BASE}/${TABLE}?${qs}`);
    if (d.error) throw new Error(JSON.stringify(d.error));
    all = all.concat(d.records || []);
    offset = d.offset || '';
    process.stdout.write(`\rFetched ${all.length} unscored leads...`);
  } while (offset);
  console.log('');
  return all;
}

async function scoreBatch(batch) {
  const criteria = config.scoring.criteria
    .map(c => `- ${c.name.replace(/_/g, ' ')} (+${c.weight}): ${c.description}`)
    .join('\n');
  const leadsText = batch.map((r, i) => {
    const f = r.fields;
    return `[${i}] ${f['company name'] || f['FULL NAME'] || '?'} | ${f['City'] || '?'} | ${f['EMAIL'] ? 'email' : 'no-email'} | ${f['Phone'] ? 'phone' : 'no-phone'} | ${f['Category'] || '?'}`;
  }).join('\n');

  const prompt = `Score these ${batch.length} Swiss leads 1-10 for real estate B2B outreach priority.

Scoring criteria:
${criteria}

Leads:
${leadsText}

Return ONLY a valid JSON array (no markdown):
[{"index":0,"score":7,"reason":"max 15 words"}, ...]`;

  const result = await orReq([
    { role: 'system', content: config.scoring.system_prompt },
    { role: 'user', content: prompt },
  ]);

  const content = result.choices?.[0]?.message?.content ?? '[]';
  try { return JSON.parse(content); }
  catch { const m = content.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : []; }
}

async function patchRecords(records) {
  // Airtable PATCH: up to 10 per request
  for (let i = 0; i < records.length; i += 10) {
    const chunk = records.slice(i, i + 10);
    const d = await atReq(`${BASE}/${TABLE}`, { method: 'PATCH', body: { records: chunk } });
    if (d.error) console.error('  Patch error:', JSON.stringify(d.error));
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
if (DRY_RUN) console.log('[DRY RUN — no Airtable writes]\n');
const leads = await fetchUnscored();
console.log(`Total unscored: ${leads.length}\n`);

const BATCH = 20;
const thresholds = config.scoring.thresholds; // { priority:7, medium:5, low:0 }
let totalScored = 0, counts = { priority: 0, medium: 0, low: 0 };

for (let i = 0; i < leads.length; i += BATCH) {
  const batch = leads.slice(i, i + BATCH);
  const batchNum = Math.floor(i / BATCH) + 1;
  const total = Math.ceil(leads.length / BATCH);
  process.stdout.write(`Batch ${batchNum}/${total} (leads ${i + 1}–${Math.min(i + BATCH, leads.length)})... `);

  try {
    const scores = await scoreBatch(batch);
    const updates = scores.map(s => {
      const lead = batch[s.index];
      if (!lead || s.score == null) return null;
      const status = s.score >= thresholds.priority ? 'priority' : s.score >= thresholds.medium ? 'medium' : 'low';
      counts[status]++;
      return { id: lead.id, fields: { Rank: s.score, score_reason: s.reason, lead_status: status } };
    }).filter(Boolean);

    if (!DRY_RUN) await patchRecords(updates);
    totalScored += updates.length;
    console.log(`✓ ${updates.length} scored`);

    // Print dry-run preview
    if (DRY_RUN && batchNum <= 2) {
      scores.slice(0, 5).forEach(s => {
        const lead = batch[s.index];
        const f = lead?.fields;
        console.log(`  [${s.score}] ${(f?.['company name'] || f?.['FULL NAME'] || '?').padEnd(35)} ${s.reason}`);
      });
    }
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }

  if (i + BATCH < leads.length) await new Promise(r => setTimeout(r, 800));
}

console.log(`\n═══ SCORING ${DRY_RUN ? 'PREVIEW' : 'COMPLETE'} ═══`);
console.log(`Scored:           ${totalScored} / ${leads.length}`);
console.log(`Priority (≥${thresholds.priority}):    ${counts.priority}`);
console.log(`Medium (${thresholds.medium}–${thresholds.priority - 1}):       ${counts.medium}`);
console.log(`Low (<${thresholds.medium}):         ${counts.low}`);
