"use client"

import { cn } from "@/lib/utils"
import { GoldDivider } from "./gold-divider"

interface SectionHeadingProps {
  title: string
  subtitle?: string
  className?: string
  align?: "left" | "center"
  ornament?: boolean
}

export function SectionHeading({
  title,
  subtitle,
  className,
  align = "center",
  ornament = true,
}: SectionHeadingProps) {
  return (
    <div className={cn(
      "space-y-3",
      align === "center" && "text-center",
      className
    )}>
      {subtitle && (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
          {subtitle}
        </p>
      )}
      <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {ornament && (
        <GoldDivider ornament className={cn("mt-4", align === "center" ? "mx-auto max-w-xs" : "max-w-xs")} />
      )}
    </div>
  )
}
