/**
 * Select Theme Recipe
 * Centralized styling configuration for NativeSelect and Select components.
 */
export const nativeSelectStyles = {
  base: "h-9 w-full min-w-0 rounded-xl border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  error: "border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
} as const
