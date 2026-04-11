***

title: Brevo MCP Server
subtitle: Use AI assistants to interact with your Brevo account using natural language — no manual navigation required.
slug: docs/mcp-protocol
---------------------

For clean Markdown of any page, append .md to the page URL. For a complete documentation index, see https://developers.brevo.com/docs/llms.txt. For full documentation content, see https://developers.brevo.com/docs/llms-full.txt.

## Overview

The Brevo MCP Server lets you use AI assistants to interact with your Brevo account using natural language.

Instead of navigating Brevo manually, you can ask your AI assistant:

* "How many contacts do I have?"
* "Create an email campaign for my product launch"
* "Show me deals in the Negotiation stage"
* "Add a contact to my newsletter list"

It works with **Claude Desktop**, **Cursor**, **Windsurf**, **VS Code**, and more.

The server uses the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), an open standard by Anthropic that connects AI assistants to external tools and services.

***

## Getting started

<Steps>
  ### Get your MCP token

  1. Log in to your [Brevo account](https://app.brevo.com)
  2. Go to **Account > SMTP & API > API Keys**
  3. Generate an MCP token (check the MCP option when creating your key)
  4. Copy and save your token

  ### Connect your AI tool

  Choose your tool and follow the configuration instructions in the [Tool configuration guide](./integration-guide):

  <CardGroup cols={3}>
    <Card title="Claude Desktop" href="./integration-guide#claude-desktop" />

    <Card title="Claude Code" href="./integration-guide#claude-code-cli" />

    <Card title="Cursor" href="./integration-guide#cursor" />

    <Card title="Windsurf" href="./integration-guide#windsurf" />

    <Card title="VS Code" href="./integration-guide#vs-code-github-copilot" />

    <Card title="Cline" href="./integration-guide#cline-vs-code-extension" />
  </CardGroup>
</Steps>

***

## Quick configuration

<Tabs>
  <Tab title="Claude Desktop">
    Add this to your Claude Desktop configuration file:

    * **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
    * **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

    ```json
    {
      "mcpServers": {
        "brevo": {
          "command": "npx",
          "args": [
            "mcp-remote",
            "https://mcp.brevo.com/v1/brevo/mcp",
            "--header",
            "Authorization: Bearer ${BREVO_MCP_TOKEN}"
          ],
          "env": {
            "BREVO_MCP_TOKEN": "paste-your-mcp-token-here"
          }
        }
      }
    }
    ```

    Restart Claude Desktop after saving.

    <Note>
      Requires 

      [Node.js](https://nodejs.org)

       installed on your machine.
    </Note>
  </Tab>

  <Tab title="Cursor">
    Add this to `~/.cursor/mcp.json`:

    ```json
    {
      "mcpServers": {
        "brevo": {
          "url": "https://mcp.brevo.com/v1/brevo/mcp",
          "headers": {
            "Authorization": "Bearer paste-your-mcp-token-here"
          }
        }
      }
    }
    ```

    Restart Cursor after saving.
  </Tab>

  <Tab title="Windsurf">
    Add this to `~/.codeium/windsurf/mcp_config.json`:

    ```json
    {
      "mcpServers": {
        "brevo": {
          "serverUrl": "https://mcp.brevo.com/v1/brevo/mcp",
          "headers": {
            "Authorization": "Bearer paste-your-mcp-token-here"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="VS Code">
    Add this to `.vscode/mcp.json` in your project:

    ```json
    {
      "servers": {
        "brevo": {
          "type": "http",
          "url": "https://mcp.brevo.com/v1/brevo/mcp",
          "headers": {
            "Authorization": "Bearer paste-your-mcp-token-here"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="Cline">
    In Cline's MCP settings (`cline_mcp_settings.json`):

    ```json
    {
      "mcpServers": {
        "brevo": {
          "url": "https://mcp.brevo.com/v1/brevo/mcp",
          "headers": {
            "Authorization": "Bearer paste-your-mcp-token-here"
          }
        }
      }
    }
    ```
  </Tab>

  <Tab title="Claude Code">
    Add this to `~/.claude/config.json`:

    ```json
    {
      "mcpServers": {
        "brevo": {
          "command": "npx",
          "args": [
            "mcp-remote",
            "https://mcp.brevo.com/v1/brevo/mcp",
            "--header",
            "Authorization: Bearer ${BREVO_MCP_TOKEN}"
          ],
          "env": {
            "BREVO_MCP_TOKEN": "paste-your-mcp-token-here"
          }
        }
      }
    }
    ```

    <Note>
      Requires 

      [Node.js](https://nodejs.org)

       installed on your machine.
    </Note>
  </Tab>
</Tabs>

***

## Available servers

Connect to the **main server** for access to all features, or to **individual servers** for specific needs. Individual servers give your AI assistant a smaller, more focused set of tools — which can improve response quality.

### Main server

| Endpoint                             | Description                        |
| ------------------------------------ | ---------------------------------- |
| `https://mcp.brevo.com/v1/brevo/mcp` | All features combined (27 modules) |

### Individual servers

| Server                          | Endpoint                                  | What it does                         |
| ------------------------------- | ----------------------------------------- | ------------------------------------ |
| **contacts**                    | `/v1/brevo_contacts/mcp`                  | Manage contacts and lists            |
| **email\_campaign\_management** | `/v1/brevo_email_campaign_management/mcp` | Create and manage email campaigns    |
| **campaign\_analytics**         | `/v1/brevo_campaign_analytics/mcp`        | View campaign performance            |
| **templates**                   | `/v1/brevo_templates/mcp`                 | Manage email templates               |
| **transac\_templates**          | `/v1/brevo_transac_templates/mcp`         | Manage transactional email templates |
| **deals**                       | `/v1/brevo_deals/mcp`                     | Manage CRM deals                     |
| **companies**                   | `/v1/brevo_companies/mcp`                 | Manage CRM companies                 |
| **tasks**                       | `/v1/brevo_tasks/mcp`                     | Manage CRM tasks                     |
| **pipelines**                   | `/v1/brevo_pipelines/mcp`                 | Configure CRM pipelines              |
| **notes**                       | `/v1/brevo_notes/mcp`                     | Add notes to contacts and deals      |
| **sms\_campaigns**              | `/v1/brevo_sms_campaigns/mcp`             | Create and send SMS campaigns        |
| **whatsapp\_campaigns**         | `/v1/brevo_whatsapp_campaigns/mcp`        | Create and send WhatsApp campaigns   |
| **whatsapp\_management**        | `/v1/brevo_whatsapp_management/mcp`       | Configure WhatsApp settings          |
| **lists**                       | `/v1/brevo_lists/mcp`                     | Manage contact lists                 |
| **segments**                    | `/v1/brevo_segments/mcp`                  | Manage contact segments              |
| **attributes**                  | `/v1/brevo_attributes/mcp`                | Manage contact attributes            |
| **contact\_import\_export**     | `/v1/brevo_contact_import_export/mcp`     | Import and export contacts in bulk   |
| **folders**                     | `/v1/brevo_folders/mcp`                   | Organise campaigns into folders      |
| **groups**                      | `/v1/brevo_groups/mcp`                    | Manage contact groups                |
| **senders**                     | `/v1/brevo_senders/mcp`                   | Manage sender identities             |
| **domains**                     | `/v1/brevo_domains/mcp`                   | Manage sender domains                |
| **ips**                         | `/v1/brevo_ips/mcp`                       | Manage dedicated IPs                 |
| **accounts**                    | `/v1/brevo_accounts/mcp`                  | Manage account and sub-accounts      |
| **users**                       | `/v1/brevo_users/mcp`                     | Manage users and permissions         |
| **webhooks\_management**        | `/v1/brevo_webhooks_management/mcp`       | Configure webhooks                   |
| **external\_feeds**             | `/v1/brevo_external_feeds/mcp`            | Manage RSS feeds                     |
| **processes**                   | `/v1/brevo_processes/mcp`                 | Monitor background processes         |

All endpoints use the base URL `https://mcp.brevo.com`.

To use an individual server, replace the main server URL in your configuration. Example for Cursor — contacts only:

```json
{
  "mcpServers": {
    "brevo_contacts": {
      "url": "https://mcp.brevo.com/v1/brevo_contacts/mcp",
      "headers": {
        "Authorization": "Bearer paste-your-mcp-token-here"
      }
    }
  }
}
```