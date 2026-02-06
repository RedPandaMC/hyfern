import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ConsoleTerminal } from '@/components/console/terminal';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { Role } from '@/app/generated/prisma';
import { redirect } from 'next/navigation';

export default async function ConsolePage() {
  // Check authentication and require MODERATOR role or higher
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  try {
    requireRole(session, Role.MODERATOR);
  } catch (error) {
    redirect('/dashboard');
  }

  const userRole = session.user.role;
  const isModerator = userRole === Role.MODERATOR;
  const isAdminOrOwner = userRole === Role.ADMIN || userRole === Role.OWNER;

  return (
    <DashboardShell pageTitle="Server Console">
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
        {/* Role-based message */}
        {isModerator && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-500 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-500 mb-1">
                  Limited Console Access
                </h3>
                <p className="text-sm text-yellow-500/80">
                  As a Moderator, you have read-only access to the console with limited command execution.
                  Some administrative commands may be restricted.
                </p>
              </div>
            </div>
          </div>
        )}

        {isAdminOrOwner && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-500 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-500 mb-1">
                  Full Console Access
                </h3>
                <p className="text-sm text-green-500/80">
                  You have full administrative access to the server console.
                  All commands are available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Terminal */}
        <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden">
          <ConsoleTerminal />
        </div>

        {/* Help text */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-2">Console Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• The console shows real-time output from the server</li>
            <li>• Connection status is shown in the top-left corner</li>
            <li>• The console will automatically reconnect if disconnected</li>
            <li>• Use Ctrl+C to copy selected text</li>
            {isAdminOrOwner && (
              <li>• Type commands directly to execute them on the server</li>
            )}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
