# KRONOS Deployment Checklist (Hostinger VPS)

Follow these steps to set up your KRONOS-OUTREACH automated system on Hostinger.

## 1. Infrastructure Setup
- [ ] **Purchase VPS**: Sign up for Hostinger VPS (KVM 2 plan recommended).
- [ ] **OS Selection**: Select Ubuntu 22.04 as your operating system.
- [ ] **DNS Configuration**:
    - [ ] Locate your VPS IP address in the Hostinger dashboard.
    - [ ] Add an **A record** in your domain's DNS settings (e.g., `n8n.yourdomain.com`) pointing to the VPS IP.

## 2. API & Data Preparation
- [ ] **Airtable**:
    - [ ] Set up your Lead CRM base.
    - [ ] **Required Fields (Columns)**:
        - `company name` (Single line text)
        - `EMAIL` (Email)
        - `Phone` (Phone number)
        - `URL` (URL)
        - `City` (Single line text)
        - `EMAIL STATUS` (Single line text)
        - `sms status` (Single line text)
        - `Rank` (Number)
        - `score_reason` (Long text)
        - `lead_status` (Single line text)
        - `scraped_at` (Date/Time)
    - [ ] Obtain your **Base ID** and **Table ID/Name**.
    - [ ] Create a [Personal Access Token](https://airtable.com/create/tokens) with `data.records:read` and `data.records:write` scopes.
- [ ] **Data Sources**:
    - [ ] **Apify**: Copy your API Token from [Apify Console](https://console.apify.com/account/integrations).
    - [ ] **OpenRouter**: Create an API Key at [OpenRouter](https://openrouter.ai/keys) for GPT-4o-mini access.
- [ ] **Outreach Channels**:
    - [ ] **Twilio**: Get your Account SID, Auth Token, and a valid Send Number.
    - [ ] **SendGrid**: Create an API Key and verify your "Sender Identity".

## 3. Server Deployment
- [ ] **SSH Access**: Connect to your VPS via terminal: `ssh root@your-vps-ip`.
- [ ] **Prepare Setup Script**:
    - [ ] Copy the contents of `scripts/setup_vps.sh` to the server.
    - [ ] Make it executable: `chmod +x setup_vps.sh`.
- [ ] **Execute Setup**:
    - [ ] Run `./setup_vps.sh`.
    - [ ] Enter your Domain, Admin Username, and Password when prompted.
- [ ] **Verify Services**:
    - [ ] Visit `https://your-n8n-domain.com`.
    - [ ] Confirm SSL is active (lock icon in browser).

## 4. n8n Workflow Configuration
- [ ] **Credentials**: In n8n, go to "Credentials" and add:
    - [ ] Airtable Token API
    - [ ] Apify API
    - [ ] OpenRouter (via HTTP Header Auth)
    - [ ] Twilio API
    - [ ] SendGrid API
- [ ] **Import Workflows**:
    - [ ] Import `workflows/universal_scraper.json`.
    - [ ] Import `workflows/universal_scorer.json`.
    - [ ] Import `KRONOS_V2_PERFECTED.json`.
- [ ] **Environment Variables**:
    - [ ] In n8n, configure Global Variables or individual node parameters for `AIRTABLE_BASE_ID` and `AIRTABLE_TABLE_ID`.

## 5. Testing & Validation
- [ ] **Scraper Test**: Manually trigger the "Schedule Trigger" or "HTTP Request" in the scraper workflow.
- [ ] **Airtable Sync**: Check if new leads appear in your Airtable base.
- [ ] **Scoring Test**: Run the scorer workflow and verify the "Rank" field updates in Airtable.
- [ ] **End-to-End**: Trigger a test outreach to your own number/email.
