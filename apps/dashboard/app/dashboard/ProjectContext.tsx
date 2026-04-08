"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Project = "kronos" | "helios";

interface ProjectContextType {
  project: Project;
  setProject: (project: Project) => void;
  brandColor: string;
}

const ProjectContext = createContext<ProjectContextType>({
  project: "kronos",
  setProject: () => {},
  brandColor: "#FF6B00"
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project>("kronos");

  useEffect(() => {
    // Sync with HTML attribute for CSS variables
    document.documentElement.setAttribute("data-theme", project);
  }, [project]);

  const brandColor = project === "kronos" ? "#FF6B00" : "#22C55E";

  return (
    <ProjectContext.Provider value={{ project, setProject, brandColor }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
