import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AnalyticsContent } from './analytics-content';

export const metadata = {
  title: 'Analytics - HyFern',
  description: 'Server performance analytics and monitoring',
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user has MODERATOR role or higher
  if (!hasPermission(session.user.role, 'MODERATOR')) {
    redirect('/dashboard');
  }

  return (
    <DashboardShell
      title="Analytics"
      description="Server performance metrics and player analytics"
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </DashboardShell>
  );
}
