# HELIOS Brevo Email Sender Configuration
**Last Updated:** 2026-04-20  
**Audit Document:** docs/AUDIT_EMAIL_CONFIG_HELIOS.md  
**Project:** Italian Solar Energy Outreach

---

## SENDER DETAILS

| Parameter | Value |
|-----------|-------|
| **Email** | otto@heliosbusiness.it |
| **Name** | Otto - HELIOS |
| **Domain** | heliosbusiness.it |
| **Purpose** | Cold outreach to Italian solar installers & energy companies |
| **Region** | Italy |

---

## BREVO CONFIGURATION

| Parameter | Value |
|-----------|-------|
| Sender Email | otto@heliosbusiness.it |
| Sender Name | Otto - HELIOS |
| BCC Email | otto@heliosbusiness.it |
| Analytics Tag | HELIOS_OUTREACH |
| API Endpoint | https://api.brevo.com/v3/smtp/email |
| Content Type | application/json |

---

## CRITICAL: ITALIAN DOMAIN SETUP

### 1. DNS Configuration (MUST COMPLETE BEFORE SENDING)

#### SPF Record
```
v=spf1 include:brevo.com ~all
```

**Verification:** Add to heliosbusiness.it DNS settings

#### DKIM Record
Generate in Brevo Console:
1. Go to Brevo Dashboard → Sender Identity
2. Add domain: heliosbusiness.it
3. Copy DKIM DNS record (will look like):
   ```
   default._domainkey.heliosbusiness.it TXT "v=DKIM1; k=rsa; p=MIGfMA0GCS..."
   ```
4. Add to heliosbusiness.it DNS

#### DMARC Policy
```
v=DMARC1; p=quarantine; rua=mailto:postmaster@heliosbusiness.it
```

**Verification:** Add to heliosbusiness.it DNS

### 2. Brevo Sender Verification

1. Log in to Brevo Console
2. Settings → Senders → Add sender
3. Enter: otto@heliosbusiness.it
4. Brevo sends verification email
5. Click verification link in email
6. Confirm sender active in Brevo dashboard

**⚠️ CRITICAL:** Cannot send until sender verified AND DNS records propagated (can take 24-48 hours)

---

## WARM-UP SCHEDULE

### Why Warm-up is Required

New .it domains have lower initial sender reputation with Italian ISPs:
- Gmail: 0% inbox placement initially
- Libero: 0% inbox placement initially
- Tim.it: 0% inbox placement initially

Gradual ramp-up proves sender legitimacy.

### 3-Week Warm-up Plan

| Week | Daily Volume | Daily Emails | Total for Week | Actions |
|------|--------------|--------------|----------------|---------|
| **1** | 5/day | 5 | 25 | Monitor deliverability, check bounce rate |
| **2** | 10/day | 10 | 70 | Monitor open rates, spot-check Italian grammar |
| **3** | 20/day | 20 | 140 | Full testing, decide full-scale campaign |
| **4+** | Full | 50-100+/day | Ramp as needed | Production mode |

### Warm-up Monitoring

**Daily (Week 1-2):**
- [ ] Check Brevo delivery rate (target: 99%+)
- [ ] Check bounce rate (target: < 5%)
- [ ] Spot-check email rendering

**Every 2 days (Week 3+):**
- [ ] Check open rate (target: >= 12%)
- [ ] Check click rate (target: >= 2%)
- [ ] Review Brevo logs for complaints

---

## WORKFLOW INTEGRATION

### Node: "Send Email via Brevo" (http-brevo)

**Configuration:**

```json
{
  "method": "POST",
  "url": "https://api.brevo.com/v3/smtp/email",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "api-key",
        "value": "{{ $credentials.brevoApiKey }}"
      },
      {
        "name": "accept",
        "value": "application/json"
      },
      {
        "name": "content-type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "{{ JSON.stringify({ sender: { name: \"Otto - HELIOS\", email: \"otto@heliosbusiness.it\" }, to: [{ email: $json.EMAIL }], bcc: [{ email: \"otto@heliosbusiness.it\" }], subject: $json.subject, htmlContent: $json.emailBody, tags: [\"HELIOS_OUTREACH\"] }) }}"
}
```

**Tag:** HELIOS_OUTREACH (for analytics filtering)

---

## ERROR HANDLING

### If Email Send Fails

Automatic error trigger sends alert to:
- **Email:** consulting@kronosautomations.com
- **Subject:** "HELIOS Outreach Error - [ExecutionID]"
- **Body:** Includes node name and error message

### Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid API key" | API key expired or incorrect | Regenerate key in Brevo; update credential in n8n |
| "Sender not verified" | otto@heliosbusiness.it not verified | Go to Brevo → Verify sender email |
| "Rate limit exceeded" | Too many emails too fast | Add delay node between sends (100-200ms) |
| "Bounce - invalid email" | Bad email in lead data | Check Airtable; validate email format |
| "Complaint filed" | Lead marked as spam | Review email content for compliance |

---

## BREVO ANALYTICS & MONITORING

### Tag: HELIOS_OUTREACH

All HELIOS emails tagged for filtering and analytics.

### Key Metrics

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Delivery Rate | 98%+ | Check Brevo logs; verify domain setup |
| Bounce Rate | < 5% | Investigate email data quality |
| Open Rate | >= 12% | See MODEL_TUNING_GUIDE_HELIOS.md |
| Click Rate | >= 2% | Improve CTA, test different calendar angles |
| Complaint Rate | < 0.5% | Review email content for compliance |

### Brevo Dashboard Reports

Access via Brevo Console:
1. Reports → Email Activity
2. Filter by tag: HELIOS_OUTREACH
3. Date range: Last 7 days, 30 days, custom

**Weekly Report Creation:**
```
Date Range: Monday-Sunday
Metrics: Sent, Delivered, Bounced, Opened, Clicked, Complained
Threshold: Stop if bounce > 5% or complaint > 1%
```

---

## ITALIAN COMPLIANCE & REGULATIONS

### AGCOM Compliance

**AGCOM** (Autorità per le Garanzie nelle Comunicazioni) — Italian telecom regulator

**Email Requirements:**
- ✅ Unsubscribe link mandatory (if unsolicited)
- ✅ Sender identity clear (company name, contact info)
- ✅ Opt-out mechanism required
- ✅ GDPR privacy policy linked

**Signature Best Practice:**
```
Otto - HELIOS Energy Solutions
VAT/P.IVA: [Italian company number]
Address: [Italian office address]
Unsubscribe: [link]
```

### GDPR Compliance (EU Requirement)

- ✅ Privacy policy linked (if handling personal data)
- ✅ Legitimate interest documented (outreach to business contacts)
- ✅ Data retention policy published
- ✅ Right to be forgotten implemented

**Note:** Business-to-business (B2B) emails have lighter GDPR requirements than B2C.

---

## RATE LIMITING GUIDELINES

### Brevo Default Limits

Standard Brevo account:
- **Emails per day:** 500-1,000 (depends on account tier)
- **Emails per minute:** ~100 (burst limit)
- **Concurrent connections:** 5

**Action:** Verify limits in Brevo account settings.

### Workflow Rate Limiting

To prevent hitting rate limits during full campaign:

**Add delay node between sends:**

```json
{
  "type": "n8n-nodes-base.wait",
  "parameters": {
    "unit": "ms",
    "amount": 100
  }
}
```

**Explanation:**
- 100ms between sends = 10 emails/second = 36,000 emails/hour
- Safe for batches up to 100 emails/hour
- Adjust to 200ms if Brevo rate-limits

---

## CREDENTIALS MANAGEMENT

### Storing Brevo API Key

**DO:** Store in n8n credential store
- Encrypted in n8n database
- Never exposed in workflow JSON
- Rotatable without changing workflow

**DO NOT:** 
- ❌ Commit API key to git
- ❌ Email API key
- ❌ Paste in workflow JSON
- ❌ Share with non-admin users

### API Key Rotation

Every 6 months:
1. Generate new API key in Brevo
2. Update credential in n8n
3. Delete old API key from Brevo
4. Document change

---

## FIRST-TIME SETUP CHECKLIST

### Pre-Launch (1-2 Weeks Before)

- [ ] **Domain Setup**
  - [ ] SPF record added to heliosbusiness.it DNS
  - [ ] DKIM record added to heliosbusiness.it DNS
  - [ ] DMARC policy added to heliosbusiness.it DNS
  - [ ] DNS propagation confirmed (nslookup test)

- [ ] **Brevo Sender**
  - [ ] otto@heliosbusiness.it added as sender
  - [ ] Verification email confirmed
  - [ ] Sender status "Active" in Brevo

- [ ] **API Key**
  - [ ] API key generated with SMTP permission
  - [ ] Key stored in n8n credential (not in code)
  - [ ] Test API call succeeds (use Brevo test endpoint)

- [ ] **Warm-up Plan**
  - [ ] Calendar reminders set (Day 1, Day 8, Day 15)
  - [ ] Daily email limits configured in workflow
  - [ ] Monitoring dashboard ready

- [ ] **Testing**
  - [ ] Send 1 email to internal address (otto@kronosautomations.com)
  - [ ] Verify in Brevo: email delivered, tag HELIOS_OUTREACH
  - [ ] Check Airtable: STATUS updated to "Sent"

### Launch Day (Day 1 Warm-up)

- [ ] **Go/No-Go Decision**
  - [ ] DNS verified (24-48 hours after changes)
  - [ ] Sender verified in Brevo
  - [ ] Test email successful
  - [ ] Error handling tested

- [ ] **Execution**
  - [ ] Trigger: Leads 1-5 (5 emails total)
  - [ ] Monitor: Brevo delivery rate in real-time
  - [ ] Document: Any delivery issues

- [ ] **Monitoring Setup**
  - [ ] Brevo dashboard open (bookmark it)
  - [ ] Email reminder set for Day 2 check-in
  - [ ] Slack/email alert configured for errors

### Week 2 (Ramp to 10/day)

- [ ] **Performance Check**
  - [ ] Bounce rate < 5%? → Continue
  - [ ] Bounce rate >= 5%? → Stop, investigate
  - [ ] Delivery rate 99%? → Continue
  - [ ] Delivery rate < 98%? → Check DNS, ISP blocks

- [ ] **Adjustment**
  - [ ] Increase leadLimit to 10
  - [ ] Monitor open rates (baseline expected)

### Week 3 (Ramp to 20/day)

- [ ] **Engagement Check**
  - [ ] Open rate >= 12%? → Proceed to full
  - [ ] Open rate 10-12%? → Keep monitoring
  - [ ] Open rate < 10%? → See MODEL_TUNING_GUIDE_HELIOS.md

- [ ] **Full Scale Decision**
  - [ ] All metrics healthy? → Move to production
  - [ ] Issues detected? → Pause, troubleshoot

---

## TROUBLESHOOTING GUIDE

### Deliverability Issues

**Problem:** Emails not arriving (delivery rate < 90%)

**Steps:**
1. Check Brevo logs (Reports → Email Activity)
2. Look for bounce codes:
   - 421: Temporary issue (ISP overloaded)
   - 550: Permanent bounce (invalid email)
   - 452: Throttling (rate limit hit)

**Solutions:**
- 421: Retry in 1 hour
- 550: Remove email from list
- 452: Add delay node (increase to 200ms)

### Bounce Rate High (> 5%)

**Problem:** Too many hard bounces

**Cause:** Bad email data in Airtable

**Solution:**
1. Export HELIOS bounced emails from Brevo
2. Cross-reference with Airtable
3. Remove invalid emails
4. Run email validation on Leads table
5. Resume campaign

### Open Rate Low (< 10%)

**Problem:** Leads not opening emails

**See:** MODEL_TUNING_GUIDE_HELIOS.md section 6 (adjust temperature)

### Complaints / Spam Reports

**Problem:** Leads marking emails as spam

**Action:**
1. STOP campaign immediately
2. Review email content for compliance issues
3. Check signature (unsubscribe link present?)
4. Verify GDPR compliance
5. Resume after fixes

---

## CONTACTS & SUPPORT

| Role | Contact | Purpose |
|------|---------|---------|
| **Email Owner** | Claude (setup via audit) | Configuration questions |
| **Brevo Account Admin** | [Name] | API key rotation, limits |
| **Domain Admin** | [Name] | DNS, SPF/DKIM/DMARC |
| **Error Alerts** | consulting@kronosautomations.com | Workflow errors |

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-20 | Initial Brevo configuration for HELIOS |

---

**End of HELIOS Brevo Configuration**
