import os
import json
import time
import random
from datetime import datetime

# CONFIG PATHS
PROJECT_ROOT = r'c:\Users\TEMPOCASA\KRONOS\kronosnet\KRONOS-OUTREACH'
SEED_PATH = os.path.join(PROJECT_ROOT, 'scripts', 'platforms_seed.json')
LOG_PATH = os.path.join(PROJECT_ROOT, 'execution', 'scout_log.json')
ENV_PATH = os.path.join(PROJECT_ROOT, '.env')

def log_msg(tag, msg, color='\033[0m'):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {color}[{tag}]\033[0m {msg}")

def run_scout_cycle():
    log_msg("KRONOS", "INITIATING BACKGROUND SCOUT...", '\033[94m')
    
    if not os.path.exists(SEED_PATH):
        log_msg("ERROR", "Seed data missing. Run seed_platforms first.", '\033[91m')
        return

    with open(SEED_PATH, 'r') as f:
        platforms = json.load(f)

    log_msg("SCAN", f"Scanning {len(platforms)} Remote Platforms for fits...", '\033[93m')
    time.sleep(2)  # Artificial lead-in

    # SIMULATION OF MATCHES
    matches = []
    sample_platforms = random.sample(platforms, min(3, len(platforms)))
    
    for platform in sample_platforms:
        log_msg("MATCH", f"Identified High-Value Role on {platform['name']}", '\033[92m')
        matches.append({
            "id": f"job_{int(time.time())}_{random.randint(100,999)}",
            "platform": platform['name'],
            "url": platform['url'],
            "role": "Senior Full Stack / Automation Lead",
            "score": random.randint(85, 98),
            "status": "AI_DRAFTING"
        })

    # Save logs
    existing_logs = []
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH, 'r') as f:
            existing_logs = json.load(f)
    
    existing_logs.extend(matches)
    # Keep last 100
    if len(existing_logs) > 100:
        existing_logs = existing_logs[-100:]

    with open(LOG_PATH, 'w') as f:
        json.dump(existing_logs, f, indent=2)

    log_msg("DONE", f"Cycle complete. {len(matches)} new leads pushed to pipeline.", '\033[96m')
    log_msg("IDLE", "Scout agent sleeping (15s for demo loop)...", '\033[90m')

if __name__ == "__main__":
    # For the user demo, let's run it 2 times then exit, normally it's a while True
    for _ in range(2):
        run_scout_cycle()
        time.sleep(15)
