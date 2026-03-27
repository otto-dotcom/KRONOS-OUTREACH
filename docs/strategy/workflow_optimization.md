# KRONOS Workflow Optimization SOP
Version: 1.0
Status: ACTIVE

## Goal
To maintain a high-volume, self-healing outreach workflow in n8n that processes real estate leads with deterministic quality.

## Inputs
- `n8n Workflow JSON`: The raw workflow structure.
- `Dynamic Config`: Supabase table `campaign_config` for orchestrating settings.

## Tools
- `execution/perfect_workflow.py`: The deterministic script for JSON injection.

## Process
1. **Fetch**: Always pull the latest legacy or perfected JSON version.
2. **Inject**: Run `perfect_workflow.py` to ensure the latest AI prompts and error-handling nodes are present.
3. **Verify**: Check that all nodes (SendGrid, Twilio, Supabase) have the correct mapping.

## Definition of Done
- JSON contains the `Error Trigger` and `Self-Healing` logic.
- AI Agent prompts use the latest **Email Outreach Strategy**.
- File is saved as `KRONOS_V2_PERFECTED.json`.
