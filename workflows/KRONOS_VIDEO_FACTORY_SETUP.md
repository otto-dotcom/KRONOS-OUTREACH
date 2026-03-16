# KRONOS Social Video Factory — Setup Guide

## What this builds
A fully automated n8n workflow that reads video requests from Google Sheets, generates AI-written prompts via Claude (OpenRouter), submits them to Kie.ai (Veo 3.1 + Flux Kontext), polls for completion, and sends you a WhatsApp notification with the video URL.

**Two pipelines in one workflow:**
1. **Content Videos** (text-to-video): AI news, Swiss real estate, brand vision, free tips
2. **UGC Character Videos** (image-to-video): Generates "Lorenzo" character via Flux → animates with Veo

---

## Step 1: Google Sheets Setup

Create a new Google Sheet with this exact header row:

| No | Topic | VideoType | ContentBrief | Status | FinishedVideo | CharacterImageURL | CompletedAt |
|----|-------|-----------|--------------|--------|---------------|-------------------|-------------|
| 1  | AI automating Swiss property valuations | content_re | Focus on market data, Zurich/Zug prices, efficiency angle | Ready | | | |
| 2  | 5 ways AI saves 10 hours per week | content_freeinfo | Keep it practical, reference n8n/ChatGPT, soft CTA | Ready | | | |
| 3  | KRONOS vision: automated real estate | content_vision | Highlight our automation stack, target HNW clients | Ready | | | |
| 4  | Lorenzo intro video | ugc_character | Introduce KRONOS brand, warm and confident tone | Ready | | | |

### VideoType values:
| Value | Description |
|-------|-------------|
| `content_ai` | AI technology news, trends, tips for Swiss business |
| `content_re` | Swiss real estate market insights, luxury properties, investments |
| `content_vision` | KRONOS brand story, vision, case studies |
| `content_freeinfo` | Free educational AI/automation content + soft CTA |
| `ugc_character` | Lorenzo character video (Flux image gen → Veo animation) |

### Status lifecycle:
`Ready` → (workflow picks it up) → `Finished` (or leaves as Ready if an error occurs)

---

## Step 2: n8n Import

1. In n8n: **Workflows → Import from file**
2. Select `kronos_social_video_factory.json`
3. The workflow will open with some nodes needing configuration

---

## Step 3: Configure Placeholders

### Google Sheets nodes (3 nodes to update):
Find all nodes named `Get Next Ready Video`, `Update Sheet - Content Done`, `Update Sheet - UGC Done`.

In each node:
- Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your actual Google Sheet ID
- The Sheet ID is in the URL: `https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_ID/edit`
- Make sure the sheet tab name matches `Videos` (or update the sheetName field)

### WhatsApp notification (2 nodes to update):
Find `WhatsApp - Content Video Ready` and `WhatsApp - UGC Video Ready`.

Update the `to` field:
```
whatsapp:+39YOUR_PHONE_NUMBER
```
(Keep the `whatsapp:` prefix)

### Twilio credential:
1. n8n → Settings → Credentials → Add Credential → Twilio
2. Add your Account SID and Auth Token from `.env`
3. In the WhatsApp nodes, select this new credential

---

## Step 4: Credentials Already Wired

These use IDs from your existing workflows and should work immediately:

| Service | Credential | Status |
|---------|-----------|--------|
| Kie.ai (video + image) | `Kie Demo` | ✅ Already set |
| OpenRouter (Claude 3.5) | `OpenRouter account 2` | ✅ Already set |
| Google Sheets | `Google Sheets account` | ✅ Already set |
| Twilio (WhatsApp) | Need to create | ⚠️ Setup required |

---

## Step 5: Schedule Configuration

The workflow runs daily at 8:00 AM (server time). To change:
- Open `Schedule - Daily 8AM` node
- Update the cron expression: `0 8 * * *` = 8AM daily
- Common alternatives:
  - `0 8,18 * * *` = 8AM and 6PM
  - `0 8 * * 1-5` = Weekdays only
  - `0 9 * * 1` = Every Monday 9AM

---

## How It Works (Flow Diagram)

```
Schedule (8AM daily)
    │
    ▼
Google Sheets — Get next row where Status = "Ready"
    │
    ▼
Switch on VideoType
    ├─ content_ai ──────┐
    ├─ content_re ──────┤
    ├─ content_vision ──┤──► Merge ──► AI: Generate Prompt (Claude)
    └─ content_freeinfo ┘              │
                                       ▼
                               Kie.ai Veo 3.1 Submit (TEXT_2_VIDEO)
                                       │
                               Wait 30s ◄──── Loop until done
                                       │
                               Get Veo Status
                                       │
                               If response exists?
                                       │
                               Update Sheet (Status=Finished)
                                       │
                               WhatsApp Notification ✅

    └─ ugc_character ──► AI: Flux Prompt (Claude)
                             │
                         Kie.ai Flux Kontext Max (character image)
                             │
                         Wait 20s ◄──── Loop until done
                             │
                         Get Flux Status
                             │
                         If successFlag = 1?
                             │
                         Store character image URL
                             │
                         AI: Veo Animation Prompt (Claude)
                             │
                         Kie.ai Veo 3.1 Submit (IMAGE_2_VIDEO)
                             │
                         Wait 30s ◄──── Loop until done
                             │
                         Get Veo Status
                             │
                         Update Sheet (Status=Finished, CharacterImageURL)
                             │
                         WhatsApp Notification ✅
```

---

## Content Video Prompt Types

### `content_ai` generates:
Professional cinematic AI tech visualization videos — neural networks, data dashboards, Swiss office settings, tech animations. CTA: `kronosautomations.it`

### `content_re` generates:
Premium Swiss real estate showcase — Alpine properties, Zurich/Geneva skylines, luxury interiors, market data overlays. Gold/black KRONOS aesthetic.

### `content_vision` generates:
Bold KRONOS brand vision videos — AI automation metaphors, Swiss precision meets innovation, Hollywood trailer feel, brand color reveal.

### `content_freeinfo` generates:
Clean educational explainer videos — step-by-step animations, friendly UI walkthroughs, approachable tone, soft CTA.

### `ugc_character` generates:
**Step 1 (Flux):** Photorealistic portrait of "Lorenzo" — 35-40yr Swiss-Italian realtor, tailored suit, Zurich office background, 9:16 portrait

**Step 2 (Veo):** Animates Lorenzo into a talking-head video based on the Topic — natural gestures, eye contact, LinkedIn creator aesthetic

---

## Customizing the Character (Lorenzo)

To change the character appearance, edit the `AI: UGC Character Image Prompt` node's system message. The current character spec:

> 35-40 year old Swiss-Italian professional. Sharp Mediterranean features, clean-shaven, dark brown styled hair with silver temples, olive complexion. Tailored charcoal/navy suit, gold tie clip, luxury Swiss watch. Confident professional posture, direct eye contact. Modern Swiss office with Zurich skyline background.

---

## Troubleshooting

**"No rows found" — workflow does nothing:**
→ Make sure at least one row has `Status = Ready` (exact match, case-sensitive)

**Kie.ai 402 error (insufficient credits):**
→ Top up kie.ai credits at kie.ai/dashboard

**Video loops too many times (stuck):**
→ If a row has been Processing for >20 min, manually set Status = Failed and re-add as Ready

**Wrong Google Sheet:**
→ Double-check the Sheet ID in all 3 Google Sheets nodes matches your actual sheet

**WhatsApp not sending:**
→ Verify Twilio credential is created and the `to` number format is `whatsapp:+COUNTRYCODENUMBER`
