"use client"

import * as React from "react"

import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { data } from "./nav-data"
import { Command } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mb-3">
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus:ring-0 focus:outline-none focus:border-none hover:bg-transparent"
        >
          <div className={cn("bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square items-center justify-center rounded-md", open ? 'size-9' : 'size-8')}>
            <Command className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <p className="text-xl font-bold truncate"><span className="text-primary">{'Wedding'}</span> Platform</p>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarSeparator className={cn("transition-opacity", open ? 'opacity-0' : 'opacity-100')} />
      <SidebarContent>
        <div className={cn("transition-opacity px-2 py-1", open ? 'opacity-100 border-y' : 'opacity-0 -mt-10')}>
          <TeamSwitcher teams={data.teams} />
        </div>
        <NavProjects mainNavs={data.mainNav} vendorControlls={data.vendorControlls} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
