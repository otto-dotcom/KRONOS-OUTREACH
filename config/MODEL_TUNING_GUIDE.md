# KRONOS Email Model Tuning Guide
**Version:** 2.0  
**Last Updated:** 2026-04-20  
**Scope:** OpenRouter GPT-4o-mini Configuration

---

## 1. CURRENT MODEL CONFIGURATION

### Model Selection
- **Provider:** OpenRouter
- **Model ID:** `openai/gpt-4o-mini`
- **Rationale:** Cost-effective, fast inference, reliable JSON parsing

### Parameter Settings

| Parameter | Current | Recommended | Status |
|-----------|---------|-------------|--------|
| Temperature | 0.7 | 0.5 | ⚠️ Needs tuning |
| Max Tokens | Unlimited | 300 | ⚠️ Not set |
| Top P | 1.0 (default) | 1.0 | ✅ OK |
| Presence Penalty | 0 (default) | 0 | ✅ OK |
| Output Format | JSON | JSON | ✅ OK |

---

## 2. TEMPERATURE TUNING

### Understanding Temperature

Temperature controls how deterministic vs. creative the model is:
- **0.0:** Completely deterministic (same input = same output always)
- **0.5:** Balanced (recommended for our use case)
- **1.0:** Maximum creativity (different output each time)
- **2.0+:** Chaotic (not recommended)

### Current vs. Recommended

**Current:** `temperature: 0.7`
- More creative subject lines
- Higher variance in email opening variations
- Risk: Inconsistent messaging across campaigns

**Recommended:** `temperature: 0.5`
- More consistent subject lines
- Predictable email structure
- Benefit: Easier to A/B test; clearer cause-effect in open rates

### Implementation

In `workflows/KRONOS_OUTREACH_EMAIL.json`, modify the `llm-email` node:

```json
{
  "id": "llm-email",
  "name": "OpenRouter Email",
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
  "parameters": {
    "model": "openai/gpt-4o-mini",
    "temperature": 0.5,
    "options": {
      "baseURL": "https://openrouter.ai/api/v1"
    }
  }
}
```

### A/B Testing Plan

**Phase 1: Baseline (Leads 1-5)**
- Temperature: 0.7 (current)
- Track: Subject line variance, open rate

**Phase 2: Test (Leads 6-15)**
- Temperature: 0.5 (recommended)
- Track: Subject line variance, open rate
- Compare to Phase 1

**Decision Gate:**
- If Phase 2 open rate >= Phase 1: Keep 0.5
- If Phase 2 open rate < Phase 1: Revert to 0.7

---

## 3. MAX TOKENS LIMIT

### Why This Matters

**Current:** No max_tokens limit → Emails can be very long

**Problem:**
- Prompt says "4-5 sentences max"
- Without token limit, emails could be 500+ words
- Each excess token increases cost (~$0.0006 per 1k tokens)
- Email length affects engagement (longer = lower open rates)

**Solution:** Set `maxTokens: 300`

### Token Budget Analysis

```
300 tokens = ~225 words (OpenAI estimate: 1 token ≈ 0.75 words)

Sample Email Structure:
- Subject: 5-10 tokens
- Greeting: 5 tokens
- Hook: 20-30 tokens
- Problem: 30-40 tokens
- Solution: 20-30 tokens
- CTA: 10-15 tokens
- Signature: 30-40 tokens
─────────────
Total: 120-180 tokens (well within 300)

Safety Buffer: 120 tokens for variations
```

### Implementation

Modify `llm-email` node in workflow:

```json
{
  "id": "llm-email",
  "name": "OpenRouter Email",
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
  "parameters": {
    "model": "openai/gpt-4o-mini",
    "maxTokens": 300,
    "options": {
      "baseURL": "https://openrouter.ai/api/v1"
    }
  }
}
```

### Monitoring

After implementation, check:
```
Average email tokens in first 20 sends:
- If < 100 tokens: Increase maxTokens to 350
- If 150-200 tokens: Keep at 300 (optimal)
- If > 250 tokens: Model is at limit; check prompt
```

---

## 4. OUTPUT PARSING & VALIDATION

### Current Setup

The workflow uses `outputParserStructured` to enforce JSON output:

```json
{
  "type": "object",
  "properties": {
    "subject": { "type": "string", "description": "Email subject line max 50 chars" },
    "emailBody": { "type": "string", "description": "Full HTML email body" }
  },
  "required": ["subject", "emailBody"]
}
```

### Subject Line Validation

**Current:** No post-generation validation  
**Issue:** Model may generate > 50 char subjects despite prompt request

**Recommended Addition:** Add validation node after parsing

```javascript
// In "Parse Email Output" code node
const ai = $input.item.json;
const subject = ai.subject || '';

// Validation
if (subject.length > 50) {
  subject = subject.substring(0, 47) + '...';
}

return { ...lead, subject, emailBody };
```

---

## 5. MODEL SELECTION: UPGRADE PATH

### Current Model: `openai/gpt-4o-mini`

**Pros:**
- Cost: ~$0.00015/1k input, $0.0006/1k output
- Speed: ~1-2 second response time
- Reliable JSON parsing
- Good enough for cold email

**Cons:**
- Less nuanced than GPT-4o
- May miss subtle regional cues
- Limited context awareness

### Upgrade Consideration: `openai/gpt-4o`

**Pros:**
- Better understanding of Swiss business culture
- Richer personalization
- Higher open rates (estimated +5-10%)

**Cons:**
- ~10x more expensive (~$0.0015/1k input, $0.006/1k output)
- Slower (3-5 second response)
- May over-personalize (verbosity)

### Upgrade Decision Tree

| Metric | Threshold | Action |
|--------|-----------|--------|
| Emails Sent | < 100 | Keep gpt-4o-mini |
| Open Rate | >= 15% | Keep gpt-4o-mini |
| Open Rate | < 10% | Test gpt-4o on 20 emails |
| Cost/Email | > $0.001 | Revert if using gpt-4o |

**Recommended:** Stay with `gpt-4o-mini` for Q2 2026. Evaluate upgrade in Q3 after 200+ sent emails.

---

## 6. PROMPT ENGINEERING GUIDE

### Current Prompt Structure

```
1. SYSTEM CONTEXT
   └─ "You are a cold email specialist..."

2. GOAL
   └─ "Write a short, direct cold email (4-5 sentences max)"

3. CONTENT PROTOCOL
   └─ HOOK → PROBLEM → SOLUTION → CTA

4. TONE REQUIREMENTS
   └─ "Direct, professional, conversational"

5. HTML FORMATTING
   └─ Specific styling, logo, signature
```

### Optimization Techniques

#### A. Region-Specific Tuning

**Current:** Generic Swiss business context  
**Improvement:** Add city-specific insights

```javascript
// In Email AI Agent node, system message:
HOOK: Specific observation about ${lead.City} market patterns.
NEVER: 'I noticed you are active in [city]'.
INSTEAD: Reference specific property trends, agency clusters, or market dynamics in ${lead.City}.
```

#### B. Agency-Size Personalization

**Current:** One-size-fits-all  
**Improvement:** Adapt tone to agency size

```javascript
// If lead.company_size === 'small' (1-5 agents):
Tone: Direct, founder-focused. Emphasize time savings.

// If lead.company_size === 'medium' (5-20 agents):
Tone: Professional, operations-focused. Emphasize consistency.

// If lead.company_size === 'large' (20+ agents):
Tone: Executive, process-focused. Emphasize scalability.
```

#### C. Engagement History

**Current:** No memory of previous outreach  
**Improvement:** Tailor CTA based on prior engagement

```javascript
// If lead already received email but didn't open:
CTA: "Want a 5-minute walk-through instead?"

// If lead opened but didn't click:
CTA: "Reply to this, or let me know a better time"

// If first-time contact:
CTA: "Book a 15-min call"
```

---

## 7. COST ANALYSIS

### Current Cost Per Email

```
Model: gpt-4o-mini
Input: ~100 tokens × $0.00015/1k = $0.000015
Output: ~150 tokens × $0.0006/1k = $0.00009
─────────────────────────────────
Total per email: ~$0.000105
Cost for 100 emails: $0.0105
Cost for 1,000 emails: $0.105
Cost for 10,000 emails: $1.05
```

### Cost with gpt-4o (upgrade scenario)

```
Model: openai/gpt-4o
Input: ~100 tokens × $0.0015/1k = $0.00015
Output: ~150 tokens × $0.006/1k = $0.0009
─────────────────────────────────
Total per email: ~$0.00105 (10x more expensive)
Cost for 100 emails: $0.105
Cost for 1,000 emails: $1.05
Cost for 10,000 emails: $10.50
```

**Recommendation:** Stick with gpt-4o-mini until open rates plateau or volume > 1,000 emails/month.

---

## 8. MONITORING & ITERATION

### Weekly Monitoring (Every 20 Emails)

Track in Brevo analytics:
- [ ] Average open rate
- [ ] Average click rate
- [ ] Bounce rate
- [ ] Subject line patterns (most common)
- [ ] Email length distribution

### Monthly Review (Every 100 Emails)

Decision points:
1. **If open rate < 10%:** Revise system prompt, increase temperature to 0.6
2. **If open rate 10-15%:** Keep current settings, monitor CTA
3. **If open rate > 15%:** Success baseline; consider scaling
4. **If click rate < 2%:** Improve CTA, test different calendar link angle

### Quarterly Tuning (Every 300 Emails)

Evaluate:
- [ ] Model upgrade to gpt-4o justified?
- [ ] Temperature sweet spot confirmed?
- [ ] Subject line formula working?
- [ ] Regional variations needed?

---

## 9. QUICK TUNING CHECKLIST

Before each campaign:

- [ ] **Temperature Set**
  - [ ] Confirm: 0.5 (for consistency) or 0.7 (for variance)?
  - [ ] Document choice in commit message

- [ ] **Max Tokens Set**
  - [ ] Confirm: 300 token limit active
  - [ ] Reason: Enforce 4-5 sentence constraint

- [ ] **Output Parser Validated**
  - [ ] JSON schema enforced: {subject, emailBody}
  - [ ] Test: Run 1 email, verify JSON structure

- [ ] **Prompt Current**
  - [ ] System message matches `/directives/EMAIL_SYSTEM_PROMPT.txt`
  - [ ] Last updated date recorded

- [ ] **Credentials Valid**
  - [ ] OpenRouter API key active
  - [ ] Rate limits sufficient for batch size

- [ ] **Cost Estimated**
  - [ ] Emails × $0.000105 = total cost
  - [ ] Budget approved

---

## 10. APPENDIX: NODE CONFIGURATION TEMPLATE

### Copy-Paste Ready: `llm-email` Node Parameters

```json
{
  "id": "llm-email",
  "name": "OpenRouter Email",
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
  "typeVersion": 1.1,
  "position": [1140, 20],
  "parameters": {
    "model": "openai/gpt-4o-mini",
    "temperature": 0.5,
    "maxTokens": 300,
    "options": {
      "baseURL": "https://openrouter.ai/api/v1"
    }
  },
  "credentials": {
    "openAiApi": {
      "id": "YOUR_OPENROUTER_CREDENTIAL_ID",
      "name": "OpenRouter API"
    }
  }
}
```

---

**End of Model Tuning Guide**
