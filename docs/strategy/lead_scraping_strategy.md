# KRONOS Elite Lead Scraper Strategy
Version: 1.3
Status: HIGH-PERFORMANCE

## Goal
A "Phantom" lead ingestion system capable of bypassing advanced bot detection and prioritizing high-net-worth real estate agencies.

## Anti-Detection Protocol
1. **User-Agent Rotation**: Every request must cycle through a library of 50+ modern browser User-Agents (Mac, Windows, Mobile).
2. **Proxies**: Header-based proxy rotation to prevent IP-based blacklisting on Swiss portals.
3. **Human-Mimicry**: The scraping intervals must be randomized and staggered (not a static 02:00 trigger).

## Lead Scoring Logic (The "Whale" Filter)
Before insertion, the AI must score leads from 1-10 based on:
- **Inventory Size**: Number of active listings found.
- **Portofolio Quality**: Luxury vs. Standard tier.
- **Brand Presence**: Well-known regional brands get +2 points.
Only leads scoring >7 are labeled `PRIORITY`.

## The "Global" Expansion
- **Source Agnostic**: The parser is instructed to handle ANY Swiss portal structure by identifying patterns (DOM-agnostic).
- **Secondary Enrichment**: If a lead is a "Whale", trigger a secondary search for the CEO's direct office number.

## Definition of Done
- No "403 Forbidden" errors for 100+ consecutive scrapes.
- Database contains a `lead_score` field for every row.
- Priority leads are tagged for specialized "Executive" outreach.
