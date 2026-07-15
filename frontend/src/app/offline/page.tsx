import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/app/metadata";

export const metadata = createPageMetadata("Offline");

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <WifiOff className="size-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">You are offline</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Check your connection and try again. Cached content may still be
          available.
        </p>
      </div>
      <div className="flex gap-3">
        <Button render={<Link href="/" />}>Go home</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Retry
        </Button>
      </div>
    </div>
  );
}
