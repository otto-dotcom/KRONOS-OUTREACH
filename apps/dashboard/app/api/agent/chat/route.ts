import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "Agent not configured (missing key)" }, { status: 500 });
  }

  try {
    const { messages } = await req.json();

    const systemPrompt = `You are KRONOS Agent Otto (v4). 
IDENTITY: High-performance Swiss AI consultant for real estate automation.
STYLE: Concise, efficient, technical. No pleasantries. Provide insights only when prompted or highly relevant.
CONTEXT: Refer to 'directives/DATABASE_SCHEMA.md' for data structure and 'directives/AGENT_PERSONALITY.md' for behavior.

CAPABILITIES:
- RAG for Airtable: Full read/write access to Leads and Settings tables.
- Brevo Intelligence: Access to analytics, sent history, and account quotas.
- Campaign Control: Launch, preview, and regenerate outreach.

Always prioritize Rank and City for lead analysis. Report outcomes specifically (e.g., "Updated 5 records in Airtable").`;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kronosbusiness.com",
        "X-Title": "KRONOS Agent Otto",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${error}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ 
      content: data.choices[0].message.content,
      role: "assistant"
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
