"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface LuxuryCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  goldBorder?: boolean
}

export function LuxuryCard({
  children,
  className,
  hover = true,
  goldBorder = false,
}: LuxuryCardProps) {
  return (
    <div className={cn(
      "relative rounded-xl bg-card border border-border/50 shadow-sm overflow-hidden",
      hover && "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      goldBorder && "border-gold-300/40 hover:border-gold-400/60 dark:border-gold-700/30 dark:hover:border-gold-600/50",
      className
    )}>
      {children}
    </div>
  )
}
