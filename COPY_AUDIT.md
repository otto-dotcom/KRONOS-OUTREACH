# KRONOS Outreach: Copy & Template Audit

To ensure your n8n deployment is "perfect," here is an audit of the current AI-generated copy and the visual template.

## 1. Visual Identity (The "Pixel-Retro" Template)
I've generated a preview file: `PREVIEW_EMAIL_TEMPLATE.html`. 

**Key Design Elements:**
- **Header**: High-impact 10px orange (#FF6B00) top border.
- **Logo**: Centered, 120px, using `image-rendering: pixelated;` for that sharp KRONOS look.
- **Micro-Copy**: Signature break uses a custom orange dotted line.
- **CTA**: Bold orange link to drive conversion.

---

## 2. Sample Copy Variations (AI Output Test)

The AI is programmed with **"Swiss-Efficiency"** (Direct, professional, value-first). Here are three variations the workflow will generate based on your Airtable data:

### Variation A: Integrated Solution (Priority Score 9-10)
> **Subject**: {AgencyName} | Scalable Lead Infrastructure in {City}
>
> Grüezi {Name},
>
> I noticed {AgencyName} is active in the {City} market. In Switzerland's current competitive landscape, the key to growth is a **predictable and scalable flow of high-quality leads**.
>
> At KRONOS, we don't just find leads; we build high-converting campaigns and custom internal tools tailored specifically for your agency's operations. This ensures you own your technical infrastructure while maintaining a steady pipeline.
>
> Would you like to see how a custom-built tool could scale your lead flow?
>
> [**Explore your scalable lead flow**](https://kronosautomations.it)

### Variation B: General Portfolio (Priority Score 7-8)
> **Subject**: Scaling {AgencyName} via Automated Response
>
> Hello {Name},
>
> I’ve been analyzing {AgencyName}'s presence in the {City} market. As volume increases, response speed becomes your biggest bottleneck. KRONOS solves this by deploying automated response systems that filter and book consultations for your advisors automatically.
>
> Let’s discuss how to stabilize your pipeline.
>
> [**Discuss steady lead flow**](https://kronosautomations.it)

### Variation C: SMS Outreach (Swiss-Standard Tone)
> **Text**: KRONOS: Grüezi {Name}, we build custom lead tools and high-converting campaigns for {AgencyName}. Predictable lead flow for Switzerland. View: https://kronosautomations.it

---

## 3. Final Pre-Flight Checklist
- [ ] **Pixelation**: Ensure `logo.png` is uploaded to your server; otherwise, the image won't render.
- [ ] **Placeholders**: The AI is instructed to use `{Name}` and `{AgencyName}`—ensure these match your Airtable column names exactly.
- [ ] **CTA Link**: Currently points to `kronosautomations.it`. If you have a specific Calendly/n8n form, update the `Email AI Agent` node.
