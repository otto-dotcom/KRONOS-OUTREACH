# KRONOS-OUTREACH — Backend

n8n workflow engine for automated Swiss real estate lead scraping, AI scoring, and multi-channel outreach.

## Architecture

```
Hostinger VPS (Managed n8n)          Vercel
├── n8n 1.76.1 — Workflow engine     ├── kronosautomations.com — Landing page
└── Caddy — Reverse proxy + SSL      └── kronosbusiness.com — Email sender domain
```

## Pipeline

```
Apify (ImmoScout24) → Normalize → AI Score (OpenRouter) → Airtable → Filter (≥5) → Brevo Email + WhatsApp
```

## Quick Start

```bash
# Import workflow to n8n
python scripts/n8n_api_manager.py --import-all

# List workflows
python scripts/n8n_api_manager.py --list

# Activate
python scripts/n8n_api_manager.py --activate WORKFLOW_ID
```

## Structure

```
├── KRONOS_CAMPAIGN.json        # Main workflow (import to n8n)
├── DEPLOYMENT.md               # Full stack docs + deployment checklist
├── docker-compose.yml          # n8n + Caddy services
├── Caddyfile                   # Reverse proxy config
├── config/industries/          # Industry-specific scraping + scoring config
├── directives/                 # Strategy docs (AI context for workflows)
└── scripts/                    # VPS setup + n8n API manager
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full deployment checklist, DNS records, credentials, and error cases.
