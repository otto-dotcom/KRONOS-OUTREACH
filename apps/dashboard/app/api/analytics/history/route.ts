import { NextResponse } from "next/server";
import { fetchSentArchive } from "@/lib/outreach";

export async function GET() {
  try {
    const archive = await fetchSentArchive(50);
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
