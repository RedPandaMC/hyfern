"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "@/lib/icons";
import { logger } from "@/lib/logger";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DefaultError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("Page error:", { context: "page", error });
  }, [error]);

  return (
    <div className="flex h-full min-h-[400px] items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            {error.message || "An unexpected error occurred"}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={reset} variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.href = "/dashboard"}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
