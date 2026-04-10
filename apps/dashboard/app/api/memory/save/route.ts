import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";
import * as fs from "fs/promises";
import * as path from "path";

export const runtime = "nodejs";

/**
 * POST /api/memory/save
 * Save high-performing email copy to local memory (data/memory/{project}/)
 * Called from the email review page when user clicks "Save to Memory"
 */
export async function POST(req: NextRequest) {
  try {
    const { project, company, subject, body, notes } = await req.json();

    if (!project || !company || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields: project, company, subject, body" }, { status: 400 });
    }

    log.info("memory_save_request", { project, company });

    const memoryDir = path.join(process.cwd(), "..", "..", "data", "memory", project);
    await fs.mkdir(memoryDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = company.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const filename = `${timestamp}_${safeName}.md`;

    const content = `---
project: ${project}
company: ${company}
subject: "${subject.replace(/"/g, '\\"')}"
saved_at: ${new Date().toISOString()}
type: high_performing_copy
source: email_review
---

# ${company}

## Subject
${subject}

## Body
\`\`\`html
${body}
\`\`\`

## Notes
${notes || "Manually saved from email review page."}
`;

    await fs.writeFile(path.join(memoryDir, filename), content, "utf-8");
    log.info("memory_saved", { project, company, filename });

    return NextResponse.json({ ok: true, filename });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error("memory_save_failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/memory/save?project=kronos
 * List saved memory entries for a project
 */
export async function GET(req: NextRequest) {
  const project = req.nextUrl.searchParams.get("project") ?? "kronos";

  try {
    const memoryDir = path.join(process.cwd(), "..", "..", "data", "memory", project);

    try {
      await fs.access(memoryDir);
    } catch {
      return NextResponse.json({ entries: [], count: 0 });
    }

    const files = await fs.readdir(memoryDir);
    const mdFiles = files.filter(f => f.endsWith(".md")).sort().reverse().slice(0, 50);

    const entries = mdFiles.map(f => ({
      filename: f,
      timestamp: f.split("_").slice(0, 2).join("_").replace(/-/g, ":"),
      company: f.replace(/^[\d-T]+_/, "").replace(/\.md$/, "").replace(/_/g, " "),
    }));

    return NextResponse.json({ entries, count: entries.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
