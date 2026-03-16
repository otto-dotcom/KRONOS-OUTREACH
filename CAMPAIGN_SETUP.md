# KRONOS Campaign Deployment Guide

This document defines the standard operating procedure for launching a new outbound vertical (e.g., KRONOS Swiss RE outreach vs HELIOS Italian solar outreach).

> **CRITICAL RULE**: NEVER use the primary domain (`kronos-automations.ch` / `.com`) for cold outreach. Always register and warm up dedicated campaign domains.

## 1. Domain Registration & Routing
1. Register a dedicated domain (e.g. `kronos-reach.com` or `helios-leads.com`).
2. Add the domain to **Cloudflare**.
3. Point the ROOT (`@`) and `www` records to a simple landing page or redirect it to your primary website.
4. **Do not point email infrastructure here yet**.

## 2. Email Setup & Authentication (CRITICAL)
Before sending a single email:

### SPF (Sender Policy Framework)
- Create a `TXT` record on the root (`@`).
- Value must include your sender: `v=spf1 include:sendgrid.net ~all`
- *Note: Only ONE SPF record is allowed per domain.*

### DKIM (DomainKeys Identified Mail)
- Generate the DKIM keys in your sending platform (e.g., SendGrid, Brevo).
- Add the 2 or 3 `CNAME` records provided by the platform to Cloudflare.
- Wait 30 mins and verify the keys in the sending platform dashboard.

### DMARC (Domain-based Message Authentication)
- Create a `TXT` record with the name `_dmarc`.
- Value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=100`

## 3. Email Warmup
1. Connect the new campaign domain to a warmup tool (like Smartlead or Mailreach).
2. **Week 1**: Send max 20-30 emails per day.
3. **Week 2**: Increase to 50-100 emails per day.
4. **Week 3**: Increase to 150-250 emails per day.
5. If the bounce rate stays under 2% and the spam rate under 0.1%, you are ready for full volume.

## 4. n8n Integration (Campaign Specific)
1. In n8n, create a new workflow folder for the vertical (e.g., `HELIOS_ITALY`).
2. Open your **Airtable** and create a duplicate/new Base for the new campaign.
3. Generate a scoped **Airtable Personal Access Token** strictly for this base.
4. In n8n, create a new Credential: `Airtable API - [Campaign Name]`.
5. Update your workflow HTTP nodes / SendGrid nodes to specify the *campaign domain* sender email (e.g., `marco@helios-leads.com`).

## 5. Compliance & Suppression
1. If the campaign targets Europe (Italy, Switzerland, Germany): Include a 1-click unsubscribe link in the footer.
2. Example plain-text footer:
   *To stop receiving these emails, please reply "Unsubscribe" or click [Here]*
3. Connect the webhook from the unsubscribe link directly into n8n to mark the Lead's `EMAIL STATUS` as `unsubscribed` in Airtable.
