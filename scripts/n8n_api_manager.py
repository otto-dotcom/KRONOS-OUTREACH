import os
import requests
import json
import time

class N8nManager:
    def __init__(self, base_url, api_key):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'X-N8N-API-KEY': api_key,
            'Content-Type': 'application/json'
        }

    def list_workflows(self):
        """List all workflows on the n8n instance."""
        url = f"{self.base_url}/api/v1/workflows"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()['data']

    def import_workflow(self, workflow_json_path):
        """Import a workflow from a JSON file."""
        with open(workflow_json_path, 'r') as f:
            workflow_data = json.load(f)
        
        url = f"{self.base_url}/api/v1/workflows"
        response = requests.post(url, headers=self.headers, json=workflow_data)
        response.raise_for_status()
        print(f"Imported workflow: {workflow_data.get('name')} (ID: {response.json()['id']})")
        return response.json()

    def activate_workflow(self, workflow_id):
        """Activate a workflow."""
        url = f"{self.base_url}/api/v1/workflows/{workflow_id}/activate"
        response = requests.post(url, headers=self.headers)
        response.raise_for_status()
        print(f"Activated workflow ID: {workflow_id}")
        return response.json()

    def deactivate_workflow(self, workflow_id):
        """Deactivate a workflow."""
        url = f"{self.base_url}/api/v1/workflows/{workflow_id}/deactivate"
        response = requests.post(url, headers=self.headers)
        response.raise_for_status()
        print(f"Deactivated workflow ID: {workflow_id}")
        return response.json()

    def execute_workflow(self, webhook_path):
        """Trigger a workflow via its Webhook URL."""
        # Public API v1 doesn't have a direct /run endpoint.
        # This helper assumes the workflow has a Webhook node.
        # You should provide the full webhook URL or just the path if base_url is known.
        url = f"{self.base_url}/webhook/{webhook_path.lstrip('/')}"
        response = requests.post(url)
        response.raise_for_status()
        return response.json()

if __name__ == "__main__":
    import argparse
    from dotenv import load_dotenv
    load_dotenv()

    parser = argparse.ArgumentParser(description="KRONOS n8n API Manager")
    parser.add_argument("--import-all", action="store_true", help="Import all project workflows")
    parser.add_argument("--list", action="store_true", help="List all workflows")
    parser.add_argument("--activate", type=str, help="Activate a workflow by ID")
    parser.add_argument("--deactivate", type=str, help="Deactivate a workflow by ID")
    parser.add_argument("--webhook", type=str, help="Trigger a workflow via webhook path")
    
    args = parser.parse_args()

    api_key = os.getenv("N8N_API_KEY")
    base_url = os.getenv("N8N_BASE_URL")

    if not api_key or not base_url:
        print("ERROR: Please set N8N_API_KEY and N8N_BASE_URL in a .env file.")
        exit(1)

    manager = N8nManager(base_url, api_key)

    if args.import_all:
        workflow_files = [
            "KRONOS_CAMPAIGN.json",
        ]
        for wf in workflow_files:
            if os.path.exists(wf):
                try:
                    manager.import_workflow(wf)
                except Exception as e:
                    print(f"Failed to import {wf}: {e}")
            else:
                print(f"SKIP: {wf} (not found)")

    if args.list:
        workflows = manager.list_workflows()
        for wf in workflows:
            print(f"[{wf['id']}] {wf['name']} (Active: {wf['active']})")

    if args.activate:
        manager.activate_workflow(args.activate)

    if args.deactivate:
        manager.deactivate_workflow(args.deactivate)

    if args.webhook:
        manager.execute_workflow(args.webhook)
