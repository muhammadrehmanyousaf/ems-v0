import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import React from "react"
import { UserNav } from "./user-nav"
import { ThemePicker } from "./ThemeToggle/ThemePicker"
import NotificationsPopover from "./notifications-popover"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { LanguageToggle } from "@/components/dashboard/language-toggle"
import { CommandTrigger } from "./command-trigger"

const Header = () => {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* `min-w-0` + `overflow-hidden` let the breadcrumb yield space on narrow
          screens. Without it this group refused to shrink, pushed the right-hand
          cluster past the viewport, and — because the page has no horizontal
          scroll — the account avatar was CLIPPED AND UNREACHABLE on a 360px
          phone. Measured: viewport 345px, avatar at 315–347px, so a vendor could
          not open their account menu or sign out. */}
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-3">
        <SidebarTrigger className="-ml-1 size-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent" />
        <Separator orientation="vertical" className="mx-1 h-4 shrink-0" />
        <Breadcrumbs />
      </div>

      {/* `shrink-0` so the controls keep their size and the group above is the
          one that gives way — the account menu must never be the thing that
          gets pushed off-screen. */}
      <div className="flex shrink-0 items-center gap-1 px-3">
        <CommandTrigger />
        <LanguageToggle />
        <NotificationsPopover />
        <ThemePicker />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <UserNav />
      </div>
    </header>
  )
}

export default Header
