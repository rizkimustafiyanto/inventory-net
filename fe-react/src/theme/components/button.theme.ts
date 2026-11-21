import { cva, type VariantProps } from "class-variance-authority"

/**
 * Button Theme Recipe
 * Centralized styling configuration for Button component variants, sizes, and states.
 */
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-brand-hover active:bg-brand-hover",
        outline:
          "border-border bg-card text-foreground shadow-xs hover:bg-muted hover:text-foreground dark:hover:bg-muted/60",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30",
        success:
          "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 focus-visible:ring-emerald-500/30",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-3.5 text-sm [&_svg]:size-4",
        xs: "h-6 gap-1 px-2 text-xs rounded-lg [&_svg]:size-3",
        sm: "h-8 gap-1.5 px-2.5 text-xs rounded-lg [&_svg]:size-3.5",
        lg: "h-10 gap-2 px-4 text-base rounded-xl [&_svg]:size-4.5",
        icon: "size-9 p-0 [&_svg]:size-4",
        "icon-sm": "size-8 p-0 rounded-lg [&_svg]:size-4",
        "icon-xs": "size-6 p-0 rounded-md [&_svg]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
