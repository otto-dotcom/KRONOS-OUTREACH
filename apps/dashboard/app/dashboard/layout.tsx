import { ProjectProvider } from "./ProjectContext";
import DashboardShell from "./DashboardShell";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <DashboardShell>{children}</DashboardShell>
    </ProjectProvider>
  );
}
