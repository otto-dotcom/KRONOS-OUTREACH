
import json
import uuid

# Paths
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
input_path = os.path.join(BASE_DIR, "KRONOS_V1_LEGACY.json")
output_path = os.path.join(BASE_DIR, "KRONOS_V2_PERFECTED.json")

with open(input_path, 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# --- CONFIGURATION & HELPERS ---
def get_node(name):
    return next((n for n in workflow['nodes'] if n['name'] == name), None)

def add_node(node):
    workflow['nodes'].append(node)
    return node['id']

# --- PRE-DEFINED PREMIUM PROMPTS ---
SMS_SYSTEM_PROMPT = """You are a Senior SMS Strategic Advisor at KRONOS Automations.
We assist Swiss real estate professionals with automated lead responses.

GOAL: Write a short (max 160 chars), personalized SMS.
- Focus: Immediate response and link to the lead gen calendar.
- Tone: Swiss-Standard (Direct, professional, respectful).
- Response MUST be ONLY JSON: {"smsText": "..."}"""

EMAIL_SYSTEM_PROMPT = """You are a Senior Strategic Growth Partner at KRONOS Automations.
We deliver steady lead flow and qualified consultations for elite Swiss real estate firms.

GOAL: Write a short, high-impact executive email (max 4-5 sentences) featuring the official KRONOS pixel-retro branding and LOGO.

CONTENT PROTOCOL:
1. PUNCHY HOOK: Reference 'company name' and the Swiss real estate market.
2. THE PROPOSITION: Focus on "Steady Sales" and predictable listings via automated lead systems.
3. TONE: Swiss-Efficiency (Ultra-direct, professional, value-first).

VISUAL BRANDING (KRONOS PIXEL-STYLE):
- LOGO: You MUST include the following logo at the VERY TOP:
  <div style="text-align: center; padding: 20px 0;">
    <img src="https://kronosautomations.it/logo.png" alt="KRONOS" width="120" style="image-rendering: pixelated;">
  </div>
- CONTAINER: max-width 550px; margin: auto; padding: 30px; border: 2px solid #1A1A1A; border-top: 10px solid #FF6B00; font-family: 'Inter', sans-serif;
- ACCENTS: Use an orange (#FF6B00) pixel-style dotted line for the signature break.
- CTA: An orange (#FF6B00) bolded text link: "Discuss steady lead flow"

HTML STRUCTURE:
- Use <p> only. Keep it clean.
- SIGNATURE: 
  <div style="border-top: 2px dotted #FF6B00; margin-top: 25px; padding-top: 10px; font-size: 14px;">
    <strong>KRONOS Strategic Partner</strong><br>
    The Standard in Swiss Real Estate Automation
  </div>

Response MUST be ONLY JSON: {"subject": "...", "emailBody": "..."}"""

# --- NEW NODES ---

# 1. Error Trigger
error_trigger_id = str(uuid.uuid4())
error_trigger = {
    "parameters": {},
    "id": error_trigger_id,
    "name": "Error Trigger",
    "type": "n8n-nodes-base.errorTrigger",
    "typeVersion": 1,
    "position": [500, 7500]
}

# 2. Update Airtable - FAILED
airtable_fail_id = str(uuid.uuid4())
airtable_fail = {
    "parameters": {
        "operation": "update",
        "base": "={{ $('Workflow Configuration1').first().json.airtableBaseId }}",
        "table": "={{ $('Workflow Configuration1').first().json.airtableTableId }}",
        "columns": {
            "mappingMode": "defineBelow",
            "value": {
                "id": "={{ $node[\"Error Trigger\"].json.execution.id }}",
                "STATUS": "FAILED",
                "ERROR_LOG": "={{ $node[\"Error Trigger\"].json.error.message }}"
            },
            "matchingColumns": ["id"]
        }
    },
    "id": airtable_fail_id,
    "name": "Airtable - Mark Failed",
    "type": "n8n-nodes-base.airtable",
    "typeVersion": 2.1,
    "position": [800, 7500],
    "credentials": {
        "airtableTokenApi": {
            "id": "AtP2rrGrxZ5FHBNZ",
            "name": "Airtable Personal Access Token account"
        }
    }
}

# 3. Supabase - Unlock Lead
supabase_unlock_id = str(uuid.uuid4())
supabase_unlock = {
    "parameters": {
        "operation": "update",
        "tableId": "leads",
        "matchColumn": "airtable_id",
        "values": {
            "values": [
                {"column": "status", "value": "READY_RETRY"}
            ]
        }
    },
    "id": supabase_unlock_id,
    "name": "Supabase - Release Lock",
    "type": "n8n-nodes-base.supabase",
    "typeVersion": 1,
    "position": [1000, 7500],
    "credentials": {
        "supabaseApi": {
            "id": "YOUR_SUPABASE_CREDENTIAL_ID",
            "name": "Supabase account"
        }
    }
}

# --- ASSEMBLY ---

# Add new nodes
add_node(error_trigger)
add_node(airtable_fail)
add_node(supabase_unlock)

# Connect Error Handler path
workflow['connections']['Error Trigger'] = {
    "main": [[{"node": "Airtable - Mark Failed", "type": "main", "index": 0}]]
}
workflow['connections']['Airtable - Mark Failed'] = {
    "main": [[{"node": "Supabase - Release Lock", "type": "main", "index": 0}]]
}

# --- UPDATE EXISTING NODES ---

# Update AI Agent Prompts to "Perfected" versions
sms_agent = get_node('AI Agent')
if sms_agent:
    sms_agent['parameters']['options']['systemMessage'] = SMS_SYSTEM_PROMPT
    print("Perfected SMS AI Agent Prompt")

email_agent = get_node('Email AI Agent')
if email_agent:
    email_agent['parameters']['options']['systemMessage'] = EMAIL_SYSTEM_PROMPT
    print("Perfected Email AI Agent Prompt")

# Insertion logic (Campaign config & Locking)
webhook = get_node('Webhook')
config_node = get_node('Workflow Configuration1')
split_leads = get_node('Split Leads1')
check_mobile = get_node('Check if Mobile Number')

# 1. Webhook -> Supabase Config -> Config Node
# (Assuming we insert Get Config node)
get_config_id = str(uuid.uuid4())
get_config = {
    "parameters": {
        "operation": "get",
        "tableId": "campaign_config",
        "rowId": "current_prod"
    },
    "id": get_config_id,
    "name": "Fetch Dynamic Config",
    "type": "n8n-nodes-base.supabase",
    "typeVersion": 1,
    "position": [1150, 6752],
    "credentials": { "supabaseApi": { "id": "YOUR_SUPABASE_CREDENTIAL_ID", "name": "Supabase" } }
}
add_node(get_config)

# Rewire Webhook
if 'Webhook' in workflow['connections']:
    workflow['connections']['Webhook']['main'][0] = [{"node": "Fetch Dynamic Config", "type": "main", "index": 0}]

workflow['connections']['Fetch Dynamic Config'] = {
    "main": [[{"node": "Workflow Configuration1", "type": "main", "index": 0}]]
}

# 1. Get Leads -> Split In Batches -> Split Leads
batch_node_id = str(uuid.uuid4())
batch_node = {
    "parameters": {
        "batchSize": 50,
        "options": {}
    },
    "id": batch_node_id,
    "name": "Batch Leads (Volume)",
    "type": "n8n-nodes-base.splitInBatches",
    "typeVersion": 3,
    "position": [1600, 6752]
}
add_node(batch_node)

# Rewire Airtable to Batch
airtable_node = get_node('Get Leads from Airtable1')
if 'Get Leads from Airtable1' in workflow['connections']:
    workflow['connections']['Get Leads from Airtable1']['main'][0] = [{"node": "Batch Leads (Volume)", "type": "main", "index": 0}]

# Connect Batch to Split
workflow['connections']['Batch Leads (Volume)'] = {
    "main": [
        [{"node": "Split Leads1", "type": "main", "index": 0}]
    ]
}

# 2. Split Leads -> Lock Lead -> Wait -> Check Mobile
lock_lead_id = str(uuid.uuid4())
lock_lead = {
    "parameters": {
        "operation": "update",
        "tableId": "leads",
        "matchColumn": "airtable_id",
        "values": { "values": [{"column": "status", "value": "IN_PROGRESS"}] }
    },
    "id": lock_lead_id,
    "name": "Lock Lead Status",
    "type": "n8n-nodes-base.supabase",
    "typeVersion": 1,
    "position": [1850, 6752],
    "credentials": { "supabaseApi": { "id": "YOUR_SUPABASE_CREDENTIAL_ID", "name": "Supabase" } }
}
add_node(lock_lead)

# 3. Add Wait Node (Anti-Rate Limit)
wait_node_id = str(uuid.uuid4())
wait_node = {
    "parameters": {
        "amount": "={{ Math.floor(Math.random() * 4) + 2 }}",
        "unit": "seconds"
    },
    "id": wait_node_id,
    "name": "Anti-Rate Limit Wait",
    "type": "n8n-nodes-base.wait",
    "typeVersion": 1,
    "position": [2000, 6752]
}
add_node(wait_node)

if 'Split Leads1' in workflow['connections']:
    workflow['connections']['Split Leads1']['main'][0] = [{"node": "Lock Lead Status", "type": "main", "index": 0}]

workflow['connections']['Lock Lead Status'] = {
    "main": [[{"node": "Anti-Rate Limit Wait", "type": "main", "index": 0}]]
}

workflow['connections']['Anti-Rate Limit Wait'] = {
    "main": [[{"node": "Check if Mobile Number", "type": "main", "index": 0}]]
}

# Save Result
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, indent=2)

print(f"Perfected KRONOS workflow saved to {output_path}")
