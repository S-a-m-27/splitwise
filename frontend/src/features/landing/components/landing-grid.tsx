import { LANDING_STYLES } from "@/features/landing/constants/styles";
import { cn } from "@/lib/utils";

type GridColumns = 3 | 4;

const COLUMN_CLASSES: Record<GridColumns, string> = {
  3: LANDING_STYLES.gridCols3,
  4: LANDING_STYLES.gridCols4,
};

interface LandingGridProps {
  /** Desktop column count (mobile is always 1–2 via gridBase). */
  columns?: GridColumns;
  children: React.ReactNode;
  className?: string;
}

/** Responsive stretch grid shared by feature, step, and benefit sections. */
export function LandingGrid({
  columns = 3,
  children,
  className,
}: LandingGridProps) {
  return (
    <div
      className={cn(LANDING_STYLES.gridBase, COLUMN_CLASSES[columns], className)}
    >
      {children}
    </div>
  );
}
