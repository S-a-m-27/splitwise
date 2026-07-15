/**
 * Shared Tailwind class groups for auth form inputs.
 * Keeps login and register forms visually consistent.
 */
export const AUTH_INPUT_CLASS =
  "w-full h-[50px] rounded-xl border border-border/80 pl-10 pr-4 bg-accent/40 text-foreground text-[15px] placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/50 focus:bg-accent/60 focus:ring-2 focus:ring-primary/15 disabled:opacity-50";

export const AUTH_INPUT_ERROR_CLASS =
  " border-destructive/60 focus:ring-destructive/20";

export const AUTH_LABEL_CLASS =
  "text-[13px] font-semibold text-foreground/80";

export const AUTH_ERROR_CLASS =
  "flex items-center gap-1 text-[12px] font-medium text-destructive";

export const AUTH_SUBMIT_CLASS =
  "btn-premium shimmer-sweep group relative mt-1 flex h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl border-0 text-[15px] font-semibold text-primary-foreground transition-all duration-200 active:scale-[0.97] disabled:opacity-60";
