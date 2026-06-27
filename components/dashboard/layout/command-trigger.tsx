"use client"

import { Icon } from "@/components/dashboard/shared/icon"
import { useUiStore } from "@/lib/store/ui-store"

/** Header affordance that opens the ⌘K command palette. */
export function CommandTrigger() {
  const setOpen = useUiStore((s) => s.setCommandOpen)
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="hidden h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
      aria-label="Open command palette"
    >
      <Icon name="Search" size={15} />
      <span className="hidden md:inline">Search or jump to…</span>
      <kbd className="ml-2 hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium md:inline">
        ⌘K
      </kbd>
    </button>
  )
}
