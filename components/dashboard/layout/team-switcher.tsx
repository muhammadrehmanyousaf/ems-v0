"use client"

import * as React from "react"
import { Check, ChevronsUpDown, GalleryVerticalEnd, Layers, Plus, Clock } from "lucide-react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useUser } from "@/context/UserContext"
import { getVendorTypeConfig } from "@/lib/vendor-type-config"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"

/** "Palm Court Marquee" -> "PC". Two letters is what fits in 44px. */
function initialsOf(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "WW"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

/**
 * `variant="rail"` renders a 44px square trigger showing the business initials,
 * for the 68px icon rail. The wide two-line row cannot fit there, and the
 * business a vendor is acting as belongs beside the modules — it scopes all of
 * them — rather than inside a panel that changes underneath it.
 */
export function TeamSwitcher({ variant = "panel" }: { variant?: "panel" | "rail" }) {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const vendorConfig = getVendorTypeConfig(user?.vendorType)
  const [businesses, setBusinesses] = React.useState<ApiBusiness[]>([])
  // Active venue lives in a persisted store (localStorage) so the choice sticks
  // across reloads and every dashboard data-hook can read it. null = All venues.
  const activeBusinessId = useActiveBusinessStore((s) => s.activeBusinessId)
  const setActiveBusinessId = useActiveBusinessStore((s) => s.setActiveBusinessId)
  const queryClient = useQueryClient()

  // Switch venue: persist the choice, then invalidate every dashboard query so
  // open pages refetch scoped to the new venue (the axios interceptor attaches
  // the businessId on the refetch).
  const pickVenue = React.useCallback(
    (id: number | null) => {
      setActiveBusinessId(id)
      queryClient.invalidateQueries()
    },
    [setActiveBusinessId, queryClient],
  )

  React.useEffect(() => {
    if (!user) return
    BusinessesAPI.getUserBusinesses()
      .then((list) => {
        setBusinesses(list)
        // If a persisted selection points at a venue this user no longer owns,
        // fall back to the combined view.
        if (activeBusinessId != null && !list.some((b) => b.id === activeBusinessId)) {
          setActiveBusinessId(null)
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const multi = businesses.length > 1
  // WW-ADDBIZ — the dropdown used to render ONLY when a vendor already owned 2+
  // businesses, so the 3,271 single-business vendors clicked the switcher and
  // nothing opened. It now always opens: that is the only place a vendor looks
  // for "add another venue". The "All venues" roll-up still needs 2+ to be
  // meaningful, so it stays gated on `multi`.
  const canAddBusiness = !!user?.isVendor || !!user?.isSuperAdmin
  // A vendor who owns nothing yet. Their onboarding lives on the dashboard
  // (NoBusinessFirstRun), but the switcher must not pretend otherwise.
  const noBusinessYet = businesses.length === 0
  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || null
  const displayName = activeBusiness
    ? activeBusiness.name
    : multi
      ? "All venues"
      : // With no business at all, falling through to `user.fullName` labelled
        // the PERSON as the business — the rail read "Business: Muhammad Rehman
        // Yousaf" for someone who owns none.
        businesses[0]?.name || (noBusinessYet ? "No business yet" : user?.fullName || "Dashboard")
  const subtitle = activeBusiness
    ? `${activeBusiness.city || ""}${activeBusiness.subArea ? `, ${activeBusiness.subArea}` : ""}` || (vendorConfig?.displayName ?? "Wedding Venue")
    : multi
      ? `${businesses.length} venues`
      : vendorConfig?.displayName ?? (user?.isSuperAdmin ? "Super Admin" : "Dashboard")

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {variant === "rail" ? (
              <button
                type="button"
                title={`${displayName} — ${subtitle}`}
                aria-label={`Business: ${displayName}. Switch business.`}
                className="mx-auto flex size-11 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent/60 text-[13px] font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
              >
                {initialsOf(displayName)}
              </button>
            ) : (
              <SidebarMenuButton
                size="default"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus:ring-0 focus:outline-none focus:border-none h-9"
              >
                <div className="h-4 w-1 bg-primary rounded-lg flex-shrink-0"></div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium text-xs">{displayName}</span>
                  <span className="truncate text-[10px] opacity-60">{subtitle}</span>
                </div>
                {(multi || canAddBusiness) && <ChevronsUpDown className="ml-auto size-3.5" />}
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          {(multi || canAddBusiness) && (
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {noBusinessYet ? "Get started" : "Your Businesses"}
              </DropdownMenuLabel>
              {/* Combined roll-up across every venue the vendor owns. Only
                  meaningful with 2+, so it stays gated on `multi`. */}
              {multi && (
                <>
                  <DropdownMenuItem onClick={() => pickVenue(null)} className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <Layers className="size-3.5 shrink-0" />
                    </div>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="text-sm">All venues</span>
                      <span className="text-[10px] text-muted-foreground">Combined roll-up</span>
                    </div>
                    {activeBusinessId == null && <Check className="ml-auto size-3.5 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {businesses.map((biz) => {
                // A self-served business is invisible to customers until an admin
                // approves it. Say so here rather than let the vendor wonder why
                // it isn't getting inquiries.
                const pending = biz.status === "pending_review"
                return (
                  <DropdownMenuItem
                    key={biz.id}
                    onClick={() => pickVenue(biz.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      {pending ? <Clock className="size-3.5 shrink-0 text-amber-600" /> : <GalleryVerticalEnd className="size-3.5 shrink-0" />}
                    </div>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate text-sm">{biz.name}</span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {pending
                          ? "Pending review"
                          : biz.city
                            ? `${biz.city}${biz.subArea ? `, ${biz.subArea}` : ""}`
                            : ""}
                      </span>
                    </div>
                    {activeBusinessId === biz.id && <Check className="ml-auto size-3.5 text-primary" />}
                  </DropdownMenuItem>
                )
              })}
              {canAddBusiness && (
                <>
                  {businesses.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem asChild className="gap-2 p-2">
                    <Link href="/dashboard/business/new">
                      <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                        <Plus className="size-3.5 shrink-0" />
                      </div>
                      <div className="grid flex-1 text-left leading-tight">
                        <span className="text-sm font-medium">
                          {noBusinessYet ? "Add your business" : "Add a business"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {noBusinessYet ? "Takes about two minutes" : "Another venue or service"}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
