# KRONOS-OUTREACH Unified Architecture

## Overview
The platform has evolved from a single-tenant application (KRONOS) to a multi-tenant unified "Outreach Operations Dashboard." It natively supports both **KRONOS** (Swiss Real Estate Ops) and **HELIOS** (Italian Solar Intelligence) within the same Next.js App Router codebase.

The system dynamically shifts UI themes, API tool-calling capabilities, and integrations based on the selected operations context.

## State Management & Project Routing
- **ProjectContext**: Situated at the top-level of the dashboard (`app/dashboard/ProjectContext.tsx`), the contextual state dictates the active project (`"kronos"`, `"helios"`, or `null`).
- **Initialization**: The initial load renders `null` and intercepts the layout in `DashboardShell.tsx` to provide a pristine Business Selector view.
- **Theme Coupling**: When a user selects a project, the context immediately dispatches a globally scoped DOM effect that updates the Document's `data-theme` attribute (e.g., `data-theme="helios"`).

## Theming & Graphics Architecture
- **Global CSS & Utility Classes**: The `globals.css`dynamically overrides CSS variables based on the active  `[data-theme]`. All UI components respect predefined Tailwind variables like `bg-k-card`, `border-k-border`, and `text-k`.
- **Kronos**: Uses the Default theme. Dark mode with sleek slate/off-black interfaces (`#151515`) and vibrant orange (`#FF6B00`) brutalist highlights.
- **Helios**: Uses the dynamic attribute `data-theme="helios"`. Rebinds the foundational palette to pristine whites, light mints, and rich green (`#22C55E`) accents.

## Backend & API Architecture
- **Stateless Routing**: API routes explicitly fetch data dynamically via the query `?project=X` instead of relying on secure cookies to preserve Edge compatibility.
- **Multi-Base Integrations**: 
  - Functions relying on Airtable dynamically configure Base IDs pointing to either the KRONOS or HELIOS specific databases. Fallbacks gracefully use primary base tables if environment variables are not defined.
- **Tools**: Includes `api/analytics/email`, `api/analytics/history`, `api/analytics/database`, and `api/campaign/setup`.

## Neural Agent Interface
- **Chat Operations**: The AI Operations Agent (`Otto`) is integrated via MCP and standard API layers on `app/api/agent/chat/route.ts`. 
- **Tool Protocol**: Supported by `gpt-4o-mini`, Otto queries real-time states executing explicitly mapped tools such as `get_leads_stats`, `search_leads`, `get_email_analytics`, and `launch_campaign`.
- **Formatting Constraints**: Otto refuses hallucinated analytics and respects hardcoded pipeline protocols, requiring positive confirmation to dispatch bulk emails. 
- **Tooling Resilience**: Tools safely capture exception statuses and propagate natural language errors to Otto instead of crashing the internal logic flow.
