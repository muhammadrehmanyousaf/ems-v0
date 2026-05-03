"use client"

// Client-side admin guard. Renders children only if the current user has
// the right role; otherwise shows a friendly notice. Backend still enforces.
//
//  <AdminGuard>                           — admin + super admin
//  <AdminGuard requireSuperAdmin>         — super admin only

import { ShieldAlert } from "lucide-react"
import { useUser } from "@/context/UserContext"
import { getDashboardRole, isAdminLike } from "@/lib/dashboard-role"

interface AdminGuardProps {
  children: React.ReactNode
  requireSuperAdmin?: boolean
}

export function AdminGuard({ children, requireSuperAdmin = false }: AdminGuardProps) {
  const { user, isLoading } = useUser()

  if (isLoading) return null

  const role = getDashboardRole(user)
  const allowed = requireSuperAdmin ? role === "superAdmin" : isAdminLike(role)

  if (!allowed) {
    return (
      <div className="px-4 py-16 lg:px-8 max-w-md mx-auto text-center">
        <ShieldAlert className="w-10 h-10 mx-auto text-destructive mb-3" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1">Admin only</h1>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
