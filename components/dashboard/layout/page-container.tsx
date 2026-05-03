import { cn } from "@/lib/utils"
import { ReactNode } from "react"

/**
 * Canonical dashboard page frame.
 *
 * `min-w-0` is critical — without it a wide child (long currency strings,
 * tables) forces the flex parent to expand past the SidebarInset width and
 * clips visible content on the right edge. `overflow-x-hidden` is the second
 * safety net.
 *
 * Padding ladder matches shadcn dashboard-01: `gap-4 p-4 md:gap-6 md:p-6`.
 */
export default function PageContainer({
  children,
  className,
  width = "wide",
}: {
  children: ReactNode
  className?: string
  /** "wide" = 1400px, "narrow" = 768px (good for forms / single-column queues). */
  width?: "wide" | "narrow"
}) {
  return (
    <div className="flex flex-1 min-w-0 flex-col overflow-x-hidden">
      <div
        className={cn(
          "mx-auto w-full min-w-0 flex flex-col gap-4 p-4 md:gap-6 md:p-6",
          width === "wide" ? "max-w-screen-2xl" : "max-w-3xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
