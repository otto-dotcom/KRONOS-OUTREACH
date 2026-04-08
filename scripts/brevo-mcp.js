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
  {
    name: "brevo-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOLS = [
  {
    name: "send_email",
    description: "Send a transactional email via Brevo",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject" },
        htmlContent: { type: "string", description: "HTML content of the email" },
        senderName: { type: "string", description: "Sender name (default: Otto from KRONOS)" },
        senderEmail: { type: "string", description: "Sender email (default: otto@kronosbusiness.com)" },
      },
      required: ["to", "subject", "htmlContent"],
    },
  },
  {
    name: "get_analytics",
    description: "Get email campaign analytics (opens, clicks, bounces)",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Number of days of data to retrieve (default: 7)" }
      },
    },
  },
  {
    name: "get_sent_emails",
    description: "Retrieve a list of recently sent transactional emails",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of emails to retrieve (max: 100)" }
      },
    },
  },
  {
    name: "get_account",
    description: "Get Brevo account information and quotas",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_analytics") {
      const days = args.days || 7;
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      const response = await fetch(`${BREVO_API_URL}/smtp/statistics/reports?startDate=${startDate}&endDate=${endDate}&tag=KRONOS_OUTREACH`, {
        headers: { "api-key": BREVO_API_KEY },
      });
      const data = await response.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "get_sent_emails") {
      const limit = Math.min(args.limit || 10, 100);
      const response = await fetch(`${BREVO_API_URL}/smtp/emails?limit=${limit}&tag=KRONOS_OUTREACH`, {
        headers: { "api-key": BREVO_API_KEY },
      });
      const data = await response.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "send_email") {
      const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: args.senderName || "Otto from KRONOS", email: args.senderEmail || "otto@kronosbusiness.com" },
          to: [{ email: args.to }],
          subject: args.subject,
          htmlContent: args.htmlContent,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(`Brevo API error: ${JSON.stringify(data)}`);

      return {
        content: [{ type: "text", text: `Email sent successfully to ${args.to}. Message ID: ${data.messageId}` }],
      };
    }

    if (name === "get_account") {
      const response = await fetch(`${BREVO_API_URL}/account`, {
        headers: { "api-key": BREVO_API_KEY },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(`Brevo API error: ${JSON.stringify(data)}`);

      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
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
  console.error("Brevo MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
