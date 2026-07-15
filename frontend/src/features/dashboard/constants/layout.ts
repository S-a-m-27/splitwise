/**
 * Mobile-first layout tokens — supports 320px through 430px.
 */
export const DASHBOARD_LAYOUT = {
  mobileMinWidth: 320,
  mobileTargetWidth: 375,
  mobileMaxWidth: 430,
  touchMin: 44,
} as const;

/** Fluid phone column: full width below 430px, capped above. */
export const MOBILE_COLUMN_CLASS =
  "mx-auto w-full max-w-[430px] px-4 min-[375px]:px-5";

/** Horizontal padding offset for full-bleed header/footer inside the column. */
export const MOBILE_BLEED_X_CLASS =
  "-mx-4 px-4 min-[375px]:-mx-5 min-[375px]:px-5";

/** FAB inset — simple on narrow screens; column-aligned on wider previews. */
export const MOBILE_FAB_RIGHT_CLASS =
  "right-4 min-[375px]:right-[max(1rem,calc(50vw-215px+1rem))] xl:right-8";
