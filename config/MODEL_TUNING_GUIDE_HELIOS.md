# HELIOS Email Model Tuning Guide
**Version:** 1.0  
**Last Updated:** 2026-04-20  
**Scope:** OpenRouter GPT-4o-mini Configuration for Italian Solar Market

---

## 1. HELIOS MODEL CONFIGURATION

### Model Selection
- **Provider:** OpenRouter
- **Model ID:** `openai/gpt-4o-mini`
- **Why:** Handles Italian text well, cost-effective, fast inference
- **Cost:** ~$0.000105 per email (same as KRONOS)

### Parameter Settings

| Parameter | Current | Rationale |
|-----------|---------|-----------|
| Temperature | 0.5 | Consistency for technical solar market |
| Max Tokens | 300 | Enforce 4-5 sentence constraint |
| Top P | 1.0 | Default (no change needed) |
| Presence Penalty | 0 | Default (no change needed) |
| Output Format | JSON | {subject, emailBody} |

---

## 2. TEMPERATURE TUNING FOR HELIOS

### Understanding Temperature in Context

Temperature controls variation in output:
- **0.3-0.5:** Deterministic (same input = similar output)
- **0.5:** RECOMMENDED for HELIOS (balanced, consistent)
- **0.7-0.9:** More creative (higher variation)

### Why 0.5 for HELIOS?

The Italian solar market is **technical and relationship-driven**:

- ❌ Too high temperature (0.7+): Creates inconsistent technical claims
- ✅ Right temperature (0.5): Consistent, credible positioning

**Difference from KRONOS:** KRONOS can use 0.6-0.7 (real estate is relationship-focused). HELIOS should stay at 0.5 (solar is more technical).

### A/B Testing Plan

**Phase 1: Conservative (Emails 1-5)**
- Temperature: 0.5 (recommended)
- Track: Subject line variance, language consistency
- Goal: Establish baseline

**Phase 2: Test Variation (Emails 6-15)**
- Temperature: 0.5 (keep same)
- Add: Regional variation in HOOK section
- Track: Open rate, regional response patterns

**Decision Gate (After 20 emails):**
- Open rate >= 12%: Keep 0.5
- Open rate 10-12%: Keep 0.5, increase temperature to 0.6
- Open rate < 10%: Increase to 0.6, revise HOOK section

---

## 3. MAX TOKENS LIMIT

### Why This Matters for HELIOS

**Current:** No max_tokens limit → Emails could exceed intended length

**Problem:**
- Prompt says "4-5 sentences max"
- Without limit, emails could be 500+ words
- Solar buyers want quick, clear ROI messaging (not long prose)
- Each excess token increases cost

**Solution:** Set `maxTokens: 300`

### Token Budget for HELIOS

```
Expected token distribution (Italian email):

- Subject: 5-10 tokens
- Greeting: "Gentile {Name}," = 5 tokens
- Hook (regional): 20-30 tokens
- Problem (lead gen/seasonality): 30-40 tokens
- Solution (automate qualification): 25-35 tokens
- CTA: "Prenota una call" = 10-15 tokens
- Signature: 30-40 tokens
─────────────────────────────────
Total: 125-175 tokens (well within 300)

Safety buffer: 125 tokens for variations, longer names, etc.
```

### Implementation

In workflow's `llm-email` node:

```json
{
  "id": "llm-email",
  "name": "OpenRouter Email",
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
  "parameters": {
    "model": "openai/gpt-4o-mini",
    "maxTokens": 300,
    "temperature": 0.5,
    "options": {
      "baseURL": "https://openrouter.ai/api/v1"
    }
  }
}
```

---

## 4. LANGUAGE-SPECIFIC TUNING

### Italian Language Considerations

GPT-4o-mini handles Italian well, but monitor these:

#### Email Length
- Italian sentences are ~10-15% longer than English
- "Qualificazione iniziale dei lead" (7 tokens) vs "Initial lead qualification" (4 tokens)
- **Impact:** 300 tokens accommodates Italian + English bilingual well

#### Formal vs. Informal
- Italian has formal (Lei) and informal (tu) pronouns
- Prompt specifies "Gentile {Name}," (formal, appropriate for B2B)
- **Monitor:** First 5 emails to ensure tone consistency

#### Regional Terms
- Solar installers use regional jargon (impianti, irraggiamento, rendimento)
- Distributors use business terms (margini, clientela, fatturato)
- **A/B Test:** Regional HOOK variations after 10 emails

### Testing Italian Output Quality

After first email generates:
- [ ] Check Italian grammar (especially conjugation)
- [ ] Verify company-type appropriate terminology
- [ ] Confirm accent marks rendered (ò, è, à)
- [ ] Validate URL encoding (CTA link)

---

## 5. COMPANY-TYPE PERSONALIZATION

### The Three HELIOS Target Types

#### 1. Installers (Impianti)
**Problem:** Lead gen cost + seasonal dips  
**Tone:** Technical, direct, focus on ROI  
**Keywords:** "margini", "acquisizione", "pipeline stabile"

**Temperature:** 0.5 (consistency important for technical claims)

#### 2. Distributors (Distributori)
**Problem:** Client acquisition bottleneck  
**Tone:** Business-focused, partnership angle  
**Keywords:** "clientela", "espansione", "supporto"

**Temperature:** 0.5 (relationships matter, consistency needed)

#### 3. Energy Firms (Aziende Energetiche)
**Problem:** Predictable qualified pipeline  
**Tone:** Enterprise, strategic, compliance-aware  
**Keywords:** "compliance", "pipeline", "qualificazione"

**Temperature:** 0.5 (enterprise tone requires consistency)

### How to Implement

In Airtable, add logic to prompt based on Company Type:

```javascript
// In Email AI Agent system message, conditionally add:

if ($json['Company Type'] === 'Installer') {
  // Add installer-specific problem hook
  context += "This company installs solar systems. Lead acquisition cost is critical.";
}
else if ($json['Company Type'] === 'Distributor') {
  // Add distributor-specific hook
  context += "This company distributes solar equipment. Client expansion is key.";
}
else if ($json['Company Type'] === 'Energy Firm') {
  // Add energy firm-specific hook
  context += "This company operates as energy provider. Compliance and scale matter.";
}
```

---

## 6. REGIONAL TUNING

### Italian Regional Context

Italy's solar market varies by region:

| Region | Characteristics | Messaging Angle |
|--------|-----------------|-----------------|
| **Nord (Lombardy, Veneto)** | Mature market, high competition | Efficiency, cost savings |
| **Centro (Lazio, Tuscany)** | Growing market, good potential | Growth opportunity, scale |
| **Sud (Sicily, Campania)** | Emerging market, high sun | Quick ROI, sunshine advantage |

### A/B Testing by Region

**After 20 total emails:**
- 5 North: Benchmark
- 5 Centro: Benchmark
- 5 Sud: Benchmark
- 5 Multi-region: Compare

**Decision:** If one region outperforms, customize HOOK by region.

---

## 7. WARM-UP COMPLIANCE & MODEL IMPLICATIONS

### Why Warm-up Affects Model Tuning

The first 2-3 weeks of HELIOS will send limited emails (5→10→20/day):
- **Implication:** Model learning limited during warm-up
- **Recommendation:** Don't change temperature during warm-up
- **Monitor:** Benchmark opening rates independently of volume

### Monitoring During Warm-up

| Week | Daily Volume | Focus | Actions |
|------|--------------|-------|---------|
| **Week 1** | 5 emails/day | Deliverability | Check bounce rate |
| **Week 2** | 10 emails/day | Open rate | Collect baseline |
| **Week 3** | 20 emails/day | Click rate | A/B test HOOK variations |
| **Week 4+** | Full volume | Engagement | Adjust temperature if needed |

---

## 8. COST ANALYSIS: HELIOS vs KRONOS

### Per-Email Cost

```
Model: openai/gpt-4o-mini
Input: ~100 tokens × $0.00015/1k = $0.000015
Output: ~150 tokens × $0.0006/1k = $0.00009
─────────────────────────────────
Total per email: ~$0.000105
```

**Same as KRONOS** (no difference)

### Volume Scenarios

| Scenario | Emails/Month | Cost/Month | Notes |
|----------|--------------|-----------|-------|
| Warm-up (Week 1-3) | 350 | $0.04 | 5→10→20 per day |
| Launch (Week 4+) | 1,000 | $0.11 | ~20 emails/day full ramp |
| Scale (Monthly) | 5,000 | $0.53 | Full campaign, mature |
| Enterprise (Monthly) | 10,000 | $1.05 | Multiple regional campaigns |

**Budget:** $0.10/month for launch, $1.00/month at scale. Negligible compared to email domain costs.

---

## 9. ITALIAN-SPECIFIC TUNING TIPS

### Avoid These Italian Translations

❌ **Buzzwords that don't translate well:**
- "Scalable" → No direct equivalent; sounds foreign
- "Infrastructure" → "Infrastruttura" is too technical
- "Optimize" → "Ottimizzare" sounds academic

✅ **Better alternatives:**
- "Sustainable growth" → "Crescita sostenibile"
- "Reliable system" → "Sistema affidabile"
- "Improve efficiency" → "Migliorare l'efficienza"

### Grammar & Tone Watchpoints

1. **Conjugation:** GPT-4o-mini handles Italian verb conjugation well, but monitor:
   - Lei (formal singular) vs Loro (formal plural) consistency
   - Conditional tense ("potrebbe" vs "potremmo")

2. **Formality:** B2B Italian prefers formal tone (Lei)
   - Check: All emails use formal greeting/closing
   - Test: Monitor if any informal (tu) slips through

3. **Idioms:** Avoid Italian idioms that don't translate
   - ❌ "Saltare il fosso" (jump the ditch = take risk)
   - ✅ "Cogliere l'opportunità" (seize the opportunity)

---

## 10. MONITORING & ITERATION PROTOCOL

### Weekly Check (First Month)

Every week, track in Brevo analytics (tag: HELIOS_OUTREACH):
- [ ] Delivery rate (target: 98%+)
- [ ] Bounce rate (target: < 5%)
- [ ] Open rate (target: >= 12%)
- [ ] Click rate (target: >= 2%)
- [ ] Language accuracy (spot check 5 emails)

### Monthly Review

After 100+ emails:
- [ ] Average email length (target: 150-200 tokens)
- [ ] Subject line patterns (note what works)
- [ ] Regional performance comparison
- [ ] Company-type engagement variation

**Decision Points:**
1. **If open rate < 10%:** Increase temperature to 0.6, revise regional HOOK
2. **If open rate 10-15%:** Keep 0.5, monitor click rate
3. **If open rate >= 15%:** Success! Consider scaling

### Quarterly Tuning

After 300+ emails:
- [ ] Model upgrade to gpt-4o justified?
- [ ] Regional customization working?
- [ ] Language preferences (Italian vs English) clear?
- [ ] Company-type variations yielding different results?

---

## 11. QUICK REFERENCE: HELIOS TUNING DEFAULTS

```json
{
  "model": "openai/gpt-4o-mini",
  "temperature": 0.5,
  "maxTokens": 300,
  "language": "Italian (primary), English (secondary)",
  "target": "Solar installers, distributors, energy companies",
  "cost_per_email": "$0.000105",
  "recommended_batch_size": "5-20 (warm-up), then 20+ (full campaign)",
  "monitoring_metric": "Open rate (target >= 12%)",
  "adjustment_trigger": "If open rate < 10% after 20 emails"
}
```

---

## 12. COMPARISON: HELIOS vs KRONOS MODEL TUNING

| Aspect | KRONOS | HELIOS | Reason |
|--------|--------|--------|--------|
| **Model** | gpt-4o-mini | gpt-4o-mini | Same cost/speed requirements |
| **Temperature** | 0.5-0.7 | 0.5 (strict) | HELIOS more technical |
| **Max Tokens** | 300 | 300 | Same constraint |
| **Language** | English/German | Italian/English | Market requirement |
| **Cost** | $0.000105/email | $0.000105/email | Identical pricing |
| **Monitoring** | Open rate >= 15% | Open rate >= 12% | Different market benchmarks |

---

## 13. SETUP CHECKLIST

Before launching HELIOS campaign:

- [ ] **Model Parameters Set**
  - [ ] Temperature: 0.5 in llm-email node
  - [ ] MaxTokens: 300 in llm-email node
  - [ ] Model: openai/gpt-4o-mini confirmed

- [ ] **Prompt Configured**
  - [ ] System message matches `HELIOS_EMAIL_SYSTEM_PROMPT.md`
  - [ ] Language handling set to Italian-first
  - [ ] Company-type logic included (if using)

- [ ] **Testing Done**
  - [ ] Generate 3 test emails (different company types)
  - [ ] Check Italian grammar and tone
  - [ ] Verify HTML rendering
  - [ ] Validate CTA link works

- [ ] **Warm-up Plan Ready**
  - [ ] Week 1: 5 emails/day
  - [ ] Week 2: 10 emails/day
  - [ ] Week 3: 20 emails/day
  - [ ] Reminders set for scaling

- [ ] **Monitoring Setup**
  - [ ] Weekly Brevo analytics check scheduled
  - [ ] Baseline metrics documented
  - [ ] Decision tree saved (>= 12% = success)

---

**End of HELIOS Model Tuning Guide**
