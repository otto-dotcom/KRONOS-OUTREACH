#!/usr/bin/env node
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3";

if (!BREVO_API_KEY) {
  console.error("BREVO_API_KEY environment variable is required");
  process.exit(1);
}

const server = new Server(
  { name: "brevo-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

const TOOLS = [
  {
    name: "send_email",
    description: "Send a transactional email via Brevo SMTP API",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject line" },
        htmlContent: { type: "string", description: "HTML body of the email" },
        senderName: { type: "string", description: "Sender name (default: Otto from KRONOS)" },
        senderEmail: { type: "string", description: "Sender email (default: otto@kronosbusiness.com)" },
        tag: { type: "string", description: "Brevo tag for tracking (default: KRONOS_OUTREACH)" },
      },
      required: ["to", "subject", "htmlContent"],
    },
  },
  {
    name: "get_analytics",
    description: "Get aggregated email campaign stats: delivered, opens, clicks, bounces, spam for a date range",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Days of data to retrieve (default: 7)" },
        tag: { type: "string", description: "Filter by Brevo tag (e.g. KRONOS_OUTREACH)" },
      },
    },
  },
  {
    name: "get_email_events",
    description: "Get detailed per-email events: opens, clicks, bounces, spam reports, unsubscribes",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Days of data to retrieve (default: 7)" },
        event: {
          type: "string",
          description: "Filter by event type: opened, clicks, softBounces, hardBounces, spam, unsubscribed",
        },
        limit: { type: "number", description: "Max events to return (default: 20, max: 100)" },
      },
    },
  },
  {
    name: "get_sent_emails",
    description: "Retrieve list of recently sent transactional emails with delivery status",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of emails to retrieve (default: 10, max: 100)" },
        tag: { type: "string", description: "Filter by tag (e.g. KRONOS_OUTREACH)" },
      },
    },
  },
  {
    name: "get_unsubscribers",
    description: "Get list of contacts who have unsubscribed or are blacklisted",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of contacts to retrieve (default: 20, max: 100)" },
        since: { type: "string", description: "ISO date string to filter from (e.g. 2025-01-01)" },
      },
    },
  },
  {
    name: "get_contact",
    description: "Get details for a specific contact by email address: subscription status, attributes, history",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Contact email address to look up" },
      },
      required: ["email"],
    },
  },
  {
    name: "get_account",
    description: "Get Brevo account info: plan, daily send limit, credits remaining, verified senders",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  async function brevoGet(path) {
    const res = await fetch(`${BREVO_API_URL}${path}`, {
      headers: { "api-key": BREVO_API_KEY },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Brevo API error ${res.status}: ${JSON.stringify(data)}`);
    return data;
  }

  async function brevoPost(path, body) {
    const res = await fetch(`${BREVO_API_URL}${path}`, {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Brevo API error ${res.status}: ${JSON.stringify(data)}`);
    return data;
  }

  try {
    if (name === "send_email") {
      const data = await brevoPost("/smtp/email", {
        sender: {
          name: args.senderName || "Otto from KRONOS",
          email: args.senderEmail || "otto@kronosbusiness.com",
        },
        to: [{ email: args.to }],
        subject: args.subject,
        htmlContent: args.htmlContent,
        tags: [args.tag || "KRONOS_OUTREACH"],
      });
      return { content: [{ type: "text", text: `Email sent to ${args.to}. Message ID: ${data.messageId}` }] };
    }

    if (name === "get_analytics") {
      const days = args.days || 7;
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
      let url = `/smtp/statistics/reports?startDate=${startDate}&endDate=${endDate}`;
      if (args.tag) url += `&tag=${encodeURIComponent(args.tag)}`;
      const data = await brevoGet(url);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "get_email_events") {
      const days = args.days || 7;
      const limit = Math.min(args.limit || 20, 100);
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
      let url = `/smtp/statistics/events?startDate=${startDate}&endDate=${endDate}&limit=${limit}`;
      if (args.event) url += `&event=${encodeURIComponent(args.event)}`;
      const data = await brevoGet(url);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "get_sent_emails") {
      const limit = Math.min(args.limit || 10, 100);
      let url = `/smtp/emails?limit=${limit}&sort=desc`;
      if (args.tag) url += `&tags=${encodeURIComponent(args.tag)}`;
      const data = await brevoGet(url);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "get_unsubscribers") {
      const limit = Math.min(args.limit || 20, 100);
      let url = `/contacts?limit=${limit}&sort=desc`;
      if (args.since) url += `&modifiedSince=${encodeURIComponent(args.since)}`;
      // Filter to only blacklisted/unsubscribed
      const data = await brevoGet(`/contacts?limit=${limit}&sort=desc&emailBlacklisted=true`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "get_contact") {
      const data = await brevoGet(`/contacts/${encodeURIComponent(args.email)}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "get_account") {
      const data = await brevoGet("/account");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Brevo MCP server v2.0 running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
