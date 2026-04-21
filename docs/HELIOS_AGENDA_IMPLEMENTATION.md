# HELIOS Call Tracking Agenda System
**Version:** 1.0  
**Date:** 2026-04-21  
**Status:** 🆕 IMPLEMENTATION GUIDE  
**Scope:** Call scheduling, tracking, and PROX ATTIVITà field integration

---

## Overview

The HELIOS Call Tracking Agenda is a new feature for scheduling and managing outreach calls to Italian solar installers, distributors, and energy companies. All calls are automatically linked to the **PROX ATTIVITà** (Proximity Activity) field in the HELIOS Airtable base, enabling activity-based lead scoring and pipeline management.

---

## Architecture

### Frontend Components
- **Page:** `/apps/dashboard/app/dashboard/agenda/page.tsx`
- **Route:** `/dashboard/agenda`
- **Navigation:** Calendar icon in DashboardShell sidebar
- **Project Isolation:** HELIOS only (shows warning if accessed from KRONOS)

### API Endpoints
```
GET    /api/helios/calls              → Fetch scheduled calls
POST   /api/helios/calls/schedule     → Schedule new call
PATCH  /api/helios/calls/[id]         → Update call outcome
```

### Database Integration
```
Airtable Base: appyqUHfwK33eisQu (HELIOS)
Primary Table: "Call Agenda" (to be created)
Links to: 
  - Leads table (tbl07Ub0WeVHOnujP)
  - PROX ATTIVITà field
```

---

## Database Schema

### Call Agenda Table (HELIOS Airtable)

#### Required Fields
| Field Name | Type | Description |
|-----------|------|-------------|
| **Record ID** | ID | Auto-generated |
| **Lead Link** | Link to Leads | Foreign key to lead |
| **Company** | Text | Solar company name |
| **Contact Name** | Text | Decision maker name |
| **Email** | Email | Contact email |
| **Phone** | Phone | Contact phone number |
| **Scheduled Date** | Date | Call date |
| **Scheduled Time** | Text | Time (HH:MM format) |
| **Purpose** | Text | Call purpose (e.g., "Initial qualification") |
| **Notes** | Long text | Call notes/prep |
| **Status** | Single select | scheduled / completed / cancelled / no-show |
| **Outcome Notes** | Long text | Post-call notes |
| **PROX ATTIVITà** | Number | Proximity activity score (0-10) |
| **Activities** | Multiple select | site_visit, demo_requested, proposal_sent, etc. |
| **Duration (min)** | Number | Actual call duration |
| **Created At** | Created time | Timestamp |
| **Updated At** | Last modified time | Timestamp |

#### Optional Fields
| Field Name | Type | Purpose |
|-----------|------|---------|
| **Region** | Single select | Italian region (Nord/Centro/Sud) |
| **Company Type** | Link to Leads | Installer / Distributor / Energy Firm |
| **Next Follow-up** | Date | Suggested next contact |
| **Qualification Level** | Single select | Cold / Warm / Hot |

---

## PROX ATTIVITà Field Integration

### What is PROX ATTIVITà?

**PROX ATTIVITà** (Proximity Activity) is a **lead scoring system** that measures how actively engaged a prospect is based on:

1. **Call Frequency:** How many times contacted in past 30 days
2. **Engagement Signals:** Opens, clicks, responses to emails
3. **Activity Type:** High-value actions (demo, proposal) vs low-value (email only)
4. **Recency:** How recent the last interaction was
5. **Momentum:** Is engagement increasing or decreasing?

### Scoring Algorithm

```typescript
proximityScore = (
  callFrequency * 0.2 +        // 0-2 calls in 30d = +20%
  engagementLevel * 0.3 +      // Email open/click = +30%
  activityWeight * 0.3 +       // Site visit = +30%, demo = +50%
  recencyBonus * 0.1 +         // Recent interaction = +10%
  momentumMultiplier * 0.1     // Trending up = +10%
) 
// Result: 0-10 scale
```

### Auto-Scoring Logic

**When a call is scheduled:**
1. Fetch lead from Airtable (email, engagement history)
2. Calculate proximity score based on recent activity
3. Auto-populate PROX ATTIVITà field
4. Trigger workflow to update lead priority if score >= 7

**After call is completed:**
1. Ask user to record outcome (completed/no-show/cancelled)
2. Log activities (site visit, demo requested, proposal sent)
3. Recalculate proximity score
4. Update lead qualification level

---

## Frontend Implementation

### Call Scheduler Form
```typescript
// Form inputs:
- Lead ID / Company (autocomplete from Airtable)
- Contact Name
- Email
- Phone
- Date (date picker)
- Time (time picker)
- Purpose / Call notes (textarea)

// Buttons:
- "Schedule Call" (POST /api/helios/calls/schedule)
- "Cancel"
```

### Calendar Views

**Upcoming Calls**
- Displays calls scheduled for future dates
- Card layout: company, contact, date/time, proximity score
- Click to expand details
- Status badge: "scheduled"

**Completed Calls**
- Displays past calls with outcomes
- Outcome selector: completed / no-show / cancelled
- Activity tags: site_visit, demo_requested, proposal_sent, etc.
- Greyed out (opacity 0.7)

**Call Details Modal**
- Full call information
- Outcome dropdown (if past date)
- Notes display
- Proximity score display
- Activities list

---

## API Specifications

### GET /api/helios/calls
**Purpose:** Retrieve all scheduled and completed calls

**Query Parameters:**
```
?project=helios        (required)
?status=scheduled      (optional: filter by status)
?dateFrom=2026-04-21   (optional: filter by date range)
?dateTo=2026-05-21     (optional)
```

**Response (200):**
```json
{
  "calls": [
    {
      "id": "rec_abc123",
      "leadId": "rec_lead_001",
      "company": "SolarTech Italia",
      "contact": "Marco Rossi",
      "email": "marco@solartech.it",
      "phone": "+39 02 1234 5678",
      "scheduledDate": "2026-04-28",
      "scheduledTime": "10:00",
      "duration": 30,
      "purpose": "Initial qualification",
      "notes": "Interested in lead gen",
      "outcomeStatus": "scheduled",
      "proximityScore": 8,
      "activities": ["site_visit"],
      "createdAt": "2026-04-21T14:32:00Z",
      "updatedAt": "2026-04-21T14:32:00Z"
    }
  ],
  "success": true
}
```

**Error (400):**
```json
{
  "error": "This endpoint is for HELIOS only"
}
```

---

### POST /api/helios/calls/schedule
**Purpose:** Schedule a new call

**Body:**
```json
{
  "project": "helios",
  "leadId": "rec_lead_001",
  "company": "SolarTech Italia",
  "contact": "Marco Rossi",
  "email": "marco@solartech.it",
  "phone": "+39 02 1234 5678",
  "scheduledDateTime": "2026-04-28T10:00",
  "purpose": "Initial qualification",
  "notes": "Interested in lead gen automation"
}
```

**Response (201):**
```json
{
  "call": {
    "id": "rec_new_123",
    "leadId": "rec_lead_001",
    "company": "SolarTech Italia",
    "contact": "Marco Rossi",
    "email": "marco@solartech.it",
    "phone": "+39 02 1234 5678",
    "scheduledDate": "2026-04-28",
    "scheduledTime": "10:00",
    "purpose": "Initial qualification",
    "notes": "Interested in lead gen automation",
    "outcomeStatus": "scheduled",
    "proximityScore": 7,
    "activities": [],
    "createdAt": "2026-04-21T14:35:00Z",
    "updatedAt": "2026-04-21T14:35:00Z"
  },
  "success": true
}
```

---

### PATCH /api/helios/calls/[id]
**Purpose:** Update a call record (outcome, notes, activities)

**Body:**
```json
{
  "project": "helios",
  "outcomeStatus": "completed",
  "notes": "Great conversation, very interested",
  "activities": ["site_visit", "demo_requested"],
  "duration": 45
}
```

**Response (200):**
```json
{
  "call": {
    "id": "rec_abc123",
    "outcomeStatus": "completed",
    "notes": "Great conversation, very interested",
    "activities": ["site_visit", "demo_requested"],
    "duration": 45,
    "proximityScore": 9,
    "updatedAt": "2026-04-28T10:45:00Z"
  },
  "success": true
}
```

---

## Implementation Checklist

### Phase 1: Backend (This PR)
- [x] Create `/dashboard/agenda` page component
- [x] Add Agenda to navigation (Calendar icon)
- [x] Create API endpoint stubs
- [x] Project isolation (HELIOS only check)
- [ ] **TODO:** Implement Airtable integration in API endpoints
- [ ] **TODO:** Implement proximity score calculation
- [ ] **TODO:** Add call notification/reminder system

### Phase 2: Frontend Enhancements
- [ ] Add autocomplete for Lead ID / Company search
- [ ] Add calendar view (monthly/weekly)
- [ ] Add call recurrence (weekly check-in calls)
- [ ] Add SMS reminder 24h before call
- [ ] Add call recording link field
- [ ] Add participant email invitations

### Phase 3: Integration
- [ ] Link calls to email campaigns (when email opens before scheduled call)
- [ ] Auto-create tasks in project management system
- [ ] Sync with Google Calendar (OAuth)
- [ ] Integrate with Twilio for SMS reminders
- [ ] Add call report generation

### Phase 4: Advanced Features
- [ ] AI-generated call script based on lead data
- [ ] Call recording transcription + summarization
- [ ] Sentiment analysis from call notes
- [ ] Automatic lead scoring updates
- [ ] Predictive call scheduling (best time for each lead)

---

## Testing Plan

### Unit Tests
```typescript
// Test proximity score calculation
describe("proximityScore", () => {
  it("should calculate score 0-10 based on activity", () => {
    const score = calculateProximityScore(lead);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });
});

// Test form validation
describe("ScheduleCallForm", () => {
  it("should require leadId and date", () => {
    // Test missing fields
  });
});
```

### Integration Tests
```bash
# Test API endpoints
curl -X GET "http://localhost:3000/api/helios/calls?project=helios"
curl -X POST "http://localhost:3000/api/helios/calls/schedule" \
  -H "Content-Type: application/json" \
  -d '{ "project": "helios", "leadId": "rec_123", ... }'
```

### E2E Tests
- [ ] Schedule a call for tomorrow
- [ ] Verify call appears in "Upcoming Calls" section
- [ ] Mark call as completed
- [ ] Verify proximity score updated in Airtable
- [ ] Test on mobile (responsive layout)

---

## User Guide

### Scheduling a Call

1. Navigate to `/dashboard/agenda`
2. Click "Schedule Call" button (top right)
3. Fill in:
   - **Company/Lead ID:** Type to autocomplete
   - **Contact Name:** Decision maker name
   - **Email & Phone:** Will auto-fill if linked to Airtable
   - **Date & Time:** Use date/time pickers
   - **Purpose:** "Initial qualification", "Demo follow-up", etc.
   - **Notes:** Prep notes for the call
4. Click "Schedule Call"
5. Call appears in "Upcoming Calls" section

### Recording a Completed Call

1. In "Upcoming Calls," find the call date has passed
2. Click on the call card to expand
3. Select **Outcome:** Completed / No Show / Cancelled
4. Add **Activities:** Check site_visit, demo_requested, etc.
5. The proximity score auto-updates in Airtable

### Viewing Call History

- **Upcoming Calls:** All calls scheduled for future dates
- **Completed Calls:** All past calls, sorted by date
- **Click on any call:** View full details and edit notes

---

## PROX ATTIVITà Field Mapping

### In HELIOS Airtable
```
Field: PROX ATTIVITà
Type: Number (0-10 scale)
Formula/Automation: Updates when:
  - New call scheduled (auto-score from lead history)
  - Call completed (recalculate based on outcome)
  - Activities logged (site_visit +2, demo_requested +3)
  - More than 30 days since last contact (-0.5 per week)
```

### Dashboard Display
```
Card Layout:
┌─────────────────────────┐
│ SolarTech Italia        │
│ Marco Rossi             │
│ 📅 Apr 28 @ 10:00      │
│ ☎️  +39 02 1234 5678   │
│                         │
│ Proximity: 8/10 ▓▓▓▓▓▓░░│
└─────────────────────────┘
```

---

## Troubleshooting

### "HELIOS Required" Error
- Make sure you're viewing as HELIOS (not KRONOS)
- Switch project: Click logo → select HELIOS

### Call Not Appearing
- Check date is within current month (load more if needed)
- Verify project filter is set to HELIOS
- Refresh page (Cmd+R)

### Proximity Score Not Updating
- Allow 30-60 seconds for Airtable webhook to process
- Check Airtable directly: open Lead record, verify PROX ATTIVITà field
- Check browser console for API errors

### Cannot Find Lead to Schedule
- Lead may not exist in Airtable yet
- Create lead first in `/dashboard/database` → "Add Lead"
- Then schedule call

---

## Future Enhancements

### Suggested Features
1. **Call Templates:** Save common call scripts by company type
2. **Bulk Scheduling:** Schedule calls for 10+ leads at once
3. **Analytics:** Call success rate by region/company type
4. **Insights:** "Best time to call" based on past engagement
5. **Integrations:** Zoom links auto-generated + sent to contact
6. **Mobile App:** Native iOS/Android for field sales teams
7. **AI Assistant:** "Call brief" generated from lead data
8. **Voice Analysis:** Speech-to-text + sentiment analysis
9. **Follow-up Automation:** Auto-schedule next call based on outcome
10. **Territory Scoring:** Proximity score aggregated by region

---

## Files Modified

### New Files
- `apps/dashboard/app/dashboard/agenda/page.tsx` (368 lines)
- `apps/dashboard/app/api/helios/calls/route.ts` (40 lines)
- `apps/dashboard/app/api/helios/calls/schedule/route.ts` (55 lines)
- `apps/dashboard/app/api/helios/calls/[id]/route.ts` (45 lines)
- `docs/HELIOS_AGENDA_IMPLEMENTATION.md` (this file)

### Updated Files
- `apps/dashboard/app/dashboard/DashboardShell.tsx` (+Calendar import, +Agenda nav item)

---

## Support

For issues or feature requests:
1. Check troubleshooting section above
2. Review Airtable data: appyqUHfwK33eisQu
3. Check browser console for errors
4. Contact: otto@heliosbusiness.it

---

**End of HELIOS Agenda Implementation Guide**
