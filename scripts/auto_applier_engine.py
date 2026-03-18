import os
import json
import time
import requests
from datetime import datetime

# LOAD ENV
PROJECT_ROOT = r'c:\Users\TEMPOCASA\KRONOS\kronosnet\KRONOS-OUTREACH'
ENV_PATH = os.path.join(PROJECT_ROOT, '.env')

def load_env():
    env = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    env[k] = v
    return env

ENV = load_env()
AIRTABLE_PAT = ENV.get('AIRTABLE_PAT')
AIRTABLE_BASE = ENV.get('AIRTABLE_BASE_ID')
AIRTABLE_TABLE = ENV.get('AIRTABLE_TABLE_ID')
OPENROUTER_KEY = ENV.get('OPENROUTER_API_KEY')
BREVO_KEY = ENV.get('BREVO_API_KEY')

def log_applier(msg, success=True):
    color = '\033[92m' if success else '\033[91m'
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {color}[AUTO-APPLIER]\033[0m {msg}")

def get_unapplied_high_scores():
    url = f"https://api.airtable.com/v0/{AIRTABLE_BASE}/{AIRTABLE_TABLE}"
    # Filter for Rank >= 9 and Status != 'Applied'
    params = {
        "filterByFormula": "AND({Rank} >= 9, {EMAIL STATUS} != 'Sent', {EMAIL} != '')",
        "maxRecords": 5
    }
    headers = {"Authorization": f"Bearer {AIRTABLE_PAT}"}
    res = requests.get(url, headers=headers, params=params)
    return res.json().get('records', [])

def generate_cover_email(job_data):
    prompt = f"""
    Write a 4stencence job application.
    Role: {job_data.get('role', 'Developer')}
    Company: {job_data.get('company name', 'Unknown')}
    Tech: {job_data.get('score_reason', 'Full Stack')}
    Persona: Senior Automation Expert.
    Tone: Direct, Swiss-style precision. No fluff.
    """
    
    res = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENROUTER_KEY}"},
        json={
            "model": "openai/gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}]
        }
    )
    return res.json()['choices'][0]['message']['content']

def send_application(email, subject, body):
    url = "https://api.brevo.com/v3/smtp/email"
    payload = {
        "sender": {"name": "Otto (Automated)", "email": "otto@kronosbusiness.com"},
        "to": [{"email": email}],
        "subject": subject,
        "textContent": body
    }
    headers = {"api-key": BREVO_KEY, "Content-Type": "application/json"}
    res = requests.post(url, json=payload, headers=headers)
    return res.status_code == 201

def mark_as_applied(record_id):
    url = f"https://api.airtable.com/v0/{AIRTABLE_BASE}/{AIRTABLE_TABLE}/{record_id}"
    headers = {"Authorization": f"Bearer {AIRTABLE_PAT}", "Content-Type": "application/json"}
    requests.patch(url, headers=headers, json={"fields": {"EMAIL STATUS": "Sent"}})

def run_auto_applier():
    log_applier("Waking up... checking for high-score matches.")
    leads = get_unapplied_high_scores()
    
    if not leads:
        log_applier("No high-confidence matches found this cycle.")
        return

    for lead in leads:
        f = lead['fields']
        log_applier(f"Applying to {f.get('company name')} for {f.get('FULL NAME')}...")
        
        try:
            body = generate_cover_email(f)
            subject = f"Application: Senior Full Stack / Automation - {f.get('company name')}"
            
            if send_application(f.get('EMAIL'), subject, body):
                mark_as_applied(lead['id'])
                log_applier(f"SUCCESS: Application sent to {f.get('EMAIL')}")
            else:
                log_applier(f"FAILED: Email bounce for {f.get('company name')}", False)
        except Exception as e:
            log_applier(f"CRITICAL ERROR: {str(e)}", False)

if __name__ == "__main__":
    run_auto_applier()
