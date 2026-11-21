/**
 * Card Theme Recipe
 * Centralized styling configuration for Card containers, headers, titles, and content.
 */
export const cardStyles = {
  root: "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-2xl border border-border bg-card py-(--card-spacing) text-sm text-card-foreground shadow-xs [--card-spacing:--spacing(6)] data-[size=sm]:[--card-spacing:--spacing(4)]",
  header: "group/card-header grid auto-rows-min items-start gap-1 rounded-t-2xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
  title: "font-heading text-base leading-normal font-semibold group-data-[size=sm]/card:text-sm text-foreground",
  description: "text-sm text-muted-foreground",
  action: "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
  content: "px-(--card-spacing)",
  footer: "flex items-center px-(--card-spacing) pt-0",
} as const
