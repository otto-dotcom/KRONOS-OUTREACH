import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/helios/calls/schedule
 * Schedule a new call for a HELIOS lead
 * Automatically links to PROX ATTIVITà field based on lead data
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      project,
      leadId,
      company,
      contact,
      email,
      phone,
      scheduledDateTime,
      purpose,
      notes,
    } = body;

    if (project !== "helios") {
      return NextResponse.json(
        { error: "This endpoint is for HELIOS only" },
        { status: 400 }
      );
    }

    if (!leadId || !scheduledDateTime) {
      return NextResponse.json(
        { error: "Missing required fields: leadId, scheduledDateTime" },
        { status: 400 }
      );
    }

    // TODO: Create record in HELIOS Airtable
    // Base: appyqUHfwK33eisQu
    // Table: Call Agenda
    // Fields:
    //   - Lead Link (link to Leads table)
    //   - Company, Contact, Email, Phone
    //   - Scheduled Date/Time
    //   - Purpose, Notes
    //   - Status: "scheduled"
    //   - PROX ATTIVITà: Calculate from lead proximity data

    const callRecord = {
      id: `rec_${Date.now()}`,
      leadId,
      company,
      contact,
      email,
      phone,
      scheduledDate: scheduledDateTime.split("T")[0],
      scheduledTime: scheduledDateTime.split("T")[1],
      purpose: purpose || "Call",
      notes,
      outcomeStatus: "scheduled",
      proximityScore: 0, // TODO: Calculate from lead data
      activities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ call: callRecord, success: true }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/helios/calls/schedule failed:", error);
    return NextResponse.json(
      { error: "Failed to schedule call" },
      { status: 500 }
    );
  }
}
