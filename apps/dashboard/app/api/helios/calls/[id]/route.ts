import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/helios/calls/[id]
 * Update a call record in Call Agenda
 * Can also update linked Leads GSE record
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      project,
      callOutcome,
      callNotes,
      durationMinutes,
      nextFollowupOverride,
      leadId,
    } = body;

    if (project !== "helios") {
      return NextResponse.json(
        { error: "This endpoint is for HELIOS only" },
        { status: 400 }
      );
    }

    const apiKey = process.env.HELIOS_AIRTABLE_API_KEY;
    const baseId = process.env.HELIOS_AIRTABLE_BASE_ID || "appyqUHfwK33eisQu";
    const callsTable = process.env.HELIOS_AIRTABLE_CALLS_TABLE || "tblPKqoBVCTALCmlC";
    const leadsTable = "tbl07Ub0WeVHOnujP";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Build update fields
    const updateFields: Record<string, any> = {};
    if (callOutcome) updateFields["Call Outcome"] = callOutcome;
    if (callNotes !== undefined) updateFields["Call Notes"] = callNotes;
    if (durationMinutes !== undefined) updateFields["Duration Minutes"] = durationMinutes;
    if (nextFollowupOverride !== undefined)
      updateFields["Next Follow-up Override"] = nextFollowupOverride;

    // Update call record
    const updateCallResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${callsTable}/${params.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: updateFields }),
      }
    );

    if (!updateCallResponse.ok) {
      throw new Error(`Failed to update call`);
    }

    const callData = await updateCallResponse.json();

    // If outcome changed, update Leads GSE
    if (callOutcome && leadId) {
      const outcomeToStatus: Record<string, string> = {
        connected: "DA SEGUIRE",
        voicemail: "DA CHIAMARE",
        "no-answer": "DA CHIAMARE",
        callback: "DA SEGUIRE",
        interested: "INTERESSATO",
        "not-interested": "CHIAMATO NON INTERESSATO",
        "wrong-number": "DA RICONTATTARE",
      };

      const newCallStatus = outcomeToStatus[callOutcome];

      const updateLeadFields: Record<string, any> = {};
      if (newCallStatus) updateLeadFields["CALL STATUS"] = newCallStatus;
      if (nextFollowupOverride !== undefined)
        updateLeadFields["PROX ATTIVITÀ"] = nextFollowupOverride;

      const updateLeadResponse = await fetch(
        `https://api.airtable.com/v0/${baseId}/${leadsTable}/${leadId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields: updateLeadFields }),
        }
      );

      if (!updateLeadResponse.ok) {
        console.warn(`[API] Warning: Lead update failed`);
      }
    }

    return NextResponse.json({
      success: true,
      call: {
        id: params.id,
        outcome: callOutcome,
        notes: callNotes,
        duration: durationMinutes,
        nextFollowupOverride,
      },
    });
  } catch (error) {
    console.error("[API] PATCH /api/helios/calls/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update call" },
      { status: 500 }
    );
  }
}
