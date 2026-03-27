# KRONOS Project Structure

This document outlines the organized directory hierarchy of the KRONOS-OUTREACH project.

## Directory Overview

```text
KRONOS-OUTREACH/
├── apps/                 # Frontend applications
│   ├── dashboard/        # Command Center (Next.js)
│   └── kronosautomations/# Landing Page (Vite + React)
├── data/                 # Persistent local data and logs
├── docs/                 # Centralized documentation
│   ├── deployment/       # Vercel, VPS, and Docker guides
│   ├── protocols/        # Outreach, Branding, and Security rules
│   └── architecture/     # System diagrams and logic flow
├── infra/                # Infrastructure configurations
│   ├── docker/           # Dockerfiles and Compose
│   └── caddy/            # Caddyfile and Reverse Proxy configs
├── scripts/              # Automation and processing scripts
│   ├── config/           # Shared JSON configurations (AI/Industries)
│   ├── maintenance/      # Setup, cleanup, and management scripts
│   ├── scraper/          # Lead generation scripts
│   └── scorer/           # AI scoring and outreach engine logic
├── workflows/            # n8n workflow JSON exports
│   └── legacy/           # Deprecated workflow versions
├── .env.template         # Environment variable template
├── README.md             # Project entry point & overview
└── STRUCTURE.md          # This document
```

## Organization Rules

1. **Apps**: All frontend code must reside in `apps/`.
2. **Workflows**: n8n export JSONs must be stored in `workflows/` with descriptive names.
3. **Docs**: All non-code text files must be in `docs/` or its subdirectories.
4. **Scripts**: Standalone automation scripts (Python/JS) should be placed in `scripts/` and categorized.
5. **No Root Clutter**: The root directory should only contain essential configuration files (`.gitignore`, `package.json`, etc.) and the core README/STRUCTURE files.
6. **Data**: Only lightweight, local logs or temporary cache files should reside in `data/`.
