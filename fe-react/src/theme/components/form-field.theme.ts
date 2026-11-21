/**
 * FormField Theme Recipe
 * Centralized styling configuration for FormField containers, labels, required marks, errors, and hints.
 */
export const formFieldStyles = {
  root: "space-y-1.5",
  label: "text-xs font-semibold text-muted-foreground flex items-center gap-1 select-none",
  requiredStar: "text-destructive font-bold",
  errorText: "text-xs text-destructive font-medium animate-in fade-in-0 duration-150",
  hintText: "text-xs text-muted-foreground",
} as const
