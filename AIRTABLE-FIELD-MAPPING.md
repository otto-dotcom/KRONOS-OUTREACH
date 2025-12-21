# KRONOS Airtable Field Mapping Guide

This guide shows how your Airtable fields are used in the N8N workflow for maximum personalization.

## 📊 Required Fields

These fields MUST be present for the workflow to function:

| Airtable Field | Used For | Example |
|----------------|----------|---------|
| `EMAIL` or `CONTACT` | Recipient email address | john@company.com |
| `FULL NAME` | Personalization, greeting | John Doe |
| `company name` | Company references in email | Acme Corp |

## 🎯 High-Value Personalization Fields

These fields dramatically improve personalization quality:

| Airtable Field | Used For | Personalization Impact |
|----------------|----------|----------------------|
| `JOB TITLE` | Role-specific messaging | "I noticed you're CEO at..." |
| `HEADLINE` | LinkedIn profile reference | "I saw your headline: 'Building the future...'" |
| `COMPANY DESCRIPTION` | Context about their business | "I saw that Acme Corp is a leading SaaS platform..." |
| `TECHNOLOGY` | Tech stack personalization | "I noticed you're using Salesforce and HubSpot..." |
| `SECTOR` | Industry-specific messaging | "Given challenges in the Technology space..." |
| `SENIORITY` | Tailored CTA based on level | C-Level gets different pitch than Director |

## 💰 Company Intelligence Fields

These fields provide valuable context:

| Airtable Field | Used For | Example Usage |
|----------------|----------|---------------|
| `REVENUE` | Company size context | "As a $50M company..." |
| `COMPANY SIZE` | Scale-appropriate messaging | "With 250-500 employees..." |
| `Category` | Business type | "Enterprise Software company" |

## 📍 Location Fields

| Airtable Field | Used For | Example |
|----------------|----------|---------|
| `City` | Geographic reference | "Companies in San Francisco" |
| `State` | Regional messaging | "CA" |
| `Address` | Full address (backup) | "123 Main St San Francisco CA" |

## 🔗 Social & Web Fields

| Airtable Field | Used For | Logged For Reference |
|----------------|----------|---------------------|
| `LINKEDIN` | LinkedIn profile reference | Yes - tracked in logs |
| `URL` | Company website | Yes |
| `FACEBOOK` | Social presence | No (not currently used) |
| `YOUTUBE` | Social presence | No (not currently used) |

## 🔍 Research & Targeting Fields

| Airtable Field | Used For | Notes |
|----------------|----------|-------|
| `KEYWORDS` | Not currently used | Future: Smart matching |
| `Phone` | Not currently used | Future: Multi-channel |
| `Rank` | Not currently used | Future: Prioritization |
| `Num` | Not currently used | Future: Sequencing |

## 🎨 How Personalization Works

### Subject Line Generation

The workflow creates smart subject lines based on available data:

1. **If TECHNOLOGY exists:**
   - `"John, re: Acme Corp's Salesforce stack"`

2. **If SECTOR exists:**
   - `"Helping Technology companies like Acme Corp"`

3. **If COMPANY SIZE exists:**
   - `"John - scaling Enterprise Software"`

4. **If HEADLINE exists:**
   - `"Re: Building the future"` (first 3 words of headline)

5. **Fallback options:**
   - `"Quick question about Acme Corp"`
   - `"John, thoughts on your business?"`

### Email Body Personalization

#### Opening Line (Priority Order):

1. **HEADLINE + LINKEDIN:**
   ```
   I came across your profile on LinkedIn - "Building the future of retail" -
   and was impressed by your work at Acme Corp.
   ```

2. **JOB TITLE + SENIORITY:**
   ```
   I noticed you're a C-Level CEO at Acme Corp and wanted to reach out directly.
   ```

3. **SECTOR/Category + City:**
   ```
   I've been researching Technology companies in San Francisco and Acme Corp stood out.
   ```

#### Value Proposition (Priority Order):

1. **COMPANY DESCRIPTION:**
   ```
   I saw that Acme Corp is a leading saas platform for enterprise automation
   ```

2. **TECHNOLOGY:**
   ```
   I noticed you're using Salesforce and HubSpot. We've helped similar companies
   optimize their tech stack and [YOUR VALUE PROP].
   ```

3. **REVENUE + COMPANY SIZE:**
   ```
   As a $50M-$100M company with 250-500 employees, I thought you might be
   interested in [YOUR VALUE PROP].
   ```

#### Call-to-Action (Based on SENIORITY):

- **C-Level:**
  ```
  Would you be open to a brief 15-minute call to discuss how we could help
  Acme Corp achieve [SPECIFIC OUTCOME]?
  ```

- **VP or Director:**
  ```
  I'd love to share some insights on how companies in Technology are solving
  [SPECIFIC PROBLEM]. Would you have 10 minutes for a quick call?
  ```

- **Other:**
  ```
  Would you be the right person to discuss this, or should I connect with
  someone else on your team?
  ```

## 📈 Follow-up Personalization

Follow-ups (sent after 3 days) also use your Airtable data:

### If TECHNOLOGY exists:
```
I wanted to share a quick insight: We recently helped a similar company
optimize their Salesforce implementation and saw [SPECIFIC RESULT].
```

### If SECTOR exists:
```
Given the challenges in the Technology space right now, I thought this
might be particularly relevant for Acme Corp.
```

### Fallback:
```
I have some specific ideas on how we could help Acme Corp achieve
[SPECIFIC OUTCOME].
```

## 📊 Google Sheets Logging

When emails are sent, these fields are logged to your Google Sheets:

| Logged Field | Source | Purpose |
|--------------|--------|---------|
| email | EMAIL/CONTACT | Track who was contacted |
| fullName | FULL NAME | Contact identification |
| company | company name | Company tracking |
| jobTitle | JOB TITLE | Role tracking |
| sector | SECTOR | Industry analysis |
| technology | TECHNOLOGY | Tech stack reference |
| revenue | REVENUE | Company size tracking |
| status | Generated | sent/followup_sent/responded |
| sentDate | Generated | Timestamp |
| campaignId | Generated | Campaign tracking |
| subject | Generated | What subject was used |
| linkedInUrl | LINKEDIN | Profile reference |

## 🎯 Best Practices

### 1. **Complete Your Airtable Data**
   - The more fields you fill, the better the personalization
   - Minimum: EMAIL, FULL NAME, company name
   - Optimal: Add JOB TITLE, HEADLINE, TECHNOLOGY, SECTOR

### 2. **HEADLINE Field Tips**
   - Copy directly from LinkedIn profiles
   - Keep it under 120 characters
   - This is one of the most powerful personalization fields

### 3. **TECHNOLOGY Field Format**
   - Comma-separated list works best
   - Example: `"Salesforce, HubSpot, Slack, AWS"`
   - First 1-2 technologies used in emails

### 4. **COMPANY DESCRIPTION**
   - Keep to 1-2 sentences
   - Focus on what makes them unique
   - This gets quoted directly in emails

### 5. **SENIORITY Values**
   - Use consistent values: `C-Level`, `VP`, `Director`, `Manager`
   - This determines the CTA style

## 🔄 Field Priority System

When multiple personalization options exist, the workflow uses this priority:

**Subject Lines:**
1. TECHNOLOGY (if exists)
2. SECTOR (if exists)
3. COMPANY SIZE (if exists)
4. HEADLINE (if exists)
5. Fallback templates

**Email Opening:**
1. HEADLINE + LINKEDIN
2. JOB TITLE + SENIORITY
3. SECTOR/Category + City

**Value Prop:**
1. COMPANY DESCRIPTION
2. TECHNOLOGY
3. REVENUE + COMPANY SIZE
4. Fallback

## 🚀 Quick Setup Checklist

- [ ] Export your Airtable to CSV with ALL these fields
- [ ] Ensure EMAIL or CONTACT field has valid emails
- [ ] Fill in FULL NAME for all contacts
- [ ] Add company name for all contacts
- [ ] Enrich JOB TITLE and SENIORITY (high impact!)
- [ ] Add HEADLINE from LinkedIn (very high impact!)
- [ ] Fill TECHNOLOGY stack where possible
- [ ] Add SECTOR/Category for industry targeting
- [ ] Include COMPANY DESCRIPTION for best results
- [ ] Import CSV to Google Sheets or use webhook

## 💡 Customization Tips

Want to change how fields are used? Edit the **Personalization Engine** node in N8N:

1. Open the workflow in N8N
2. Find the "Personalization Engine" node
3. Edit the JavaScript code
4. Customize:
   - Subject line templates
   - Email body structure
   - Which fields to prioritize
   - CTA variations
   - Signature

## 📝 Example Personalized Email

With this Airtable data:
```
FULL NAME: John Doe
EMAIL: john@acmecorp.com
company name: Acme Corp
JOB TITLE: CEO
SENIORITY: C-Level
HEADLINE: Transforming how businesses automate workflows
TECHNOLOGY: Salesforce, HubSpot, Slack
SECTOR: Technology
COMPANY DESCRIPTION: Leading SaaS platform for enterprise automation
REVENUE: $50M-$100M
LINKEDIN: https://linkedin.com/in/johndoe
```

Generated email:
```
Subject: John, re: Acme Corp's Salesforce stack

Hi John,

I came across your profile on LinkedIn - "Transforming how businesses automate
workflows" - and was impressed by your work at Acme Corp.

I saw that Acme Corp is a leading saas platform for enterprise automation

I noticed you're using Salesforce and HubSpot. We've helped similar companies
optimize their tech stack and [YOUR SPECIFIC VALUE PROP].

Would you be open to a brief 15-minute call to discuss how we could help
Acme Corp achieve [SPECIFIC OUTCOME]?

Best regards,
[YOUR NAME]
[YOUR TITLE]
[YOUR COMPANY]
[YOUR CONTACT INFO]
```

---

**The richer your Airtable data, the better your emails! 🚀**
