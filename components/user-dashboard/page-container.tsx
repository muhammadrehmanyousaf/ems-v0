import type { PropsWithChildren } from "react"
import { cn } from "@/lib/utils"

type Props = PropsWithChildren<{
  className?: string
  density?: "comfortable" | "compact"
}>

/**
 * Standard frame for any /user/* page. Keeps padding + max-width + vertical
 * rhythm consistent across the dashboard.
 */
export function PageContainer({ className, density = "comfortable", children }: Props) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-screen-2xl flex-1 space-y-6 p-4 md:p-6",
        density === "compact" && "space-y-4 p-3 md:p-4",
        className,
      )}
    >
      {children}
    </main>
  )
}
