import { Loader2 } from "lucide-react";

interface AuthGateLoaderProps {
  message: string;
}

/** Shared loading state for auth route guards. */
export function AuthGateLoader({ message }: AuthGateLoaderProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
