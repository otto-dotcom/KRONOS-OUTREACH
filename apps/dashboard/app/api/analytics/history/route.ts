import { NextRequest, NextResponse } from "next/server";
import { fetchSentArchive, Project } from "@/lib/outreach";
import { requireProjectFromQuery } from "@/lib/project-scope";

export async function GET(req: NextRequest) {
  try {
    const project = requireProjectFromQuery(req.nextUrl.searchParams.get("project")) as Project | null;
    if (!project) {
      return NextResponse.json({ error: "Missing or invalid project. Use ?project=kronos|helios" }, { status: 400 });
    }
    const archive = await fetchSentArchive(50, project);
    const history = archive.map((rec) => ({
      id: rec.id,
      company: String(rec.fields["company name"] ?? "Unknown"),
      email: String(rec.fields.EMAIL ?? ""),
      sentAt: String(rec.fields.DATE_SENT ?? rec.fields.last_modified ?? ""),
      subject: String(rec.fields.EMAIL_SUBJECT ?? rec.fields["EMAIL SUBJECT"] ?? ""),
      status: "Sent"
    }));

    return NextResponse.json({ history });
  } catch (err) {
    console.error("History API error:", err);
    return NextResponse.json({ error: "Failed to fetch send history" }, { status: 500 });
  }
}
