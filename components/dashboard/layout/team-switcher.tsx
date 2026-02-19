"use client"

import * as React from "react"
import { ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const vendorConfig = getVendorTypeConfig(user?.vendorType)
  const [businesses, setBusinesses] = React.useState<ApiBusiness[]>([])
  const [activeBusiness, setActiveBusiness] = React.useState<ApiBusiness | null>(null)

  React.useEffect(() => {
    if (!user) return
    BusinessesAPI.getUserBusinesses()
      .then((list) => {
        setBusinesses(list)
        if (list.length > 0) setActiveBusiness(list[0])
      })
      .catch(() => {})
  }, [user])

  const displayName = activeBusiness?.name || user?.fullName || "Dashboard"
  const subtitle = vendorConfig?.displayName ?? (user?.isSuperAdmin ? "Super Admin" : "Dashboard")

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="default"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus:ring-0 focus:outline-none focus:border-none h-9"
            >
              <div className="h-4 w-1 bg-primary rounded-lg flex-shrink-0"></div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium text-xs">{displayName}</span>
                <span className="truncate text-[10px] opacity-60">{subtitle}</span>
              </div>
              {businesses.length > 1 && (
                <ChevronsUpDown className="ml-auto size-3.5" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {businesses.length > 1 && (
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Your Businesses
              </DropdownMenuLabel>
              {businesses.map((biz) => (
                <DropdownMenuItem
                  key={biz.id}
                  onClick={() => setActiveBusiness(biz)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <GalleryVerticalEnd className="size-3.5 shrink-0" />
                  </div>
                  <div className="grid text-left leading-tight">
                    <span className="text-sm">{biz.name}</span>
                    {biz.city && (
                      <span className="text-[10px] text-muted-foreground">{biz.city}{biz.subArea ? `, ${biz.subArea}` : ""}</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
