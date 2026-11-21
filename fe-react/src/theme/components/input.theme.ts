/**
 * Input Theme Recipe
 * Centralized styling configuration for Input fields, states, and icon placements.
 */
export const inputStyles = {
  base: "h-9 w-full min-w-0 rounded-xl border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-xs transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  error: "border-destructive text-destructive placeholder:text-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/30",
  wrapper: "relative w-full",
  iconWrapper: "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4",
  iconLeft: "left-3",
  iconRight: "right-3",
  withLeftIcon: "pl-9",
  withRightIcon: "pr-9",
} as const
