"use client"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/dashboard/shared/icon"
import { useUiStore, type Density } from "@/lib/store/ui-store"

const OPTIONS: { value: Density; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { value: "comfortable", label: "Comfortable", icon: "LayoutGrid" },
  { value: "compact", label: "Compact", icon: "Filter" },
]

/** Toggles table row density (persisted). DataTable reads it from the ui-store. */
export function DensityToggle({ className }: { className?: string }) {
  const density = useUiStore((s) => s.density)
  const setDensity = useUiStore((s) => s.setDensity)
  return (
    <div className={cn("inline-flex rounded-md border border-input p-0.5", className)} role="group" aria-label="Row density">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={density === o.value}
          aria-label={o.label}
          onClick={() => setDensity(o.value)}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded transition-colors",
            density === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
          )}
        >
          <Icon name={o.icon} size={14} />
        </button>
      ))}
    </div>
  )
}
