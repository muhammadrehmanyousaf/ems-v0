"use client"

import * as React from "react"

import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { data } from "./nav-data"
import { Command } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mb-3">
        <div className="flex items-center gap-2.5 text-xl font-bold pt-3">
          <span className="h-9 w-9 flex items-center justify-center bg-primary text-white rounded-md">
            <Command className="size-4" />
          </span>
          <p><span className="text-primary">Wedding</span> Platform</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 border-y py-1">
          <TeamSwitcher teams={data.teams} />
        </div>
        <NavProjects projects={data.static} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
