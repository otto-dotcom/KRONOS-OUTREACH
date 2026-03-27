/**
 * KRONOS Lead Scorer — optimized for Swiss Real Estate
 * Usage: node scripts/scorer/score_leads.mjs [--dry-run] [--industry=swiss_realestate]
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// ARGUMENTS
const DRY_RUN = process.argv.includes('--dry-run');
const INDUSTRY = process.argv.find(a => a.startsWith('--industry='))?.split('=')[1] || 'swiss_realestate';

// ENV
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [k, v] = line.split('=');
        process.env[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}
loadEnv();

const AIRTABLE_PAT = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const BASE = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE_ID;

if (!AIRTABLE_PAT || !OPENROUTER_KEY || !BASE || !TABLE) {
  console.error('Missing required environment variables (AIRTABLE_PAT, OPENROUTER_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)');
  process.exit(1);
}

// LOAD CONFIG
const configPath = path.join(PROJECT_ROOT, 'scripts', 'config', 'industries', `${INDUSTRY}.json`);
if (!fs.existsSync(configPath)) {
  console.error(`Config not found for industry: ${INDUSTRY}`);
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log(`\x1b[96m[LEAD-SCORER]\x1b[0m Targeting: ${config.display_name}`);

function atReq(path, opts = {}) {
  return new Promise((res, rej) => {
    const body = opts.body ? JSON.stringify(opts.body) : undefined;
    const req = https.request(
      { 
        hostname: 'api.airtable.com', 
        path: '/v0/' + path, 
        method: opts.method || 'GET',
        headers: { 
          Authorization: `Bearer ${AIRTABLE_PAT}`, 
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) 
        } 
      },
      r => { 
        const c = []; 
        r.on('data', d => c.push(d)); 
        r.on('end', () => { 
          try { res(JSON.parse(c.join(''))); } catch { res({ raw: c.join('') }); } 
        }); 
      }
    );
    req.on('error', rej);
    if (body) req.write(body);
    req.end();
  });
}

function orReq(messages) {
  return new Promise((res, rej) => {
    const body = JSON.stringify({ 
        model: config.scoring.model || 'openai/gpt-4o-mini', 
        messages, 
        temperature: 0.3, 
        max_tokens: 2000 
    });
    const req = https.request(
      { 
        hostname: 'openrouter.ai', 
        path: '/api/v1/chat/completions', 
        method: 'POST',
        headers: { 
            Authorization: `Bearer ${OPENROUTER_KEY}`, 
            'Content-Type': 'application/json', 
            'Content-Length': Buffer.byteLength(body) 
        } 
      },
      r => { const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(JSON.parse(c.join('')))); }
    );
    req.on('error', rej);
    req.write(body);
    req.end();
  });
}

async function fetchUnscored() {
  const formula = encodeURIComponent(`OR({Rank} = BLANK(), {Rank} = 0)`);
  const fields = ['company name', 'EMAIL', 'Phone', 'City', 'Category']
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
    return `[${i}] ${f['company name'] || '?'} | ${f['City'] || '?'} | ${f['EMAIL'] ? 'email' : 'no-email'} | ${f['Phone'] ? 'phone' : 'no-phone'} | ${f['Category'] || '?'}`;
  }).join('\n');

  const prompt = `Score these ${batch.length} Swiss leads 1-10 for real estate B2B outreach priority.
\nCriteria:\n${criteria}\n\nLeads:\n${leadsText}\n\nReturn ONLY a valid JSON array (no markdown): [{"index":0,"score":7,"reason":"reason"}]`;

  const result = await orReq([
    { role: 'system', content: config.scoring.system_prompt },
    { role: 'user', content: prompt },
  ]);

  const content = result.choices?.[0]?.message?.content ?? '[]';
  try { return JSON.parse(content); }
  catch { const m = content.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]) : []; }
}

async function patchRecords(records) {
  for (let i = 0; i < records.length; i += 10) {
    const chunk = records.slice(i, i + 10);
    const d = await atReq(`${BASE}/${TABLE}`, { method: 'PATCH', body: { records: chunk } });
    if (d.error) console.error('  Patch error:', JSON.stringify(d.error));
  }
}

// START
console.log(`\n\x1b[96m[LEAD-SCORER]\x1b[0m System starting... ${DRY_RUN ? '(DRY RUN)' : ''}`);
const leads = await fetchUnscored();
if (leads.length === 0) { console.log('No unscored leads found. Terminating.'); process.exit(0); }

const BATCH = config.scoring.batch_size || 20;
const thresholds = config.scoring.thresholds;
let totalScored = 0;

for (let i = 0; i < leads.length; i += BATCH) {
  const batch = leads.slice(i, i + BATCH);
  console.log(`Processing batch ${i/BATCH + 1}/${Math.ceil(leads.length/BATCH)}...`);

  try {
    const scores = await scoreBatch(batch);
    const updates = scores.map(s => {
      const lead = batch[s.index];
      if (!lead || s.score == null) return null;
      return { id: lead.id, fields: { Rank: s.score, score_reason: s.reason } };
    }).filter(Boolean);

    if (!DRY_RUN) await patchRecords(updates);
    totalScored += updates.length;
    process.stdout.write(`✓ ${updates.length} leads scored\n`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

console.log(`\n═══ SCORING COMPLETE ═══\nTotal Scored: ${totalScored}`);
