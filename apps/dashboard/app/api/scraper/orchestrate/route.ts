import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Scraper orchestration is disabled until a real provider is configured.",
      status: "disabled",
      reason: "This route previously returned mocked lead data and is now quarantined to prevent fabricated records.",
    },
    { status: 501 },
  );
}
