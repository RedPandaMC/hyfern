import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ErrorBoundary } from "@/components/error-boundary";
import DashboardPage from "./page-content";

export const dynamic = 'force-dynamic';

export default async function DashboardWrapper() {
  const session = await auth();
  
  if (!session) {
    redirect('/');
  }

  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  );
}
