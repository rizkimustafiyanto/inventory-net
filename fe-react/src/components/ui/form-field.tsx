import * as React from "react"
import { cn } from "@/lib/utils"
import { formFieldStyles } from "@/theme/components/form-field.theme"

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
    <div className={cn(formFieldStyles.root, className)} {...props}>
      {label && (
        <label className={formFieldStyles.label}>
          <span>{label}</span>
          {required && <span className={formFieldStyles.requiredStar}>*</span>}
        </label>
      )}

      {children}

      {hasError && errorMessage && (
        <p className={formFieldStyles.errorText}>
          {errorMessage}
        </p>
      )}

      {!hasError && hint && (
        <p className={formFieldStyles.hintText}>{hint}</p>
      )}
    </div>
  )
}
