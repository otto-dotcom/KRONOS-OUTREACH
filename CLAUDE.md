# KRONOS-OUTREACH — n8n Backend

This repo is the **backend only** for KRONOS. It runs n8n on Hostinger VPS via Docker + Caddy.

## What This Repo Does

- Hosts n8n workflow engine (Hostinger managed instance)
- Runs automated lead scraping, AI scoring, and outreach campaigns
- Campaign workflows: `workflows/` (import to n8n)
- Full deployment docs: `docs/DEPLOYMENT.md`

## Architecture

- **Backend** (this repo): n8n on Hostinger managed VPS
- **Frontend**: `apps/kronosautomations` and `apps/dashboard`
- **Email domain**: `kronosbusiness.com` (cold outreach, protects primary domain)

## Available MCP Tools

### Documentation & Discovery

| Tool | Purpose |
|------|---------|
| `search_nodes` | Full-text search across 1,084 nodes |
| `get_node` | Retrieve node details (minimal/standard/full) |
| `validate_node` | Validate node configuration |
| `validate_workflow` | Complete workflow validation |
| `search_templates` | Search 2,709 templates |
| `get_template` | Retrieve workflow JSON from templates |

### Workflow Management

| Tool | Purpose |
|------|---------|
| `n8n_create_workflow` | Create new workflows |
| `n8n_get_workflow` | Retrieve existing workflows |
| `n8n_update_workflow` | Full workflow update |
| `n8n_delete_workflow` | Delete workflows |
| `n8n_list_workflows` | List all workflows |
| `n8n_validate_workflow` | Validate before deployment |

### Execution

| Tool | Purpose |
|------|---------|
| `n8n_test_workflow` | Test/trigger workflows |
| `n8n_list_executions` | List execution history |
| `n8n_get_execution` | Get execution details |

## Workflow Building Process

1. `search_templates` → Find patterns
2. `search_nodes` → Find required nodes
3. Build incrementally (trigger → scrape → score → sync → outreach)
4. `validate_workflow` → Check for errors
5. `n8n_create_workflow` → Deploy
6. `n8n_test_workflow` → Test with real data

## Safety Rules

- NEVER edit production workflows directly — create copies
- NEVER deploy without `validate_workflow`
- NEVER skip testing
- NEVER use default values blindly

## Expression Syntax

```javascript
{{ $json.fieldName }}
{{ $('NodeName').item.json.field }}
{{ $json.status === 'active' ? 'yes' : 'no' }}
{{ $now.toISO() }}
```

## Key Config

- Industry config: `config/industries/swiss_realestate.json`
- Strategy docs: `directives/` (used for AI context in workflows)
- VPS setup: `infra/setup_vps.sh`
- API manager: `scripts/n8n_api_manager.py`
