import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import React from "react"
import { UserNav } from "./user-nav"
import ThemeToggle from "./ThemeToggle/theme-toggle"
import NotificationsPopover from "./notifications-popover"
import { Breadcrumbs } from "@/components/breadcrumbs"

const Header = () => {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2 px-3">
        <SidebarTrigger className="-ml-1 size-7 text-muted-foreground hover:text-foreground hover:bg-accent" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-1 px-3">
        <NotificationsPopover />
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <UserNav />
      </div>
    </header>
  )
}

export default Header
