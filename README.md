# KRONOS FAMILY

Repository for the KRONOS FAMILY project. This workspace contains workflow JSONs, directives, and Python helper scripts used to build and run lead-scraping and outreach workflows.

Quick start
- Review and remove or rotate any embedded secrets in `KRONOS_V2_PERFECTED.json` and `KRONOS_V1_LEGACY.json` before publishing.
- Optionally run the sanitizer to redact secrets (creates backups):

```bash
python scripts/sanitize_secrets.py
```

- To create a private GitHub repo and push (requires `gh` CLI and authentication):

```powershell
powershell -File scripts/create_github_repo.ps1
```

Files of interest
- `execution/` — Python workflows
- `directives/` — documentation and strategy
- `KRONOS_*.json` — workflow JSONs

Notes
- Repo will be created as **KRONOS-FAMILY** (GitHub names cannot contain spaces). The repo should be private.
