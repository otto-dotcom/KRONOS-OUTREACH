# KRONOS DATABASE SCHEMA (AIRTABLE)

The primary database is hosted on Airtable.

## Table: Leads (Target Table)
This table contains all the Swiss Real Estate prospects.

### Key Fields:
- **FULL NAME**: Name of the contact.
- **company name**: The agency name.
- **City**: Physical location in Switzerland.
- **EMAIL**: Verified contact email.
- **Rank**: Numeric score (0-10) determining lead quality.
- **score_reason**: AI-generated rationale for the rank.
- **EMAIL STATUS**:
    - `Pending`: Not yet processed.
    - `Processing `: Currently being handled.
    - `Sent`: Outreach complete.
    - `Failed `: Error in delivery.
- **EMAIL_SUBJECT**: The subject line sent to the lead.
- **SENT MAIL**: The actual HTML body of the email sent.
- **ORIGINAL_SUBJECT**: The first generated subject before any human edits.
- **ORIGINAL_BODY**: The first generated body before any human edits.

## Table: Settings
Configuration table for system-wide behavior.
- **Key**: String identifier (e.g., `copy_directives`).
- **Value**: Long text containing the configuration data.

## Table: Analytics (Implicit)
Historical data is gathered from the `EMAIL STATUS = "Sent"` filter in the Leads table.
