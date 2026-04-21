import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/helios/calls
 * Retrieve scheduled calls for HELIOS project
 * Linked to PROX ATTIVITà field in HELIOS Airtable
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const project = searchParams.get("project");

    if (project !== "helios") {
      return NextResponse.json(
        { error: "This endpoint is for HELIOS only" },
        { status: 400 }
      );
    }

    // TODO: Fetch from HELIOS Airtable
    // Base: appyqUHfwK33eisQu
    // Table: Call Agenda (or similar)
    // Filter by date range, link to PROX ATTIVITà field

    const calls = [
      {
        id: "rec_demo_001",
        leadId: "rec_lead_001",
        company: "SolarTech Italia",
        contact: "Marco Rossi",
        email: "marco@solartech.it",
        phone: "+39 02 1234 5678",
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        scheduledTime: "10:00",
        duration: 30,
        purpose: "Initial product qualification",
        notes: "Interested in lead gen automation",
        outcomeStatus: "scheduled",
        proximityScore: 8,
        activities: ["site_visit", "demo_requested"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({ calls, success: true });
  } catch (error) {
    console.error("[API] GET /api/helios/calls failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}
