# KRONOS Response Handling SOP
Version: 2.0
Status: ACTIVE

## Goal
To manage and qualify incoming responses from the Swiss real estate outreach with near-zero latency.

## Channels
- **Email**: Brevo inbound webhook
- **WhatsApp**: WhatsApp Business Cloud API webhook

## Response Categorization (AI Agent)
The agent must categorize leads into:
1. **INTERESTED**: High curiosity, request for a call or price.
   - *Action*: Tag in Airtable as `HOT_LEAD` and notify via email alert.
2. **OBJECTION**: Concerns about price, timing, or existing systems.
   - *Action*: Soft-objection handling script (Focus on "Efficiency Audit").
3. **NOT_INTERESTED / OPT_OUT**: Explicit request to stop.
   - *Action*: Update Airtable status to `OPTED_OUT` and stop all future automation.

## Human-in-the-Loop
For any lead categorized as `INTERESTED`, the AI should prepare a draft response for the user to review but NOT send it automatically unless configured for "Auto-Pilot" mode.
