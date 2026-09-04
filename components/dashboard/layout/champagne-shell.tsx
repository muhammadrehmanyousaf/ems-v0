"use client"

/**
 * ChampagneShell — a REACT version of the shadow-DOM artifact shell, for pages
 * that are ordinary React trees (the settings hub with its editors, etc.) so
 * they render in the SAME premium chrome instead of the legacy icon-rail layout.
 *
 * It is a fixed inset:0 overlay (same as the shadow shell's :host), so it covers
 * the legacy (dashboard)/layout chrome without any layout change — admin pages
 * and the shadow artifacts are untouched.
 *
 * The sidebar nav reuses the shell's own navHtml / setupPanelHtml / khataPanelHtml
 * string builders (single source of truth), rendered via dangerouslySetInnerHTML;
 * clicks are delegated to router.push. The chrome CSS mirrors SHELL_CSS, scoped
 * under `.cshell` so nothing leaks to the light-DOM page inside.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useThemePrefs, useResolvedThemeMode } from "@/lib/store/theme-prefs"
import { useUser } from "@/context/UserContext"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"
import { useShellStore } from "@/lib/store/shell-store"
import { NotificationAPI } from "@/lib/api/notifications"
import {
  navHtml, setupPanelHtml, khataPanelHtml, SETUP_PATHS, KHATA_PATHS, initialsOf, applyContentSearch,
} from "@/components/dashboard/mainScreens/artifact/artifact-shell"

/** React pages (non-artifact, e.g. the settings hub) call this to set the
 * persistent shell's crumb + active-route, mirroring what useArtifactShell does
 * for shadow screens. Renders nothing. */
export function ShellChromeSetter({ activeHref, crumbBold, crumbSub }: { activeHref: string; crumbBold: string; crumbSub: string }) {
  const setChrome = useShellStore((s) => s.setChrome)
  React.useEffect(() => { setChrome({ activeHref, crumbBold, crumbSub }) }, [activeHref, crumbBold, crumbSub, setChrome])
  return null
}

const CHROME_CSS = String.raw`
.cshell{ position:fixed; inset:0; overflow:hidden; z-index:46; display:block; color:var(--ink);
  font-family:"Geist","Inter",system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13.5px; line-height:1.5; -webkit-font-smoothing:antialiased; letter-spacing:-.006em;
  --bg:#F7F6F3; --surface:#FFFFFF; --surface-2:#FAF9F6; --surface-3:#F3F1EC; --ink:#1A1815; --ink-2:#605A52; --ink-3:#6E6A62; --ink-4:#8C857B;
  --border:#EBE9E3; --border-2:#DEDBD3; --accent:#B8863B; --accent-ink:#8A6220; --accent-wash:#F5EFE2; --accent-line:#E3D3AE; --on-accent:#FFFFFF;
  --ok:#3F7A55; --ok-wash:#EEF4EF; --warn:#8A6220; --warn-wash:#F6EEDD; --info:#3F6FA6; --info-wash:#EDF2F8; --bad:#A24845; --bad-wash:#F8ECEB;
  --shadow-xs:0 1px 2px rgba(20,18,15,.04); --shadow-sm:0 1px 3px rgba(20,18,15,.06),0 1px 2px rgba(20,18,15,.04); --shadow-md:0 8px 24px -12px rgba(20,18,15,.16);
  --r:12px; --r-sm:9px; --r-xs:7px; background:var(--bg); }
@media (prefers-color-scheme:dark){ .cshell:not([data-theme="light"]){
  --bg:#0C0B09; --surface:#161410; --surface-2:#121009; --surface-3:#1E1B15; --ink:#F5F2EC; --ink-2:#ABA498; --ink-3:#9A9184; --ink-4:#6B6558;
  --border:#26231C; --border-2:#322E25; --accent:#D8A85A; --accent-ink:#E7C079; --accent-wash:#221B10; --accent-line:#3A2F1A; --on-accent:#231A08;
  --ok:#7FB894; --ok-wash:#16211A; --warn:#D6A94E; --warn-wash:#221B0F; --info:#7FA6D6; --info-wash:#141D28; --bad:#DA9490; --bad-wash:#241614;
  --shadow-xs:0 1px 2px rgba(0,0,0,.4); --shadow-sm:0 1px 3px rgba(0,0,0,.5); --shadow-md:0 10px 28px -12px rgba(0,0,0,.6); } }
.cshell[data-theme="dark"]{
  --bg:#0C0B09; --surface:#161410; --surface-2:#121009; --surface-3:#1E1B15; --ink:#F5F2EC; --ink-2:#ABA498; --ink-3:#9A9184; --ink-4:#6B6558;
  --border:#26231C; --border-2:#322E25; --accent:#D8A85A; --accent-ink:#E7C079; --accent-wash:#221B10; --accent-line:#3A2F1A; --on-accent:#231A08;
  --ok:#7FB894; --ok-wash:#16211A; --warn:#D6A94E; --warn-wash:#221B0F; --info:#7FA6D6; --info-wash:#141D28; --bad:#DA9490; --bad-wash:#241614;
  --shadow-xs:0 1px 2px rgba(0,0,0,.4); --shadow-sm:0 1px 3px rgba(0,0,0,.5); --shadow-md:0 10px 28px -12px rgba(0,0,0,.6); }
/* Token bridge — map the shadcn/tailwind tokens to the champagne palette WITHIN
   the shell, so React hub pages (the settings hub and its editors) render in the
   SAME gold/cream system as the artifact console instead of the app-wide purple
   primary (globals.css --primary:263…). This is the single source of the
   "settings colours/borders look different" inconsistency. */
.cshell{ --background:45 18% 96%; --foreground:40 11% 9%; --card:0 0% 100%; --card-foreground:40 11% 9%; --popover:0 0% 100%; --popover-foreground:40 11% 9%; --primary:36 51% 48%; --primary-foreground:0 0% 100%; --secondary:43 21% 94%; --secondary-foreground:40 11% 9%; --muted:43 21% 94%; --muted-foreground:40 6% 41%; --accent:43 21% 94%; --accent-foreground:40 11% 9%; --destructive:2 55% 46%; --destructive-foreground:0 0% 100%; --border:43 15% 90%; --input:43 15% 85%; --ring:36 51% 48%; }
@media (prefers-color-scheme:dark){ .cshell:not([data-theme="light"]){ --background:40 14% 4%; --foreground:40 33% 94%; --card:40 18% 7%; --card-foreground:40 33% 94%; --popover:40 18% 7%; --popover-foreground:40 33% 94%; --primary:36 61% 60%; --primary-foreground:36 63% 9%; --secondary:38 17% 10%; --secondary-foreground:40 33% 94%; --muted:38 17% 10%; --muted-foreground:36 9% 56%; --accent:38 17% 10%; --accent-foreground:40 33% 94%; --border:40 16% 13%; --input:40 16% 16%; --ring:36 61% 60%; } }
.cshell[data-theme="dark"]{ --background:40 14% 4%; --foreground:40 33% 94%; --card:40 18% 7%; --card-foreground:40 33% 94%; --popover:40 18% 7%; --popover-foreground:40 33% 94%; --primary:36 61% 60%; --primary-foreground:36 63% 9%; --secondary:38 17% 10%; --secondary-foreground:40 33% 94%; --muted:38 17% 10%; --muted-foreground:36 9% 56%; --accent:38 17% 10%; --accent-foreground:40 33% 94%; --border:40 16% 13%; --input:40 16% 16%; --ring:36 61% 60%; }
.cshell *{ box-sizing:border-box; }
.cshell h1,.cshell h2,.cshell h3{ margin:0; line-height:1.2; letter-spacing:-.02em; font-weight:600; }
.cshell a{ color:inherit; text-decoration:none; } .cshell button{ font:inherit; color:inherit; cursor:pointer; }
.cshell svg{ display:block; }
.cshell .app{ display:grid; grid-template-columns:236px 1fr; height:100%; }
.cshell .app.app-sub{ grid-template-columns:236px 234px 1fr; }
/* The rail is a fixed-height column: the business switcher (top) and the profile
   (foot) are PINNED, and only the nav in between scrolls. overflow stays visible
   so the business-switcher dropdown isn't clipped. */
.cshell .side{ background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; height:100vh; overflow:visible; }
.cshell .side-top{ display:flex; align-items:center; gap:10px; width:100%; padding:16px 16px 14px; border:0; border-bottom:1px solid var(--border); background:transparent; text-align:left; }
.cshell .side-top:hover{ background:var(--surface-3); } .cshell .side-top[aria-expanded="true"]{ background:var(--surface-3); }
.cshell .bizwrap{ position:relative; flex:none; }
.cshell .bizmenu{ position:absolute; left:12px; right:12px; top:calc(100% - 6px); z-index:60; background:var(--surface); border:1px solid var(--border-2); border-radius:11px; box-shadow:var(--shadow-md); padding:6px; max-height:60vh; overflow-y:auto; }
.cshell .bizmenu[hidden]{ display:none; }
.cshell .bizmenu .bm-lbl{ font-size:10.5px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:var(--ink-4); padding:8px 9px 5px; }
.cshell .bizmenu .bm-item{ display:flex; align-items:center; gap:10px; width:100%; text-align:left; border:0; background:transparent; padding:8px 9px; border-radius:8px; color:var(--ink); }
.cshell .bizmenu .bm-item:hover{ background:var(--surface-3); }
.cshell .bizmenu .bm-ava{ width:28px; height:28px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink-2); display:grid; place-items:center; font-weight:700; font-size:11px; flex:none; }
.cshell .bizmenu .bm-item.on .bm-ava{ background:var(--accent); color:var(--on-accent); border-color:transparent; }
.cshell .bizmenu .bm-txt{ flex:1; min-width:0; } .cshell .bizmenu .bm-nm{ display:block; font-size:12.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cshell .bizmenu .bm-sub{ display:block; font-size:11px; color:var(--ink-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
.cshell .bizmenu .bm-tick{ margin-left:auto; color:var(--accent-ink); flex:none; } .cshell .bizmenu .bm-tick svg{ width:16px; height:16px; }
.cshell .bizmenu .bm-sep{ height:1px; background:var(--border); margin:5px 4px; }
.cshell .logo{ width:32px; height:32px; border-radius:9px; background:var(--accent); color:var(--on-accent); display:grid; place-items:center; font-weight:700; font-size:15px; flex:none; box-shadow:var(--shadow-xs); }
.cshell .side-top .st-txt{ flex:1; min-width:0; } .cshell .side-top .st-name{ display:block; font-weight:600; font-size:13px; letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cshell .side-top .st-sub{ display:block; font-size:11.5px; color:var(--ink-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; } .cshell .side-top .chev{ color:var(--ink-3); flex:none; }
.cshell .nav{ padding:10px 12px 4px; flex:1 1 auto; min-height:0; overflow-y:auto; } .cshell .side-spring{ display:none; }
.cshell .nav-sec{ font-size:11px; font-weight:600; letter-spacing:.04em; color:var(--ink-3); text-transform:uppercase; padding:14px 10px 6px; } .cshell .nav-sec:first-child{ padding-top:2px; }
.cshell .nav a{ display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; min-height:36px; color:var(--ink-2); font-weight:500; font-size:13px; position:relative; transition:background .12s,color .12s; }
.cshell .nav a svg{ width:17px; height:17px; color:var(--ink-3); flex:none; }
.cshell .nav a:hover{ background:var(--surface-3); color:var(--ink); } .cshell .nav a:hover svg{ color:var(--ink-2); }
.cshell .nav a.active{ background:var(--surface-3); color:var(--ink); font-weight:600; } .cshell .nav a.active svg{ color:var(--accent-ink); }
.cshell .nav a.active::before{ content:""; position:absolute; left:0; top:9px; bottom:9px; width:2.5px; border-radius:0 3px 3px 0; background:var(--accent); }
.cshell .nav-more-btn{ display:flex; align-items:center; justify-content:space-between; gap:10px; width:calc(100% - 24px); margin:10px 12px 2px; padding:8px 10px; border-radius:8px; border:0; background:transparent; color:var(--ink-3); font-weight:600; font-size:11px; letter-spacing:.04em; text-transform:uppercase; }
.cshell .nav-more-btn:hover{ background:var(--surface-3); color:var(--ink); } .cshell .nav-more-btn .mchev{ width:15px; height:15px; transition:transform .15s; color:var(--ink-4); } .cshell .nav-more-btn[aria-expanded="true"] .mchev{ transform:rotate(180deg); }
.cshell .nav-more[hidden]{ display:none; }
.cshell .nav-mod{ display:flex; align-items:center; gap:10px; margin:8px 12px 2px; padding:9px 10px; border-radius:8px; color:var(--ink); font-weight:600; font-size:13px; position:relative; }
.cshell .nav-mod svg{ width:17px; height:17px; color:var(--ink-3); flex:none; } .cshell .nav-mod .mod-caret{ margin-left:auto; width:14px; height:14px; color:var(--ink-4); }
.cshell .nav-mod:hover{ background:var(--surface-3); } .cshell .nav-mod.active{ background:var(--accent-wash); color:var(--accent-ink); } .cshell .nav-mod.active svg,.cshell .nav-mod.active .mod-caret{ color:var(--accent-ink); }
.cshell .side-foot{ border-top:1px solid var(--border); padding:10px 12px; flex:none; background:var(--surface); } .cshell .side-foot .me{ display:flex; align-items:center; gap:10px; padding:7px 8px; border-radius:8px; } .cshell .side-foot .me:hover{ background:var(--surface-3); }
.cshell .me .m-ava{ width:30px; height:30px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink); display:grid; place-items:center; font-weight:600; font-size:12px; flex:none; }
.cshell .me .m-name{ font-weight:600; font-size:12.5px; } .cshell .me .m-sub{ font-size:11px; color:var(--ink-3); } .cshell .me .cog{ margin-left:auto; color:var(--ink-3); }
.cshell .sub-side{ background:var(--surface-2); border-right:1px solid var(--border); height:100vh; overflow-y:auto; padding:16px 12px 24px; }
.cshell .sub-side .sp-head{ padding:2px 2px 4px; }
.cshell .sp-title{ display:flex; align-items:center; gap:9px; padding:6px 8px; border-radius:8px; font-size:15px; font-weight:600; letter-spacing:-.01em; color:var(--ink); }
.cshell .sp-title svg{ width:18px; height:18px; color:var(--accent-ink); flex:none; } .cshell .sp-title:hover{ background:var(--surface-3); } .cshell .sp-title.active{ background:var(--surface); box-shadow:var(--shadow-xs); }
.cshell .sp-note{ font-size:11px; color:var(--ink-3); padding:6px 9px 2px; }
.cshell .sp-grp{ font-size:10.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-4); padding:15px 10px 6px; }
.cshell .sp-item{ display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; min-height:34px; color:var(--ink-2); font-weight:500; font-size:12.5px; position:relative; }
.cshell .sp-item svg{ width:16px; height:16px; color:var(--ink-3); flex:none; } .cshell .sp-item span{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cshell .sp-item:hover{ background:var(--surface-3); color:var(--ink); } .cshell .sp-item.active{ background:var(--surface); color:var(--ink); font-weight:600; box-shadow:var(--shadow-xs); } .cshell .sp-item.active svg{ color:var(--accent-ink); }
.cshell .sp-item.active::before{ content:""; position:absolute; left:0; top:8px; bottom:8px; width:2.5px; border-radius:0 3px 3px 0; background:var(--accent); }
.cshell .main{ min-width:0; display:flex; flex-direction:column; height:100vh; }
.cshell .topbar{ display:flex; align-items:center; gap:12px; padding:11px 22px; min-height:57px; border-bottom:1px solid var(--border); background:color-mix(in srgb,var(--bg) 80%,transparent); backdrop-filter:blur(10px); flex:none; }
.cshell .crumb{ font-size:13px; color:var(--ink-3); display:flex; align-items:center; gap:8px; } .cshell .crumb b{ color:var(--ink); font-weight:600; } .cshell .crumb .sep{ color:var(--border-2); } .cshell .tb-spring{ flex:1; }
.cshell .search{ width:260px; display:flex; align-items:center; gap:8px; height:36px; padding:0 11px; border:1px solid var(--border); border-radius:9px; background:var(--surface); color:var(--ink-3); }
.cshell .search input{ border:0; background:transparent; color:var(--ink); width:100%; outline:none; font-size:13px; } .cshell .search input::placeholder{ color:var(--ink-3); }
.cshell .kbd{ font-size:10.5px; color:var(--ink-3); border:1px solid var(--border); border-radius:5px; padding:1px 5px; }
.cshell .ibtn{ width:36px; height:36px; border-radius:9px; border:1px solid var(--border); background:var(--surface); display:grid; place-items:center; color:var(--ink-2); position:relative; }
.cshell .ibtn:hover{ background:var(--surface-3); } .cshell .ibtn svg{ width:17px; height:17px; } .cshell .ibtn .dot{ position:absolute; top:7px; right:8px; width:7px; height:7px; border-radius:50%; background:var(--bad); border:1.5px solid var(--surface); }
.cshell .cscroll{ flex:1; min-height:0; overflow-y:auto; }
.cshell .cscroll .content{ padding:16px 26px 20px; max-width:1320px; width:100%; margin:0 auto; }
@media (max-width:820px){ .cshell .app,.cshell .app.app-sub{ grid-template-columns:1fr; } .cshell .side,.cshell .sub-side{ display:none; } }
`

function BizSwitcher() {
  const { business, businesses } = useBusiness()
  const setActiveBusinessId = useActiveBusinessStore((s) => s.setActiveBusinessId)
  const activeBusinessId = useActiveBusinessStore((s) => s.activeBusinessId)
  const [open, setOpen] = React.useState(false)
  type Biz = { id: number; name?: string; city?: string; subArea?: string }
  const list = (businesses || []) as Biz[]
  const active = activeBusinessId != null ? list.find((b) => b.id === activeBusinessId) || null : null
  const allMode = activeBusinessId == null && list.length > 1
  const subOf = (b?: Biz | null) => (b ? [b.city, b.subArea].filter(Boolean).join(" · ") : "")
  const shown = active || (list.length === 1 ? list[0] : (business as Biz | null))
  const name = allMode ? "Sabhi venue" : (shown?.name || "Your venue")
  const sub = allMode ? `${list.length} venues` : (subOf(shown) || " ")
  return (
    <div className="bizwrap">
      <button className="side-top" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="logo" aria-hidden>{(name.trim()[0] || "R").toUpperCase()}</span>
        <span className="st-txt"><span className="st-name">{name}</span><span className="st-sub">{sub}</span></span>
        <svg className="chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m8 9 4-4 4 4M8 15l4 4 4-4" /></svg>
      </button>
      <div className="bizmenu" role="listbox" hidden={!open}>
        <div className="bm-lbl">Venue chunein</div>
        {list.length > 1 && (
          <>
            <button className={"bm-item" + (activeBusinessId == null ? " on" : "")} role="option" onClick={() => { setActiveBusinessId(null); setOpen(false) }}>
              <span className="bm-ava">S</span><span className="bm-txt"><span className="bm-nm">Sabhi venue</span><span className="bm-sub">{list.length} venues ka rollup</span></span>
            </button>
            <div className="bm-sep" />
          </>
        )}
        {list.length ? list.map((b) => (
          <button key={b.id} className={"bm-item" + (activeBusinessId === b.id ? " on" : "")} role="option" onClick={() => { setActiveBusinessId(b.id); setOpen(false) }}>
            <span className="bm-ava">{((b.name || "?").trim()[0] || "?").toUpperCase()}</span>
            <span className="bm-txt"><span className="bm-nm">{b.name || "Venue"}</span>{subOf(b) ? <span className="bm-sub">{subOf(b)}</span> : null}</span>
          </button>
        )) : <div className="bm-lbl" style={{ textTransform: "none" }}>Koi venue nahi</div>}
      </div>
    </div>
  )
}

export function ChampagneShell({
  children, activeHref: activeHrefProp, crumbBold: crumbBoldProp, crumbSub: crumbSubProp,
}: { children: React.ReactNode; activeHref?: string; crumbBold?: string; crumbSub?: string }) {
  const router = useRouter()
  const setMode = useThemePrefs((s) => s.setMode)
  const resolvedMode = useResolvedThemeMode()
  const { user } = useUser()
  // Props win (standalone use); otherwise follow the shell store (persistent
  // layout use — the active screen pushes its crumb/route there).
  const storeHref = useShellStore((s) => s.activeHref)
  const storeBold = useShellStore((s) => s.crumbBold)
  const storeSub = useShellStore((s) => s.crumbSub)
  const activeHref = activeHrefProp ?? storeHref
  const crumbBold = crumbBoldProp ?? storeBold
  const crumbSub = crumbSubProp ?? storeSub
  const [unread, setUnread] = React.useState(0)
  React.useEffect(() => { let a = true; NotificationAPI.getUnreadCount().then((c: number) => { if (a) setUnread(c) }).catch(() => {}); return () => { a = false } }, [])
  // Reflect the manual light/dark choice onto <html> too, so React pages inside
  // the shell (the settings hub — tailwind `dark:` styles) follow the toggle.
  React.useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", resolvedMode === "dark")
  }, [resolvedMode])
  const hasPanel = SETUP_PATHS.has(activeHref) || KHATA_PATHS.has(activeHref)
  const panelHtml = SETUP_PATHS.has(activeHref) ? setupPanelHtml(activeHref)
    : KHATA_PATHS.has(activeHref) ? khataPanelHtml(activeHref) : ""
  const nav = React.useMemo(() => navHtml(activeHref), [activeHref])
  const fullName = (user as { fullName?: string } | null)?.fullName || ""

  const onClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-act="theme"]')) { e.preventDefault(); setMode(resolvedMode === "dark" ? "light" : "dark"); return }
    const moreBtn = t.closest("[data-nav-more]") as HTMLElement | null
    if (moreBtn) {
      e.preventDefault()
      const panel = moreBtn.parentElement?.querySelector("[data-nav-more-panel]") as HTMLElement | null
      if (panel) { const open = !panel.hidden; panel.hidden = open; moreBtn.setAttribute("aria-expanded", String(!open)) }
      return
    }
    const a = t.closest("a[data-nav]") as HTMLAnchorElement | null
    const b = t.closest("[data-nav-btn]") as HTMLElement | null
    const href = a?.getAttribute("href") || b?.getAttribute("data-nav-btn")
    if (href) { e.preventDefault(); router.push(href) }
  }

  return (
    <div className="cshell" data-theme={resolvedMode} onClick={onClick}>
      <style dangerouslySetInnerHTML={{ __html: CHROME_CSS }} />
      <div className={hasPanel ? "app app-sub" : "app"}>
        <aside className="side">
          <BizSwitcher />
          <nav className="nav" aria-label="Main" dangerouslySetInnerHTML={{ __html: nav }} />
          <div className="side-spring" />
          <div className="side-foot">
            <div className="me" role="button" tabIndex={0} data-nav-btn="/dashboard/profile">
              <span className="m-ava" aria-hidden>{fullName ? initialsOf(fullName) : "·"}</span>
              <span><span className="m-name">{fullName || " "}</span><br /><span className="m-sub">Owner</span></span>
              <svg className="cog" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 3 14.1a2 2 0 1 1 0-4A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 10 3a2 2 0 1 1 4 0 1.6 1.6 0 0 0 3 1.6 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 21 10a2 2 0 1 1 0 4" /></svg>
            </div>
          </div>
        </aside>
        {hasPanel ? <aside className="sub-side" aria-label="Module menu" dangerouslySetInnerHTML={{ __html: panelHtml }} /> : null}
        <div className="main">
          <header className="topbar">
            <div className="crumb"><b>{crumbBold}</b><span className="sep">/</span>{crumbSub}</div>
            <div className="tb-spring" />
            <label className="search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg><input placeholder="Search…" aria-label="Search" onChange={(e) => applyContentSearch(e.currentTarget.value)} /><span className="kbd">⌘K</span></label>
            <button className="ibtn" data-act="theme" title="Theme" aria-label="Toggle theme"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg></button>
            <button className="ibtn" data-nav-btn="/dashboard/notifications" aria-label="Notifications"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>{unread > 0 ? <span className="dot" /> : null}</button>
          </header>
          <div className="cscroll"><div className="content">{children}</div></div>
        </div>
      </div>
    </div>
  )
}

export default ChampagneShell
