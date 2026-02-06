import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell pageTitle="Dashboard">
      {children}
    </DashboardShell>
  );
}
