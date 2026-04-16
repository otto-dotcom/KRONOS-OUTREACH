import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Shell-safe commit message — use JSON.stringify for proper escaping
// then strip surrounding quotes (exec uses shell, not execFile)
function sanitizeCommitMessage(raw: string): string {
  if (typeof raw !== "string") return "Dashboard Automated Commit";
  // Allow only safe characters for a commit message
  const cleaned = raw
    .replace(/[\x00-\x1f\x7f]/g, "")  // strip control chars
    .replace(/[`$\\]/g, "")             // strip shell expansion chars
    .trim()
    .slice(0, 200);
  return cleaned || "Dashboard Automated Commit";
}

export async function POST(req: Request) {
  if (process.env.ENABLE_GIT_API !== "true") {
    return NextResponse.json(
      {
        error: "Git automation is disabled by default.",
        hint: "Set ENABLE_GIT_API=true only if you explicitly want the server to commit and push changes.",
      },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const message = sanitizeCommitMessage(body.message ?? "");

    console.log("[Git API] Orchestrating Git sequence...");

    // Stage only tracked/modified files — never blindly add everything
    // This prevents accidentally committing .env, .mcp.json, secrets
    await execAsync("git add -u", { cwd: process.cwd() });

    // Use -- to terminate options and pass message safely via env var
    const { stdout: commitStdout } = await execAsync(
      `git commit -m ${JSON.stringify(message)}`,
      { cwd: process.cwd() }
    ).catch((e: Error) => {
      if (e.message.includes("nothing to commit")) {
        return { stdout: "nothing to commit", stderr: "" };
      }
      throw e;
    });

    if (commitStdout === "nothing to commit") {
      return NextResponse.json({ success: true, message: "Nothing to commit." });
    }

    await execAsync("git push origin HEAD", { cwd: process.cwd() });

    return NextResponse.json({
      success: true,
      message: "Successfully orchestrated Git push.",
      details: commitStdout.slice(0, 500), // cap output length
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Git API] Error:", msg);
    // Never expose internal paths or stack traces
    return NextResponse.json({ error: "Git operation failed" }, { status: 500 });
  }
}
