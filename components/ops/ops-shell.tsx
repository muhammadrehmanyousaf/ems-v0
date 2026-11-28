"use client"

// Ops Portal shell — clear simple English labels, live team badges across Team A & Team B,
// and instant top-bar vendor search for BOTH Vendor Team and Client Desk staff.
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart3, CalendarClock, ClipboardCheck, Contact, FileSpreadsheet, Headphones, Home, ListChecks, LogOut, Menu, Moon, Search as SearchIcon, ScrollText, Settings, ShieldCheck, Store, ShieldAlert, Sun, Users, UsersRound } from "lucide-react"

import { useUser } from "@/context/UserContext"
import { useResolvedThemeMode, useThemePrefs } from "@/lib/store/theme-prefs"
import { opsApi, opsErrorMessage, OPS_ROLE_LABEL, type OpsMe } from "@/lib/api/ops"
import { reportsApi } from "@/lib/api/ops-prospects"
import { Btn, Empty, IconBtn, OpsRootContext, OpsToastProvider, Skel, cx } from "@/components/ops/ops-ui"
import { OPS_CSS } from "@/components/ops/ops-css"

interface OpsContextValue {
  me: OpsMe
  can: (permission: string | string[]) => boolean
}
const OpsContext = React.createContext<OpsContextValue | null>(null)
export function useOps(): OpsContextValue {
  const ctx = React.useContext(OpsContext)
  if (!ctx) throw new Error("useOps must be used inside <OpsShell>")
  return ctx
}
export const OPS_ME_KEY = ["ops", "me"] as const

export function Gate({ permission, children }: { permission: string | string[]; children: React.ReactNode }) {
  const { can } = useOps()
  if (can(permission)) return <>{children}</>
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <Empty icon={<ShieldAlert />} title="You don't have access to this page">Ask your manager if your account needs this screen.</Empty>
    </div>
  )
}

interface NavItem {
  href: string
  label: string
  icon: typeof Home
  permission?: string | string[]
  section: string
  exact?: boolean
  badge?: "tasksDue" | "needsReview" | "clientAction" | "vendorRequests" | "bookingsAction"
}

const CALLERS = ["ops_prospect_call", "ops_prospect_view_team", "ops_prospect_view_all"]

const CRUMB_OVERRIDES: [RegExp, string][] = [
  [/^\/ops\/prospects\/\d+\/onboarding\/?$/, "Vendor form"],
  [/^\/ops\/listings\/\d+\/?$/, "Vendor listing"],
  [/^\/ops\/clients\/\d+\/?$/, "Couple file"],
  [/^\/ops\/assigned\/\d+\/?$/, "Client request"],
  [/^\/ops\/find\/\d+\/?$/, "Vendor edit page"],
  [/^\/ops\/bookings\/\d+\/?$/, "Wedding booking"],
]

export const OPS_NAV: NavItem[] = [
  { href: "/ops", label: "Home", icon: Home, section: "Daily work", exact: true },
  { href: "/ops/clients", label: "Clients & Calls", icon: Contact, permission: "ops_client_manage", section: "Client team", badge: "clientAction" },
  { href: "/ops/vendors", label: "Check Vendors", icon: Store, permission: "ops_vendor_search", section: "Client team" },
  { href: "/ops/bookings", label: "Bookings", icon: CalendarClock, permission: ["ops_client_manage", "ops_prospect_call", "ops_listing_edit_on_behalf", "ops_reports_team", "ops_reports_all"], section: "Bookings", badge: "bookingsAction" },
  { href: "/ops/assigned", label: "Client Requests", icon: ClipboardCheck, permission: "ops_prospect_call", section: "Vendor team", badge: "vendorRequests" },
  { href: "/ops/find", label: "All Vendors", icon: Store, permission: "ops_listing_edit_on_behalf", section: "Vendor team" },
  { href: "/ops/call", label: "Call Next Vendor", icon: Headphones, permission: "ops_prospect_call", section: "Vendor team" },
  { href: "/ops/tasks", label: "Callbacks", icon: CalendarClock, permission: CALLERS, section: "Vendor team", badge: "tasksDue" },
  { href: "/ops/prospects", label: "New Vendors List", icon: ListChecks, permission: CALLERS, section: "Vendor team" },
  { href: "/ops/import", label: "Import Excel", icon: FileSpreadsheet, permission: "ops_prospect_import", section: "Vendor team" },
  { href: "/ops/team", label: "Team", icon: UsersRound, permission: ["ops_reports_team", "ops_reports_all"], section: "Managers", badge: "needsReview" },
  { href: "/ops/reports", label: "Analytics & Reports", icon: BarChart3, permission: ["ops_reports_team", "ops_reports_all"], section: "Managers" },
  { href: "/ops/quality", label: "Quality Check", icon: ShieldCheck, permission: ["ops_reports_team", "ops_reports_all"], section: "Managers" },
  { href: "/ops/audit", label: "Activity Log", icon: ScrollText, permission: "ops_reports_all", section: "Managers" },
  { href: "/ops/staff", label: "Staff & Teams", icon: Users, permission: "ops_settings", section: "Setup" },
  { href: "/ops/settings", label: "Settings", icon: Settings, permission: "ops_settings", section: "Setup" },
]

function Frame({ children, theme }: { children: React.ReactNode; theme: "light" | "dark" }) {
  return (
    <div className="oshell" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: OPS_CSS }} />
      {children}
    </div>
  )
}

export function OpsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const { logout } = useUser()
  const setMode = useThemePrefs((s) => s.setMode)
  const mode = useResolvedThemeMode()
  const [root, setRoot] = React.useState<HTMLElement | null>(null)
  const [navOpen, setNavOpen] = React.useState(false)

  React.useEffect(() => {
    const html = document.documentElement
    const prev = { o: html.style.overflow, g: html.style.scrollbarGutter }
    html.style.overflow = "hidden"
    html.style.scrollbarGutter = "auto"
    return () => { html.style.overflow = prev.o; html.style.scrollbarGutter = prev.g }
  }, [])
  React.useEffect(() => { setNavOpen(false) }, [pathname])

  const meQuery = useQuery({ queryKey: OPS_ME_KEY, queryFn: opsApi.me, staleTime: 60_000 })
  const me = meQuery.data
  const can = React.useCallback((permission: string | string[]) => {
    if (!me) return false
    return (Array.isArray(permission) ? permission : [permission]).some((p) => me.permissions.includes(p))
  }, [me])
  const value = React.useMemo(() => (me ? { me, can } : null), [me, can])

  const signOut = async () => { await logout({ redirectTo: "/login?redirect=%2Fops" }) }
  const [search, setSearch] = React.useState("")
  const canWork = !!me && CALLERS.some((p) => me.permissions.includes(p))
  const canSearchVendors = !!me && (canWork || me.permissions.includes("ops_vendor_search"))

  const summaryQ = useQuery({ queryKey: ["ops", "summary"], queryFn: reportsApi.summary, enabled: canWork, refetchInterval: 60_000, staleTime: 30_000 })
  const homeQ = useQuery({ queryKey: ["ops", "home-summary"], queryFn: opsApi.homeSummary, enabled: !!me, refetchInterval: 45_000, staleTime: 20_000 })

  if (meQuery.isLoading) {
    return (
      <Frame theme={mode}>
        <div style={{ padding: 28, maxWidth: 1000 }} aria-busy="true" aria-label="Loading portal">
          <Skel h={30} w={280} /><div style={{ height: 18 }} /><Skel h={150} /><div style={{ height: 14 }} /><Skel h={150} />
        </div>
      </Frame>
    )
  }

  if (meQuery.isError || !me || !value) {
    const status = (meQuery.error as { response?: { status?: number } } | null)?.response?.status
    const forbidden = status === 403
    return (
      <Frame theme={mode}>
        <div style={{ height: "100%", display: "grid", placeItems: "center", padding: 24 }}>
          <div className="card" style={{ maxWidth: 440, width: "100%" }}>
            <Empty
              icon={<ShieldAlert />}
              title={forbidden ? "You don't have access to the Call Center Portal" : "Could not open the portal"}
              action={<div className="row" style={{ justifyContent: "center" }}>{!forbidden && <Btn variant="primary" onClick={() => meQuery.refetch()}>Try again</Btn>}<Btn onClick={signOut}>Sign out</Btn></div>}
            >
              {forbidden ? "This area is only for Wedding Wala staff. Ask your manager if you need access." : opsErrorMessage(meQuery.error, "Please check your internet and try again.")}
            </Empty>
          </div>
        </div>
      </Frame>
    )
  }

  const badgeOf = (key?: NavItem["badge"]): { count: number; hot: boolean } => {
    if (!key) return { count: 0, hot: false }
    if (key === "tasksDue") return { count: summaryQ.data?.tasksDue ?? 0, hot: (summaryQ.data?.tasksOverdue ?? 0) > 0 }
    if (key === "needsReview") return { count: summaryQ.data?.needsReview ?? 0, hot: (summaryQ.data?.needsReview ?? 0) > 0 }
    if (key === "vendorRequests") {
      const c = homeQ.data?.teamA?.assignmentsOpen ?? 0
      return { count: c, hot: c > 0 }
    }
    if (key === "clientAction") {
      const n = (homeQ.data?.teamB?.needsResponse ?? 0) + (homeQ.data?.teamB?.vendorReplied ?? 0)
      return { count: n, hot: (homeQ.data?.teamB?.vendorReplied ?? 0) > 0 || (homeQ.data?.teamB?.overdue ?? 0) > 0 }
    }
    if (key === "bookingsAction") {
      const c = homeQ.data?.bookings?.needsAction ?? 0
      return { count: c, hot: c > 0 }
    }
    return { count: 0, hot: false }
  }

  const items = OPS_NAV.filter((n) => (!n.permission || can(n.permission)) && !(n.href === "/ops/vendors" && can("ops_listing_edit_on_behalf") && !can("ops_client_manage")))
  const sections = Array.from(new Set(items.map((n) => n.section)))
  const isActive = (n: NavItem) => (n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(`${n.href}/`))
  const current = items.filter(isActive).sort((a, b) => b.href.length - a.href.length)[0]
  const crumb = CRUMB_OVERRIDES.find(([re]) => re.test(pathname))?.[1] ?? current?.label ?? "Page"
  const roleLabel = me.isSuperAdmin ? "Super admin" : me.roles.map((r) => OPS_ROLE_LABEL[r] ?? r).join(", ")
  const initials = me.user.fullName
    .split(/\s+/)
    .map((p) => p.replace(/^[^A-Za-z0-9]+/, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?"

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const t = search.trim()
    if (!t) return
    if (can("ops_listing_edit_on_behalf")) router.push(`/ops/find?q=${encodeURIComponent(t)}`)
    else if (can("ops_vendor_search")) router.push(`/ops/vendors?q=${encodeURIComponent(t)}`)
    else router.push(`/ops/prospects?view=all&q=${encodeURIComponent(t)}`)
  }

  return (
    <OpsContext.Provider value={value}>
      <OpsRootContext.Provider value={root}>
        <div ref={setRoot} className={cx("oshell", navOpen && "nav-open")} data-theme={mode}>
          <style dangerouslySetInnerHTML={{ __html: OPS_CSS }} />
          <OpsToastProvider>
            <div className="app">
              <aside className="side" aria-label="Portal menu">
                <div className="side-top">
                  <span className="logo" aria-hidden>W</span>
                  <span className="st-txt"><span className="st-name">Wedding Wala</span><span className="st-sub">Call-center desk</span></span>
                </div>
                <nav className="nav">
                  {sections.map((sec) => (
                    <React.Fragment key={sec}>
                      <div className="nav-sec">{sec}</div>
                      {items.filter((n) => n.section === sec).map((n) => {
                        const Icon = n.icon
                        const b = badgeOf(n.badge)
                        return (
                          <Link key={n.href} href={n.href} className={cx(isActive(n) && "active")} aria-current={isActive(n) ? "page" : undefined}>
                            <Icon aria-hidden />{n.label}
                            {b.count > 0 ? <span className={cx("badge", b.hot && "hot")}>{b.count}</span> : null}
                          </Link>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </nav>
                <div className="side-foot">
                  <div className="me">
                    <span className="m-ava" aria-hidden>{initials}</span>
                    <span className="m-txt"><span className="m-name" style={{ display: "block" }}>{me.user.fullName}</span><span className="m-sub" style={{ display: "block" }}>{roleLabel}</span></span>
                  </div>
                </div>
              </aside>
              <div className="main">
                <header className="topbar">
                  <IconBtn label="Open menu" className="ibtn menu-btn" onClick={() => setNavOpen(true)}><Menu aria-hidden /></IconBtn>
                  <div className="crumb"><b>Wedding Wala Desk</b><span className="sep">/</span><span>{crumb}</span></div>
                  <div className="tb-spring" />
                  {canSearchVendors && (
                    <form className="search" role="search" onSubmit={handleGlobalSearch}>
                      <SearchIcon aria-hidden />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={can("ops_listing_edit_on_behalf") ? "Search vendor by name or phone..." : "Search venue name (e.g. Royal Palace)..."}
                        aria-label="Search vendor"
                      />
                    </form>
                  )}
                  <IconBtn label={mode === "dark" ? "Light theme" : "Dark theme"} onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
                    {mode === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
                  </IconBtn>
                  <IconBtn label="Sign out" onClick={signOut}><LogOut aria-hidden /></IconBtn>
                </header>
                <div className="cscroll"><div className="content">{children}</div></div>
              </div>
            </div>
            <div className="scrim" onClick={() => setNavOpen(false)} aria-hidden />
          </OpsToastProvider>
        </div>
      </OpsRootContext.Provider>
    </OpsContext.Provider>
  )
}
