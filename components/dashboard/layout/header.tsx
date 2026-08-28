import { Separator } from "@/components/ui/separator"
import React from "react"
import { UserNav } from "./user-nav"
import { ThemePicker } from "./ThemeToggle/ThemePicker"
import NotificationsPopover from "./notifications-popover"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { LanguageToggle } from "@/components/dashboard/language-toggle"
import { CommandTrigger } from "./command-trigger"
import { PanelToggle } from "./panel-toggle"

const Header = () => {
  return (
    // Fixed furniture, not a sticky element. The shell is one viewport tall and
    // only the content region below scrolls, so this is simply the first row of
    // a fixed-height column — it cannot scroll away because nothing around it
    // moves. `shrink-0` keeps it at 56px when the content region is full.
    //
    // It was `sticky top-0` before and still left the screen: `overflow-x-hidden`
    // on the parent made that parent a scroll container, and sticky is confined
    // to its nearest scroll-container ancestor. Removing the stickiness is the
    // fix, not a workaround — this is what it was trying to approximate.
    //
    // Opaque, not translucent. A backdrop-blur bar over a scrolling region shows
    // rows sliding underneath it, which reads as a rendering fault rather than a
    // material.
    <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background">
      {/* `min-w-0` + `overflow-hidden` let the breadcrumb yield space on narrow
          screens. Without it this group refused to shrink, pushed the right-hand
          cluster past the viewport, and — because the page has no horizontal
          scroll — the account avatar was CLIPPED AND UNREACHABLE on a 360px
          phone. Measured: viewport 345px, avatar at 315–347px, so a vendor could
          not open their account menu or sign out. */}
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-3">
        {/* Renders nothing on rail-only modules (Home, Bookings) — there is no
            panel there for it to collapse. Carries its own separator. */}
        <PanelToggle />
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
