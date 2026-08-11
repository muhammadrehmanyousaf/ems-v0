import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Two fixes, both site-wide:
        //   1. text-base below md — iOS Safari zooms the page on focus under
        //      16px, so every textarea used to shove the layout sideways.
        //   2. This killed its outline and put nothing back, so a keyboard user
        //      focusing any textarea in the product saw no focus indicator at
        //      all (WCAG 2.4.7). Matches the gold ring <Input> already uses.
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-bridal-gold/55 focus-visible:ring-1 focus-visible:ring-bridal-gold/40 disabled:cursor-not-allowed disabled:opacity-50 text-base md:text-sm transition-all duration-200",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
