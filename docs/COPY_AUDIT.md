# KRONOS Outreach: Copy & Template Audit (Lead Gen Focus)

## 1. Visual Identity (The "Pixel-Retro" Template)
Preview file: `PREVIEW_EMAIL_TEMPLATE.html`

**Key Design Elements:**
- **Header**: 10px orange (#FF6B00) top border
- **Logo**: Centered, 120px, `image-rendering: pixelated`
- **Signature separator**: Orange dotted line
- **CTA**: Bold orange link "See our acquisition model →"

---

## 2. Email Copy — Perfected Variants (Focus: Objektakquise & Mandates)

### Variant A: Primary Objective (Score 8–10)
> **Subject**: `{Name} — quick question about mandate acquisition at {AgencyName}`
>
> Grüezi {Name},
>
> Quick question: how many new Verkaufsmandate (sales mandates) is {AgencyName} targeting this quarter?
>
> Most agencies in {City} rely too heavily on referrals and traditional networking, leaving them vulnerable to market shifts. Predictable growth requires predictable pipeline generation.
>
> We build automated, data-driven systems that generate exclusive seller leads (Objektakquise) so your consultants spend their time closing mandates, not prospecting for them.
>
> Worth 15 minutes this week to discuss a scalable acquisition model?
>
> [**See our acquisition model →**](https://kronosautomations.com/#contattaci)

### Variant B: Problem-first / Competition (Score 6–7)
> **Subject**: `how {City} agencies are scaling their Objektakquise`
>
> Grüezi {Name},
>
> I've been speaking with managing directors across {City} about one specific bottleneck: inconsistent seller lead generation.
>
> The agencies winning the most mandates right now aren't just working harder—they have systems that actively identify and acquire off-market opportunities before they hit the open market.
>
> We set up the infrastructure to automate your Objektakquise, delivering a steady stream of qualified sellers directly to your team.
>
> Curious to see how we do this for agencies like {AgencyName}?
>
> [**See our acquisition model →**](https://kronosautomations.com/#contattaci)

### Variant C: Data hook (use when city/metrics available in lead data)
> **Subject**: `{AgencyName} | predictable lead generation`
>
> Grüezi {Name},
>
> One quick stat: agencies relying solely on referrals in {City} see a 40% higher fluctuation in their annual revenue compared to those with active acquisition systems.
>
> KRONOS shifts that dynamic. We implement automated lead generation workflows designed specifically for Swiss real estate to capture new Verkaufsmandate predictably.
>
> If scaling your mandate pipeline is a priority this year, is it worth a 15-minute demo?
>
> [**See our acquisition model →**](https://kronosautomations.com/#contattaci)

---

## 3. WhatsApp/SMS Copy — Perfected Variants

### Primary (under 160 chars)
```
{Name}, relying on referrals for new mandates is risky. We automate seller lead generation for {City} agencies. Worth 10 mins? kronosautomations.com
```

### High-score leads (score ≥ 8)
```
{Name} — quick question: how is {AgencyName} proactively scaling its Objektakquise? Reply YES to see how top {City} agencies automate mandate generation.
```

### Fallback (sparse lead data)
```
Quick question {Name} — is {AgencyName} looking to predictably scale new mandates? We automate lead gen for real estate. Reply YES for a quick demo.
```

---

## 4. Subject Line Cheatsheet

| Pattern | Example | Use case |
|---------|---------|----------|
| `{Name} — mandate acquisition at...` | `Marco — mandate acquisition at Müller Immo` | High personalization |
| `how {City} agencies scale...` | `how Zurich agencies scale Objektakquise` | Social proof angle |
| `{AgencyName} \| predictable lead...` | `Müller Immobilien \| predictable lead generation` | Problem-specific |
| `scaling your Verkaufsmandate` | `scaling your Verkaufsmandate` | Direct approach |

**Never use:** "Scalable", "Infrastructure", "INITIALIZE LEAD FLOW", all-caps words, exclamation marks

---

## 5. Pre-Flight Checklist
- [ ] Logo `logo.png` is live at `https://kronosautomations.com/logo.png`
- [ ] Lead data fields match: `FULL NAME`, `company name`, `City`, `EMAIL`, `Phone`
- [ ] CTA link points to `https://kronosautomations.com/#contattaci`
- [ ] Subject line schema in Email Output Parser set to max 50 chars
- [ ] SMS/WhatsApp: verify 160-char limit in output parser schema
