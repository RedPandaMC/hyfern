import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { UsersContent } from './users-content';

export const metadata = {
  title: 'User Management - HyFern',
  description: 'Manage users and permissions',
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user has OWNER role (only owners can manage users)
  if (!hasPermission(session.user.role, 'OWNER')) {
    redirect('/dashboard');
  }

  return (
    <DashboardShell
      title="User Management"
      description="Manage users, roles, and permissions"
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
          </div>
        }
      >
        <UsersContent />
      </Suspense>
    </DashboardShell>
  );
}
