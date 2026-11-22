"use client"

// Ops Portal shell: the frame around every /ops screen.
//
// One query (GET /ops/me) tells us who the caller is and what they may do. The navigation shows only the screens the
// caller's permissions open, but that is a convenience: every endpoint behind each screen is authorised again by the
// server, so a hand-typed URL still gets a 403 rather than data.
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Home, LogOut, Settings, ShieldAlert, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/context/UserContext"
import { opsApi, opsErrorMessage, OPS_ROLE_LABEL, type OpsMe } from "@/lib/api/ops"
import { cn } from "@/lib/utils"

interface OpsContextValue {
  me: OpsMe
  /** True when the caller holds the permission (or ANY of a list). The server re-checks every call. */
  can: (permission: string | string[]) => boolean
}

const OpsContext = createContext<OpsContextValue | null>(null)

export function useOps(): OpsContextValue {
  const ctx = useContext(OpsContext)
  if (!ctx) throw new Error("useOps must be used inside <OpsShell>")
  return ctx
}

export const OPS_ME_KEY = ["ops", "me"] as const

const NAV: { href: string; label: string; icon: typeof Home; permission?: string }[] = [
  { href: "/ops", label: "Home", icon: Home },
  { href: "/ops/staff", label: "Staff & teams", icon: Users, permission: "ops_settings" },
  { href: "/ops/settings", label: "Settings", icon: Settings, permission: "ops_settings" },
]

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bridal-ivory text-bridal-text">{children}</div>
}

function Message({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <Frame>
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-status-danger-soft text-status-danger">
          <ShieldAlert className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-bridal-charcoal">{title}</h1>
        <p className="text-sm leading-relaxed text-bridal-text-soft">{body}</p>
        {action}
      </div>
    </Frame>
  )
}

export function OpsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useUser()

  const meQuery = useQuery({
    queryKey: OPS_ME_KEY,
    queryFn: opsApi.me,
    staleTime: 60_000,
  })

  const me = meQuery.data
  const can = useCallback(
    (permission: string | string[]) => {
      if (!me) return false
      const wanted = Array.isArray(permission) ? permission : [permission]
      return wanted.some((p) => me.permissions.includes(p))
    },
    [me],
  )
  const value = useMemo(() => (me ? { me, can } : null), [me, can])

  const signOut = async () => {
    await logout()
    router.replace("/login")
  }

  if (meQuery.isLoading) {
    return (
      <Frame>
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 md:px-6" aria-busy="true" aria-label="Loading the ops portal">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Frame>
    )
  }

  if (meQuery.isError || !me || !value) {
    const status = (meQuery.error as { response?: { status?: number } } | null)?.response?.status
    const forbidden = status === 403
    return (
      <Message
        title={forbidden ? "You don't have access to the Ops Portal" : "Couldn't open the Ops Portal"}
        body={
          forbidden
            ? "This area is for Wedding Wala's call-center staff. If you should have access, ask your manager to add you."
            : opsErrorMessage(meQuery.error, "Please check your connection and try again.")
        }
        action={
          <div className="flex gap-2">
            {!forbidden && (
              <Button onClick={() => meQuery.refetch()} className="transition-all duration-150 active:scale-[0.98]">
                Try again
              </Button>
            )}
            <Button variant="outline" onClick={signOut} className="transition-all duration-150 active:scale-[0.98]">
              Sign out
            </Button>
          </div>
        }
      />
    )
  }

  const items = NAV.filter((n) => !n.permission || can(n.permission))

  return (
    <OpsContext.Provider value={value}>
      <Frame>
        <header className="sticky top-0 z-30 border-b border-bridal-beige/70 bg-bridal-cream/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 px-4 md:h-14 md:flex-nowrap md:px-6">
            <Link
              href="/ops"
              className="order-1 rounded-md py-3 font-display text-lg font-semibold leading-none tracking-tight text-bridal-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 md:py-0"
            >
              Wedding Wala <span className="font-sans text-xs font-medium uppercase tracking-[0.14em] text-bridal-text-label">Ops</span>
            </Link>

            {/* Phones: the nav drops to its own full-width row under the brand + sign-out, so no tab is ever cropped. */}
            <nav aria-label="Ops sections" className="order-3 -mx-1 flex w-full min-w-0 items-center gap-1 overflow-x-auto px-1 pb-2 md:order-2 md:w-auto md:flex-1 md:pb-0">
              {items.map((item) => {
                const here = pathname ?? ""
                const active = item.href === "/ops" ? here === "/ops" : here.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium md:gap-2 md:px-3 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark active:scale-[0.98]",
                      active
                        ? "bg-bridal-sand text-bridal-charcoal"
                        : "text-bridal-text-soft hover:bg-bridal-sand/60 hover:text-bridal-charcoal",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="order-2 ml-auto flex shrink-0 items-center gap-3 md:order-3 md:ml-0">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-medium text-bridal-charcoal">{me.user.fullName}</p>
                <p className="text-xs text-bridal-text-soft">
                  {me.isSuperAdmin ? "Super admin" : me.roles.map((r) => OPS_ROLE_LABEL[r] ?? r).join(", ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="gap-2 transition-all duration-150 active:scale-[0.98]"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
      </Frame>
    </OpsContext.Provider>
  )
}
