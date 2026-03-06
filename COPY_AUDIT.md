# KRONOS Outreach: Copy & Template Audit

## 1. Visual Identity (The "Pixel-Retro" Template)
Preview file: `PREVIEW_EMAIL_TEMPLATE.html`

**Key Design Elements:**
- **Header**: 10px orange (#FF6B00) top border
- **Logo**: Centered, 120px, `image-rendering: pixelated`
- **Signature separator**: Orange dotted line
- **CTA**: Bold orange link "See how it works →"

---

## 2. Email Copy — Perfected Variants

### Variant A: Primary (Score 8–10)
> **Subject**: `{Name} — quick question about {AgencyName}`
>
> Grüezi {Name},
>
> Quick question: how many leads does {AgencyName} lose each week because your team couldn't follow up fast enough?
>
> Most agencies in {City} lose 30–50% of warm leads to slower competitors — not from lack of quality, but because follow-up is manual and inconsistent.
>
> We build automated systems that handle first contact and qualification instantly, so your consultants only spend time with buyers and sellers who are ready to move.
>
> Worth 15 minutes this week?
>
> [**See how it works →**](https://kronosautomations.it/#contattaci)

### Variant B: Problem-first (Score 6–7)
> **Subject**: `agencies in {City} are closing more without hiring`
>
> Grüezi {Name},
>
> I've been working with agencies across {City} on one specific problem: advisors spending most of their time chasing leads that never convert.
>
> The fix isn't hiring more staff — it's automating the first 48 hours of every lead's journey so your team only talks to people who are ready to buy or sell.
>
> Curious to see the numbers from agencies like {AgencyName}?
>
> [**See how it works →**](https://kronosautomations.it/#contattaci)

### Variant C: Data hook (use when city/metrics available in lead data)
> **Subject**: `{AgencyName} | lead follow-up gap`
>
> Grüezi {Name},
>
> One quick stat: the average agency in {City} takes 6+ hours to respond to a new lead. By then, 50% have already contacted a competitor.
>
> KRONOS closes that gap automatically — every new lead gets an instant, personalized first response, 24/7. Your advisors step in only when the prospect is warm.
>
> Worth a 15-minute demo?
>
> [**See how it works →**](https://kronosautomations.it/#contattaci)

---

## 3. WhatsApp/SMS Copy — Perfected Variants

### Primary (under 160 chars)
```
{Name}, most agencies in {City} lose leads to slow follow-up. We automate it. Worth a 10min call? kronosautomations.it
```

### High-score leads (score ≥ 8)
```
{Name} — quick question: how does {AgencyName} handle new leads after hours? Reply YES to see how top {City} agencies automate it.
```

### Fallback (sparse lead data)
```
Quick question {Name} — is {AgencyName} manually following up on every lead? We can automate that. Reply YES for a quick demo.
```

---

## 4. Subject Line Cheatsheet

| Pattern | Example | Use case |
|---------|---------|----------|
| `{Name} — quick question` | `Marco — quick question` | High personalization |
| `agencies in {City} are...` | `agencies in Zurich are closing more` | Social proof angle |
| `{AgencyName} \| lead follow-up gap` | `Müller Immobilien \| lead follow-up gap` | Problem-specific |
| `how {City} agencies handle...` | `how Zurich agencies handle off-hours leads` | Curiosity hook |

**Never use:** "Scalable", "Infrastructure", "INITIALIZE LEAD FLOW", all-caps words, exclamation marks

---

## 5. Pre-Flight Checklist
- [ ] Logo `logo.png` is live at `https://kronosautomations.it/logo.png`
- [ ] Lead data fields match: `FULL NAME`, `company name`, `City`, `EMAIL`, `Phone`
- [ ] CTA link points to `https://kronosautomations.it/#contattaci`
- [ ] Subject line schema in Email Output Parser set to max 50 chars
- [ ] SMS/WhatsApp: verify 160-char limit in output parser schema
