/**
 * Pagination Theme Recipe
 * Centralized styling configuration for PaginationControl, page size selectors, and button groups.
 */
export const paginationStyles = {
  root: "flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3.5 sm:flex-row bg-card text-foreground",
  infoWrapper: "flex flex-wrap items-center gap-3 text-xs text-muted-foreground",
  highlightText: "font-semibold text-foreground",
  limitWrapper: "flex items-center gap-1.5 border-l border-border pl-3",
  limitSelect: "h-7 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground shadow-xs transition-all outline-none focus:ring-1 focus:ring-primary disabled:opacity-50",
  navWrapper: "flex items-center gap-3",
  pageInfo: "text-xs font-medium text-muted-foreground",
  buttonGroup: "flex items-center gap-1",
} as const
