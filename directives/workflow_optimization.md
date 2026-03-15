# KRONOS Workflow Optimization SOP
Version: 2.0
Status: ACTIVE

## Goal
To maintain a high-volume, self-healing outreach workflow in n8n that processes real estate leads with deterministic quality.

## Inputs
- `KRONOS_CAMPAIGN.json`: The campaign workflow definition.
- `config/industries/*.json`: Industry-specific scraping and scoring config.

## Process
1. **Import**: Use `scripts/n8n_api_manager.py --import-all` or n8n UI to import workflows.
2. **Configure**: Assign credentials in n8n (Apify, OpenRouter, Airtable, Brevo, WhatsApp).
3. **Validate**: Use n8n MCP `validate_workflow` to check for errors before activation.
4. **Test**: Run manually once via n8n UI to verify the full pipeline.

## Definition of Done
- Workflow contains the `Error Trigger` and error notification logic.
- AI scoring prompts use the latest criteria from `swiss_realestate.json`.
- All credential placeholders are replaced with real n8n credential IDs.
