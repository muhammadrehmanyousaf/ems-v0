"use client"

import type { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { UserSidebar } from "./user-sidebar"
import { UserTopbar } from "./user-topbar"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <UserSidebar />
      <SidebarInset>
        <UserTopbar />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
