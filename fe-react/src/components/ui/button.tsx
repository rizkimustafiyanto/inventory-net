import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants, type ButtonVariantProps } from "@/theme/components/button.theme"

export interface ButtonProps
  extends ButtonPrimitive.Props,
    ButtonVariantProps {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  icon?: React.ReactNode
}

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  icon,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = loading || disabled
  const resolvedSize = icon && !children && size === "default" ? "icon" : size

  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size: resolvedSize, className }))}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin shrink-0" />
          {children && <span className="inline-flex items-center">{children}</span>}
        </>
      ) : icon && !children ? (
        <span className="inline-flex items-center justify-center shrink-0">{icon}</span>
      ) : (
        <>
          {leftIcon && <span className="inline-flex items-center justify-center shrink-0">{leftIcon}</span>}
          {children && <span className="inline-flex items-center">{children}</span>}
          {rightIcon && <span className="inline-flex items-center justify-center shrink-0">{rightIcon}</span>}
        </>
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
