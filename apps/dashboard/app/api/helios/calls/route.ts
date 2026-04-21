import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/helios/calls
 * Retrieve all scheduled calls for a HELIOS lead
 * Linked to Call Agenda table in Airtable
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const project = searchParams.get("project");
    const leadId = searchParams.get("leadId");

    if (project !== "helios") {
      return NextResponse.json(
        { error: "This endpoint is for HELIOS only" },
        { status: 400 }
      );
    }

    if (!leadId) {
      return NextResponse.json(
        { error: "Missing leadId parameter" },
        { status: 400 }
      );
    }

    const apiKey = process.env.HELIOS_AIRTABLE_API_KEY;
    const baseId = process.env.HELIOS_AIRTABLE_BASE_ID || "appyqUHfwK33eisQu";
    const callsTable = process.env.HELIOS_AIRTABLE_CALLS_TABLE || "tblPKqoBVCTALCmlC";

    if (!apiKey) {
      console.error("[API] Missing HELIOS_AIRTABLE_API_KEY");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Fetch calls from Airtable, filtered by lead link
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${callsTable}?filterByFormula=FIND("${leadId}",CONCATENATE({Lead Link}))&sort[0][field]=Call Date&sort[0][direction]=desc&maxRecords=100`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[API] Airtable error: ${response.status}`, await response.text());
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();

    const calls = data.records.map((record: any) => ({
      id: record.id,
      leadId: leadId,
      callDate: record.fields["Call Date"],
      outcome: record.fields["Call Outcome"],
      notes: record.fields["Call Notes"] || "",
      duration: record.fields["Duration Minutes"] || 0,
      nextFollowupOverride: record.fields["Next Follow-up Override"],
      createdBy: record.fields["Created By"],
      createdAt: record.fields["Created At"],
    }));

    return NextResponse.json({ calls, success: true });
  } catch (error) {
    console.error("[API] GET /api/helios/calls failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}
