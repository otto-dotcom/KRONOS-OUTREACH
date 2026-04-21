# HELIOS Call Tracking System — Product Requirements Document

**Document Version:** 1.0  
**Last Updated:** 2026-04-21  
**Status:** APPROVED FOR IMPLEMENTATION  
**Project:** KRONOS-OUTREACH / HELIOS Solar Intelligence  

---

## Executive Summary

HELIOS Call Tracking System is an integrated telephonic engagement platform that bridges outbound lead management with real-time call orchestration. The system enables operators to log, track, and manage cold calls across the Italian solar energy market, with automatic synchronization to Airtable for persistent lead history and intelligent follow-up scheduling.

**Key Outcomes:**
- Reduce manual call tracking overhead by 80%
- Enable data-driven follow-up prioritization
- Maintain audit trail of all customer interactions
- Accelerate sales cycle via automated next-action scheduling

---

## 1. Product Overview

### 1.1 Vision
A unified call management system that treats every telephone interaction as a structured data point, enabling teams to analyze call outcomes, optimize follow-up timing, and maintain complete visibility into the customer journey.

### 1.2 Problem Statement
**Current State:**
- Call outcomes are logged manually into Notes fields
- No structured tracking of call attempts, outcomes, or follow-up actions
- Call history is fragmented across email logs and unstructured notes
- Follow-up dates (PROX ATTIVITÀ) are set manually without call context

**Gap:**
- Loss of institutional knowledge about call interactions
- Missed follow-up opportunities due to lack of structured reminders
- Inability to analyze call success rates or patterns
- Unclear which leads are "hot" vs. "cold" based on recent contact

### 1.3 Solution Overview
Implement a dual-layer call tracking system:
1. **Call Agenda Table** (Airtable) — Persistent log of all calls
2. **Call Tracker Modal** (Dashboard) — Real-time call logging and outcome tracking
3. **API Integration** — Seamless sync between dashboard and Airtable

---

## 2. Objectives & Success Metrics

### 2.1 Primary Objectives
- [ ] Enable operators to log calls with structured outcomes
- [ ] Maintain complete call history linked to each lead
- [ ] Automatically update PROX ATTIVITÀ (next follow-up date) based on call outcome
- [ ] Provide call analytics: total calls, success rate, average time-to-close
- [ ] Support multi-channel contact tracking (email + phone in one view)

### 2.2 Success Metrics
| Metric | Target | Baseline | Owner |
|--------|--------|----------|-------|
| Calls logged per day | 50+ | 0 | Operations |
| Call outcome accuracy | 99%+ | N/A | QA |
| PROX ATTIVITÀ auto-update success | 98%+ | 0% | Engineering |
| Time to log call | <2 min | 10+ min | UX/Product |
| Call history completeness | 95%+ | <10% | Operations |

---

## 3. User Stories

### 3.1 Primary User: Solar Outreach Operator
**As** a solar outreach specialist in Milan  
**I want** to log a phone call and its outcome instantly  
**So that** I can maintain accurate follow-up schedules and track engagement patterns

**Acceptance Criteria:**
- [ ] Can open call logging modal from lead detail view
- [ ] Can select call outcome from predefined list (Connected, Voicemail, No-Answer, etc.)
- [ ] Can add call notes with rich text formatting
- [ ] Call is automatically synced to Airtable within 2 seconds
- [ ] PROX ATTIVITÀ is updated to next business day if "Callback Requested"

### 3.2 Secondary User: Sales Manager
**As** a solar sales manager  
**I want** to see call analytics for my team  
**So that** I can identify top performers and coaching opportunities

**Acceptance Criteria:**
- [ ] Can filter calls by date range, outcome, team member
- [ ] Can see success rate (% Connected calls)
- [ ] Can view average time-to-first-call per lead
- [ ] Can export call report for analysis

### 3.3 Tertiary User: Lead Qualifier
**As** a lead qualification specialist  
**I want** to see full call history when reviewing a lead  
**So that** I can understand context before any contact

**Acceptance Criteria:**
- [ ] Can view last 5 calls in lead modal
- [ ] Can see call dates, outcomes, and notes
- [ ] Can see next scheduled call (PROX ATTIVITÀ)

---

## 4. Functional Requirements

### 4.1 Core Features

#### 4.1.1 Call Logging
**FR-1.1: Initiate Call Log**
- User clicks "Log Call" button in lead modal
- System displays inline call form
- Form contains: Outcome (required), Notes (optional), Duration (optional)

**FR-1.2: Call Outcome Selection**
- Predefined outcomes (single select):
  - `connected` — Spoke directly with decision maker
  - `voicemail` — Left voicemail message
  - `no-answer` — Number rang, nobody picked up
  - `callback` — Lead asked to call back
  - `interested` — Lead expressed interest
  - `not-interested` — Lead declined
  - `wrong-number` — Incorrect/disconnected number

**FR-1.3: Call Notes**
- Rich text field for call context
- Auto-save to local state while typing
- Character limit: 500 chars
- Support for common formatting (bold, italic)

**FR-1.4: Call Duration (Optional)**
- Numeric input field (minutes)
- Range: 1-120 minutes
- Defaults to 0 if not provided

#### 4.1.2 Call History
**FR-2.1: Display Recent Calls**
- Show last 3 calls in lead modal
- Display: outcome (badge), date, duration, notes snippet
- Reverse chronological order

**FR-2.2: Expand Call History**
- "View All Calls" link expands to show last 20 calls
- Pagination if more than 20 calls exist
- Sortable by date (ascending/descending)

#### 4.1.3 PROX ATTIVITÀ Auto-Update
**FR-3.1: Auto-Schedule Next Follow-up**
- When outcome = `callback` or `interested`:
  - Set PROX ATTIVITÀ to next business day, 10:00 AM
  - Notify user: "Follow-up scheduled for [date]"

**FR-3.2: Manual Override**
- User can manually set next follow-up date/time
- Overrides auto-scheduling
- Updates PROX ATTIVITÀ in Leads table

#### 4.1.4 Call Statistics
**FR-4.1: Call Counter**
- Display total calls made to this lead
- Show in lead card: "5 calls"
- Show in table view: Calls column

**FR-4.2: Call Success Rate**
- Calculate: (Connected + Interested) / Total Calls × 100
- Display in analytics dashboard

---

### 4.2 Integration Requirements

#### 4.2.1 Airtable Sync
**FR-5.1: Create Call Record**
- API: `POST /api/helios/calls/schedule`
- Create record in "Call Agenda" table
- Link to Leads GSE record
- Sync within 2 seconds

**FR-5.2: Update Call Outcome**
- API: `PATCH /api/helios/calls/[id]`
- Update call status, notes, duration
- Sync changes back to dashboard

**FR-5.3: Fetch Call History**
- API: `GET /api/helios/calls`
- Query all calls for a lead
- Return last 20 calls sorted by date DESC

#### 4.2.2 Lead Status Sync
**FR-6.1: Update CALL STATUS in Leads**
- If outcome = `interested` → CALL STATUS = "INTERESSATO"
- If outcome = `not-interested` → CALL STATUS = "CHIAMATO NON INTERESSATO"
- If outcome = `connected` → CALL STATUS = "DA SEGUIRE" (or keep existing)

**FR-6.2: Update PROX ATTIVITÀ**
- If outcome = `callback` or `interested`:
  - PROX ATTIVITÀ = tomorrow 10:00 AM
- If outcome = `no-answer` or `voicemail`:
  - PROX ATTIVITÀ = +3 days 09:00 AM
- If outcome = `not-interested`:
  - PROX ATTIVITÀ = null (do not follow up)

---

## 5. Technical Requirements

### 5.1 Data Model

#### 5.1.1 Call Agenda Table (Airtable)
**Table ID:** `tblXXXXXXXXXXXXXX` (to be created)

| Field Name | Type | Required | Options | Notes |
|------------|------|----------|---------|-------|
| `ID` | Autonumber | Yes | - | Unique call record ID |
| `Lead Link` | Link to Records | Yes | Leads GSE | Foreign key to lead |
| `Call Date` | DateTime | Yes | ISO 8601 | When call occurred |
| `Call Outcome` | Single Select | Yes | See 4.1.2 | Enum: connected, voicemail, etc |
| `Call Notes` | Long Text | No | - | Rich text notes, max 500 chars |
| `Duration Minutes` | Number | No | 1-120 | Call length in minutes |
| `Next Follow-up Override` | DateTime | No | ISO 8601 | Manual override for PROX ATTIVITÀ |
| `Created By` | Email | Yes | - | Operator email |
| `Created At` | DateTime | Yes | Automatic | Timestamp |
| `Updated At` | DateTime | Yes | Automatic | Last update timestamp |

#### 5.1.2 Leads GSE Table (Existing)
**Modifications:**
- No schema changes required
- Existing fields used: `CALL STATUS`, `PROX ATTIVITÀ`, `INFORMATION`
- Will auto-update via API

---

### 5.2 API Specifications

#### 5.2.1 GET /api/helios/calls
**Purpose:** Fetch all calls for a lead

**Request:**
```typescript
GET /api/helios/calls?project=helios&leadId=rec_XXXXXXX
```

**Response:**
```json
{
  "success": true,
  "calls": [
    {
      "id": "recXXXXXXXXXXXXXX",
      "leadId": "recYYYYYYYYYYYYYY",
      "callDate": "2026-04-20T14:30:00Z",
      "outcome": "interested",
      "notes": "Manager very interested, wants demo next week",
      "duration": 12,
      "nextFollowupOverride": "2026-04-28T10:00:00Z",
      "createdBy": "operator@company.it",
      "createdAt": "2026-04-20T14:32:15Z",
      "updatedAt": "2026-04-20T14:32:15Z"
    }
  ]
}
```

**Error Handling:**
- 400: Invalid lead ID
- 401: Unauthorized
- 500: Server error

---

#### 5.2.2 POST /api/helios/calls/schedule
**Purpose:** Create new call record

**Request:**
```json
{
  "project": "helios",
  "leadId": "recXXXXXXXXXXXXXX",
  "callOutcome": "interested",
  "callNotes": "Manager very interested, wants demo next week",
  "durationMinutes": 12,
  "nextFollowupOverride": "2026-04-28T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "call": {
    "id": "recXXXXXXXXXXXXXX",
    "leadId": "recYYYYYYYYYYYYYY",
    "callDate": "2026-04-20T14:30:00Z",
    "outcome": "interested",
    "notes": "Manager very interested, wants demo next week",
    "duration": 12,
    "updatedLeadStatus": "INTERESSATO",
    "updatedProxAttivita": "2026-04-28T10:00:00Z"
  }
}
```

**Logic:**
1. Create record in Call Agenda table
2. Link to Leads GSE
3. Auto-update CALL STATUS based on outcome
4. Auto-set PROX ATTIVITÀ (or use override)
5. Return created record

---

#### 5.2.3 PATCH /api/helios/calls/[id]
**Purpose:** Update call outcome/notes

**Request:**
```json
{
  "project": "helios",
  "callOutcome": "not-interested",
  "callNotes": "Budget constraints",
  "durationMinutes": 8
}
```

**Response:**
```json
{
  "success": true,
  "call": {
    "id": "recXXXXXXXXXXXXXX",
    "outcome": "not-interested",
    "notes": "Budget constraints",
    "duration": 8,
    "updatedLeadStatus": "CHIAMATO NON INTERESSATO",
    "updatedProxAttivita": null
  }
}
```

---

### 5.3 Environment Variables

```env
# Airtable Configuration (set in .env.local)
HELIOS_AIRTABLE_API_KEY=<your-airtable-api-key>
HELIOS_AIRTABLE_BASE_ID=appyqUHfwK33eisQu
HELIOS_AIRTABLE_LEADS_TABLE=tbl07Ub0WeVHOnujP
HELIOS_AIRTABLE_CALLS_TABLE=tblPKqoBVCTALCmlC

# API Configuration
NEXT_PUBLIC_API_TIMEOUT=5000
HELIOS_AUTO_PROX_ATTIVITA_ENABLED=true
```

**Note:** API key should be stored securely in `.env.local` (not committed to git)

---

## 6. UI/UX Requirements

### 6.1 Call Logging Modal

**Location:** Lead detail modal, right panel (center column)

**Components:**
1. **Call Stats Card**
   - Total calls made
   - Last contact date
   - Readable: "3 calls • Last: Apr 20"

2. **Log Call Button**
   - Prominent CTA: "+ Log Call"
   - Color: Accent (var(--accent))
   - Opens inline form

3. **Call Form**
   - Outcome dropdown (7 options)
   - Notes textarea (max 500 chars)
   - Duration input (minutes)
   - Save/Cancel buttons
   - Auto-collapse after save

4. **Call History**
   - Show last 3 calls
   - Cards display: outcome badge, date, duration, notes snippet
   - "View All" link expands to 20 calls

### 6.2 Lead Table Column

**New Column:** "Calls"
- Display: Number (e.g., "5")
- Align: Center
- Sort: By call count ascending/descending

### 6.3 Responsive Behavior

**Desktop (>768px):**
- Three-panel modal: Lead Info | Call Tracking | Email Generation
- Each panel scrolls independently
- Min width for center panel: 300px

**Mobile (<768px):**
- Single column, tabbed interface
- Tabs: Profile | Calls | Email
- Full-width call form

---

## 7. Implementation Plan

### 7.1 Phase 1: Foundation (Week 1)
- [ ] Create Call Agenda table in Airtable
- [ ] Implement API endpoints (GET, POST, PATCH)
- [ ] Write integration tests for Airtable sync
- [ ] Deploy to staging

### 7.2 Phase 2: Dashboard Integration (Week 2)
- [ ] Build call logging form component
- [ ] Implement call history display
- [ ] Add call stats card
- [ ] Integrate modals with APIs
- [ ] Unit tests for UI components

### 7.3 Phase 3: Analytics & Polish (Week 3)
- [ ] Build call analytics dashboard (optional Phase 2)
- [ ] Add call success rate calculations
- [ ] Implement export functionality
- [ ] Performance testing & optimization
- [ ] UAT with operations team

### 7.4 Phase 4: Launch & Monitoring (Week 4)
- [ ] Production deployment
- [ ] Operator training
- [ ] 24/7 monitoring for first week
- [ ] Feedback collection
- [ ] Bug fixes & iterations

---

## 8. Acceptance Criteria (UAT)

### 8.1 Functional Testing
- [ ] Can log call with all outcome types
- [ ] Call syncs to Airtable within 2 seconds
- [ ] CALL STATUS updates correctly based on outcome
- [ ] PROX ATTIVITÀ auto-updates for interested/callback
- [ ] Call notes display in lead modal
- [ ] Call history shows in reverse chronological order
- [ ] Manual PROX ATTIVITÀ override works

### 8.2 Performance Testing
- [ ] Call logging completes in <2 seconds
- [ ] Fetching 20 calls loads in <1 second
- [ ] Modal opens without lag
- [ ] No network errors on slow connections (simulated 3G)

### 8.3 User Acceptance Testing
- [ ] 5 operators can log calls without errors
- [ ] 95%+ of calls are logged correctly (accuracy audit)
- [ ] Team reports reduced time to log calls
- [ ] No duplicate call records created

---

## 9. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Airtable API rate limits | Calls fail to sync | Medium | Implement exponential backoff, batch requests |
| Network latency | Poor UX, lost data | Medium | Add offline queue, local storage fallback |
| Operator errors (wrong outcome) | Data quality issues | High | Add confirmation dialog, outcome tips/help |
| PROX ATTIVITÀ conflicts | Schedule overwrites | Low | Prioritize operator override, add conflict detection |
| Missing lead link | Orphaned call records | Low | Validate lead ID before creation |

---

## 10. Future Enhancements (Phase 2+)

- [ ] Call recording integration (Twilio/Asterisk)
- [ ] Automated call outcome detection via AI
- [ ] SMS integration alongside phone calls
- [ ] Call sentiment analysis
- [ ] Predictive next-best-action recommendations
- [ ] Call quality scoring
- [ ] Team performance leaderboard
- [ ] Automatic callback scheduling via Google Calendar

---

## 11. Success Definition

**MVP Success = "Operators prefer digital call logging over manual notes"**

- 80%+ of calls logged digitally within first month
- <5 minutes average time to log call
- 99%+ data accuracy
- Zero critical bugs in production for 2 weeks
- Team reports improved follow-up consistency

---

## Appendix A: Field Mapping Reference

```javascript
// Call Outcome → CALL STATUS in Leads
const outcomeToStatus = {
  connected: "DA SEGUIRE",      // Follow up
  voicemail: "DA CHIAMARE",     // Call back
  no_answer: "DA CHIAMARE",     // Call back
  callback: "DA SEGUIRE",       // Follow up
  interested: "INTERESSATO",     // Interested
  not_interested: "CHIAMATO NON INTERESSATO",  // Called, not interested
  wrong_number: "DA RICONTATTARE"  // Needs retry
};

// Call Outcome → PROX ATTIVITÀ Auto-Schedule
const outcomeToNextDay = {
  connected: "next business day, 10:00 AM",
  voicemail: "+3 days, 09:00 AM",
  no_answer: "+3 days, 09:00 AM",
  callback: "next business day, 10:00 AM",
  interested: "next business day, 14:00 PM",
  not_interested: null,  // Do not schedule
  wrong_number: "+7 days, 09:00 AM"
};
```

---

**Document Signed:**
- Product Manager: KRONOS Team
- Engineering Lead: [TBD]
- Operations Lead: [TBD]
- Date: 2026-04-21

**Next Review:** 2026-05-21
