# KRONOS Brevo Email Sender Configuration
**Last Updated:** 2026-04-20  
**Audit Document:** docs/AUDIT_EMAIL_CONFIG.md  
**Project:** Swiss Real Estate Outreach

---

## Sender Details

| Parameter | Value |
|-----------|-------|
| **Email** | otto@kronosbusiness.com |
| **Name** | Otto from KRONOS |
| **Domain** | kronosbusiness.com |
| **Purpose** | Cold outreach (distinct from primary domain kronosautomations.com) |

## Brevo Configuration

| Parameter | Value |
|-----------|-------|
| Sender Email | otto@kronosbusiness.com |
| Sender Name | Otto from KRONOS |
| BCC Email | otto@kronosbusiness.com |
| Analytics Tag | KRONOS_OUTREACH |
| API Endpoint | https://api.brevo.com/v3/smtp/email |
| Content Type | application/json |

---

## SMTP Requirements

- ✅ Email verified in Brevo console
- ✅ API key has SMTP sending permission
- ✅ Rate limits: Check account settings (typical: 500-1000/day)
- ✅ Warm-up: If new sender, start with 5 emails/day, ramp up gradually

---

## DNS Configuration (Required for New Domain)

If `kronosbusiness.com` is a dedicated cold outreach domain, configure these DNS records:

### SPF Record
```
v=spf1 include:brevo.com ~all
```

### DKIM Record
Generate in Brevo Console:
1. Go to Brevo Dashboard → Sender Identity
2. Add domain: kronosbusiness.com
3. Copy DKIM DNS record
4. Add to kronosbusiness.com DNS

### DMARC Policy
```
v=DMARC1; p=quarantine; rua=mailto:postmaster@kronosbusiness.com
```

**Note:** DNS propagation can take 24-48 hours. Verify before sending emails.

---

## Workflow Integration

**Node:** "Send Email via Brevo" (http-brevo)  
**Method:** POST

### Body Structure
```json
{
  "sender": {
    "name": "Otto from KRONOS",
    "email": "otto@kronosbusiness.com"
  },
  "to": [{ "email": "recipient_email" }],
  "bcc": [{ "email": "otto@kronosbusiness.com" }],
  "subject": "ai_generated_subject",
  "htmlContent": "ai_generated_body",
  "tags": ["KRONOS_OUTREACH"]
}
```

---

## Error Handling

**On Send Failure:**
- Node: "Brevo - Error Alert" (http-err) triggers
- Sends alert to: consulting@kronosautomations.com
- Includes: Execution ID, failed node, error message
- **Action:** Check Brevo API status, verify rate limits

---

## Analytics

**Tag:** KRONOS_OUTREACH

Monitor in Brevo:
- Delivery status (delivered, bounced, complained)
- Open rates (track via tag)
- Click rates (track via CTA links)
- Bounce rates (investigate if > 5%)

---

## Credentials Management

The actual Brevo API key is stored in n8n credential store.
- ❌ **DO NOT** commit API key to git
- ✅ Reference: `config/settings_backup.json` (settings only, no secrets)

---

## First-Time Setup

1. Verify `otto@kronosbusiness.com` in Brevo console
2. Create API key with SMTP sending permission
3. Map credential ID in n8n:
   - Node: http-brevo (Send Email via Brevo)
   - Credential ID: (enter actual credential ID)
4. Test send 1 email to internal address
5. Verify in Brevo console (Sent emails tab)
6. Check tag "KRONOS_OUTREACH" created

---

## Rate Limiting Guidelines

| Batch Size | Recommended Interval | Notes |
|-----------|----------------------|-------|
| 1-5 | Immediate | Test mode |
| 5-10 | 1 per minute (60s) | Learning phase |
| 10-20 | 1 per 30s | Ramp up |
| 20-50 | 1 per 20s | Full batches |
| 50+ | Requires API check | May hit rate limits |

Adjust in workflow by adding delay node between email sends.

---

## Troubleshooting

### Error: "Invalid API key"
- Check Brevo console; regenerate API key if needed
- Verify credential mapped correctly in n8n

### Error: "Rate limit exceeded"
- Reduce batch size or add delay between emails
- Check Brevo account rate limit tier

### Error: "Sender email not verified"
- Go to Brevo console → Email Addresses
- Verify otto@kronosbusiness.com is listed and confirmed
- Re-do confirmation if needed

### Bounced Email
- Check Airtable; update EMAIL STATUS to "Failed"
- Investigate email validity in lead data
- Add to Do Not Contact list if persistent

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v2.0 | 2026-04-20 | Complete config copy + audit |
| v1.0 | 2026-04-15 | Initial setup |

---

## Contacts

| Role | Contact |
|------|---------|
| Email Config Owner | Claude (via audit) |
| Brevo Account Admin | (enter name/contact) |
| Support Email | otto@kronosbusiness.com |
