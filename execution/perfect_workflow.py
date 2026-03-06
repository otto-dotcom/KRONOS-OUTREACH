
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
SMS_SYSTEM_PROMPT = """You are a cold outreach specialist writing SMS/WhatsApp messages for KRONOS Automations.
KRONOS helps Swiss real estate agencies stop losing leads to slow manual follow-up.

GOAL: Write a single message (max 160 characters) that sounds like a real person, not a marketing blast.

TARGET DATA:
<LEAD_DATA>
{{ JSON.stringify($json) }}
</LEAD_DATA>

RULES:
1. Start with the lead's first name if available: "{Name},"
2. Mention ONE specific pain — leads going cold, slow follow-up, time wasted on unqualified calls
3. Hint at the solution without over-explaining
4. CTA: Ask them to reply (Reply YES / Reply SI) or visit https://kronosautomations.it/#contattaci
5. NEVER start with the brand name — do not open with "KRONOS:"
6. NO buzzwords: no "scalable", "predictable flow", "infrastructure", "INITIALIZE LEAD FLOW"
7. Tone: Direct, human, slightly urgent — like a colleague who spotted a problem

GOOD EXAMPLES:
- "{Name}, your team is probably losing 30% of leads to slow follow-up. We can automate that. Worth a 10min call? kronosautomations.it"
- "Quick question {Name} — how does {AgencyName} handle leads after hours? Reply YES to see how top {City} agencies automate it."

Response MUST be ONLY JSON: {"smsText": "..."}"""

EMAIL_SYSTEM_PROMPT = """You are a cold email specialist writing on behalf of KRONOS Automations.
KRONOS helps Swiss real estate agencies automate their lead follow-up and client acquisition.

GOAL: Write a short, direct cold email (4-5 sentences max) that feels like it came from a real person, not a marketing department.

TARGET DATA:
Analyze the lead JSON below to understand the prospect.
<LEAD_DATA>
{{ JSON.stringify($json) }}
</LEAD_DATA>

CONTENT PROTOCOL:
1. HOOK: Start with a specific observation or pointed question about their business. Use agency name, city, or any metric you find in the data. NEVER start with "I noticed you're active in [city]" — it's obviously automated.
2. PROBLEM: Name one specific pain — losing warm leads due to slow follow-up, advisors wasting time on unqualified contacts, inconsistent pipeline.
3. SOLUTION: One sentence. KRONOS automates first contact and qualification so their consultants only deal with ready-to-move buyers and sellers.
4. CTA: Low-friction close — "Worth 15 minutes this week?" or "Curious to see the numbers?"

TONE:
- Direct and professional (Swiss business culture values directness)
- Conversational, not corporate
- NO buzzwords: never use "scalable", "synergy", "leverage", "infrastructure", "optimize", "ecosystem"
- NO ALL CAPS words, NO exclamation marks
- Greet with "Grüezi {Name}," if name is available, otherwise "Hello,"

SUBJECT LINE RULES:
- Max 50 characters
- Lowercase preferred (feels personal, not promotional)
- Good patterns: "{Name} — quick question", "agencies in {City} are closing more", "{AgencyName} | lead follow-up gap"
- NEVER use: "Scalable", "Infrastructure", "Automated Response", "INITIALIZE", all-caps words

VISUAL BRANDING (HTML email):
- LOGO at the very top:
  <div style="text-align: center; padding: 20px 0;">
    <img src="https://kronosautomations.it/logo.png" alt="KRONOS" width="120" style="image-rendering: pixelated;">
  </div>
- CONTAINER: max-width: 550px; margin: auto; padding: 30px; border: 2px solid #1A1A1A; border-top: 10px solid #FF6B00; font-family: 'Inter', sans-serif; color: #1A1A1A; line-height: 1.6;
- Use <p> tags only. Keep HTML clean.
- CTA: Orange (#FF6B00) bold link — label "See how it works →" — pointing to https://kronosautomations.it/#contattaci
- SIGNATURE:
  <div style="border-top: 2px dotted #FF6B00; margin-top: 25px; padding-top: 10px; font-size: 14px;">
    <strong>KRONOS Strategic Partner</strong><br>
    Swiss Real Estate Automation<br>
    <a href="mailto:consulting@kronosautomations.it" style="color: #FF6B00; text-decoration: none;">consulting@kronosautomations.it</a>
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
            "id": "YOUR_AIRTABLE_CREDENTIAL_ID",
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

# Migrate model nodes from OpenRouter to Ollama
OLLAMA_NODE_TEMPLATE = {
    "type": "@n8n/n8n-nodes-langchain.lmChatOllama",
    "typeVersion": 1,
    "parameters": {"model": "llama3.2", "options": {}},
    "credentials": {"ollamaApi": {"id": "YOUR_OLLAMA_CREDENTIAL_ID", "name": "Ollama account"}}
}
MODEL_RENAMES = {
    "OpenRouter Model for SMS1": "Ollama Model for SMS",
    "OpenRouter Model for Email": "Ollama Model for Email",
}
for node in workflow['nodes']:
    if node['name'] in MODEL_RENAMES:
        old_name = node['name']
        new_name = MODEL_RENAMES[old_name]
        node['name'] = new_name
        node.update(OLLAMA_NODE_TEMPLATE)
        if old_name in workflow['connections']:
            workflow['connections'][new_name] = workflow['connections'].pop(old_name)
        print(f"Migrated '{old_name}' → '{new_name}' (Ollama llama3.2)")

# Migration to WhatsApp API
for node in workflow['nodes']:
    if node['type'] == 'n8n-nodes-base.twilio' and node.get('parameters', {}).get('operation') == 'send':
        params = node['parameters']
        # If they aren't already prefixed with whatsapp:
        if 'to' in params and not str(params['to']).startswith('whatsapp:'):
            params['to'] = f"whatsapp:{params['to']}"
        if 'from' in params and not str(params['from']).startswith('whatsapp:'):
            params['from'] = f"whatsapp:{params['from']}"
        print(f"Migrated Twilio node '{node['name']}' to WhatsApp format.")

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
