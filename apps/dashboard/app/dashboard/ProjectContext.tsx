"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Project = "kronos" | "helios" | null;

interface ProjectContextType {
  project: Project;
  setProject: (project: Project) => void;
  brandColor: string;
  /** Hard reset — clears session and returns to selector */
  resetProject: () => void;
}

const ProjectContext = createContext<ProjectContextType>({
  project: null,
  setProject: () => {},
  brandColor: "#FF6B00",
  resetProject: () => {},
});

// ─── Validation guard ──────────────────────────────────────────────────────────
// Only these exact strings are accepted. Anything else is rejected and treated as null.
const VALID_PROJECTS: readonly Project[] = ["kronos", "helios"];

function isValidProject(v: unknown): v is "kronos" | "helios" {
  return VALID_PROJECTS.includes(v as Project);
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, _setProject] = useState<Project>(null);

  // ── Restore from sessionStorage (NOT localStorage — scoped to tab) ──
  // Using sessionStorage means a refresh in the same tab preserves project,
  // but a new tab or window requires re-selection. This prevents stale state
  // from leaking between KRONOS and HELIOS sessions.
  useEffect(() => {
    const stored = window.sessionStorage.getItem("jarvis-project");
    if (isValidProject(stored)) {
      _setProject(stored);
    }
    // Also check localStorage for backwards compat — migrate if found
    const legacy = window.localStorage.getItem("kronos-project");
    if (!stored && isValidProject(legacy)) {
      _setProject(legacy);
      window.sessionStorage.setItem("jarvis-project", legacy);
      window.localStorage.removeItem("kronos-project"); // clean up legacy
    }
  }, []);

  // ── Apply theme + persist ──
  useEffect(() => {
    if (project) {
      document.documentElement.setAttribute("data-theme", project);
      window.sessionStorage.setItem("jarvis-project", project);
      // Clear old localStorage key if it still exists
      window.localStorage.removeItem("kronos-project");
    } else {
      document.documentElement.removeAttribute("data-theme");
      window.sessionStorage.removeItem("jarvis-project");
    }
  }, [project]);

  function setProject(p: Project) {
    // Hard type guard — never accept anything outside the allowed enum
    if (p !== null && !isValidProject(p)) {
      console.error(`[ProjectContext] Rejected invalid project value: "${p}"`);
      return;
    }
    _setProject(p);
  }

  function resetProject() {
    _setProject(null);
    window.sessionStorage.removeItem("jarvis-project");
    window.localStorage.removeItem("kronos-project");
    document.documentElement.removeAttribute("data-theme");
  }

  const brandColor = project === "helios" ? "#22C55E" : "#FF6B00";

  return (
    <ProjectContext.Provider value={{ project, setProject, brandColor, resetProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
