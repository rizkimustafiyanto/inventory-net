import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormFieldProps extends React.ComponentProps<"div"> {
  label?: string
  required?: boolean
  error?: string | boolean
  hint?: string
  children: React.ReactNode
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  className,
  ...props
}: FormFieldProps) {
  const errorMessage = typeof error === "string" ? error : undefined
  const hasError = Boolean(error)

  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {label && (
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 select-none">
          <span>{label}</span>
          {required && <span className="text-destructive font-bold">*</span>}
        </label>
      )}

      {children}

      {hasError && errorMessage && (
        <p className="text-xs text-destructive font-medium animate-in fade-in-0 duration-150">
          {errorMessage}
        </p>
      )}

      {!hasError && hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
