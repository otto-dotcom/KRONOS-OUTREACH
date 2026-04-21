import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/helios/calls/[id]
 * Update a call record
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { project, ...updates } = body;

    if (project !== "helios") {
      return NextResponse.json(
        { error: "This endpoint is for HELIOS only" },
        { status: 400 }
      );
    }

    // TODO: Update record in HELIOS Airtable
    // Base: appyqUHfwK33eisQu
    // Table: Call Agenda
    // Update: outcomeStatus, notes, proximityScore, activities

    const updatedCall = {
      id: params.id,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ call: updatedCall, success: true });
  } catch (error) {
    console.error("[API] PATCH /api/helios/calls/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update call" },
      { status: 500 }
    );
  }
}
