/**
 * Pagination Theme Recipe
 * Centralized styling configuration for PaginationControl, page size selectors, and button groups.
 */
export const paginationStyles = {
  root: "flex flex-col items-center justify-between gap-3.5 border-t border-border px-4 py-3.5 sm:flex-row sm:px-5 bg-card text-foreground",
  infoWrapper: "flex flex-wrap items-center justify-between w-full sm:w-auto gap-2.5 text-xs text-muted-foreground",
  highlightText: "font-semibold text-foreground",
  limitWrapper: "flex items-center gap-1.5 sm:border-l sm:border-border sm:pl-3",
  limitSelect: "h-7 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground shadow-xs transition-all outline-none focus:ring-1 focus:ring-primary disabled:opacity-50",
  navWrapper: "flex items-center justify-between w-full sm:w-auto gap-3",
  pageInfo: "text-xs font-medium text-muted-foreground",
  buttonGroup: "flex items-center gap-1",
} as const
