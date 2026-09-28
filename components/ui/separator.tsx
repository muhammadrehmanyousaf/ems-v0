"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      // Radix renders `role="none"` for a decorative separator but still emits
      // `aria-orientation`, and aria-orientation is prohibited on role="none".
      // axe reports it as `aria-prohibited-attr` on every page that draws a
      // divider — which is most of them. The attribute carries no meaning on an
      // element that has been removed from the accessibility tree, so drop it.
      {...(decorative ? { "aria-orientation": undefined } : {})}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
