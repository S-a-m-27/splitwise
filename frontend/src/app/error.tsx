"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  const message =
    process.env.NODE_ENV === "development"
      ? error.message || "An unexpected error occurred."
      : "An unexpected error occurred. Please try again.";

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
