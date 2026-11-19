/**
 * Design Tokens (TypeScript)
 * Single source of truth for programmatic access in components, charts, and stores
 */

export const THEME_TOKENS = {
  brand: {
    name: "Indigo Modern",
    primary: "oklch(0.511 0.262 276.966)",
    primaryDark: "oklch(0.585 0.233 277.117)",
    subtle: "oklch(0.96 0.03 275)",
  },
  status: {
    success: {
      label: "Aman",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-900",
    },
    warning: {
      label: "Menipis",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-900",
    },
    danger: {
      label: "Habis",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-200 dark:border-rose-900",
    },
    info: {
      label: "Info",
      bg: "bg-sky-50 dark:bg-sky-950/40",
      text: "text-sky-700 dark:text-sky-300",
      border: "border-sky-200 dark:border-sky-900",
    },
  },
  radii: {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
  },
} as const

export type ThemeTokens = typeof THEME_TOKENS
