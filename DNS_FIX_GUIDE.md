# 🚨 KRONOS DNS CONFIGURATION FIX — CRITICAL

## ❌ Current Issues (Must Fix Before Launch)

### 1. **DUPLICATE SPF RECORDS** (RFC violation)
You have TWO SPF TXT records, which violates RFC 7208. DNS servers may randomly choose one, causing intermittent auth failures.

**Current (BROKEN)**:
```
v=spf1 include:spf.brevo.com ~all
v=spf1 include:_spf.mail.hostinger.com ~all
```

**Fixed (CORRECT)**:
```
v=spf1 include:spf.brevo.com include:_spf.mail.hostinger.com ~all
```

### 2. **MISSING DKIM** (Critical for deliverability)
`mail._domainkey.kronosbusiness.com` does NOT exist.

Without DKIM, Gmail/Outlook will:
- Flag emails as unauthenticated
- Land in Promotions/Spam
- Damage sender reputation

---

## ✅ Required DNS Changes

### Step 1: Fix SPF Record (Hostinger DNS)

1. Go to Hostinger → Domains → kronosbusiness.com → DNS/Name Servers
2. Find the **TWO** SPF TXT records
3. Delete BOTH records
4. Create ONE new TXT record:
   - **Type**: TXT
   - **Name**: `@` (or leave blank for root domain)
   - **Value**: `v=spf1 include:spf.brevo.com include:_spf.mail.hostinger.com ~all`
   - **TTL**: 3600

### Step 2: Add DKIM Record (Brevo → Hostinger)

1. Go to **Brevo Dashboard** → Settings → Senders & IP → Domains
2. Find `kronosbusiness.com` → Click "Authenticate this domain"
3. Copy the DKIM CNAME record (format: `mail._domainkey` → `mail._domainkey.brevo.com`)
4. Go to **Hostinger DNS**
5. Add new CNAME record:
   - **Type**: CNAME
   - **Name**: `mail._domainkey`
   - **Value**: `mail._domainkey.brevo.com` (exact value from Brevo)
   - **TTL**: 3600

### Step 3: Verify Configuration

Wait 15-30 minutes for DNS propagation, then test:

```bash
# Check SPF (should show ONE merged record)
nslookup -type=TXT kronosbusiness.com 8.8.8.8

# Check DKIM (should now resolve)
nslookup -type=CNAME mail._domainkey.kronosbusiness.com 8.8.8.8

# Check DMARC (already correct)
nslookup -type=TXT _dmarc.kronosbusiness.com 8.8.8.8
```

**Expected Results**:
```
✅ SPF: v=spf1 include:spf.brevo.com include:_spf.mail.hostinger.com ~all
✅ DKIM: mail._domainkey.kronosbusiness.com → CNAME → mail._domainkey.brevo.com
✅ DMARC: v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com
```

---

## 🔍 Verification Tools

### Online Checkers:
- **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3akronosbusiness.com
- **DMARC Analyzer**: https://www.dmarcanalyzer.com/spf/checker/
- **Mail-Tester**: Send test email to checker@mail-tester.com, review score

### Command Line:
```bash
# All-in-one check
dig TXT kronosbusiness.com +short
dig TXT _dmarc.kronosbusiness.com +short
dig CNAME mail._domainkey.kronosbusiness.com +short
```

---

## 📊 Current Status (2026-03-19)

| Record | Status | Notes |
|--------|--------|-------|
| MX | ✅ | mx1.hostinger.com (5), mx2.hostinger.com (10) |
| SPF | ❌ | **TWO records** — must merge |
| DKIM | ❌ | **MISSING** — must add CNAME |
| DMARC | ✅ | p=none, reporting to Brevo |

---

## ⚠️ Impact if Not Fixed

**Without DKIM + proper SPF**:
- 60-80% of emails land in Promotions/Spam
- Gmail shows "via brevo.com" warning
- Domain reputation degrades with each send
- Open rates drop below 5%
- Risk of permanent blacklisting

**After fixing**:
- Primary inbox delivery: 70-85%
- No authentication warnings
- Clean sender reputation
- Open rates: 15-25% (industry standard)

---

## 🚀 Post-Fix: Domain Warmup

Once DNS is fixed, follow this warmup schedule:

| Day | Sends | Notes |
|-----|-------|-------|
| 1-3 | 10/day | Monitor deliverability |
| 4-7 | 20/day | Check spam reports |
| 8-14 | 50/day | Stable inbox rate |
| 15+ | 100/day | Full volume |

**Never**:
- Send to purchased lists
- Exceed 100 emails/day in first 30 days
- Send from multiple IPs simultaneously
- Use Brevo + Hostinger sending at the same time

---

## 📝 Next Steps After DNS Fix

1. ✅ Fix SPF + DKIM (this doc)
2. Wait 24 hours for full DNS propagation
3. Test with Mail-Tester (aim for 8+ / 10 score)
4. Deploy Vercel changes (runtime fixes already done)
5. Start warmup: 10 emails/day for 3 days
6. Monitor Brevo analytics for bounce/spam rates
7. Scale to 100/day after 2 weeks if metrics are clean

---

**Generated**: 2026-03-19
**Author**: KRONOS Audit System
**Priority**: 🔴 CRITICAL — must fix before production launch
