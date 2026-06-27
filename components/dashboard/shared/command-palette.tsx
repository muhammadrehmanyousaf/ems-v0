"use client"

import * as React from "react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Icon } from "@/components/dashboard/shared/icon"
import { useCommands } from "@/lib/commands/use-commands"
import { useUiStore } from "@/lib/store/ui-store"

/**
 * CommandPalette (⌘K / Ctrl-K) — the keyboard-first spine. Opens from anywhere,
 * navigates the 5-zone IA, and runs quick-create actions. cmdk handles fuzzy
 * filtering + full keyboard nav + a11y (combobox/listbox). Mounted once in the
 * dashboard shell.
 */
export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen)
  const setOpen = useUiStore((s) => s.setCommandOpen)
  const toggle = useUiStore((s) => s.toggleCommand)
  const commands = useCommands()

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [toggle])

  const groups = React.useMemo(() => {
    const order: string[] = []
    const byGroup: Record<string, typeof commands> = {}
    for (const c of commands) {
      if (!byGroup[c.group]) { byGroup[c.group] = []; order.push(c.group) }
      byGroup[c.group].push(c)
    }
    return order.map((g) => ({ group: g, items: byGroup[g] }))
  }, [commands])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to…  (⌘K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map(({ group, items }) => (
          <CommandGroup key={group} heading={group}>
            {items.map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.label} ${c.keywords ?? ""} ${group}`}
                onSelect={() => {
                  c.run()
                  setOpen(false)
                }}
                className="gap-2"
              >
                <Icon name={c.icon} size={16} className="text-muted-foreground" />
                <span>{c.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export default CommandPalette
