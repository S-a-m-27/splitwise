import { AppLayout } from "@/components/layout";

/**
 * Layout for authenticated application routes.
 * Marketing pages use their own layout via the (marketing) route group.
 */
export default function AppRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
