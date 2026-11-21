/**
 * Table Theme Recipe
 * Centralized styling configuration for Data Tables, headers, rows, cells, and empty states.
 */
export const tableStyles = {
  container: "relative w-full overflow-x-auto scroll-smooth overscroll-x-contain touch-pan-x",
  table: "w-full caption-bottom text-sm",
  header: "[&_tr]:border-b border-border bg-muted/40",
  body: "[&_tr:last-child]:border-0 divide-y divide-border",
  row: "border-b border-border transition-colors hover:bg-muted/50",
  head: "h-11 px-5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap [&:has([role=checkbox])]:pr-0",
  headWrap: "whitespace-normal break-words",
  cell: "px-5 py-4 align-middle text-sm text-foreground [&:has([role=checkbox])]:pr-0",
  cellWrap: "whitespace-normal break-words",
  cellNowrap: "whitespace-nowrap",
  footer: "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 whitespace-nowrap",
  footerWrap: "whitespace-normal break-words",
  empty: "py-12 text-center text-sm text-muted-foreground",
  emptyLoadingIcon: "mx-auto size-6 animate-spin text-primary",
  emptyMessage: "mt-2 font-medium text-foreground",
  emptySubtext: "mt-0.5 text-xs text-muted-foreground",
} as const
