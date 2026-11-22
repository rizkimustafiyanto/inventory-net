/**
 * Select Theme Recipe
 * Centralized styling configuration for NativeSelect and Select components.
 */
export const nativeSelectStyles = {
  base: "h-9 w-full min-w-0 appearance-none rounded-xl border border-input bg-card pl-3 pr-8 py-1.5 text-sm text-foreground shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
  error: "border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
  wrapper: "relative inline-flex w-full items-center",
  icon: "pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
} as const
