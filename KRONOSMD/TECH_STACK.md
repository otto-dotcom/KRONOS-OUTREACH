# KRONOS Tech Stack

> Last updated: 2026-03-17

## Current Stack (Active)

| Layer | Service | Purpose | Status |
|-------|---------|---------|--------|
| **Workflow engine** | n8n (Hostinger managed) | Automation orchestration | ✅ Running at `n8n-ugw8.srv1405638.hstgr.cloud` |
| **AI / Copy generation** | OpenRouter `openai/gpt-4o-mini` | Email + WA copy personalization | ✅ `https://openrouter.ai/api/v1` |
| **Email sending** | Brevo | Cold outreach from `otto@kronosbusiness.com` | ✅ Domain verified |
| **CRM** | Airtable | Lead storage, status tracking | ✅ Base `appLriEwWldpPTMPg` |
| **Lead scraping** | Apify | ImmoScout24 + FlatFox scraper | ✅ Key in vault |
| **AI / Lead scoring** | OpenRouter (GPT-4o-mini) | Score leads 1–10 | ✅ Key in vault (universal_scorer.json) |
| **Frontend** | Vercel | `kronosautomations.com` landing page | ✅ Live |
| **Credential vault** | Airtable | All API keys stored in `app5YD0XJ6ymo1M5j/tblKkFsNYZq4bX8gO` | ✅ Connected |

## WhatsApp — Suspended

| Service | Status | Reason |
|---------|--------|--------|
| WhatsApp Business Cloud API | ❌ Restricted | Meta account restriction (#2655089) |

**Resolution**: Go to [business.facebook.com/help/support](https://business.facebook.com/help/support) → Account Quality → appeal restriction.
WhatsApp nodes exist in `KRONOS_OUTREACH_V3.json` but are stripped from the active build `KRONOS_OUTREACH_EMAIL.json`.

## Deprecated / Replaced

| Service | Replaced By | Reason |
|---------|------------|--------|
| Ollama llama3.2 | **OpenRouter GPT-4o-mini** | Unified stack — one API key, no VPS dependency for AI |
| Twilio SMS | *(WhatsApp Business Cloud — also suspended)* | Architecture decision |
| SendGrid | **Brevo** | Domain `kronosbusiness.com` fully configured on Brevo |
| Supabase (config/locking) | **Removed** | Over-engineering for current scale |
| `kronosautomations.it` | **`kronosautomations.com`** | Wrong domain — all refs updated |

## Domains

| Domain | Purpose | Infra |
|--------|---------|-------|
| `kronosautomations.com` | Public landing page | Vercel |
| `kronosbusiness.com` | Cold email sender domain | Brevo (SPF/DKIM/DMARC ✅) |
| `n8n-ugw8.srv1405638.hstgr.cloud` | n8n instance | Hostinger VPS (`187.77.92.163`) |

## VPS Services (187.77.92.163)

| Port | Service | Status |
|------|---------|--------|
| 80 | Caddy reverse proxy | ✅ Running (502 = n8n container down) |
| 443 | Caddy HTTPS | ❌ Connection refused |
| 5678 | n8n (Docker) | ❌ Container stopped — needs `docker compose up -d` |
| 32769 | Ollama | ⚠️ No longer used — can be stopped |
