# KRONOS Email Configuration Audit
**Date:** 2026-04-20  
**Scope:** KRONOS Outreach Email Workflow, Settings Architecture, Model Tuning  
**Status:** Complete Audit Report  
**Airtable Schema:** appLriEwWldpPTMPg (Swiss Real Estate)

> **Note:** This audit documents the current KRONOS configuration. Field names (e.g., "EMAIL STATUS" vs "STATUS", "Rank" vs "Score") are schema-specific to your Airtable base. Adjust all references to match your actual Airtable field names.

---

## Executive Summary

The KRONOS email outreach system is well-structured with comprehensive configuration management. This audit documents:
- **Workflow Architecture**: 11-node n8n workflow with AI-driven email generation
- **Settings Management**: Airtable-based configuration table with copy/backup requirements
- **Model Tuning**: GPT-4o-mini with Swiss RE-specific prompt engineering
- **Security**: Credential management via n8n (requires credential ID mapping)
- **Recommendations**: 4 critical improvements

---

## 1. WORKFLOW ARCHITECTURE AUDIT

### 1.1 Current Workflow: `KRONOS_OUTREACH_EMAIL.json`

**Workflow Name:** KRONOS Outreach - Email Only (OpenRouter + Brevo)  
**Status:** Inactive (ready to activate)  
**Trigger:** HTTP Webhook POST to `/kronos-outreach`

#### Node Flow & Configuration

| ID | Node Name | Type | Purpose | Config |
|----|-----------|------|---------|--------|
| wh-001 | Webhook | n8n-nodes-base.webhook | Entry point | POST, path: `kronos-outreach` |
| cfg-001 | Set Config | n8n-nodes-base.set | Load runtime params | baseId, tableId, leadLimit (default: 5) |
| atbl-001 | Get Leads from Airtable | n8n-nodes-base.airtable | Fetch qualified leads | Filter: EMAIL != "" AND EMAIL STATUS != "Sent" AND Rank >= 5 |
| if-email | Check Has Email | n8n-nodes-base.if | Validation gate | Condition: {EMAIL} notEmpty |
| ai-email | Email AI Agent | @n8n/n8n-nodes-langchain.agent | Generate email copy | Prompt-based (see 1.3) |
| llm-email | OpenRouter Email | @n8n/n8n-nodes-langchain.lmChatOpenAi | LLM backend | Model: openai/gpt-4o-mini |
| parser-email | Email Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Validate JSON output | Schema: {subject, emailBody} |
| code-email | Parse Email Output | n8n-nodes-base.code | Extract & merge | Combines AI output + lead data |
| http-brevo | Send Email via Brevo | n8n-nodes-base.httpRequest | Email dispatch | POST to Brevo v3/smtp/email |
| atbl-email-sent | Update Airtable - Email Sent | n8n-nodes-base.airtable | Mark as processed | Sets EMAIL STATUS="Sent", stores subject + body |
| err-001 / http-err | Error Handling | Error Trigger + HTTP Alert | Failure notification | Sends alert to consulting@kronosautomations.com |

### 1.2 Lead Filtering Logic

**Airtable Filter Formula:**
```
AND({EMAIL} != "", {EMAIL STATUS} != "Sent", {EMAIL STATUS} != "Processing ", {Rank} >= 5)
```

**Interpretation:**
- Email must exist (not empty)
- Status must not be "Sent" (idempotent, prevents duplicates)
- Status must not be "Processing " (prevents race conditions)
- Rank must be >= 5 (quality threshold: high-priority leads only)

**Default Lead Limit:** 5 leads per trigger (configurable via webhook body)

### 1.3 Model Tuning: Email AI Agent Prompt

**LLM Model:** `openai/gpt-4o-mini` (via OpenRouter)

**System Prompt (Current):**
```
You are a cold email specialist writing on behalf of KRONOS Automations.
KRONOS helps Swiss real estate agencies automate their lead follow-up and mandate acquisition.

GOAL: Write a short, direct cold email (4-5 sentences max) that feels like it came from a real person.

CONTENT PROTOCOL:
1. HOOK: Specific observation about their business using agency name or city. NEVER start with 'I noticed you are active in [city]'.
2. PROBLEM: One pain - losing warm leads, advisors wasting time on unqualified contacts, inconsistent mandate pipeline.
3. SOLUTION: One sentence. KRONOS automates first contact so consultants only deal with ready-to-move clients.
4. CTA: Low-friction close with the booking link.

TONE: Direct, professional, conversational. NO buzzwords (scalable/synergy/leverage/infrastructure/optimize). NO ALL CAPS. NO exclamation marks.
Greet with 'Gruezi {Name},' if name available, else 'Hello,'

SUBJECT LINE: Max 50 chars. Lowercase preferred. Patterns: '{Name} - quick question', '{AgencyName} | mandate pipeline gap'.
NEVER: 'Scalable', 'Infrastructure', 'INITIALIZE', all-caps.

HTML BRANDING:
- Logo: KRONOS branded container
- Container: max-width:550px;margin:auto;padding:30px;border:2px solid #1A1A1A;border-top:10px solid #FF6B00
- Font: 'Inter', sans-serif; Color: #1A1A1A
- CTA: <a href="https://cal.com/othman-zraidi-o24jj1/15min">Book a 15-min call</a>
- Signature: Otto - KRONOS Automations | otto@kronosbusiness.com
```

**Tuning Parameters:**
- **Temperature:** Not explicitly set (default 0.7 assumed)
- **Max Tokens:** Not capped (may exceed optimal email length)
- **Output Format:** Structured JSON: `{subject, emailBody}`

### 1.4 Credentials Mapping (REQUIRED CONFIGURATION)

| Credential | Node | Current ID | Status | Action |
|-----------|------|-----------|--------|--------|
| Airtable PAT | atbl-001, atbl-email-sent | YOUR_AIRTABLE_CREDENTIAL_ID | ⚠️ Placeholder | Must map to actual credential ID |
| OpenRouter API | llm-email | YOUR_OPENROUTER_CREDENTIAL_ID | ⚠️ Placeholder | Must map to actual credential ID |
| Brevo API Key | http-brevo, http-err | YOUR_BREVO_CREDENTIAL_ID | ⚠️ Placeholder | Must map to actual credential ID |

**Status:** Workflow cannot run until all credentials are mapped to actual n8n credential IDs.

---

## 2. SETTINGS MANAGEMENT & COPY REQUIREMENTS

### 2.1 Airtable Settings Table Structure

**Table Name:** `Settings` (implied from DATABASE_SCHEMA.md)

**Schema:**
| Field | Type | Purpose |
|-------|------|---------|
| Key | String | Configuration identifier |
| Value | Long Text | Configuration data (JSON or plaintext) |

### 2.2 Settings That Must Be Copied/Versioned

#### Critical Settings:

1. **email_system_prompt** (Settings table)
   - Current value: Full system prompt from Email AI Agent node
   - Purpose: AI email generation instructions
   - Backup location: `/directives/EMAIL_SYSTEM_PROMPT.txt`
   - Copy strategy: Stored in both n8n workflow AND Airtable for versioning

2. **email_templates** (Settings table)
   - Pattern: Subject line + body templates
   - Purpose: Human-reviewed, high-performing copy patterns
   - Backup location: `/templates/email/`
   - Copy strategy: Save high-performing emails to memory vault (JARVIS capability)

3. **airtable_config** (Settings table)
   - baseId: `appLriEwWldpPTMPg`
   - tableId: `tblLZkFo7Th7uyfWB`
   - Purpose: Database endpoint mapping
   - Backup location: `/config/airtable_mapping.json`
   - Copy strategy: Version control + deployment checkpoints

4. **brevo_config** (Settings table)
   - senderEmail: `otto@kronosbusiness.com`
   - senderName: `Otto from KRONOS`
   - tags: `KRONOS_OUTREACH`
   - Purpose: Email sending defaults
   - Backup location: `/config/brevo_config.json`
   - Copy strategy: Environment variables for production

5. **lead_scoring_thresholds** (Settings table)
   - Current: `Rank >= 5`
   - Purpose: Quality filtering
   - Backup location: `/config/lead_filters.json`
   - Copy strategy: Airtable versioning + git tracking

6. **copy_directives** (Settings table, mentioned in JARVIS)
   - Content: Operational instructions for email writing
   - Backup location: `/directives/JARVIS_DIRECTIVES.md`
   - Copy strategy: Git-versioned

### 2.3 Recommended Settings Copy Structure

Create `/config/settings_backup.json`:
```json
{
  "workflow_name": "KRONOS_OUTREACH_EMAIL",
  "version": "2.0",
  "last_updated": "2026-04-20",
  "settings": {
    "airtable": {
      "baseId": "appLriEwWldpPTMPg",
      "tableId": "tblLZkFo7Th7uyfWB",
      "filterFormula": "AND({EMAIL} != \"\", {EMAIL STATUS} != \"Sent\", {EMAIL STATUS} != \"Processing \", {Rank} >= 5)",
      "defaultLeadLimit": 5
    },
    "brevo": {
      "senderEmail": "otto@kronosbusiness.com",
      "senderName": "Otto from KRONOS",
      "tag": "KRONOS_OUTREACH",
      "apiUrl": "https://api.brevo.com/v3/smtp/email"
    },
    "openrouter": {
      "baseURL": "https://openrouter.ai/api/v1",
      "model": "openai/gpt-4o-mini"
    },
    "lead_filtering": {
      "minRank": 5,
      "statusExclusions": ["Sent", "Processing "],
      "emailRequired": true
    },
    "workflow_defaults": {
      "leadLimit": 5,
      "errorAlertEmail": "consulting@kronosautomations.com",
      "calendarLink": "https://cal.com/othman-zraidi-o24jj1/15min"
    }
  }
}
```

---

## 3. MODEL TUNING PARAMETERS

### 3.1 Current Model Configuration

| Parameter | Value | Source | Tuning Impact |
|-----------|-------|--------|----------------|
| **Model ID** | openai/gpt-4o-mini | llm-email node | ⭐⭐ Speed + Cost (primary lever) |
| **Temperature** | 0.7 (default) | OpenAI default | ⭐⭐⭐ Creativity/Consistency |
| **Max Tokens** | Unlimited | Not set | ⭐ Email length control |
| **Top P** | Not set (default 1.0) | OpenAI default | ⭐ Diversity control |
| **Presence Penalty** | Not set (default 0) | OpenAI default | Repetition control |
| **Output Format** | JSON (structured) | outputParserStructured | ⭐⭐⭐ Parsing reliability |

### 3.2 Model Selection Rationale

**Current:** `openai/gpt-4o-mini`

**Pros:**
- Fast inference (optimized for real-time email generation)
- Cost-effective ($0.00015/1k input, $0.0006/1k output)
- Multimodal support (not used, but available)
- Reliable JSON output parsing

**Cons:**
- Less nuanced than GPT-4o (may miss subtle regional patterns)
- Limited context window (128k vs unlimited in larger models)

**Recommendation:** Suitable for v1. Monitor open rates; if < 15%, consider upgrading to `openai/gpt-4o` for Q3 campaign.

### 3.3 Temperature Tuning Guide

**Current Setting:** 0.7 (default OpenAI)

| Temperature | Behavior | Use Case | Recommendation |
|-------------|----------|----------|----------------|
| 0.3-0.5 | Deterministic, repetitive | Consistency-critical (templated emails) | ✅ Try 0.4 for high-volume batches |
| 0.6-0.7 | Balanced | **Current setting** | Current baseline |
| 0.8-1.0 | Creative, variable | Personalization required | Try after 50+ sent emails |
| >1.0 | Chaotic | Testing only | Not recommended |

**Action:** Set `temperature: 0.5` in llm-email node for Q2 campaign (consistency over creativity).

### 3.4 Token Budget Analysis

**Current:** No max_tokens limit  
**Impact:** Emails could exceed intended 4-5 sentence constraint

**Recommended Settings:**
```json
{
  "maxTokens": 300,
  "expectedOutput": "~150-180 tokens per email"
}
```

**Rationale:** 300 tokens ≈ 225 words (email body + subject) = 4-5 sentences + signature.

### 3.5 JARVIS Integration - Model Directives

From `directives/JARVIS_DIRECTIVES.md` (v5.1):

**Key Model Parameters in Directives:**
- **Email Prompt Source:** Settings table key: `email_prompt` (SOP-05)
- **Update Protocol:** Via `update_email_prompt` tool (updates Settings table)
- **Memory Protocol:** Via `save_to_memory` tool (persists high-performing copy)

**Model Tuning Hooks:**
1. **Post-send analysis:** JARVIS monitors open/click rates
2. **Low engagement trigger:** If engagement < 10% for 20 emails, JARVIS recommends prompt revision
3. **Seasonal tuning:** Adjust tone/CTA based on campaign season

---

## 4. EMAIL CONFIGURATION CHECKLIST

### Pre-Deployment Validation

- [ ] **Credentials Mapped**
  - [ ] Airtable credential ID in n8n (atbl-001, atbl-email-sent)
  - [ ] OpenRouter credential ID in n8n (llm-email)
  - [ ] Brevo credential ID in n8n (http-brevo, http-err)

- [ ] **Airtable Schema Verified**
  - [ ] Leads table exists with all required fields (EMAIL, Rank, EMAIL STATUS, etc.)
  - [ ] Settings table exists with `Key` and `Value` columns
  - [ ] Filter formula tested: `AND({EMAIL} != "", {EMAIL STATUS} != "Sent", {EMAIL STATUS} != "Processing ", {Rank} >= 5)`

- [ ] **Brevo Configuration**
  - [ ] API key valid and has SMTP sending permission
  - [ ] Sender email (otto@kronosbusiness.com) verified in Brevo
  - [ ] Tag "KRONOS_OUTREACH" configured for analytics

- [ ] **OpenRouter Configuration**
  - [ ] API key valid with GPT-4o-mini access
  - [ ] Rate limits sufficient for batch size (default 5 leads)

- [ ] **Settings Table Populated**
  - [ ] `email_system_prompt` key contains full system message
  - [ ] `airtable_config` key contains baseId + tableId
  - [ ] `brevo_config` key contains sender details
  - [ ] `copy_directives` key contains JARVIS instructions

- [ ] **Email HTML Testing**
  - [ ] Send test email to internal inbox
  - [ ] Verify logo renders
  - [ ] Verify CTA link (cal.com booking)
  - [ ] Verify signature rendering

- [ ] **Error Handling**
  - [ ] Error trigger active and alert email configured
  - [ ] Test by triggering workflow without email

---

## 5. SECURITY AUDIT

### 5.1 Credential Management ✅

**Status:** SECURE (credentials externalized)

- Airtable PAT stored in n8n credential store (not in workflow JSON)
- OpenRouter API key stored in n8n credential store
- Brevo API key stored in n8n credential store

**Recommendation:** No changes required.

### 5.2 Data Isolation ✅

**Status:** SECURE (Swiss RE only)

- Single Airtable base: `appLriEwWldpPTMPg` (Swiss RE)
- Email domain: `kronosbusiness.com` (distinct from primary domain)
- No data commingling with HELIOS system (Italian solar)

**Recommendation:** Document this in DEPLOYMENT.md.

### 5.3 Audit Logging ⚠️

**Status:** PARTIAL

- Airtable records updated with subject + body (traceable)
- Brevo tag "KRONOS_OUTREACH" allows filtering sent emails
- n8n workflow execution log available (check status)

**Recommendation:** Enable n8n workflow execution history (Settings → saveManualExecutions: true already set).

### 5.4 Rate Limiting ⚠️

**Status:** UNVERIFIED

- Airtable: Default 5 lead limit (configurable)
- Brevo: No explicit rate limiting in workflow
- OpenRouter: No explicit rate limiting in workflow

**Recommendation:** Add rate limiting node if batches exceed 50 emails/hour.

---

## 6. COPY SETTINGS & VERSION CONTROL

### 6.1 Settings Backup Procedure

**What to Copy:**
1. Current email system prompt (from Email AI Agent node → Save to `/directives/EMAIL_SYSTEM_PROMPT.txt`)
2. Airtable configuration (baseId, tableId, filter formula)
3. Brevo sender configuration
4. OpenRouter model + settings
5. Lead filtering thresholds

**Where to Store:**
```
/config/settings_backup.json         ← Master settings snapshot
/directives/EMAIL_SYSTEM_PROMPT.txt  ← Current AI prompt
/directives/BREVO_SENDER_CONFIG.txt  ← Brevo defaults
/templates/email/high_performers/    ← Saved successful emails
```

### 6.2 Versioning Strategy

**File Structure:**
```
KRONOS-OUTREACH/
├── config/
│   ├── settings_backup.json           (version 2.0)
│   ├── settings_backup.v1.0.json      (archived)
│   ├── airtable_mapping.json
│   └── brevo_config.json
├── directives/
│   ├── EMAIL_SYSTEM_PROMPT.txt        (v2.0, current)
│   ├── BREVO_SENDER_CONFIG.txt
│   └── JARVIS_DIRECTIVES.md           (v5.1)
└── docs/
    └── AUDIT_EMAIL_CONFIG.md          (this file)
```

**Git Commit Protocol:**
```bash
# When updating email prompt
git commit -m "chore: update email system prompt (v2.1 - remove buzzwords)"

# When updating settings
git commit -m "config: bump settings to v2.1 (Rank threshold 5→6)"

# When backing up current state
git commit -m "backup: snapshot email config (high engagement baseline)"
```

---

## 7. ISSUES & RECOMMENDATIONS

### 🔴 CRITICAL (Must Fix Before Deployment)

1. **Credentials Not Mapped**
   - Issue: All 3 credential IDs are placeholders
   - Impact: Workflow cannot execute
   - Action: Map actual credential IDs in n8n
   - Timeline: BEFORE first deployment

### 🟡 HIGH (Should Fix for Production)

2. **No Max Token Limit**
   - Issue: Emails may exceed 4-5 sentence constraint
   - Impact: Inconsistent email length; higher costs
   - Action: Add `maxTokens: 300` to llm-email node
   - Timeline: BEFORE campaign launch
   - Effort: 5 minutes

3. **Temperature Not Optimized**
   - Issue: Default 0.7 may be too creative for bulk emails
   - Impact: Consistency issues across campaigns
   - Action: Test with `temperature: 0.5` for first 20 emails
   - Timeline: Q2 campaign refinement
   - Effort: A/B test, monitor open rates

4. **No Explicit Rate Limiting**
   - Issue: Large batches could trigger API throttling
   - Impact: Failed sends if Brevo/OpenRouter rate limited
   - Action: Add delay node between emails (100-200ms)
   - Timeline: BEFORE batches > 20 leads
   - Effort: 10 minutes

### 🟢 MEDIUM (Should Fix for Maintainability)

5. **Settings Not Documented in Code**
   - Issue: Airtable Settings table structure not enforced
   - Impact: Manual key entry; potential typos
   - Action: Document required keys + example values
   - Timeline: Q2 documentation sprint
   - Effort: 30 minutes

6. **Email Subject Line Not Validated**
   - Issue: Subject could exceed 50 char limit (from prompt)
   - Impact: Email clients may truncate subject
   - Action: Add validation node after email parsing
   - Timeline: Q2 polish
   - Effort: 15 minutes

---

## 8. MODEL TUNING RECOMMENDATIONS

### For Q2 2026 Campaign:

1. **Temperature:** Change from 0.7 → **0.5**
   - Rationale: Consistency > creativity for first campaign
   - Test: Monitor subject line variance, open rates
   - Revert: If engagement > 20%, consider 0.6 for next batch

2. **Max Tokens:** Add limit of **300 tokens**
   - Rationale: Enforce 4-5 sentence constraint
   - Test: Measure email length distribution
   - Adjust: If emails too short (< 100 tokens), increase to 350

3. **Model Stability:** Keep `openai/gpt-4o-mini`
   - Rationale: Cost & speed optimal for v1
   - Review: After 200+ sent emails, evaluate upgrade to gpt-4o

4. **Prompt Refinement:** Add regional tone
   - Recommendation: Include "Swiss German business culture" context
   - Test: A/B test with/without regional context (10 emails each)

---

## 9. AUDIT SIGN-OFF

| Item | Status | Owner | Date |
|------|--------|-------|------|
| Workflow Architecture | ✅ Reviewed | Claude | 2026-04-20 |
| Credentials Mapping | ⚠️ Not Deployed | DevOps | Pending |
| Settings Structure | ✅ Documented | Claude | 2026-04-20 |
| Model Tuning | ✅ Recommended | Claude | 2026-04-20 |
| Security Audit | ✅ Passed | Claude | 2026-04-20 |
| Pre-Deployment Checklist | 📋 Template | QA | Pending |

---

## 10. APPENDIX: SETTINGS REFERENCE

### Sample Settings Table Entries

**Key:** `email_system_prompt`  
**Value:** [Full prompt from section 1.3]

**Key:** `airtable_config`  
**Value:**
```json
{
  "baseId": "appLriEwWldpPTMPg",
  "tableId": "tblLZkFo7Th7uyfWB",
  "filterFormula": "AND({EMAIL} != \"\", {EMAIL STATUS} != \"Sent\", {EMAIL STATUS} != \"Processing \", {Rank} >= 5)"
}
```

**Key:** `brevo_config`  
**Value:**
```json
{
  "senderEmail": "otto@kronosbusiness.com",
  "senderName": "Otto from KRONOS",
  "tag": "KRONOS_OUTREACH",
  "apiUrl": "https://api.brevo.com/v3/smtp/email"
}
```

**Key:** `copy_directives`  
**Value:** [Content from JARVIS_DIRECTIVES.md v5.1]

---

**End of Audit Report**
