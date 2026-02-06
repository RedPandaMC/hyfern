import { SidebarWrapper } from "./sidebar-wrapper";
import { HeaderWrapper } from "./header-wrapper";

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export async function DashboardShell({ children, pageTitle }: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <SidebarWrapper />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <HeaderWrapper pageTitle={pageTitle} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
