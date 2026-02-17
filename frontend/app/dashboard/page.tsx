"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import DashboardPage from "./page-content";

export default function DashboardWrapper() {
  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  );
}
