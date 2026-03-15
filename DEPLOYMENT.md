# KRONOS Deployment Setup

## Full Stack Overview

```
                    ┌─────────────────────────────────────────┐
                    │            KRONOS ARCHITECTURE           │
                    └─────────────────────────────────────────┘

  ┌──────────────────────┐         ┌──────────────────────┐
  │   LANDING PAGE       │         │   CAMPAIGN ENGINE    │
  │   (Vercel)           │         │   (Hostinger VPS)    │
  │                      │         │                      │
  │  kronosautomations   │         │  n8n 1.76.1          │
  │  .com                │         │  + Caddy (auto-SSL)  │
  │                      │         │  + Docker Compose    │
  │  Vite + React        │         │                      │
  │  + shadcn + Tailwind │         │  n8n-ugw8.srv1405638 │
  └──────────┬───────────┘         │  .hstgr.cloud        │
             │                     └──────────┬───────────┘
             │                                │
             │         WORKFLOW PIPELINE       │
             │    ┌────────────────────────────┤
             │    │                            │
             │    ▼                            ▼
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │  SCRAPING         │  │  AI SCORING      │  │  CRM             │
  │  Apify            │  │  OpenRouter      │  │  Airtable        │
  │                   │  │  (GPT-4o-mini)   │  │                  │
  │  ImmoScout24      │  │                  │  │  Leads table     │
  │  FlatFox          │  │  Score 1-10      │  │  Status tracking │
  │  Homegate (off)   │  │  Whale filter    │  │                  │
  └───────────────────┘  └──────────────────┘  └──────────────────┘
             │                                          │
             │              OUTREACH                    │
             │    ┌─────────────────────────────────────┤
             │    │                                     │
             ▼    ▼                                     ▼
  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │  EMAIL            │  │  MESSAGING       │  │  ERROR ALERTS    │
  │  Brevo            │  │  WhatsApp        │  │  Brevo           │
  │                   │  │  Business Cloud  │  │                  │
  │  FROM:            │  │                  │  │  TO:             │
  │  kronosbusiness   │  │  Score >= 5      │  │  consulting@     │
  │  .com             │  │  + has phone     │  │  kronosautoma..  │
  └───────────────────┘  └──────────────────┘  └──────────────────┘
```

## Domains

| Domain | Purpose | DNS | Project |
|--------|---------|-----|---------|
| `kronosautomations.com` | Landing page | Vercel DNS | `kronosautomations` (Vercel) |
| `www.kronosautomations.com` | Redirect → apex | Vercel DNS | Redirects to apex |
| `kronosbusiness.com` | Cold email sender domain | Vercel DNS | Not assigned (email only) |
| `n8n-ugw8.srv1405638.hstgr.cloud` | n8n instance | Hostinger managed | Hostinger VPS |

## DNS Records

### kronosautomations.com (Vercel DNS)
| Type | Name | Value |
|------|------|-------|
| ALIAS | `@` | `cname.vercel-dns-017.com` (auto) |
| ALIAS | `*` | `cname.vercel-dns-017.com` (auto) |

### kronosbusiness.com (Vercel DNS)
| Type | Name | Value |
|------|------|-------|
| TXT | `@` | `v=spf1 include:spf.brevo.com ~all` |
| TXT | `@` | `brevo-code:78417ae1ab91f29069e11634cdffa8da` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` |
| CNAME | `brevo1._domainkey` | `b1.kronosbusiness-com.dkim.brevo.com` |
| CNAME | `brevo2._domainkey` | `b2.kronosbusiness-com.dkim.brevo.com` |

## Services & Accounts

| Service | Purpose | Account |
|---------|---------|---------|
| **Vercel** | Frontend hosting + DNS | `otto808808` / team `ottos-projects-b99d124e` |
| **Hostinger** | VPS (managed n8n) | VPS KVM 2 |
| **GitHub** | Source code | `otto-dotcom` |
| **Brevo** | Transactional email | Configured for `kronosbusiness.com` |
| **Airtable** | CRM / lead database | Base + Leads table |
| **Apify** | Web scraping (ImmoScout24) | API token via HTTP Header Auth |
| **OpenRouter** | AI scoring (GPT-4o-mini) | API key via HTTP Header Auth |
| **WhatsApp Business** | Outreach messaging | Cloud API |

## Campaign Workflow Pipeline

```
KRONOS_CAMPAIGN.json
│
├─ Daily Schedule (every 24h)
│  └─ Apify: Scrape ImmoScout24 (500 leads max)
│     └─ Code: Normalize & Deduplicate
│        └─ OpenRouter: AI Score (1-10)
│           └─ Code: Parse Score & Classify
│              └─ Airtable: Save Lead
│                 └─ Filter: Score >= 5?
│                    ├─ YES → Brevo: Send Email (from kronosbusiness.com)
│                    ├─ YES → WhatsApp: Send Message (if phone exists)
│                    └─ Airtable: Update Status (sent/no_phone)
│
└─ Error Trigger
   └─ Brevo: Error Alert → consulting@kronosautomations.com
```

## Credentials Required in n8n

| Credential | Type | Used By |
|------------|------|---------|
| Apify API Token | HTTP Header Auth | Scraper node |
| OpenRouter API Key | HTTP Header Auth | AI scoring node |
| Airtable Personal Token | Airtable Token API | Save + Update nodes |
| Brevo API Key | Brevo API | Email + Error alert nodes |
| WhatsApp Business Cloud | WhatsApp Business Cloud API | Messaging node |

## Environment Variables Required in n8n

| Variable | Purpose |
|----------|---------|
| `AIRTABLE_BASE_ID` | Your Airtable base ID (starts with `app`) |
| `AIRTABLE_TABLE_ID` | Leads table ID (starts with `tbl`) |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID |

## Repo Structure (Current)

```
KRONOS-OUTREACH/
├── KRONOS_CAMPAIGN.json        # Main workflow (import to n8n)
├── docker-compose.yml          # n8n + Caddy services
├── Caddyfile                   # Reverse proxy + security headers
├── .env.template               # Environment variable template
├── .mcp.json                   # n8n MCP server config
├── CLAUDE.md                   # AI assistant instructions
├── README.md                   # Quick-start guide
├── DEPLOYMENT.md               # This file
│
├── config/industries/
│   ├── _template.json          # Template for new industries
│   └── swiss_realestate.json   # Swiss RE: sources, scoring, thresholds
│
├── directives/
│   ├── email_outreach_strategy.md      # PAS framework, voice & tone
│   ├── lead_scraping_strategy.md       # Anti-detection, whale filter
│   ├── response_handling_strategy.md   # Lead categorization SOP
│   └── workflow_optimization.md        # Import/validate/test process
│
└── scripts/
    ├── setup_vps.sh            # One-command VPS deployment
    └── n8n_api_manager.py      # CLI: list/import/activate workflows
```

## Deployment Checklist

### VPS (Self-Hosted Option)
- [ ] SSH into VPS: `ssh root@YOUR_VPS_IP`
- [ ] Run setup: `sudo ./scripts/setup_vps.sh`
- [ ] Enter domain: `n8n.kronosautomations.com`
- [ ] Set admin username and password
- [ ] Verify: `docker compose logs -f`
- [ ] Add DNS A record: `n8n` → VPS IP

### n8n (Managed Hostinger)
- [x] Instance running at `n8n-ugw8.srv1405638.hstgr.cloud`
- [ ] Import `KRONOS_CAMPAIGN.json` via n8n UI (Import from File)
- [ ] Create credentials: Apify, OpenRouter, Airtable, Brevo, WhatsApp
- [ ] Set environment variables: AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, WHATSAPP_PHONE_NUMBER_ID
- [ ] Assign credentials to workflow nodes
- [ ] Test: Run workflow manually once
- [ ] Activate workflow (enables daily schedule)

### Frontend (Vercel)
- [x] `kronosautomations.com` assigned to `kronosautomations` project
- [x] `www.kronosautomations.com` redirects to apex
- [x] Landing page live (200 OK)

### Email Domain (kronosbusiness.com)
- [x] SPF record added
- [x] DKIM 1 + DKIM 2 records added
- [x] DMARC record added (with Brevo rua)
- [x] Brevo verification code added
- [ ] Nameserver propagation complete (Cloudflare → Vercel DNS)
- [ ] Brevo domain fully verified (all green)

### Airtable CRM
- [ ] Create base with Leads table
- [ ] Required fields: company name, EMAIL, Phone, URL, City, Rank, score_reason, lead_status, scraped_at, EMAIL STATUS, sms status
- [ ] Note base ID and table ID for n8n env vars

## Error Cases & Mitigations

| Error | Cause | Mitigation |
|-------|-------|------------|
| Apify 403 | Bot detection / IP blocked | Apify proxy rotation is enabled; increase `maxItems` gradually |
| OpenRouter timeout | API overload | Default score of 5 applied on parse error (graceful fallback) |
| Airtable rate limit | >5 requests/sec | n8n processes sequentially per item; batch_size=20 in config |
| Brevo bounce | Invalid email | Brevo handles bounces; check Brevo dashboard for suppression list |
| WhatsApp template rejection | Message not approved | Use pre-approved template; current message is freeform (may need template) |
| Workflow error (any node) | Various | Error Trigger → Brevo alert to consulting@kronosautomations.com |
| DNS not propagated | Nameserver switch | Wait up to 48h; verify at mxtoolbox.com |
| n8n instance unreachable | VPS down / container stopped | Check Hostinger dashboard; `docker compose up -d` if self-hosted |
| Duplicate leads | Same company scraped twice | Code node deduplicates by company name (case-insensitive Set) |
| No email on lead | Scrape didn't find email | Lead is skipped entirely (filter in normalize node) |
