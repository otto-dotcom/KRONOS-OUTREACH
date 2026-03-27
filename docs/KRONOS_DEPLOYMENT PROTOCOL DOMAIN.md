# KRONOS DEPLOYMENT CHECKLIST
> Living document — check off items as completed. Last updated: March 2026
> Format: `[ ]` = pending · `[x]` = done · `[~]` = in progress · `[!]` = blocked

---

## 1. DOMAIN SECURITY

### Primary Domain (`kronos-automations.ch` / `.com`)
- [ ] Register via Cloudflare Registrar (at-cost, no markup)
- [ ] Enable WHOIS privacy / domain lock
- [ ] Enable DNSSEC on all primary domains
- [ ] Set up Cloudflare nameservers (free DNS, DDoS protection, CDN)
- [ ] Enable auto-renew — never let a domain expire
- [ ] Add 2FA to registrar account

### Campaign Domains (cold outreach only — NEVER use primary)
- [ ] Register separate domains for each vertical:
  - [ ] `kronos-leads.com` or `kronos-reach.com` — KRONOS Swiss RE outreach
  - [ ] `helios-solare.it` or `helios-leads.com` — HELIOS Italian solar outreach
  - [ ] `helios-solar.de` (future) — Germany expansion
- [ ] Set up DNS on Cloudflare for all campaign domains
- [ ] Do NOT put a real website on campaign domains (redirect or simple landing page only)

---

## 2. EMAIL AUTHENTICATION (DNS RECORDS)

> Must be configured per domain — both primary AND each campaign domain.
> Without these, emails go to spam and Google/Yahoo may block you entirely.

### SPF Record
- [ ] Add TXT record: `v=spf1 include:[your-sender] ~all`
- [ ] Only ONE SPF record per domain (combine all senders into one)
- [ ] Verify with: https://mxtoolbox.com/spf.aspx

### DKIM Record
- [ ] Generate DKIM keys in your email platform (SendGrid / Brevo / Telnyx)
- [ ] Add CNAME/TXT record to DNS as instructed by platform
- [ ] Verify DKIM is signing outbound emails
- [ ] Verify with: https://mxtoolbox.com/dkim.aspx

### DMARC Record
- [ ] Add TXT record at `_dmarc.yourdomain.com`:
  ```
  v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100
  ```
- [ ] Start with `p=none` (monitoring), graduate to `p=quarantine`, then `p=reject`
- [ ] Set up a DMARC report inbox to receive feedback
- [ ] Verify with: https://mxtoolbox.com/dmarc.aspx

### Email Domain Warmup (campaign domains only)
- [ ] Never send cold volume on a fresh domain — warm up first
- [ ] Week 1: 20–30 emails/day
- [ ] Week 2: 50–100 emails/day
- [ ] Week 3: 150–250 emails/day
- [ ] Week 4+: ramp to full volume
- [ ] Use inbox warmup tool (Smartlead warmup, or Mailreach)

---

## 3. SSL / TLS (HTTPS)

- [ ] SSL cert on ALL domains (Cloudflare provides free Universal SSL)
- [ ] Force HTTPS redirect — no HTTP traffic allowed
- [ ] Set Cloudflare SSL mode to "Full (strict)" — not "Flexible"
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Verify SSL rating: https://www.ssllabs.com/ssltest/
- [ ] Renew certs before expiry (Cloudflare auto-renews)
- [ ] All API endpoints use HTTPS only — never HTTP

---

## 4. APP / SERVER DEPLOYMENT (Hostinger VPS)

### Initial VPS Hardening
- [ ] Change default SSH port (22 → custom port, e.g. 2299)
- [ ] Disable root SSH login (`PermitRootLogin no` in sshd_config)
- [ ] Create a non-root sudo user for all operations
- [ ] Use SSH key authentication — disable password auth
- [ ] Set up UFW firewall:
  ```bash
  ufw allow [custom-ssh-port]
  ufw allow 80
  ufw allow 443
  ufw deny incoming
  ufw enable
  ```
- [ ] Install Fail2Ban (auto-blocks brute force attempts)
- [ ] Enable automatic security updates (`unattended-upgrades`)
- [ ] Set up intrusion detection (optional: Wazuh or Crowdsec)

### Application Layer
- [ ] All secrets in environment variables — NEVER hardcoded in code
- [ ] Use `.env` files locally, server env vars in production
- [ ] `.env` files in `.gitignore` — never committed to GitHub
- [ ] Rotate all API keys after any accidental exposure
- [ ] Use a secrets manager for production (Doppler free tier, or Vault)
- [ ] Set `NODE_ENV=production` (disables debug output, stack traces)
- [ ] Disable verbose error messages in production responses

### Reverse Proxy (Nginx)
- [ ] Install Nginx as reverse proxy in front of app
- [ ] Configure rate limiting per IP:
  ```nginx
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
  ```
- [ ] Add security headers in Nginx config:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy: default-src 'self'`
- [ ] Hide Nginx version: `server_tokens off`
- [ ] Block access to `.env`, `.git`, config files via Nginx

### Lovable Dashboard (Frontend)
- [ ] Custom domain with HTTPS
- [ ] Authentication enabled (no public access to dashboard)
- [ ] API keys used in frontend are read-only / scoped keys only
- [ ] No secrets visible in frontend JS bundle

---

## 5. n8n (fagiolinosssssss.app.n8n.cloud)

- [ ] Strong admin password (20+ chars, unique)
- [ ] 2FA enabled on n8n account
- [ ] Webhook URLs use secret tokens in path or header
- [ ] Restrict which IPs can trigger webhooks (whitelist Apify, Supabase, etc.)
- [ ] Credentials stored in n8n credential store (not hardcoded in nodes)
- [ ] Disable public workflow sharing
- [ ] Audit active webhooks — disable any unused ones
- [ ] Set up n8n error alerting (email/Slack on workflow failure)

---

## 6. API SECURITY

### All APIs (SendGrid, Twilio/Telnyx, Brevo, Apify, OpenAI/DeepSeek)
- [ ] Use scoped API keys — minimum permissions required
- [ ] Separate API keys per environment (dev vs production)
- [ ] Never expose API keys in client-side code
- [ ] Store all keys in environment variables or secrets manager
- [ ] Set up spending limits/alerts on Twilio, Apify, OpenAI to prevent bill shock
- [ ] Rotate API keys every 90 days minimum

### Supabase
- [ ] Enable Row Level Security (RLS) on ALL tables
- [ ] Use service_role key only server-side — never in browser
- [ ] Use anon key with RLS for any client-side access
- [ ] Enable email confirmation for user signups
- [ ] Regular database backups enabled
- [ ] Restrict which IP ranges can access DB (whitelist VPS IP)
- [ ] Enable 2FA on Supabase dashboard

### Airtable (while still in use)
- [ ] Use personal access tokens (not legacy API key)
- [ ] Minimum scope tokens per integration
- [ ] Rotate tokens quarterly

---

## 7. AUTHENTICATION & ACCESS

- [ ] 2FA enabled on ALL services:
  - [ ] Cloudflare
  - [ ] GitHub
  - [ ] Hostinger
  - [ ] Supabase
  - [ ] n8n cloud
  - [ ] SendGrid
  - [ ] Twilio / Telnyx
  - [ ] Brevo
  - [ ] Apify
  - [ ] Revolut
  - [ ] Lovable
- [ ] Use a password manager (Bitwarden recommended — free, open source)
- [ ] All passwords 20+ characters, unique per service
- [ ] Use separate email for critical infrastructure vs personal
- [ ] Recovery codes stored securely (offline backup)

---

## 8. MONITORING & ALERTING

- [ ] Uptime monitoring: UptimeRobot (free tier — alerts if site goes down)
- [ ] Error tracking: Sentry free tier on main app
- [ ] Server monitoring: Netdata or htop for VPS health
- [ ] Set spend alerts on all paid APIs (Twilio, Apify, SendGrid)
- [ ] Email reputation monitoring: Google Postmaster Tools set up
- [ ] Blacklist monitoring: MXToolbox blacklist check (weekly)
- [ ] Log retention: Keep API logs for 30+ days (debugging + compliance)
- [ ] Set up alerts for: failed logins, high error rates, unusual spend spikes

---

## 9. GDPR / LEGAL COMPLIANCE (EU Campaigns)

> Italy + Switzerland = GDPR applies. Non-compliance = fines.

- [ ] Privacy policy published on main website
- [ ] Unsubscribe mechanism in every outreach email (1-click)
- [ ] Honor unsubscribe/opt-out within 10 days
- [ ] Suppression list maintained (never re-contact opted-out contacts)
- [ ] GSE registry data usage is legitimate (B2B professional contact = lawful basis)
- [ ] Do not store personal data beyond what's needed
- [ ] Data stored in EU region (Supabase EU endpoint, n8n EU instance)
- [ ] Cookie consent banner on website if using analytics
- [ ] Record of Processing Activities (RoPA) document created

---

## 10. BACKUP & DISASTER RECOVERY

- [ ] GitHub repo for all code (private repos)
- [ ] Supabase auto-backups enabled
- [ ] Airtable base backup exported monthly (CSV)
- [ ] n8n workflow export saved to GitHub (JSON)
- [ ] VPS snapshot scheduled weekly (Hostinger panel)
- [ ] `.env` files backed up in encrypted vault (not GitHub)
- [ ] Recovery plan documented: if VPS dies, how long to redeploy?

---

## 11. OUTREACH INFRA HYGIENE

- [ ] Campaign domains on separate IP ranges from main domain
- [ ] Separate SendGrid sub-accounts or IPs per vertical (KRONOS vs HELIOS)
- [ ] Bounce rate monitored — pause campaign if > 5%
- [ ] Spam complaint rate monitored — pause if > 0.1%
- [ ] Email list verified before sending (ZeroBounce or NeverBounce)
- [ ] Remove hard bounces immediately from all lists
- [ ] Do not purchase email lists — use only registry data (GSE, etc.)

---

## QUICK REFERENCE — DNS RECORDS TEMPLATE

For each domain, add these DNS records (adjust to your sender platform):

| Type | Host | Value | TTL |
|------|------|-------|-----|
| TXT | `@` | `v=spf1 include:sendgrid.net include:sendinblue.com ~all` | Auto |
| CNAME | `em._domainkey` | `em.dkim.sendgrid.net` (from SendGrid) | Auto |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com` | Auto |
| A | `@` | `[your VPS IP]` | Auto |
| CNAME | `www` | `@` | Auto |

---

## COMPLETION STATUS

| Category | Progress |
|----------|----------|
| Domain Security | 0 / 9 |
| Email Authentication | 0 / 16 |
| SSL / TLS | 0 / 7 |
| VPS Hardening | 0 / 18 |
| n8n Security | 0 / 8 |
| API Security | 0 / 17 |
| Auth & 2FA | 0 / 13 |
| Monitoring | 0 / 9 |
| GDPR | 0 / 9 |
| Backup & Recovery | 0 / 8 |
| Outreach Hygiene | 0 / 8 |
| **TOTAL** | **0 / 122** |
