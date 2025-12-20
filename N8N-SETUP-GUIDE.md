# KRONOS Outreach Engine - N8N Setup Guide

## 🚀 Quick Start

This N8N workflow automates your entire outreach process from contact import to follow-ups.

## 📋 Prerequisites

1. **N8N Instance** (Self-hosted or cloud)
   - Install from: https://n8n.io/
   - Docker: `docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n`

2. **Required Credentials**
   - Gmail/SMTP account for sending emails
   - Google Sheets API access (optional, for contact management)

## 🔧 Installation Steps

### Step 1: Import the Workflow

1. Open your N8N instance (usually `http://localhost:5678`)
2. Click on **Workflows** → **Import from File**
3. Select `kronos-outreach-workflow.json`
4. Click **Import**

### Step 2: Configure Credentials

#### SMTP Email Credentials

1. Go to **Credentials** → **Add Credential**
2. Search for **SMTP**
3. Fill in your email provider details:

**For Gmail:**
```
Host: smtp.gmail.com
Port: 465
User: your-email@gmail.com
Password: your-app-specific-password
Secure: Yes (SSL/TLS)
```

**For SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: your-sendgrid-api-key
Secure: Yes (STARTTLS)
```

**For Custom SMTP:**
```
Host: your-smtp-host.com
Port: 587 or 465
User: your-username
Password: your-password
```

#### Google Sheets Credentials (Optional)

1. Go to **Credentials** → **Add Credential**
2. Search for **Google Sheets OAuth2 API**
3. Follow the OAuth2 setup:
   - Create project at https://console.cloud.google.com
   - Enable Google Sheets API
   - Create OAuth2 credentials
   - Add authorized redirect URI from N8N

### Step 3: Configure the Workflow Nodes

Open the imported workflow and configure these nodes:

#### 1. **Google Sheets - Contacts** (if using)
   - Select your credentials
   - Choose the spreadsheet with your contacts
   - Sheet format should match `contacts-template.csv`

#### 2. **Personalization Engine**
   - Edit the JavaScript code to customize:
     - Subject line templates
     - Email body template
     - Your name and signature
     - Value proposition

#### 3. **Send Outreach Email**
   - Select your SMTP credentials
   - Verify the `fromEmail` field

#### 4. **Log to Google Sheets** (if using)
   - Select your credentials
   - Create a sheet named "Outreach Log"
   - Headers: `email, firstName, lastName, company, status, sentDate, campaignId, subject`

#### 5. **Rate Limiter**
   - Default: 3 seconds between emails
   - Adjust based on your email provider's limits
   - Gmail: ~500 emails/day, recommend 5-10 sec delay
   - SendGrid: depends on your plan

### Step 4: Set Up Contact Sources

You have 3 options for importing contacts:

#### Option A: Webhook (API/Manual Trigger)
1. Activate the workflow
2. Copy the webhook URL from the "Webhook Trigger" node
3. Send POST requests with contact data:

```bash
curl -X POST https://your-n8n-instance.com/webhook/kronos-outreach \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prospect@company.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "company": "Tech Corp",
    "position": "CEO",
    "industry": "SaaS",
    "customField1": "recently raised funding"
  }'
```

#### Option B: Google Sheets
1. Create a Google Sheet with these columns:
   - `email, firstName, lastName, company, position, industry, customField1, fromEmail`
2. Add your contacts
3. Configure the "Google Sheets - Contacts" node
4. Trigger manually or on schedule

#### Option C: CSV Upload
1. Use `contacts-template.csv` as a template
2. Add your contacts
3. Use N8N's HTTP Request or File Trigger node to import
4. Connect to the "Merge Contact Sources" node

## 🎯 Features Included

### 1. **Personalization Engine**
- Dynamic subject lines
- Personalized email bodies
- Uses contact data (name, company, industry, custom fields)
- Randomized subject lines to avoid spam filters

### 2. **Smart Follow-ups**
- Automatically follows up after 3 days
- Only sends if no response received
- Customizable follow-up timing
- Tracks follow-up status in Google Sheets

### 3. **Rate Limiting**
- Prevents spam flags
- Configurable delay between emails
- Recommended: 3-10 seconds per email

### 4. **Response Tracking**
- Logs all outreach attempts
- Tracks sent date, status, campaign ID
- Google Sheets integration for easy management

### 5. **Scheduled Execution**
- Daily trigger at 9 AM weekdays
- Checks for follow-ups automatically
- Customizable schedule via cron expression

## 📊 Google Sheets Structure

### Contacts Sheet
```
email | firstName | lastName | company | position | industry | customField1 | fromEmail
```

### Outreach Log Sheet
```
email | firstName | lastName | company | status | sentDate | campaignId | subject | lastFollowupDate
```

**Status Values:**
- `ready_to_send` - Contact processed, ready for outreach
- `sent` - Initial email sent
- `followup_sent` - Follow-up email sent
- `responded` - Prospect responded (manual update)
- `converted` - Became customer (manual update)

## 🎨 Customization Guide

### Personalizing Email Templates

Edit the **Personalization Engine** node:

```javascript
// Customize subject lines
const subjectTemplates = [
  `Your custom subject with ${company}`,
  `${firstName}, another variant`,
  `Add more templates here`
];

// Customize email body
const emailBody = `Hi ${firstName},

YOUR OPENING LINE HERE

YOUR VALUE PROPOSITION HERE

YOUR CALL TO ACTION HERE

Best regards,
YOUR NAME
YOUR TITLE
YOUR COMPANY`;
```

### Adjusting Follow-up Timing

Edit the **Follow-up Logic** node:

```javascript
// Change from 3 days to 5 days
if (daysSinceSent >= 5 && daysSinceSent <= 6 && item.json.status === 'sent') {
  // Send follow-up
}
```

### Adding More Follow-ups

Duplicate the follow-up workflow section and adjust timing:
- First follow-up: Day 3
- Second follow-up: Day 7
- Third follow-up: Day 14

## 🧪 Testing the Workflow

### Test Mode
1. Use your own email as the test contact
2. Send a test via webhook or manual execution
3. Verify:
   - ✅ Email received with personalization
   - ✅ Logged in Google Sheets
   - ✅ Follow-up scheduled

### Sample Test Data
```json
{
  "email": "your-test-email@gmail.com",
  "firstName": "Test",
  "lastName": "User",
  "company": "Test Corp",
  "position": "Tester",
  "industry": "QA",
  "customField1": "testing the workflow",
  "fromEmail": "your-sender-email@domain.com"
}
```

## 🚨 Common Issues & Troubleshooting

### Email Not Sending
- ✅ Check SMTP credentials
- ✅ Verify fromEmail is valid
- ✅ Check email provider daily limits
- ✅ Enable "Less secure apps" (Gmail) or use App Password

### Follow-ups Not Working
- ✅ Ensure "Daily Trigger" is activated
- ✅ Check Google Sheets connection
- ✅ Verify status column has "sent" value
- ✅ Check sentDate is valid date format

### Personalization Not Working
- ✅ Verify contact data has required fields
- ✅ Check JavaScript syntax in Code node
- ✅ Test with console.log() debugging

### Rate Limiting Issues
- ✅ Increase wait time in Rate Limiter node
- ✅ Check your email provider's sending limits
- ✅ Consider using a dedicated email service

## 📈 Best Practices

1. **Warm Up Your Email Domain**
   - Start with 10-20 emails/day
   - Gradually increase over 2-3 weeks
   - Monitor spam rates

2. **Personalization is Key**
   - Always customize the template
   - Research prospects before adding to list
   - Use specific, relevant customField1 data

3. **Compliance**
   - Include unsubscribe link
   - Follow CAN-SPAM Act guidelines
   - Respect GDPR if applicable
   - Only email business contacts (B2B)

4. **Testing**
   - A/B test subject lines
   - Track open rates (use email tracker integration)
   - Iterate on templates based on response rates

5. **Follow-up Strategy**
   - Don't send more than 3 follow-ups
   - Add value in each follow-up
   - Change the angle/approach

## 🔄 Workflow Triggers

The workflow can be triggered in multiple ways:

1. **Webhook** - API calls, Zapier, Make.com integration
2. **Schedule** - Daily at 9 AM for follow-ups
3. **Manual** - Click "Execute Workflow" button
4. **Google Sheets** - When new row added (requires additional trigger)

## 🎓 Next Steps

1. **Test with 5-10 contacts first**
2. **Monitor delivery and response rates**
3. **Iterate on email templates**
4. **Scale up gradually**
5. **Build contact list systematically**

## 🚀 Advanced Features to Add

- LinkedIn API integration for profile enrichment
- Response parsing (webhook from email provider)
- AI-powered personalization (OpenAI integration)
- Sentiment analysis on responses
- Multi-channel outreach (email + LinkedIn)
- A/B testing automation
- Unsubscribe handling

## 📝 Notes

- The workflow uses Gmail/SMTP by default
- Google Sheets is optional but recommended for tracking
- Webhook allows integration with any CRM or lead source
- All personalization logic is in JavaScript and fully customizable

## 🆘 Support

For issues or questions:
1. Check N8N documentation: https://docs.n8n.io
2. Review this guide
3. Test with simple data first
4. Check N8N community forum

---

**Ready to crush it with KRONOS? Import the workflow and let's test it out!**
