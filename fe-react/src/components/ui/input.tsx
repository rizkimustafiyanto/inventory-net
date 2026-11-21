import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"
import { inputStyles } from "@/theme/components/input.theme"

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
        inputStyles.base,
        hasError && inputStyles.error,
        leftIcon && inputStyles.withLeftIcon,
        rightIcon && inputStyles.withRightIcon,
        className
      )}
      {...props}
    />
  )

  if (leftIcon || rightIcon) {
    return (
      <div className={inputStyles.wrapper}>
        {leftIcon && (
          <div className={cn(inputStyles.iconWrapper, inputStyles.iconLeft)}>
            {leftIcon}
          </div>
        )}
        {inputElement}
        {rightIcon && (
          <div className={cn(inputStyles.iconWrapper, inputStyles.iconRight)}>
            {rightIcon}
          </div>
        )}
      </div>
    )
  }

  return inputElement
}

export { Input }
