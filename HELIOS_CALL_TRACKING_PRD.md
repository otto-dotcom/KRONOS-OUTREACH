# HELIOS Call Tracking — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-04-21  
**Status:** Active Development  
**Branch:** `claude/build-helios-call-tracking-lRRjS`  
**Owner:** HELIOS (Italian Solar Outreach)

---

## 1. Overview

### 1.1 Product Context

HELIOS is an AI-driven cold outreach system targeting Italian solar installers, distributors, and energy companies. It runs on the same infrastructure as KRONOS (Swiss real estate) but operates under a separate brand (`heliosbusiness.it`), Airtable base (`appyqUHfwK33eisQu`), and email/design system (green `#22C55E` theme, Italian-language copy).

The outreach funnel is: **Email Campaign → Response → Qualification Call → Pipeline**.

HELIOS Call Tracking is the missing piece between "email response" and "closed deal" — a purpose-built agenda system for scheduling, tracking, and scoring qualification calls, linked directly to the PROX ATTIVITà lead scoring field in Airtable.

### 1.2 Problem Statement

The HELIOS team currently has no structured way to:
- Schedule calls with qualified leads coming out of email campaigns
- Track call outcomes and follow-up activity in one place
- Measure which leads are actively engaging (vs cold/unresponsive)
- Automatically update lead scores in Airtable when call activity happens

Call data lives in individual inboxes and notes apps, disconnected from the Airtable lead pipeline. This creates blind spots in the funnel and makes it impossible to prioritize follow-ups by engagement level.

### 1.3 Solution

A call tracking module inside the existing HELIOS dashboard (`/dashboard/agenda`) that:
1. Schedules calls linked to Airtable leads
2. Tracks outcomes (completed, no-show, cancelled)
3. Logs activities per call (site visit, demo, proposal, contract)
4. Automatically calculates and writes **PROX ATTIVITà** scores back to Airtable

---

## 2. Goals and Non-Goals

### Goals
- Replace ad-hoc call tracking with a structured, pipeline-visible system
- Auto-update PROX ATTIVITà in Airtable based on call and activity data
- Give the team a single view of all upcoming and completed outreach calls
- Enable activity-weighted lead prioritization (not just email engagement)

### Non-Goals (this version)
- Native mobile app
- Twilio / VoIP integration (call logging from the phone system)
- Google Calendar two-way sync
- Bulk call scheduling for campaigns
- Call recording or transcription

---

## 3. Users

| User | Context |
|------|---------|
| **Outreach Rep** | Schedules calls, logs outcomes, reviews upcoming agenda |
| **Campaign Manager** | Reviews PROX ATTIVITà scores to reprioritize follow-up sequences |
| **JARVIS (AI Agent)** | Reads call history to generate context-aware call briefs |

Project isolation is enforced: the agenda page and all `/api/helios/calls/*` endpoints reject requests from the KRONOS project context.

---

## 4. Functional Requirements

### 4.1 Schedule a Call

- **FR-01** — User can open a "Schedule Call" form from `/dashboard/agenda`
- **FR-02** — Form fields: Company/Lead ID, Contact Name, Email, Phone, Date, Time, Purpose, Notes
- **FR-03** — Company field auto-completes from the HELIOS Airtable Leads table
- **FR-04** — On submit, call record is written to the "Call Agenda" table in Airtable
- **FR-05** — PROX ATTIVITà is calculated from lead's email engagement history and written to the record at scheduling time
- **FR-06** — If proximity score ≥ 7, a workflow trigger flags the lead as high-priority in Airtable

### 4.2 View Upcoming Calls

- **FR-07** — Upcoming calls (scheduled date ≥ today) displayed in card grid
- **FR-08** — Each card shows: Company, Contact, Date/Time, Phone, Proximity Score (bar + numeric)
- **FR-09** — Cards are clickable to open the Call Detail modal

### 4.3 Record Call Outcomes

- **FR-10** — Past calls (date < today) show an Outcome selector: Completed / No Show / Cancelled
- **FR-11** — Activities can be logged per call: `site_visit`, `demo_requested`, `proposal_sent`, `contract_signed`
- **FR-12** — Duration (minutes) can be recorded after a completed call
- **FR-13** — On outcome save, PROX ATTIVITà is recalculated and written back to Airtable
- **FR-14** — Lead Qualification Level is updated in Airtable based on new score (Cold / Warm / Hot)

### 4.4 View Completed Calls

- **FR-15** — Completed calls rendered below upcoming calls, greyed out (opacity 0.7)
- **FR-16** — Shows company, date, and outcome status
- **FR-17** — Clickable for full detail and note editing

### 4.5 Project Isolation

- **FR-18** — `/dashboard/agenda` renders an "HELIOS Required" screen if project context is KRONOS
- **FR-19** — All API endpoints return `400` with `"This endpoint is for HELIOS only"` if `project !== "helios"`

---

## 5. PROX ATTIVITà Scoring

### 5.1 What It Measures

PROX ATTIVITà (Proximity Activity) quantifies how actively engaged a lead is, combining email behaviour, call history, and activity milestones into a single 0–10 score. It is the primary field for prioritizing the follow-up sequence in Airtable.

### 5.2 Scoring Algorithm

```typescript
proximityScore = clamp(
  callFrequency    * 0.2 +   // 0-2 qualifying calls in past 30 days
  engagementLevel  * 0.3 +   // Email opens, clicks, replies
  activityWeight   * 0.3 +   // Weighted by milestone type (see below)
  recencyBonus     * 0.1 +   // Last interaction < 7 days = max bonus
  momentumScore    * 0.1,    // Engagement trending up vs down
  0, 10
)
```

**Activity Weights:**

| Activity | Weight |
|---------|--------|
| Email open | +1 |
| Email click | +1.5 |
| Email reply | +2 |
| Site visit | +2 |
| Demo requested | +3 |
| Proposal sent | +5 |
| Contract signed | +10 (cap) |

**Decay:** Score decreases by −0.5 per week after 30 days of no contact.

### 5.3 Score → Qualification Level

| Score | Qualification |
|-------|--------------|
| 0–3 | Cold |
| 4–6 | Warm |
| 7–10 | Hot |

### 5.4 Auto-Scoring Triggers

1. **Call scheduled** → calculate from lead's email + prior call history
2. **Call completed** → recalculate including activity log from this call
3. **Activities updated** → incremental recalculation
4. **7-day inactivity** → automated decay job via n8n workflow

---

## 6. Data Model

### 6.1 Airtable: Call Agenda Table

**Base ID:** `appyqUHfwK33eisQu`  
**Linked Tables:** Leads (`tbl07Ub0WeVHOnujP`)

#### Required Fields

| Field | Airtable Type | Notes |
|-------|--------------|-------|
| Record ID | Auto ID | PK |
| Lead Link | Link to Leads | FK to lead record |
| Company | Single line text | Solar company name |
| Contact Name | Single line text | Decision maker |
| Email | Email | Contact email |
| Phone | Phone | Italian format (+39...) |
| Scheduled Date | Date | ISO 8601 |
| Scheduled Time | Single line text | HH:MM |
| Purpose | Single line text | e.g., "Initial qualification" |
| Notes | Long text | Prep notes |
| Status | Single select | `scheduled` / `completed` / `cancelled` / `no-show` |
| Outcome Notes | Long text | Post-call write-up |
| PROX ATTIVITà | Number | 0–10 |
| Activities | Multiple select | `site_visit`, `demo_requested`, `proposal_sent`, `contract_signed` |
| Duration (min) | Number | Actual call length |
| Created At | Created time | Auto |
| Updated At | Last modified time | Auto |

#### Optional Fields

| Field | Airtable Type | Notes |
|-------|--------------|-------|
| Region | Single select | Nord / Centro / Sud Italia |
| Company Type | Single select | Installer / Distributor / Energy Firm |
| Next Follow-up | Date | Suggested next contact |
| Qualification Level | Single select | Cold / Warm / Hot |

### 6.2 TypeScript Interface

```typescript
interface CallRecord {
  id: string;                   // Airtable record ID
  leadId: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  scheduledDate: string;        // YYYY-MM-DD
  scheduledTime: string;        // HH:MM
  duration?: number;
  purpose: string;
  notes: string;
  outcomeStatus?: "scheduled" | "completed" | "cancelled" | "no-show";
  outcomeNotes?: string;
  proximityScore?: number;      // 0-10
  activities?: ActivityType[];
  createdAt: string;
  updatedAt: string;
}

type ActivityType =
  | "site_visit"
  | "demo_requested"
  | "proposal_sent"
  | "contract_signed";
```

---

## 7. API Specification

All endpoints enforce project isolation. Requests without `project=helios` (GET) or `"project": "helios"` (body) return `400`.

### GET `/api/helios/calls`

Fetch scheduled and completed calls.

**Query Parameters:**
- `project=helios` (required)
- `status=scheduled|completed|cancelled|no-show` (optional)
- `dateFrom=YYYY-MM-DD` (optional)
- `dateTo=YYYY-MM-DD` (optional)

**Response 200:**
```json
{
  "calls": [ CallRecord ],
  "success": true
}
```

**Backend implementation:**
1. Fetch from Airtable "Call Agenda" table
2. Apply date/status filters
3. Return sorted by scheduledDate ASC

---

### POST `/api/helios/calls/schedule`

Schedule a new call.

**Request Body:**
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

**Response 201:**
```json
{
  "call": CallRecord,
  "success": true
}
```

**Backend implementation:**
1. Validate required fields (leadId, scheduledDateTime, company)
2. Fetch lead's email engagement history from Airtable
3. Calculate initial PROX ATTIVITà score
4. Create record in "Call Agenda" table
5. If score ≥ 7, trigger Airtable automation to set lead priority = "High"

---

### PATCH `/api/helios/calls/[id]`

Update call outcome, activities, or notes.

**Request Body:**
```json
{
  "project": "helios",
  "outcomeStatus": "completed",
  "outcomeNotes": "Very interested, wants a demo next week",
  "activities": ["site_visit", "demo_requested"],
  "duration": 45
}
```

**Response 200:**
```json
{
  "call": CallRecord,
  "success": true
}
```

**Backend implementation:**
1. Fetch existing record from Airtable
2. Apply updates
3. Recalculate PROX ATTIVITà from updated activity log
4. Write updated score + outcome back to Airtable
5. Update lead's Qualification Level field based on new score

---

## 8. Frontend Architecture

### 8.1 Route

`/apps/dashboard/app/dashboard/agenda/page.tsx`  
Route: `/dashboard/agenda`

**Status: Complete.** The frontend is fully implemented and responsive. Pending: real data from Airtable (currently returns demo stubs).

### 8.2 Component Map

```
AgendaPage
├── Header (title + "Schedule Call" button)
├── ErrorBanner (dismissable)
├── ScheduleCallForm (inline panel, toggleable)
│   ├── Grid inputs: Company, Contact, Email, Phone, Date, Time
│   ├── Textarea: Purpose / Notes
│   └── Buttons: Cancel | Schedule Call
├── UpcomingCallsSection
│   └── CallCard[] (company, contact, datetime, phone, proximity bar)
├── CompletedCallsSection
│   └── CallCard[] (greyed, company, date, outcome badge)
└── CallDetailModal
    ├── Contact / Date / Purpose / Notes display
    ├── Proximity Score display
    ├── Outcome selector (only if date < today)
    └── Activities checklist (site_visit, demo_requested, etc.)
```

### 8.3 Navigation

Agenda is accessed via the Calendar icon in `DashboardShell.tsx` sidebar, positioned between "Lead Base" and "JARVIS".

### 8.4 Theme

Inherits HELIOS design tokens: `var(--accent)` = `#22C55E`, light background, white surfaces.

---

## 9. n8n Workflow Integration

### 9.1 PROX ATTIVITà Decay Job

A scheduled n8n workflow runs weekly to apply score decay to inactive leads:

```
Trigger: Schedule (every Monday 09:00)
→ Airtable: Fetch leads where PROX ATTIVITà > 0 AND last_contact > 30 days ago
→ Code: Apply -0.5 decay per week of inactivity
→ Airtable: Update PROX ATTIVITà field
→ If score drops below 4: Update Qualification Level = "Cold"
```

### 9.2 High-Priority Lead Trigger

When a call is scheduled and PROX ATTIVITà ≥ 7, the API calls an n8n webhook that:
1. Updates lead's priority field in Airtable to "High"
2. Removes lead from standard drip sequence
3. Moves lead to "Hot Leads" Airtable view

---

## 10. Implementation Phases

### Phase 1 — Backend Core (This Sprint)
- [ ] Airtable integration: `GET /api/helios/calls` reads from "Call Agenda" table
- [ ] Airtable integration: `POST /api/helios/calls/schedule` creates record + calculates PROX ATTIVITà
- [ ] Airtable integration: `PATCH /api/helios/calls/[id]` updates outcome + recalculates score
- [ ] `calculateProximityScore(leadId)` utility function
- [ ] Create "Call Agenda" table in Airtable base `appyqUHfwK33eisQu`

### Phase 2 — Frontend Enhancements
- [ ] Lead autocomplete in schedule form (query Airtable Leads on keystroke)
- [ ] Activities checklist in Call Detail modal
- [ ] Outcome Notes textarea
- [ ] Duration input on completion
- [ ] PROX ATTIVITà progress bar (visual, not just text)

### Phase 3 — Notifications & Reminders
- [ ] Brevo email reminder 24h before scheduled call (via n8n)
- [ ] SMS reminder via Brevo SMS or Twilio
- [ ] Slack notification to team channel on high-proximity calls

### Phase 4 — Analytics & AI
- [ ] Call success rate by region / company type
- [ ] PROX ATTIVITà trend chart per lead
- [ ] AI-generated call brief from lead data (JARVIS integration)
- [ ] "Best time to call" prediction from engagement history
- [ ] Follow-up auto-scheduler based on call outcome

---

## 11. Testing Plan

### Unit Tests

```typescript
describe("calculateProximityScore", () => {
  it("returns 0-10 for any input", () => {
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });
  it("scores contract_signed leads at maximum", () => {
    expect(score).toBe(10);
  });
  it("decays score after 30 days inactivity", () => {
    expect(decayedScore).toBeLessThan(originalScore);
  });
});
```

### API Integration Tests

```bash
# Fetch calls
curl "http://localhost:3000/api/helios/calls?project=helios"

# Schedule call
curl -X POST "http://localhost:3000/api/helios/calls/schedule" \
  -H "Content-Type: application/json" \
  -d '{"project":"helios","leadId":"rec_123","company":"SolarTech Italia","contact":"Marco Rossi","email":"marco@solartech.it","phone":"+39 02 1234 5678","scheduledDateTime":"2026-05-05T10:00","purpose":"Initial qualification"}'

# Update outcome
curl -X PATCH "http://localhost:3000/api/helios/calls/rec_123" \
  -H "Content-Type: application/json" \
  -d '{"project":"helios","outcomeStatus":"completed","activities":["demo_requested"],"duration":30}'

# Verify project isolation
curl "http://localhost:3000/api/helios/calls?project=kronos"
# Expected: 400 {"error":"This endpoint is for HELIOS only"}
```

### E2E Checklist
- [ ] Schedule a call → verify it appears in "Upcoming Calls"
- [ ] Verify PROX ATTIVITà written to Airtable record
- [ ] Mark call as completed with activities → verify score updated in Airtable
- [ ] Access `/dashboard/agenda` as KRONOS → verify isolation screen
- [ ] Test on mobile (responsive grid)

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Calls tracked per week | ≥ 10 (team adoption baseline) |
| Airtable write latency | < 2s per operation |
| PROX ATTIVITà accuracy | Manually validated against 20 leads |
| Lead-to-call conversion | Baseline in month 1, improve in month 2 |
| No-show rate visibility | Previously unknown; now measurable |

---

## 13. Key Files

| File | Status | Purpose |
|------|--------|---------|
| `apps/dashboard/app/dashboard/agenda/page.tsx` | Complete | Full frontend UI (368 lines) |
| `apps/dashboard/app/api/helios/calls/route.ts` | Stub | GET handler — needs Airtable |
| `apps/dashboard/app/api/helios/calls/schedule/route.ts` | Stub | POST handler — needs Airtable |
| `apps/dashboard/app/api/helios/calls/[id]/route.ts` | Stub | PATCH handler — needs Airtable |
| `apps/dashboard/app/dashboard/DashboardShell.tsx` | Complete | Agenda nav item added |
| `docs/HELIOS_AGENDA_IMPLEMENTATION.md` | Complete | Original implementation guide |
| `directives/HELIOS_EMAIL_SYSTEM_PROMPT.md` | Existing | Email AI context (Italian) |
| `config/BREVO_SENDER_CONFIG_HELIOS.md` | Existing | Email sender config |

---

## 14. Open Questions

| # | Question | Owner |
|---|---------|-------|
| 1 | Should PROX ATTIVITà also pull from Brevo webhook data (opens/clicks)? | Campaign Manager |
| 2 | Is the "Call Agenda" table being created manually in Airtable, or via API? | Backend dev |
| 3 | What is the Airtable field ID for PROX ATTIVITà in the existing Leads table? | Airtable admin |
| 4 | Should completed calls older than 90 days be archived or remain visible? | Product |
| 5 | Is the n8n decay workflow blocked on Phase 1 Airtable integration? | Backend dev |

---

*End of PRD*
