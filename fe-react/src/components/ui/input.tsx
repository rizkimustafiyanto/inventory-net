import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean | string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Input({ className, type, error, leftIcon, rightIcon, ...props }: InputProps) {
  const hasError = Boolean(error)

  const inputElement = (
    <InputPrimitive
      type={type}
      data-slot="input"
      aria-invalid={hasError || undefined}
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-xs transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        hasError && "border-destructive text-destructive placeholder:text-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/30",
        leftIcon && "pl-9",
        rightIcon && "pr-9",
        className
      )}
      {...props}
    />
  )

  if (leftIcon || rightIcon) {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
            {leftIcon}
          </div>
        )}
        {inputElement}
        {rightIcon && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }

  return inputElement
}

export { Input }
