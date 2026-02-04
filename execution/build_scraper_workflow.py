import json
import uuid
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
output_path = os.path.join(BASE_DIR, "KRONOS_LEAD_SCRAPER_V1.json")

# Elite Swiss Scraper Builder
workflow = {
    "name": "KRONOS Elite Swiss Scraper (High-Performance)",
    "nodes": [],
    "connections": {},
    "settings": { "executionOrder": "v1" }
}

def add_node(node):
    workflow['nodes'].append(node)
    return node['name']

# 1. Randomized Trigger - To avoid static detection patterns
add_node({
    "parameters": {
        "rule": { "interval": [{ "field": "minutes", "value": "={{ Math.floor(Math.random() * 60) }}" }] }
    },
    "id": str(uuid.uuid4()),
    "name": "Randomized Trigger",
    "type": "n8n-nodes-base.scheduleTrigger",
    "typeVersion": 1,
    "position": [400, 600]
})

# 2. User-Agent Rotator
ua_node = {
    "parameters": {
        "jsCode": """const uas = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
];
return { 
    userAgent: uas[Math.floor(Math.random() * uas.length)],
    timestamp: new Date().toISOString()
};"""
    },
    "id": str(uuid.uuid4()),
    "name": "User-Agent Rotator",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [600, 600]
}
add_node(ua_node)

# 3. Scrape - With Rotated Headers
add_node({
    "parameters": { 
        "url": "https://www.immoscout24.ch/en/real-estate/buy/city-lugano",
        "headerParameters": {
            "parameters": [
                { "name": "User-Agent", "value": "={{ $node[\"User-Agent Rotator\"].json.userAgent }}" }
            ]
        },
        "options": { "retry": { "count": 5, "delay": 10000 } }
    },
    "id": str(uuid.uuid4()),
    "name": "Fetch ImmoScout24 (Anti-Bot)",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [800, 600]
})

# 4. AI Elite Parser & Scorer
parsing_prompt = """Extract ALL real estate agencies from this Swiss data. 
FOR EACH LEAD, CALCULATE A 'LEAD_SCORE' (1-10) BASED ON:
- Brand recognizable in Switzerland (+2)
- High inventory / Luxury listings (+3)
- Commercial/Office focus (+2)
- Completeness of contact info (+3)

EXTRACT: AgencyName, LeadScore, Sector (Luxury/Standard/Commercial), City, Phone.
Return as a clean JSON ARRAY."""

add_node({
    "parameters": {
        "options": { "systemMessage": parsing_prompt }
    },
    "id": str(uuid.uuid4()),
    "name": "AI Elite Parser & Scorer",
    "type": "@n8n/n8n-nodes-langchain.agent",
    "typeVersion": 1.6,
    "position": [1050, 600]
})

# 5. Storage - Priority Upsert
add_node({
    "parameters": {
        "operation": "upsert",
        "tableId": "leads",
        "matchColumn": "url",
        "values": {
            "values": [
                { "column": "company_name", "value": "={{ $json.AgencyName }}" },
                { "column": "lead_score", "value": "={{ $json.LeadScore }}" },
                { "column": "sector", "value": "={{ $json.Sector }}" },
                { "column": "status", "value": "={{ $json.LeadScore > 7 ? 'PRIORITY' : 'READY_TO_PROCESS' }}" }
            ]
        }
    },
    "id": str(uuid.uuid4()),
    "name": "Supabase - Elite Upsert",
    "type": "n8n-nodes-base.supabase",
    "typeVersion": 1,
    "position": [1300, 600],
    "credentials": { "supabaseApi": { "id": "YOUR_CREDENTIALS", "name": "Supabase" } }
})

# Connect Linear Flow
workflow['connections'] = {
    "Randomized Trigger": { "main": [[{ "node": "User-Agent Rotator", "type": "main", "index": 0 }]] },
    "User-Agent Rotator": { "main": [[{ "node": "Fetch ImmoScout24 (Anti-Bot)", "type": "main", "index": 0 }]] },
    "Fetch ImmoScout24 (Anti-Bot)": { "main": [[{ "node": "AI Elite Parser & Scorer", "type": "main", "index": 0 }]] },
    "AI Elite Parser & Scorer": { "main": [[{ "node": "Supabase - Elite Upsert", "type": "main", "index": 0 }]] }
}

with open(output_path, "w", encoding='utf-8') as f:
    json.dump(workflow, f, indent=2)

print(f"Elite Swiss Scraper JSON generated at {output_path}")
