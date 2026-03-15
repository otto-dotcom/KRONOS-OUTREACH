# KRONOS-OUTREACH — Backend

n8n workflow engine on Hostinger VPS for automated Swiss real estate lead scraping and outreach.

## Architecture

```
Hostinger VPS (KVM 2)
├── n8n (port 5678) — Workflow automation
└── Caddy (80/443) — Reverse proxy + auto-SSL
```

**Domain**: `n8n.kronosautomations.com`
**Frontend**: Separate repo → [kronosautomations](https://github.com/otto-dotcom/kronosautomations) on Vercel

## Deploy

```bash
# On fresh Ubuntu 22.04 VPS
sudo ./scripts/setup_vps.sh
```

This installs Docker, creates `/opt/kronos`, and starts n8n + Caddy.

## DNS Required

| Type | Name | Value |
|------|------|-------|
| A | n8n | YOUR_VPS_IP |

## Manage Workflows

```bash
# List workflows
python scripts/n8n_api_manager.py --list

# Import workflow
python scripts/n8n_api_manager.py --import workflow.json

# Activate
python scripts/n8n_api_manager.py --activate WORKFLOW_ID
```

## Structure

```
├── docker-compose.yml    # n8n + Caddy services
├── Caddyfile             # Reverse proxy config
├── .env.template         # Environment variables
├── config/industries/    # Campaign configs
├── directives/           # Strategy docs (AI context)
└── scripts/              # VPS setup + n8n API manager
```
