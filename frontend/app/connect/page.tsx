import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ConnectContent } from './connect-content';

export const metadata = {
  title: 'Connection Info - HyFern',
  description: 'Server connection information',
};

export default async function ConnectPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user has VIEWER role or higher (everyone)
  if (!hasPermission(session.user.role, 'VIEWER')) {
    redirect('/dashboard');
  }

  return (
    <DashboardShell
      title="Connection Info"
      description="Connect to the Hytale server"
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
          </div>
        }
      >
        <ConnectContent />
      </Suspense>
    </DashboardShell>
  );
}
