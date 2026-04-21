import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/helios/calls/schedule
 * Schedule a new call for a HELIOS lead
 * Creates record in Call Agenda table + updates Leads GSE
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      project,
      leadId,
      callOutcome,
      callNotes = "",
      durationMinutes = 0,
      nextFollowupOverride = null,
    } = body;

    if (project !== "helios") {
      return NextResponse.json(
        { error: "This endpoint is for HELIOS only" },
        { status: 400 }
      );
    }

    if (!leadId || !callOutcome) {
      return NextResponse.json(
        { error: "Missing required fields: leadId, callOutcome" },
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

    // Create call record in Call Agenda
    const callDate = new Date().toISOString();
    const callId = `call_${Date.now()}`;

    // Auto-schedule PROX ATTIVITÀ based on outcome
    let proxAttivita = nextFollowupOverride;
    if (!proxAttivita) {
      const nextDay = new Date();
      if (callOutcome === "callback" || callOutcome === "interested") {
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(10, 0, 0, 0);
      } else if (callOutcome === "voicemail" || callOutcome === "no-answer") {
        nextDay.setDate(nextDay.getDate() + 3);
        nextDay.setHours(9, 0, 0, 0);
      } else if (callOutcome === "wrong-number") {
        nextDay.setDate(nextDay.getDate() + 7);
        nextDay.setHours(9, 0, 0, 0);
      }
      proxAttivita = callOutcome !== "not-interested" ? nextDay.toISOString() : null;
    }

    // Outcome to CALL STATUS mapping
    const outcomeToStatus: Record<string, string> = {
      connected: "DA SEGUIRE",
      voicemail: "DA CHIAMARE",
      "no-answer": "DA CHIAMARE",
      callback: "DA SEGUIRE",
      interested: "INTERESSATO",
      "not-interested": "CHIAMATO NON INTERESSATO",
      "wrong-number": "DA RICONTATTARE",
    };

    const newCallStatus = outcomeToStatus[callOutcome] || "DA SEGUIRE";

    // Create call record in Airtable
    const createCallResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${callsTable}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                ID: callId,
                "Lead Link": [leadId],
                "Call Date": callDate,
                "Call Outcome": callOutcome,
                "Call Notes": callNotes,
                "Duration Minutes": durationMinutes,
                ...(proxAttivita && { "Next Follow-up Override": proxAttivita }),
                "Created By": "api@kronos.local",
                "Created At": callDate,
              },
            },
          ],
        }),
      }
    );

    if (!createCallResponse.ok) {
      console.error(`[API] Airtable call creation error: ${createCallResponse.status}`);
      throw new Error(`Failed to create call record`);
    }

    const callData = await createCallResponse.json();
    const createdCallId = callData.records[0].id;

    // Update Leads GSE with new CALL STATUS and PROX ATTIVITÀ
    const updateLeadResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${leadsTable}/${leadId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "CALL STATUS": newCallStatus,
            ...(proxAttivita && { "PROX ATTIVITÀ": proxAttivita }),
          },
        }),
      }
    );

    if (!updateLeadResponse.ok) {
      console.warn(`[API] Warning: Lead update failed, but call was created`);
    }

    return NextResponse.json(
      {
        success: true,
        call: {
          id: createdCallId,
          leadId,
          callDate,
          outcome: callOutcome,
          notes: callNotes,
          duration: durationMinutes,
          nextFollowupOverride: proxAttivita,
          updatedLeadStatus: newCallStatus,
          updatedProxAttivita: proxAttivita,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/helios/calls/schedule failed:", error);
    return NextResponse.json(
      { error: "Failed to schedule call" },
      { status: 500 }
    );
  }
}
