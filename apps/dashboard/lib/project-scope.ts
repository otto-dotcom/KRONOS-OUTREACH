export type Project = "kronos" | "helios";

const ALLOWED = new Set<Project>(["kronos", "helios"]);

export function parseProject(value: unknown): Project | null {
  if (typeof value !== "string") return null;
  return ALLOWED.has(value as Project) ? (value as Project) : null;
}

export function requireProjectFromQuery(project: string | null): Project | null {
  return parseProject(project);
}

export function requireProjectFromBody(body: Record<string, unknown> | null | undefined): Project | null {
  if (!body) return null;
  return parseProject(body.project);
}
