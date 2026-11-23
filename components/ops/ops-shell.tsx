"use client"

// Ops Portal shell: the vendor portal's champagne chrome (236px rail, 57px topbar, gold edge-bar nav, user foot, light/dark),
// for Wedding Wala's own call-center staff.
//
// One query (GET /ops/me) says who the caller is and what they may do. The rail shows only the screens their permissions
// open, but that is a convenience: every endpoint behind a screen is authorised again by the server.
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
  /** True when the caller holds the permission (or ANY of a list). The server re-checks every call. */
  can: (permission: string | string[]) => boolean
}
const OpsContext = React.createContext<OpsContextValue | null>(null)
export function useOps(): OpsContextValue {
  const ctx = React.useContext(OpsContext)
  if (!ctx) throw new Error("useOps must be used inside <OpsShell>")
  return ctx
}
export const OPS_ME_KEY = ["ops", "me"] as const

/** Shows its children only to someone holding the permission (or ANY of a list); everyone else gets a plain explanation. The server still answers 403. */
export function Gate({ permission, children }: { permission: string | string[]; children: React.ReactNode }) {
  const { can } = useOps()
  if (can(permission)) return <>{children}</>
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <Empty icon={<ShieldAlert />} title="This screen is not part of your role">Ask your manager if you need access to it.</Empty>
    </div>
  )
}

interface NavItem { href: string; label: string; icon: typeof Home; permission?: string | string[]; section: string; exact?: boolean; badge?: "tasksDue" | "needsReview" }

const CALLERS = ["ops_prospect_call", "ops_prospect_view_team", "ops_prospect_view_all"]

/** Every screen that exists. A phase adds its entries here when its screens ship, so the rail never has a dead link. */
const CRUMB_OVERRIDES: [RegExp, string][] = [[/^\/ops\/prospects\/\d+\/onboarding\/?$/, "Call sheet"], [/^\/ops\/listings\/\d+\/?$/, "Listing"], [/^\/ops\/clients\/\d+\/?$/, "Client"], [/^\/ops\/assigned\/\d+\/?$/, "Assignment"]]

export const OPS_NAV: NavItem[] = [
  { href: "/ops", label: "Home", icon: Home, section: "Kaam", exact: true },
  { href: "/ops/call", label: "Call queue", icon: Headphones, permission: "ops_prospect_call", section: "Kaam" },
  { href: "/ops/tasks", label: "Callbacks", icon: CalendarClock, permission: CALLERS, section: "Kaam", badge: "tasksDue" },
  { href: "/ops/prospects", label: "Prospects", icon: ListChecks, permission: CALLERS, section: "Kaam" },
  { href: "/ops/import", label: "Import vendors", icon: FileSpreadsheet, permission: "ops_prospect_import", section: "Kaam" },
  { href: "/ops/assigned", label: "Assigned to me", icon: ClipboardCheck, permission: "ops_prospect_call", section: "Kaam" },
  { href: "/ops/clients", label: "Clients", icon: Contact, permission: "ops_client_manage", section: "Client desk" },
  { href: "/ops/vendors", label: "Find venues", icon: Store, permission: "ops_vendor_search", section: "Client desk" },
  { href: "/ops/team", label: "Team", icon: UsersRound, permission: ["ops_reports_team", "ops_reports_all"], section: "Nigrani", badge: "needsReview" },
  { href: "/ops/reports", label: "Reports", icon: BarChart3, permission: ["ops_reports_team", "ops_reports_all"], section: "Nigrani" },
  { href: "/ops/quality", label: "Quality", icon: ShieldCheck, permission: ["ops_reports_team", "ops_reports_all"], section: "Nigrani" },
  { href: "/ops/audit", label: "Audit trail", icon: ScrollText, permission: "ops_reports_all", section: "Nigrani" },
  { href: "/ops/staff", label: "Staff & teams", icon: Users, permission: "ops_settings", section: "Setup" },
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

  // The shell is a fixed overlay with its own scroll region (same as the vendor console): hide the document's scroll
  // while it is mounted and restore it on unmount, so there is never a second, empty scrollbar.
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

  const signOut = async () => { await logout(); router.replace("/login") }
  const [search, setSearch] = React.useState("")
  const canWork = !!me && CALLERS.some((p) => me.permissions.includes(p))
  const summaryQ = useQuery({ queryKey: ["ops", "summary"], queryFn: reportsApi.summary, enabled: canWork, refetchInterval: 60_000, staleTime: 30_000 })

  if (meQuery.isLoading) {
    return (
      <Frame theme={mode}>
        <div style={{ padding: 28, maxWidth: 1000 }} aria-busy="true" aria-label="Loading the ops portal">
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
              title={forbidden ? "You don't have access to the Ops Portal" : "Couldn't open the Ops Portal"}
              action={<div className="row" style={{ justifyContent: "center" }}>{!forbidden && <Btn variant="primary" onClick={() => meQuery.refetch()}>Try again</Btn>}<Btn onClick={signOut}>Sign out</Btn></div>}
            >
              {forbidden ? "This area is for Wedding Wala's call-center staff. If you should have access, ask your manager to add you." : opsErrorMessage(meQuery.error, "Please check your connection and try again.")}
            </Empty>
          </div>
        </div>
      </Frame>
    )
  }

  const items = OPS_NAV.filter((n) => !n.permission || can(n.permission))
  const sections = Array.from(new Set(items.map((n) => n.section)))
  const isActive = (n: NavItem) => (n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(`${n.href}/`))
  const current = items.filter(isActive).sort((a, b) => b.href.length - a.href.length)[0]
  // screens reached from a prospect rather than from the rail get their own crumb instead of a generic "Page"
  const crumb = CRUMB_OVERRIDES.find(([re]) => re.test(pathname))?.[1] ?? current?.label ?? "Page"
  const roleLabel = me.isSuperAdmin ? "Super admin" : me.roles.map((r) => OPS_ROLE_LABEL[r] ?? r).join(", ")
  const initials = me.user.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?"

  return (
    <OpsContext.Provider value={value}>
      <OpsRootContext.Provider value={root}>
        <div ref={setRoot} className={cx("oshell", navOpen && "nav-open")} data-theme={mode}>
          <style dangerouslySetInnerHTML={{ __html: OPS_CSS }} />
          <OpsToastProvider>
            <div className="app">
              <aside className="side" aria-label="Ops navigation">
                <div className="side-top">
                  <span className="logo" aria-hidden>W</span>
                  <span className="st-txt"><span className="st-name">Wedding Wala Ops</span><span className="st-sub">Call-center portal</span></span>
                </div>
                <nav className="nav">
                  {sections.map((sec) => (
                    <React.Fragment key={sec}>
                      <div className="nav-sec">{sec}</div>
                      {items.filter((n) => n.section === sec).map((n) => {
                        const Icon = n.icon
                        return (
                          <Link key={n.href} href={n.href} className={cx(isActive(n) && "active")} aria-current={isActive(n) ? "page" : undefined}>
                            <Icon aria-hidden />{n.label}
                            {n.badge && (summaryQ.data?.[n.badge] ?? 0) > 0 ? <span className={cx("badge", n.badge === "needsReview" || (n.badge === "tasksDue" && (summaryQ.data?.tasksOverdue ?? 0) > 0) ? "hot" : "")}>{summaryQ.data?.[n.badge]}</span> : null}
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
                  <div className="crumb"><b>Ops Portal</b><span className="sep">/</span><span>{crumb}</span></div>
                  <div className="tb-spring" />
                  {canWork && (
                    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); const t = search.trim(); if (t) router.push(`/ops/prospects?view=all&q=${encodeURIComponent(t)}`) }}>
                      <SearchIcon aria-hidden /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a vendor by name or phone" aria-label="Find a vendor by name or phone" />
                    </form>
                  )}
                  <IconBtn label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
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
