"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Project = "kronos" | "helios" | null;

interface ProjectContextType {
  project: Project;
  setProject: (project: Project) => void;
  brandColor: string;
}

const ProjectContext = createContext<ProjectContextType>({
  project: null,
  setProject: () => {},
  brandColor: "#FF6B00"
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("kronos-project");
    if (stored === "kronos" || stored === "helios") {
      setProject(stored);
    }
  }, []);

  useEffect(() => {
    if (project) {
      document.documentElement.setAttribute("data-theme", project);
      window.localStorage.setItem("kronos-project", project);
    } else {
      document.documentElement.removeAttribute("data-theme");
      window.localStorage.removeItem("kronos-project");
    }
  }, [project]);

  const brandColor = project === "helios" ? "#22C55E" : "#FF6B00";

  return (
    <ProjectContext.Provider value={{ project, setProject, brandColor }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
