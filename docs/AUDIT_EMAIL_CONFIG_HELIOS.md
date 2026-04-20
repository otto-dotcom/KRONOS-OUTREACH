# HELIOS Email Configuration Audit
**Date:** 2026-04-20  
**Scope:** HELIOS Outreach Email Workflow, Settings Architecture, Model Tuning  
**Status:** Complete Audit Report  
**Project:** Italian Solar Energy Outreach System

---

## Executive Summary

HELIOS is the parallel outreach system for Italian solar energy companies. This audit documents:
- **Workflow Architecture**: Adapted from KRONOS template for solar installer market
- **Settings Management**: Airtable-based configuration (appyqUHfwK33eisQu)
- **Model Tuning**: GPT-4o-mini with Italian solar-specific prompt engineering
- **Security**: Data isolation from KRONOS (separate Airtable base, distinct domain)
- **Recommendations**: 5 critical setup steps + 3 tuning recommendations

---

## 1. HELIOS PROJECT OVERVIEW

### 1.1 Project Scope

| Aspect | KRONOS | HELIOS |
|--------|--------|--------|
| **Market** | Swiss Real Estate | Italian Solar Energy |
| **Target** | RE agencies (Rank ≥ 5) | Solar installers & energy companies |
| **Email Domain** | kronosbusiness.com | heliosbusiness.it |
| **Sender** | otto@kronosbusiness.com | otto@heliosbusiness.it |
| **Airtable Base** | appLriEwWldpPTMPg | appyqUHfwK33eisQu |
| **Airtable Table** | tblLZkFo7Th7uyfWB | tbl07Ub0WeVHOnujP |
| **Analytics Tag** | KRONOS_OUTREACH | HELIOS_OUTREACH |
| **CRM Fields** | company name, City, Rank | company name, Region, Score |

### 1.2 Data Isolation (CRITICAL)

```
╔════════════════════════════════════════════════════════════════╗
║  HELIOS & KRONOS MUST HAVE ZERO DATA CROSSOVER               ║
║                                                                ║
║  KRONOS Airtable Base: appLriEwWldpPTMPg (Switzerland)        ║
║  HELIOS Airtable Base: appyqUHfwK33eisQu (Italy)              ║
║                                                                ║
║  Every n8n workflow MUST query only its own base.             ║
║  If HELIOS workflow queries KRONOS data → CRITICAL FAILURE   ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 2. HELIOS WORKFLOW ARCHITECTURE

### 2.1 Recommended Workflow: `HELIOS_OUTREACH_EMAIL.json`

**Workflow Name:** HELIOS Outreach - Email Only (OpenRouter + Brevo)  
**Status:** Not yet created (template available: KRONOS_OUTREACH_EMAIL.json)  
**Trigger:** HTTP Webhook POST to `/helios-outreach`

### 2.2 Node Configuration (Adapted from KRONOS)

| ID | Node Name | Purpose | HELIOS Adaptation |
|----|-----------|---------|-------------------|
| wh-001 | Webhook | Entry point | Path: `helios-outreach` |
| cfg-001 | Set Config | Load runtime params | baseId: appyqUHfwK33eisQu, tableId: tbl07Ub0WeVHOnujP |
| atbl-001 | Get Leads from Airtable | Fetch qualified leads | Filter: EMAIL != "" AND STATUS != "Sent" AND Score >= 7 |
| if-email | Check Has Email | Validation gate | Same logic as KRONOS |
| ai-email | Email AI Agent | Generate email copy | **ITALIAN PROMPT** (see 2.4) |
| llm-email | OpenRouter Email | LLM backend | Model: openai/gpt-4o-mini, temperature: 0.5 |
| parser-email | Email Output Parser | Validate JSON output | Schema: {subject, emailBody} |
| code-email | Parse Email Output | Extract & merge | Same as KRONOS |
| http-brevo | Send Email via Brevo | Email dispatch | Tag: HELIOS_OUTREACH |
| atbl-email-sent | Update Airtable - Email Sent | Mark as processed | Sets STATUS="Sent" |
| err-001 / http-err | Error Handling | Failure notification | Alert to consulting@kronosautomations.com |

### 2.3 Lead Filtering Logic (Italian Market)

**Recommended Filter Formula:**
```
AND({EMAIL} != "", {STATUS} != "Sent", {STATUS} != "Processing", {Score} >= 7)
```

**Key Differences from KRONOS:**
- Score threshold: 7 (vs. Rank 5 for KRONOS) - Italian market more competitive
- Status field: "STATUS" (vs. "EMAIL STATUS") - adjust for your Airtable schema
- Region-based: Consider adding city/region filter for Italy if data available

**Default Lead Limit:** 5 leads per trigger (configurable)

### 2.4 Model Tuning: HELIOS Email AI Agent Prompt

**LLM Model:** `openai/gpt-4o-mini` (same as KRONOS)

**System Prompt (Recommended for HELIOS):**
```
You are a cold email specialist writing on behalf of HELIOS Energy Solutions.
HELIOS helps Italian solar installation companies and energy firms 
expand their client base through automated outreach and lead qualification.

GOAL: Write a short, direct cold email (4-5 sentences max) in Italian or English 
(match lead location) that feels like it came from a real person.

LEAD DATA:
{{ JSON.stringify($json) }}

CONTENT PROTOCOL:
1. HOOK: Reference specific achievement or project in their region. 
   Italian example: "Vedo che avete completato impianti nel nord Italia."
   NEVER: "Ho notato che siete attivi in [città]"

2. PROBLEM: One pain unique to solar installers:
   - Lead generation costs eating margins (CAC too high)
   - Seasonal revenue volatility (winter slump)
   - Long sales cycles (3-6 months pipeline)

3. SOLUTION: One sentence. 
   HELIOS automates first contact so installers focus on closing deals, 
   not chasing cold leads.

4. CTA: Low-friction close with calendar link.

TONE: Professional, warm, conversational. NO buzzwords 
(scalable/sinergico/infrastruttura). NO ALL CAPS. NO exclamation marks.
Greet with 'Gentile {Name},' if name available, else 'Buongiorno,'

LANGUAGE: If lead is Italian-based, respond in Italian. 
If mixed or unclear, use English with Italian greeting.

SUBJECT LINE: Max 50 chars. Patterns: 
- "{Name} - opportunità energia solare"
- "{CompanyName} | acquisizione lead"
NEVER: 'Scalable', 'Infrastructure', 'Inizialize', all-caps.

HTML BRANDING:
- Logo: <div style="text-align:center;padding:20px 0;"><img src="https://heliosenergy.it/logo.png" alt="HELIOS" width="120"></div>
- Container: max-width:550px;margin:auto;padding:30px;border:2px solid #1A1A1A;border-top:10px solid #FFA500;font-family:'Inter',sans-serif;color:#1A1A1A;
- CTA: <a href="https://cal.com/otto-helios/15min" style="color:#FFA500;font-weight:bold;">Prenota una call</a>
- Signature: <div style="border-top:2px dotted #FFA500;margin-top:25px;padding-top:10px;"><strong>Otto - HELIOS Energy Solutions</strong><br>Italian Solar Expansion<br><a href="mailto:otto@heliosbusiness.it" style="color:#FFA500;">otto@heliosbusiness.it</a></div>

Response MUST be ONLY valid JSON: {"subject": "...", "emailBody": "..."}
```

**Tuning Parameters (HELIOS-Specific):**
- **Temperature:** 0.5 (consistency for Italian market)
- **Max Tokens:** 300 (same as KRONOS)
- **Language Model:** gpt-4o-mini (sufficient for Italian + English bilingual)
- **Output Format:** JSON (subject, emailBody)

---

## 3. HELIOS AIRTABLE CONFIGURATION

### 3.1 Airtable Base & Table Details

| Parameter | Value |
|-----------|-------|
| Base ID | appyqUHfwK33eisQu |
| Table Name | Leads (or equivalent) |
| Table ID | tbl07Ub0WeVHOnujP |
| Lead Limit (default) | 5 |

### 3.2 Recommended Airtable Schema

**Key Fields Required:**

| Field | Type | Purpose | Notes |
|-------|------|---------|-------|
| FULL NAME | Text | Contact name | Required for personalization |
| EMAIL | Email | Contact email | Filter: must exist |
| company name | Text | Company name | For HOOK personalization |
| Region | Text | Italian region (Lombardy, Lazio, etc.) | Regional context |
| Score | Number | Lead quality (0-10) | Filter threshold: >= 7 |
| Company Type | Single select | "Installer" / "Distributor" / "Energy Firm" | Tone adjustment |
| STATUS | Single select | Pending / Processing / Sent / Failed | Filter: != "Sent" |
| EMAIL_SUBJECT | Text (long) | Subject line sent | For audit trail |
| SENT MAIL | Text (long) | Email body sent | For audit trail |
| ORIGINAL_SUBJECT | Text | Original AI subject (before edits) | For A/B testing |
| ORIGINAL_BODY | Text | Original AI body (before edits) | For A/B testing |

### 3.3 Settings Table (Airtable)

**Create Settings table with:**

| Key | Value |
|-----|-------|
| email_system_prompt | [Full HELIOS prompt from section 2.4] |
| airtable_config | `{"baseId": "appyqUHfwK33eisQu", "tableId": "tbl07Ub0WeVHOnujP"}` |
| brevo_config | `{"senderEmail": "otto@heliosbusiness.it", "senderName": "Otto - HELIOS", "tag": "HELIOS_OUTREACH"}` |
| copy_directives | [HELIOS-specific outreach instructions] |
| lead_filtering | `{"minScore": 7, "statusExclusions": ["Sent", "Processing"]}` |

---

## 4. HELIOS BREVO CONFIGURATION

### 4.1 Email Sender Setup

| Parameter | Value |
|-----------|-------|
| Sender Email | otto@heliosbusiness.it |
| Sender Name | Otto - HELIOS |
| BCC Email | otto@heliosbusiness.it |
| Analytics Tag | HELIOS_OUTREACH |
| API Endpoint | https://api.brevo.com/v3/smtp/email |

### 4.2 Setup Checklist

- [ ] **Domain Verification**
  - [ ] otto@heliosbusiness.it verified in Brevo
  - [ ] SPF record added to heliosbusiness.it DNS
  - [ ] DKIM record configured
  - [ ] DMARC policy set

- [ ] **API Key**
  - [ ] API key with SMTP sending permission created
  - [ ] Rate limits: Default 500-1000 emails/day (verify)
  - [ ] Key stored in n8n credential store (NOT in git)

- [ ] **Warm-up Plan**
  - [ ] Start with 5 emails/day for first week
  - [ ] Ramp to 10/day week 2, then 20/day week 3
  - [ ] Monitor bounce/complaint rates
  - [ ] If bounce > 5%, pause and investigate

### 4.3 Italian-Specific Considerations

**Deliverability Tips for .it domain:**
- Monitor AGCOM compliance (Italian email regulations)
- Unsubscribe link mandatory for bulk emails
- Include company registration number in signature
- Response time commitment: "Rispondiamo entro 24 ore"

---

## 5. HELIOS SETTINGS BACKUP & VERSION CONTROL

### 5.1 Configuration Files to Create

```
KRONOS-OUTREACH/
├── config/
│   ├── settings_backup_helios.json
│   ├── helios_airtable_mapping.json
│   ├── helios_brevo_config.json
│   └── MODEL_TUNING_GUIDE_HELIOS.md
├── directives/
│   ├── HELIOS_EMAIL_SYSTEM_PROMPT.md
│   └── HELIOS_DIRECTIVES.md (optional)
└── docs/
    └── AUDIT_EMAIL_CONFIG_HELIOS.md (this file)
```

### 5.2 Settings Backup Structure (helios)

```json
{
  "workflow_name": "HELIOS_OUTREACH_EMAIL",
  "version": "1.0",
  "last_updated": "2026-04-20",
  "airtable": {
    "baseId": "appyqUHfwK33eisQu",
    "tableId": "tbl07Ub0WeVHOnujP",
    "filterFormula": "AND({EMAIL} != \"\", {STATUS} != \"Sent\", {STATUS} != \"Processing\", {Score} >= 7)",
    "defaultLeadLimit": 5
  },
  "brevo": {
    "senderEmail": "otto@heliosbusiness.it",
    "senderName": "Otto - HELIOS",
    "tag": "HELIOS_OUTREACH",
    "warmupPlan": "5→10→20 emails/day over 3 weeks"
  },
  "openrouter": {
    "model": "openai/gpt-4o-mini",
    "temperature": 0.5,
    "maxTokens": 300
  }
}
```

---

## 6. HELIOS MODEL TUNING

### 6.1 Parameter Recommendations

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Model** | openai/gpt-4o-mini | Cost + speed optimized; handles Italian |
| **Temperature** | 0.5 | Consistency for solar market (more technical than RE) |
| **Max Tokens** | 300 | Enforce 4-5 sentence constraint |
| **Language** | Italian-first | If company in Italy, email in Italian |

### 6.2 Italian Language Tuning

**Key phrases to avoid (already in prompt):**
- "Scalable" → Not common in Italian B2B
- "Sinergico" → Buzzword equivalent
- "Infrastruttura" → Overused

**Key phrases to emphasize:**
- "Risparmio energetico" (energy savings)
- "Tempo di ROI" (ROI timeline)
- "Qualificazione lead" (lead qualification)
- "Margini" (margins)

### 6.3 A/B Testing Plan for HELIOS

**Phase 1: Baseline (Emails 1-5)**
- Temperature: 0.5
- Language: Italian (if Italian leads)
- Track: Open rate, language preference feedback

**Phase 2: Test (Emails 6-15)**
- Temperature: 0.5 (keep consistent)
- Regional variation: Add region-specific HOOK for each
- Track: Open rate, click-through, reply rate

**Decision Gate:**
- If open rate >= 12%: Proceed to full campaign
- If open rate < 10%: Revise HOOK section, increase temperature to 0.6

---

## 7. HELIOS PRE-DEPLOYMENT CHECKLIST

### Setup Phase

- [ ] **Airtable Prepared**
  - [ ] HELIOS base exists (appyqUHfwK33eisQu)
  - [ ] Leads table created with required fields
  - [ ] Settings table created with configuration keys
  - [ ] Minimum 5 leads with Score >= 7

- [ ] **Brevo Configured**
  - [ ] otto@heliosbusiness.it verified in Brevo
  - [ ] SPF/DKIM/DMARC configured for heliosbusiness.it
  - [ ] API key created with SMTP permission
  - [ ] Rate limits verified

- [ ] **n8n Workflow Created**
  - [ ] HELIOS_OUTREACH_EMAIL.json imported or created
  - [ ] All nodes properly configured
  - [ ] Credentials mapped:
    - [ ] Airtable (HELIOS base credential)
    - [ ] OpenRouter (API key)
    - [ ] Brevo (API key)

- [ ] **Configuration Populated**
  - [ ] All Airtable base/table IDs match (appyqUHfwK33eisQu, tbl07Ub0WeVHOnujP)
  - [ ] Email sender: otto@heliosbusiness.it
  - [ ] Tag: HELIOS_OUTREACH
  - [ ] Filter formula correct: Score >= 7

### Testing Phase

- [ ] **Dry Run (0 sends)**
  - [ ] Trigger workflow with leadLimit: 1
  - [ ] Check Airtable for test lead (don't update STATUS)
  - [ ] Verify AI generates email (check n8n logs)
  - [ ] Verify JSON parsing works

- [ ] **Test Send (1 email)**
  - [ ] Send to internal test email (otto@kronosautomations.com)
  - [ ] Verify in Brevo: email delivered
  - [ ] Check Airtable: STATUS updated to "Sent"
  - [ ] Verify signature renders correctly

- [ ] **Error Handling**
  - [ ] Trigger intentional error (bad credential)
  - [ ] Verify error alert sent to consulting@kronosautomations.com

### Production Launch Phase

- [ ] **Warm-up (Week 1)**
  - [ ] Send 5 emails on Day 1
  - [ ] Monitor Brevo delivery rate (should be 100%)
  - [ ] Monitor bounce rate (should be < 5%)
  - [ ] Monitor open rate by end of day (baseline)

- [ ] **Ramp-up (Week 2-3)**
  - [ ] Increase to 10 emails/day
  - [ ] Monitor engagement metrics
  - [ ] Adjust temperature if needed (see section 6.3)

- [ ] **Full Campaign (Week 4+)**
  - [ ] After 20 emails, evaluate open rate
  - [ ] If success (>= 12%), proceed with full list
  - [ ] Continue weekly monitoring

---

## 8. CRITICAL DIFFERENCES FROM KRONOS

| Aspect | KRONOS | HELIOS |
|--------|--------|--------|
| **Score Threshold** | Rank >= 5 | Score >= 7 (higher bar) |
| **Target Audience** | RE agencies | Solar installers |
| **Problem Hook** | Warm leads, mandates | Lead gen cost, seasonality |
| **Solution** | Automate first contact | Focus on closing (not hunting) |
| **Language** | English/German | Italian/English (bilingual) |
| **CTA Link** | https://cal.com/othman-zraidi-o24jj1/15min | https://cal.com/otto-helios/15min |
| **Email Domain** | kronosbusiness.com | heliosbusiness.it |
| **Brevo Tag** | KRONOS_OUTREACH | HELIOS_OUTREACH |
| **Sender Name** | Otto from KRONOS | Otto - HELIOS |

---

## 9. HELIOS SPECIFIC RECOMMENDATIONS

### 🔴 CRITICAL (Before Launch)

1. **Verify Data Isolation**
   - Confirm HELIOS workflow queries ONLY appyqUHfwK33eisQu
   - No cross-contamination with KRONOS data (appLriEwWldpPTMPg)
   - Action: Code review before activation

2. **Italian Domain Setup**
   - SPF, DKIM, DMARC must be configured
   - heliosbusiness.it DNS records must point correctly
   - Action: Work with domain registrar

### 🟡 HIGH (Before First Campaign)

3. **Warm-up Protocol**
   - Start with 5 emails/day, ramp gradually
   - Monitor bounce/complaint rates closely
   - Action: Set reminders for Day 1, Day 8, Day 15

4. **Language Settings**
   - Test prompt with Italian leads first
   - Verify Italian email rendering (special characters)
   - Action: Send 3 test emails to Italian address

### 🟢 MEDIUM (Optimization)

5. **Regional Tuning**
   - HELIOS operates across Italian regions (north, central, south)
   - Consider region-specific company types (installer vs. distributor)
   - Action: A/B test regional variations after 20 sends

---

## 10. AUDIT SIGN-OFF

| Item | Status | Owner | Date |
|------|--------|-------|------|
| Workflow Architecture | 📋 Template Provided | Claude | 2026-04-20 |
| Airtable Configuration | ✅ Identified | User | 2026-04-20 |
| Brevo Setup | 📋 Checklist Provided | DevOps | Pending |
| Model Tuning | ✅ Documented | Claude | 2026-04-20 |
| Data Isolation | 🔴 CRITICAL | DevOps | Pending |
| Pre-Deployment Checklist | 📋 Template | QA | Pending |

---

**End of HELIOS Audit Report**
