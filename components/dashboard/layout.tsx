"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import Cookies from 'js-cookie'
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  Users,
  Package,
  UserCircle,
  Settings,
  LogOut,
} from "lucide-react"
import ProtectedRoutes from "@/lib/protected-routes"

interface SidebarItemProps {
  icon: ReactNode
  label: string
  href: string
}

const SidebarItem = ({ icon, label, href }: SidebarItemProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href} passHref>
      <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start">
        {icon}
        <span className="ml-2">{label}</span>
      </Button>
    </Link>
  )
}

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoutes>
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-primary">Vendor Dashboard</h1>
        </div>
        <nav className="mt-6">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" href="/dashboard" />
          <SidebarItem icon={<CalendarDays size={20} />} label="Bookings" href="/dashboard/bookings" />
          <SidebarItem icon={<MessageSquare size={20} />} label="Chat" href="/dashboard/chat" />
          <SidebarItem icon={<Users size={20} />} label="Customers" href="/dashboard/customers" />
          <SidebarItem icon={<Package size={20} />} label="Packages" href="/dashboard/packages" />
          <SidebarItem icon={<UserCircle size={20} />} label="Profile" href="/dashboard/profile" />
          <SidebarItem icon={<Settings size={20} />} label="Settings" href="/dashboard/settings" />
        </nav>
        {/* <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full">
            <LogOut size={20} />
            <span className="ml-2">Logout</span>
          </Button>
        </div> */}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
    </ProtectedRoutes>
  )
}