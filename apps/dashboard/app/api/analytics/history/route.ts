import { NextRequest, NextResponse } from "next/server";
import { fetchSentArchive, Project } from "@/lib/outreach";

export async function GET(req: NextRequest) {
  try {
    const project = (req.nextUrl.searchParams.get("project") as Project) ?? "kronos";
    const archive = await fetchSentArchive(50, project);
    const history = archive.map((rec) => ({
      id: rec.id,
      company: String(rec.fields["company name"] ?? "Unknown"),
      email: String(rec.fields.EMAIL ?? ""),
      sentAt: String(rec.fields.last_modified ?? ""),
      subject: String(rec.fields["EMAIL SUBJECT"] ?? ""),
      status: "Sent"
    }));

    return NextResponse.json({ history });
  } catch (err) {
    console.error("History API error:", err);
    return NextResponse.json({ error: "Failed to fetch send history" }, { status: 500 });
  }
}
