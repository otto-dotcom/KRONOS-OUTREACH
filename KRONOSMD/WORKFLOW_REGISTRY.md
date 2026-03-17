# KRONOS Workflow Registry

> Last updated: 2026-03-17

## Active Workflows (import these to n8n)

### 1. `KRONOS_OUTREACH_EMAIL.json` ← **DEPLOY TONIGHT**
**"KRONOS Outreach - Email Only (Ollama + Brevo)"**

| Property | Value |
|----------|-------|
| Trigger | Webhook POST `/kronos-outreach` |
| AI | Ollama llama3.2 (local) |
| Email | Brevo API from `otto@kronosbusiness.com` |
| CRM | Airtable (read + update) |
| WhatsApp | Removed (suspended) |
| Nodes | 12 |

Flow:
```
Webhook → Set Config → Get Leads from Airtable
  → Check Has Email → Email AI Agent (Ollama) → Parse → Send Brevo → Update Airtable
+ Error Trigger → Brevo Error Alert
```

Credentials needed in n8n:
- `Airtable Personal Access Token account`
- `Ollama account` → host: `http://187.77.92.163:32769`
- `Brevo API Key` (HTTP Header Auth) → `xkeysib-06f30316...`

---

### 2. `KRONOS_OUTREACH_V3.json` ← Full version (WhatsApp suspended)
**"KRONOS Outreach - Ollama + Brevo + WhatsApp"**

Same as above + WhatsApp Business Cloud path.
Park until Meta restriction lifted.

---

### 3. `workflows/universal_scraper.json` — Scraper
**"KRONOS Universal Scraper"**
Reads from `config/industries/swiss_realestate.json`, scrapes Apify sources, deduplicates, writes to Airtable.
Run separately before outreach.

---

### 4. `workflows/universal_scorer.json` — Scorer
**"KRONOS Universal Scorer"**
Reads unscored leads from Airtable, batches them, scores via OpenRouter, writes scores back.
Run after scraper, before outreach.

---

### 5. `workflows/kronos_social_video_factory.json` — Video
Separate product. Generates social media videos via Kie.ai. Uses OpenRouter (Claude 3.5).
Note: Uses Twilio for WhatsApp notifications — update when Twilio suspended.

---

## Archived (do not use)

| File | Reason |
|------|--------|
| `archive/KRONOS_CAMPAIGN.json` | Monolithic v1. Static templates, OpenRouter for AI, WhatsApp Business Cloud |
| `archive/KRONOS_V2_PERFECTED.json` | Uses Twilio SMS + Supabase. Superseded by V3 |
| `workflows/lead_scorer.json` | Swiss-specific scorer. Superseded by `universal_scorer.json` |
| `workflows/apify_swiss_scraper.json` | Swiss-specific scraper. Superseded by `universal_scraper.json` |

---

## Pipeline Order (Full Campaign Run)

```
1. universal_scraper.json     → Fills Airtable with new leads
2. universal_scorer.json      → Scores leads 1-10 via OpenRouter
3. KRONOS_OUTREACH_EMAIL.json → Sends emails to score >= 5 leads
```
