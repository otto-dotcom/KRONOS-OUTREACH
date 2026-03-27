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

For a detailed map of the project, see [STRUCTURE.md](STRUCTURE.md).

```
├── apps/               # Frontend applications (React, Next.js)
├── data/               # Persistent local data (logs, mini-db)
├── docs/               # Documentation (Deployment, Protocols, Architecture)
├── infra/              # Infrastructure (Docker, Caddy, VPS setup)
├── scripts/            # Automation scripts & categorization
│   ├── config/         # Shared JSON configurations
│   ├── scraper/        # Scraping and lead generation
│   └── scorer/         # AI scoring and auto-applier logic
└── workflows/          # n8n workflow exports (JSON)
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full deployment checklist, DNS records, credentials, and error cases.
