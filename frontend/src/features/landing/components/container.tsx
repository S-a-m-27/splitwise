import { cn } from "@/lib/utils";

/** Max-width wrapper aligned to the mobile-first breakpoints (375–430px base). */
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}

export function Container({
  children,
  className,
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full max-w-[430px] px-4 sm:max-w-3xl sm:px-6 lg:max-w-6xl lg:px-8",
        className,
      )}
    >
      {children}
    </Component>
  );
}
