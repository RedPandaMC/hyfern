import { SidebarWrapper } from "./sidebar-wrapper";
import { HeaderWrapper } from "./header-wrapper";
import { ConstellationBackground } from "@/components/background";

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export async function DashboardShell({ children, pageTitle }: DashboardShellProps) {
  return (
    <ConstellationBackground>
      <div className="flex h-screen overflow-hidden bg-background/50 backdrop-blur-sm">
        {/* Sidebar - hidden on mobile, shown on md+ */}
        <SidebarWrapper />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Header */}
          <HeaderWrapper pageTitle={pageTitle} />

          {/* Page content - responsive padding */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ConstellationBackground>
  );
}
