# KRONOS Response Handling SOP
Version: 1.0
Status: ACTIVE

## Goal
To manage and qualify incoming responses from the Swiss real estate outreach with near-zero latency.

## Channel: Email & SMS
- **Trigger**: Webhook from SendGrid (Incoming) or Twilio (Inbound SMS).

## Response Categorization (AI Agent)
The agent must categorize leads into:
1. **INTERESTED**: High curiosity, request for a call or price.
   - *Action*: Tag in CRM as `HOT_LEAD` and notify user via Slack/Telegram.
2. **OBJECTION**: Concerns about price, timing, or existing systems.
   - *Action*: Soft-objection handling script (Focus on "Efficiency Audit").
3. **NOT_INTERESTED / OPT_OUT**: Explicit request to stop.
   - *Action*: Update Supabase status to `OPTED_OUT` and stop all future automation.

## Human-in-the-Loop
For any lead categorized as `INTERESTED`, the AI should prepare a draft response for the user to review but NOT send it automatically unless configured for "Auto-Pilot" mode.
