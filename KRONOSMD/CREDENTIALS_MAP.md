# KRONOS Credentials Map

> Source of truth: Airtable vault `app5YD0XJ6ymo1M5j / tblKkFsNYZq4bX8gO`
> Keys also mirrored in `.env` (gitignored)
> Last updated: 2026-03-17

## Active Credentials

| Service | Vault Name | Used In | Notes |
|---------|-----------|---------|-------|
| Airtable | `AIRTABLE API KEY` | All workflows, vault access | PAT format `pat...` |
| n8n API | `N8N KRONOS api` | `.mcp.json`, API calls | JWT, expires ~Jun 2026 |
| Brevo | `BREVO MCP` | Email sending, error alerts | Base64-encoded JSON → extract `api_key` |
| OpenRouter | `OPENROUTER` | Email + WA copy generation AND lead scoring | n8n credential type: **OpenAI**, Base URL: `https://openrouter.ai/api/v1` |
| Apify | `APIFY` | Lead scraping (ImmoScout24, FlatFox) | |
| OpenAI | `OPENAI API KEY` | Available if needed | |

## Deprecated (no longer used in active workflows)

| Service | Vault Name | Was Used For |
|---------|-----------|-------------|
| Ollama | `OLLAMA` | Email + WA copy generation (replaced by OpenRouter) |
| Twilio | `Twillio +1 213 583 6915` | SMS (replaced by WA Business Cloud, now both suspended) |
| SendGrid | `TWIILIO SENDGRID EMAILS` | Email (replaced by Brevo) |
| Supabase Zürich | `supabase ZURIGO` | Dynamic config (removed) |

## Other Available Keys (future use)

| Service | Vault Name | Potential Use |
|---------|-----------|--------------|
| GitHub | `GITHUB` | CI/CD, repo automation |
| Vercel | `Vercel` | Frontend deploy hooks |
| Perplexity | `PERPLEXITY` | Research/enrichment |
| Browserless | `BROWSERLESS` | Headless scraping |
| BrowserBase | `BROWSERBASE API` | Advanced scraping |
| Enrich | `ENRICH` | Lead enrichment |
| Cloudflare | `CLOUDFLARE ZONE ID` / `CLOUDFLARE ACCOUNT ID` | DNS automation |
| Modal | `MODAL API KEY` | GPU compute |
| Gemini | `GEMINI` | AI model alternative |
| IONOS | `IONOS DOMAIN KRONOS` | Domain management |

## Security Note

> The Airtable PAT was shared in a conversation on 2026-03-17.
> **Regenerate it** at airtable.com → Profile → Personal Access Tokens.
> Then update `.env` and the vault entry.
