"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type ProjectItem = { name: string; url: string; icon: LucideIcon }

function normalizePath(p?: string | null) {
  if (!p) return "/"
  const [pathOnly] = p.split(/[?#]/)
  return pathOnly!.replace(/\/+$/, "") || "/"
}

function getDashboardModule(path: string) {
  const segs = path.split("/").filter(Boolean)
  if (segs[0] !== "dashboard") return null 
  return segs[1] ?? ""
}

function isActiveForNav(currentPathname: string | null, itemUrl: string) {
  const current = normalizePath(currentPathname)
  const target = normalizePath(itemUrl)

  const currentMod = getDashboardModule(current)
  const targetMod  = getDashboardModule(target)

  if (targetMod === null) return current === target

  if (targetMod === "") return currentMod === ""

  return currentMod === targetMod
}

export function NavProjects({ projects }: { projects: ProjectItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main Navigations</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              isActive={isActiveForNav(pathname, item.url)}
              asChild
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
