import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-sm text-muted-foreground">Page not found.</p>
      <Button variant="outline" render={<Link href={ROUTES.home} />}>
        Go home
      </Button>
    </div>
  );
}
