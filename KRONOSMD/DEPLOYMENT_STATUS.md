# KRONOS Deployment Status

> Last updated: 2026-03-17

## Tonight's Goal: First Emails Sent

### Blockers (in order)

| # | Blocker | Action | Owner |
|---|---------|--------|-------|
| 1 | **n8n container stopped** | SSH `187.77.92.163` → `docker compose up -d` | You |
| 2 | **Airtable Leads table not created** | Create base `appLriEwWldpPTMPg` / table `tblLZkFo7Th7uyfWB` with required fields | You |
| 3 | **n8n credentials not set up** | Create 3 credentials in n8n UI (see below) | You |
| 4 | **Workflow not imported** | Import `KRONOS_OUTREACH_EMAIL.json` to n8n | You / Claude |

### n8n Credentials to Create

| Name (exact) | Type | Value source |
|-------------|------|-------------|
| `Airtable Personal Access Token account` | Airtable Token API | `AIRTABLE_PAT` from `.env` |
| `Ollama account` | Ollama API | Host: `http://187.77.92.163:32769` |
| `Brevo API Key` | HTTP Header Auth | Header name: `api-key`, value: `BREVO_API_KEY` from `.env` |

### Airtable Leads Table — Required Fields

| Field name | Type |
|------------|------|
| `company name` | Text |
| `EMAIL` | Email |
| `Phone` | Phone |
| `URL` | URL |
| `City` | Text |
| `Rank` | Number |
| `score_reason` | Long text |
| `lead_status` | Single select: `new`, `contacted` |
| `scraped_at` | Date |
| `EMAIL STATUS` | Single select: `sent`, `no_email` |
| `sms status` | Single select: `sent`, `no_phone` |
| `EMAIL BODY` | Long text |
| `SMS` | Long text |
| `FULL NAME` | Text |

---

## Infrastructure Status

| Component | Status | Notes |
|-----------|--------|-------|
| VPS `187.77.92.163` | ✅ Up | Ollama responding on :32769 |
| Caddy (port 80) | ✅ Running | Returns 502 (n8n down) |
| n8n Docker container | ❌ Stopped | Needs `docker compose up -d` |
| Ollama llama3.2 | ✅ Running | |
| Brevo domain `kronosbusiness.com` | ✅ DNS verified | SPF/DKIM/DMARC all set |
| Airtable vault | ✅ Connected | `app5YD0XJ6ymo1M5j/tblKkFsNYZq4bX8gO` |
| Frontend `kronosautomations.com` | ✅ Live | Vercel |
| WhatsApp Business API | ❌ Restricted | Meta restriction #2655089 — appeal at business.facebook.com |

---

## Config Already Wired

`.env` has all keys. `.mcp.json` has n8n URL + API key.
Once n8n is back up, MCP tools will connect automatically.
