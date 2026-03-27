import os
import requests
import json
import re
from datetime import datetime

# CONFIGURATION
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CONFIG_PATH = os.path.join(PROJECT_ROOT, 'scripts', 'config', 'industries', 'swiss_realestate.json')
ENV_PATH = os.path.join(PROJECT_ROOT, '.env')

def load_env():
    env = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    env[k] = v.strip('"').strip("'")
    return env

ENV = load_env()
APIFY_KEY = ENV.get('APIFY_API_KEY')
AIRTABLE_PAT = ENV.get('AIRTABLE_PAT') or ENV.get('AIRTABLE_API_KEY')
AIRTABLE_BASE = ENV.get('AIRTABLE_BASE_ID')
AIRTABLE_TABLE = ENV.get('AIRTABLE_TABLE_ID')

def log(msg, level='INFO'):
    colors = {'INFO': '\033[96m', 'SUCCESS': '\033[92m', 'WARN': '\033[93m', 'ERROR': '\033[91m'}
    color = colors.get(level, '')
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {color}[LEAD-GEN]\033[0m {msg}")

def extract_phone(text):
    if not text: return None
    # Match Swiss formats: 079 123 45 67, +41 79..., 044...
    match = re.search(r'(\+41|0041|0)[0-9\s]{8,15}', text)
    return match.group(0).strip() if match else None

def get_nested(data, paths):
    for path in paths:
        parts = path.split('.')
        current = data
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                current = None
                break
        if current: return current
    return None

def fetch_apify_dataset(actor_id, input_data):
    log(f"Triggering {actor_id}...")
    url = f"https://api.apify.com/v2/acts/{actor_id}/runs?token={APIFY_KEY}"
    res = requests.post(url, json=input_data)
    if res.status_code != 201:
        log(f"Failed to start: {res.text}", 'ERROR')
        return []

    run_id = res.json()['data']['id']
    log(f"Run {run_id} started. Polling for results...")
    
    # Wait for completion (simple loop for CLI usage)
    import time
    dataset_url = f"https://api.apify.com/v2/runs/{run_id}/dataset/items?token={APIFY_KEY}"
    for _ in range(60): # 10 mins max
        res = requests.get(dataset_url)
        if res.status_code == 200 and len(res.json()) > 0:
            return res.json()
        time.sleep(10)
    
    return []

def main():
    if not os.path.exists(CONFIG_PATH):
        log(f"Missing config at {CONFIG_PATH}", 'ERROR')
        return

    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)

    log(f"Starting lead generation for: {config['display_name']}")
    
    all_leads = []
    
    for source in config['data_sources']:
        if source.get('enabled') == False: continue
        
        # Trigger or Mock? Currently we trigger if API key is present
        items = []
        if APIFY_KEY:
            items = fetch_apify_dataset(source['actor_id'], source['input'])
        else:
            log(f"APIFY_API_KEY missing, skipping actual scrape for {source['name']}", 'WARN')
            continue

        log(f"Processing {len(items)} items from {source['name']}...")
        
        mapping = source['field_mapping']
        for item in items:
            name = get_nested(item, mapping['company_name'])
            email = get_nested(item, mapping['email'])
            phone = get_nested(item, mapping['phone'])
            url = get_nested(item, mapping['url'])
            city = get_nested(item, mapping['city'])
            
            # Contact recovery from description
            desc = get_nested(item, ['listing.localization.de.text.description', 'description'])
            if not phone: phone = extract_phone(desc)
            
            if not name or name == 'Unknown': continue
            if not email and not phone: continue # Need at least one way to reach them
            
            lead = {
                "company name": name.strip().title(),
                "EMAIL": email.lower().strip() if email else "",
                "Phone": phone.strip() if phone else "",
                "URL": url,
                "City": city or "Switzerland",
                "lead_source": source['name'],
                "scraped_at": datetime.now().isoformat()
            }
            all_leads.append(lead)

    log(f"Found {len(all_leads)} valid leads. Syncing to Airtable...")
    
    # Sync with deduplication
    headers = {"Authorization": f"Bearer {AIRTABLE_PAT}", "Content-Type": "application/json"}
    airtable_url = f"https://api.airtable.com/v0/{AIRTABLE_BASE}/{AIRTABLE_TABLE}"
    
    count = 0
    for lead in all_leads:
        # Check existing
        search_query = f"OR(URL='{lead['URL']}', LOWER({{company name}})='{lead['company name'].lower()}')"
        search_url = f"{airtable_url}?filterByFormula={search_query}"
        check = requests.get(search_url, headers=headers).json()
        
        if check.get('records'):
            log(f"SKIP: {lead['company name']} (Already exists)")
            continue
            
        res = requests.post(airtable_url, headers=headers, json={"fields": lead})
        if res.status_code == 200:
            log(f"CREATED: {lead['company name']}", 'SUCCESS')
            count += 1
            
    log(f"Finished. Total new leads: {count}")

if __name__ == "__main__":
    main()
