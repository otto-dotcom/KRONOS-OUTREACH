import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";
import { requireProjectFromQuery } from "@/lib/project-scope";
import * as fs from "fs/promises";
import * as path from "path";

export const runtime = "nodejs";

// Whitelist — only these project values are allowed as directory names
const ALLOWED_PROJECTS = new Set(["kronos", "helios"]);

// Resolve the absolute allowed root and ensure paths never escape it
const MEMORY_ROOT = path.resolve(process.cwd(), "..", "..", "data", "memory");

function safeMemoryPath(project: string, filename?: string): string | null {
  if (!ALLOWED_PROJECTS.has(project)) return null;
  const projectDir = path.resolve(MEMORY_ROOT, project);
  // Guard: resolved path must start with MEMORY_ROOT
  if (!projectDir.startsWith(MEMORY_ROOT + path.sep) && projectDir !== MEMORY_ROOT) return null;
  if (!filename) return projectDir;
  const filePath = path.resolve(projectDir, filename);
  if (!filePath.startsWith(projectDir + path.sep)) return null;
  return filePath;
}

/**
 * POST /api/memory/save
 * Save high-performing email copy to local memory (data/memory/{project}/)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project, company, subject, body: emailBody, notes } = body;

    if (!project || !company || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields: project, company, subject, body" }, { status: 400 });
    }

    // Strict project whitelist — prevents path traversal
    if (!ALLOWED_PROJECTS.has(project)) {
      log.error("memory_save_invalid_project", new Error("Invalid project"), { project });
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }

    const memoryDir = safeMemoryPath(project);
    if (!memoryDir) {
      return NextResponse.json({ error: "Invalid project path" }, { status: 400 });
    }

    log.info("memory_save_request", { project, company });

    await fs.mkdir(memoryDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    // Strict filename sanitization — alphanumeric + underscore only
    const safeName = company.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const filename = `${timestamp}_${safeName}.md`;

    const filePath = safeMemoryPath(project, filename);
    if (!filePath) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const content = `---
project: ${project}
company: ${company.replace(/[^\w\s.-]/g, "")}
subject: "${subject.replace(/"/g, '\\"').slice(0, 500)}"
saved_at: ${new Date().toISOString()}
type: high_performing_copy
source: email_review
---

# ${company.replace(/[^\w\s.-]/g, "")}

## Subject
${subject.slice(0, 500)}

## Body
\`\`\`html
${emailBody.slice(0, 50000)}
\`\`\`

## Notes
${(notes ?? "Manually saved from email review page.").slice(0, 2000)}
`;

    await fs.writeFile(filePath, content, "utf-8");
    log.info("memory_saved", { project, company, filename });

    return NextResponse.json({ ok: true, filename });
  } catch (err) {
    log.error("memory_save_failed", err);
    return NextResponse.json({ error: "Failed to save memory entry" }, { status: 500 });
  }
}

/**
 * GET /api/memory/save?project=kronos
 * List saved memory entries for a project
 */
export async function GET(req: NextRequest) {
  const project = requireProjectFromQuery(req.nextUrl.searchParams.get("project"));

  if (!project || !ALLOWED_PROJECTS.has(project)) return NextResponse.json({ error: "Missing or invalid project. Use ?project=kronos|helios" }, { status: 400 });

  const memoryDir = safeMemoryPath(project);
  if (!memoryDir) {
    return NextResponse.json({ error: "Invalid project path" }, { status: 400 });
  }

  try {
    try {
      await fs.access(memoryDir);
    } catch {
      return NextResponse.json({ entries: [], count: 0 });
    }

    const files = await fs.readdir(memoryDir);
    const mdFiles = files
      .filter(f => f.endsWith(".md") && /^[\w\-. ]+$/.test(f))
      .sort()
      .reverse()
      .slice(0, 50);

    const entries = mdFiles.map(f => ({
      filename: f,
      timestamp: f.split("_").slice(0, 2).join("_").replace(/-/g, ":"),
      company: f.replace(/^[\d-T]+_/, "").replace(/\.md$/, "").replace(/_/g, " "),
    }));

    return NextResponse.json({ entries, count: entries.length });
  } catch {
    return NextResponse.json({ error: "Failed to list memory entries" }, { status: 500 });
  }
}
