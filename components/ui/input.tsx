import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // text-base below md, text-sm from md up. iOS Safari zooms the whole
          // page whenever a focused field's font-size is under 16px — it is a
          // WebKit behaviour, not something a viewport meta tag can opt out of.
          // At the old flat text-sm (14px) every form in the product punched the
          // layout sideways the moment a vendor tapped a field. 16px on phones
          // stops the zoom; desktop keeps the denser 14px it was designed at.
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-bridal-gold/55 focus-visible:ring-1 focus-visible:ring-bridal-gold/40 disabled:cursor-not-allowed disabled:opacity-50 text-base md:text-sm transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
