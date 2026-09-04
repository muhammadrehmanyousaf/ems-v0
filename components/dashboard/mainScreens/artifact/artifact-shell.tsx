"use client"

/**
 * Artifact shell — the shared sidebar + top bar + design-sample CSS, rendered in
 * a Shadow DOM so the sample's generic class names never collide with the app's
 * global styles. Every "artifact" screen (Overview, Bookings, Khata …) mounts a
 * host <div> and calls useArtifactShell to get the isolated shadow root; it then
 * fills the `#wwc` content slot with its own real-data markup.
 *
 * Wired to the app: theme follows the active dashboard theme, nav uses client
 * routing, and the sidebar shows the real business + user.
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useUser } from "@/context/UserContext"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"
import { useShellStore } from "@/lib/store/shell-store"
import { useResolvedThemeMode } from "@/lib/store/theme-prefs"
import { NotificationAPI } from "@/lib/api/notifications"

export const initialsOf = (s?: string | null) =>
  (s || "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?"

// Pakistani digit grouping: 18,45,000 (2,2,3).
export function pkNum(v: number): string {
  const s = Math.round(Math.abs(v)).toString()
  if (s.length <= 3) return (v < 0 ? "-" : "") + s
  const last3 = s.slice(-3)
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  return (v < 0 ? "-" : "") + rest + "," + last3
}
export const escHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string))

/**
 * Export the first data table inside `#wwc` to a downloaded CSV. Shared by every
 * screen whose header carries an `[data-act="export-table"]` button, so "Export"
 * is one real, consistent action across the console. Skips fully-hidden rows so
 * an active filter/search narrows the export too.
 */
function exportWwcTable(shadow: ShadowRoot, name: string) {
  const wwc = shadow.getElementById("wwc"); if (!wwc) return
  const table = wwc.querySelector("table.tbl") as HTMLTableElement | null
  if (!table) return
  const cell = (el: Element) => `"${(el.textContent || "").replace(/\s+/g, " ").trim().replace(/"/g, '""')}"`
  const heads = [...table.querySelectorAll("thead th")]
  const lines: string[] = []
  if (heads.length) lines.push(heads.map(cell).join(","))
  ;[...table.querySelectorAll("tbody tr")].forEach((tr) => {
    if ((tr as HTMLElement).hidden) return
    const tds = [...tr.querySelectorAll("td")]
    if (tds.length) lines.push(tds.map(cell).join(","))
  })
  if (lines.length <= (heads.length ? 1 : 0)) return
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `${(name || "export").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Full vendor sidebar — mirrors the production nav (components/dashboard/layout/nav-data.ts)
// so every module is reachable, grouped into the same sections.
const IX = {
  grid: `<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>`,
  today: `<path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4z"/><path d="M18.5 15l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z"/>`,
  leads: `<path d="M22 12h-5l-2 3h-6l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>`,
  bookings: `<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>`,
  calendar: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>`,
  chat: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
  fsheet: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h5"/>`,
  customers: `<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="10" r="2.6"/><path d="M7 18a5 5 0 0 1 10 0"/>`,
  khata: `<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>`,
  pay: `<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.4a2 2 0 0 1 2-1.4h1.2a1.8 1.8 0 0 1 0 3.6h-1.4a1.8 1.8 0 0 0 0 3.6H13a2 2 0 0 0 2-1.4"/>`,
  wapsi: `<path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>`,
  receipt: `<path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 8h8M8 12h6"/>`,
  cheque: `<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>`,
  expense: `<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M14 15h4"/>`,
  tax: `<path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3"/><path d="M9 15l6-6M9.5 9.5h.01M14.5 14.5h.01"/>`,
  quotes: `<path d="M20.6 3.4a2 2 0 0 0-1.4-.6H12L3 11.8a2 2 0 0 0 0 2.8l6.4 6.4a2 2 0 0 0 2.8 0L21 12V4.8a2 2 0 0 0-.4-1.4z"/><circle cx="16.5" cy="7.5" r="1.1"/>`,
  holds: `<rect x="3" y="4" width="13" height="16" rx="2"/><path d="M3 9h13M7 2v4M12 2v4"/><circle cx="18" cy="16" r="4.2"/><path d="M18 14.4v1.7l1.1.8"/>`,
  packages: `<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>`,
  promote: `<path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M14 7a5 5 0 0 1 0 10"/>`,
  reviews: `<circle cx="12" cy="12" r="9"/><path d="M8 14a5 5 0 0 0 8 0M9 9h.01M15 9h.01"/>`,
  bell: `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>`,
  field: `<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>`,
  trade: `<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M6.5 10v3.5a2 2 0 0 0 2 2H14"/>`,
  kitchen: `<path d="M6 13a4 4 0 1 1 1-7.9 4 4 0 0 1 8 0A4 4 0 1 1 18 13z"/><path d="M6 13v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6"/>`,
  inventory: `<path d="M3 8l4-2 4 2v4l-4 2-4-2z"/><path d="M13 8l4-2 4 2v4l-4 2-4-2z"/><path d="M8 16l4-2 4 2v4l-4 2-4-2z"/>`,
  staff: `<circle cx="8" cy="8" r="3"/><path d="M2 20a6 6 0 0 1 12 0"/><circle cx="18" cy="7" r="2"/><path d="M16 20a5 5 0 0 1 6-4"/>`,
  suppliers: `<path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>`,
  brokers: `<path d="M8 11.5l2.4 2.4a1.5 1.5 0 0 0 2.1 0L18 8.5"/><path d="M2 12l4-4 4 3M22 12l-4-4-3 2"/>`,
  fuel: `<path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18M3 12h10M16 6l3 3v9a2 2 0 0 1-4 0V9"/>`,
  halal: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>`,
  drone: `<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="18" r="2.4"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M7.7 7.7l1.8 1.8M16.3 7.7l-1.8 1.8M7.7 16.3l1.8-1.8M16.3 16.3l-1.8-1.8"/>`,
  auto: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>`,
  billing: `<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M6 14h6"/>`,
  collab: `<path d="M8 11.5l2.4 2.4a1.5 1.5 0 0 0 2.1 0L18 8.5"/><path d="M2 12l4-4 4 3M22 12l-4-4-3 2"/>`,
  venueos: `<path d="M3 21h18M6 21V7l6-4 6 4v14"/><path d="M10 21v-4h4v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 3 14.1a2 2 0 1 1 0-4A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 10 3a2 2 0 1 1 4 0 1.6 1.6 0 0 0 3 1.6 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 21 10a2 2 0 1 1 0 4"/>`,
  onboarding: `<path d="M11 6h9M11 12h9M11 18h8"/><path d="M3 6l1.4 1.4L7 5M3 12l1.4 1.4L7 11M3 18l1.4 1.4L7 17"/>`,
  policy: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>`,
  reports: `<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>`,
}
// Primary rail — LEAN, like live. Money collapses into one "Khata" module entry
// (secondary sidebar below), and setup collapses into "Set up". Only the daily
// loop stays always-visible; the rest sits behind "Zyada (More)".
const NAV = [
  { sec: "Rozana", items: [["/dashboard", "Overview", IX.grid], ["/dashboard/leads", "Leads", IX.leads],
    ["/dashboard/bookings", "Bookings", IX.bookings], ["/dashboard/calendar", "Calendar", IX.calendar], ["/dashboard/chat", "Chat", IX.chat],
    ["/dashboard/function-sheets", "Function sheets", IX.fsheet], ["/dashboard/customers", "Customers", IX.customers]] },
  // Notifications lives in the top-bar bell (no duplicate row here); "Aaj/Today"
  // removed at founder's direction.
  { sec: "Bechna & serve", items: [["/dashboard/quotes", "Quote requests", IX.quotes], ["/dashboard/holds", "Date holds", IX.holds],
    ["/dashboard/reviews", "Reviews", IX.reviews], ["/dashboard/field", "Field capture", IX.field]] },
  { sec: "Operations", items: [["/dashboard/trade-ops", "Trade ops", IX.trade], ["/dashboard/kitchen-prep", "Kitchen prep", IX.kitchen], ["/dashboard/brokers", "Brokers", IX.brokers]] },
  { sec: "Grow", items: [["/dashboard/insights", "Reports", IX.reports], ["/dashboard/billing", "Plan & billing", IX.billing]] },
]

/**
 * Modules with their OWN secondary sidebar, mirroring the live portal's rail +
 * contextual panel (components/dashboard/layout/module-panels.ts). Each collapses
 * a cluster of related screens behind ONE primary entry so the primary rail stays
 * lean; the secondary column persists across every route the module owns.
 */
type PanelGroup = { grp: string; items: string[][] }

// Khata (money) — live collapses Payments/Receipts/Receivables/Expenses/Cheque/Tax
// into one "Khata" with a Money-in / Money-out / Records panel. Staff & Suppliers
// are money-out and live them here too, out of the primary "More".
const KHATA: PanelGroup[] = [
  { grp: "Aaya (money in)", items: [
    ["/dashboard/payments", "Payments", IX.pay], ["/dashboard/receipts", "Receipts", IX.receipt], ["/dashboard/receivables", "Wapsi (due)", IX.wapsi]] },
  { grp: "Gaya (money out)", items: [
    ["/dashboard/expenses", "Kharche", IX.expense], ["/dashboard/staff", "Staff & payroll", IX.staff], ["/dashboard/suppliers", "Suppliers", IX.suppliers]] },
  { grp: "Records", items: [
    ["/dashboard/pdcs", "Cheque ledger", IX.cheque], ["/dashboard/tax", "Tax report", IX.tax]] },
]
const KHATA_ROOT = "/dashboard/money"
export const KHATA_PATHS = new Set<string>([KHATA_ROOT, ...KHATA.flatMap((g) => g.items.map((i) => i[0]))])

// Set up — every setup/config/compliance module grouped, out of the primary rail.
const SETUP: PanelGroup[] = [
  { grp: "Mera business", items: [
    ["/dashboard/settings", "Business settings", IX.settings], ["/dashboard/onboarding", "Setup checklist", IX.onboarding],
    ["/dashboard/automation", "Automation", IX.auto], ["/dashboard/cancellation-policy", "Cancellation policy", IX.policy]] },
    // "Availability" → /dashboard/availability removed: that route renders the
    // legacy off-shell AvailabilitySetup. On-shell availability is set via the
    // Calendar (Rozana) + "Bookable slots" (/slots) in the Venue group below.
  { grp: "Venue", items: [
    ["/dashboard/spaces", "Halls & spaces", IX.venueos], ["/dashboard/slots", "Bookable slots", IX.holds],
    ["/dashboard/packages", "Packages & menus", IX.packages],
    ["/dashboard/venue-os", "Venue-OS hub", IX.venueos]] },
  { grp: "Stock & compliance", items: [
    ["/dashboard/inventory", "Inventory", IX.inventory], ["/dashboard/generator-fuel", "Generator fuel", IX.fuel],
    ["/dashboard/halal-certs", "Halal certs", IX.halal], ["/dashboard/drone-noc", "Drone NOC", IX.drone]] },
  { grp: "Grow", items: [
    ["/dashboard/promote", "Promote", IX.promote], ["/dashboard/collaborations", "Collaborations", IX.collab]] },
]
const SETUP_ROOT = "/dashboard/setup"
export const SETUP_PATHS = new Set<string>([SETUP_ROOT, ...SETUP.flatMap((g) => g.items.map((i) => i[0]))])

/** A module's secondary-sidebar column (title + grouped items, active row lit). */
function secondaryPanelHtml(rootHref: string, title: string, note: string, ico: string, groups: PanelGroup[], activeHref: string): string {
  const item = ([href, label, ic]: string[]) => {
    const on = href === activeHref
    return `<a data-nav href="${href}" class="sp-item${on ? " active" : ""}"${on ? ' aria-current="page"' : ""} title="${escHtml(label)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ic}</svg><span>${escHtml(label)}</span></a>`
  }
  return `<div class="sp-head"><a data-nav href="${rootHref}" class="sp-title${activeHref === rootHref ? " active" : ""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ico}</svg><span>${escHtml(title)}</span></a><div class="sp-note">${escHtml(note)}</div></div>`
    + groups.map((g) => `<div class="sp-grp">${escHtml(g.grp)}</div>` + g.items.map(item).join("")).join("")
}
export const setupPanelHtml = (activeHref: string) => secondaryPanelHtml(SETUP_ROOT, "Set up", "Venue config & compliance", IX.settings, SETUP, activeHref)
export const khataPanelHtml = (activeHref: string) => secondaryPanelHtml(KHATA_ROOT, "Khata", "Aaya, gaya aur records", IX.khata, KHATA, activeHref)

/** Vendor sidebar nav HTML — shared by the shell and overview's inline copy.
 * Only the daily loop (Rozana) is always visible; the rest sit behind "Zyada
 * (More)". Khata + Set up are their own module entries that open a secondary
 * sidebar (see khataPanelHtml / setupPanelHtml), mirroring the live rail. */
const PRIMARY_SECS = new Set(["Rozana"])
export function navHtml(activeHref: string): string {
  const khataActive = KHATA_PATHS.has(activeHref)
  const setupActive = SETUP_PATHS.has(activeHref)
  const item = ([href, label, ico]: string[]) => {
    const on = href === activeHref
    return `<a data-nav href="${href}"${on ? ' class="active" aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ico}</svg> ${label}</a>`
  }
  const renderSec = (g: (typeof NAV)[number]) => `<div class="nav-sec">${g.sec}</div>` + g.items.map(item).join("")
  const primary = NAV.filter((g) => PRIMARY_SECS.has(g.sec))
  const secondary = NAV.filter((g) => !PRIMARY_SECS.has(g.sec))
  const activeInSecondary = secondary.some((g) => g.items.some(([href]) => href === activeHref))
  const chev = `<svg class="mchev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`
  const caret = `<svg class="mod-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>`
  const modLink = (href: string, label: string, ico: string, active: boolean) =>
    `<a data-nav href="${href}" class="nav-mod${active ? " active" : ""}"${active ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ico}</svg> <span>${label}</span>${caret}</a>`
  return primary.map(renderSec).join("")
    + modLink(KHATA_ROOT, "Khata", IX.khata, khataActive)
    + `<button class="nav-more-btn" data-nav-more aria-expanded="${activeInSecondary}"><span>Zyada (More)</span>${chev}</button>`
    + `<div class="nav-more" data-nav-more-panel${activeInSecondary ? "" : " hidden"}>${secondary.map(renderSec).join("")}</div>`
    + modLink(SETUP_ROOT, "Set up", IX.settings, setupActive)
}

function buildShell(activeHref: string, crumbBold: string, crumbSub: string): string {
  const nav = navHtml(activeHref)
  const panel = SETUP_PATHS.has(activeHref) ? setupPanelHtml(activeHref)
    : KHATA_PATHS.has(activeHref) ? khataPanelHtml(activeHref) : null
  const subSide = panel ? `<aside class="sub-side" aria-label="Module menu">${panel}</aside>` : ""
  return `
<div class="${panel ? "app app-sub" : "app"}">
  <aside class="side">
    <div class="bizwrap">
      <button class="side-top" data-biz-switch aria-haspopup="listbox" aria-expanded="false">
        <span class="logo" aria-hidden="true" data-logo>·</span>
        <span class="st-txt"><span class="st-name" data-biz>Your venue</span><span class="st-sub" data-biz-sub>&nbsp;</span></span>
        <svg class="chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 9 4-4 4 4M8 15l4 4 4-4"/></svg>
      </button>
      <div class="bizmenu" data-bizmenu role="listbox" hidden></div>
    </div>
    <nav class="nav" aria-label="Main">${nav}</nav>
    <div class="side-spring"></div>
    <div class="side-foot"><div class="me" role="button" tabindex="0" data-nav-btn="/dashboard/profile"><span class="m-ava" aria-hidden="true" data-user-ava>·</span><span><span class="m-name" data-user-name>&nbsp;</span><br><span class="m-sub">Owner</span></span><svg class="cog" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 3 14.1a2 2 0 1 1 0-4A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 10 3a2 2 0 1 1 4 0 1.6 1.6 0 0 0 3 1.6 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 21 10a2 2 0 1 1 0 4"/></svg></div></div>
  </aside>
  ${subSide}
  <div class="main">
    <header class="topbar"><div class="crumb"><b>${escHtml(crumbBold)}</b><span class="sep">/</span>${escHtml(crumbSub)}</div><div class="tb-spring"></div>
      <label class="search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input placeholder="Search…" aria-label="Search"/><span class="kbd">⌘K</span></label>
      <button class="ibtn" data-act="theme" title="Theme" aria-label="Toggle theme"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
      <button class="ibtn" data-nav-btn="/dashboard/notifications" aria-label="Notifications"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg><span class="dot" data-unread-dot hidden></span></button>
    </header>
    <div class="content" data-content><div id="wwc"></div></div>
  </div>
  <div class="ww-scrim" data-drawer-scrim hidden></div>
  <aside class="ww-drawer" data-drawer aria-hidden="true">
    <div class="ww-dhead"><h3 class="ww-dtitle" data-drawer-title>—</h3><button class="ww-dx" data-drawer-close aria-label="Band karein"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="ww-dbody" id="ww-drawer-body"></div>
  </aside>
</div>
`
}

// ── Phase 2: content-only shadow ──────────────────────────────────────────
// The shell chrome (sidebar/topbar) is now a PERSISTENT React component
// (PersistentChampagneShell) mounted once in the dashboard layout. Each screen's
// shadow renders ONLY its content (#wwc) + the drawer, so navigating swaps just
// the content and the chrome never rebuilds (no per-route flash). This CSS turns
// the shadow host from the old fixed-inset overlay into a normal in-flow block
// that lives inside the React shell's scroll area.
const CONTENT_MODE_CSS = String.raw`
:host{ position:static !important; inset:auto !important; overflow:visible !important; z-index:auto !important; display:block !important; height:auto !important; min-height:0 !important; background:transparent !important; }
`
function contentShellHtml(): string {
  return `<div id="wwc"></div>
  <div class="ww-scrim" data-drawer-scrim hidden></div>
  <aside class="ww-drawer" data-drawer aria-hidden="true">
    <div class="ww-dhead"><h3 class="ww-dtitle" data-drawer-title>—</h3><button class="ww-dx" data-drawer-close aria-label="Band karein"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="ww-dbody" id="ww-drawer-body"></div>
  </aside>`
}

// The currently-mounted screen's shadow root, so the persistent React top-bar
// search can live-filter the active screen's rows across the shadow boundary.
let ACTIVE_CONTENT_SHADOW: ShadowRoot | null = null
export function applyContentSearch(q: string) {
  const shadow = ACTIVE_CONTENT_SHADOW
  if (!shadow) return
  const query = q.trim().toLowerCase()
  const st = PAGERS.get(shadow)
  if (st) { st.search = query; st.page = 0; pagerRender(st); return }
  const wwc = shadow.getElementById("wwc"); if (!wwc) return
  const rows = wwc.querySelectorAll("tbody tr")
  if (!rows.length) return
  let n = 0
  rows.forEach((tr) => { const el = tr as HTMLElement; const show = !query || (el.textContent || "").toLowerCase().includes(query); el.hidden = !show; if (show) n++ })
  const rc = wwc.querySelector("#rowcount"); if (rc) rc.textContent = `${n} entries`
}

/** Slide a form/content into the right-side drawer. Screens fill `bodyHtml` and
 * handle its buttons in their own shadow click listener; the shell handles close. */
export function openDrawer(shadow: ShadowRoot, title: string, bodyHtml: string) {
  const d = shadow.querySelector("[data-drawer]") as HTMLElement | null
  const scrim = shadow.querySelector("[data-drawer-scrim]") as HTMLElement | null
  const body = shadow.getElementById("ww-drawer-body")
  const t = shadow.querySelector("[data-drawer-title]")
  if (t) t.textContent = title
  if (body) body.innerHTML = bodyHtml
  if (scrim) scrim.hidden = false
  if (d) { requestAnimationFrame(() => d.classList.add("open")); d.setAttribute("aria-hidden", "false") }
}
export function closeDrawer(shadow: ShadowRoot) {
  const d = shadow.querySelector("[data-drawer]") as HTMLElement | null
  const scrim = shadow.querySelector("[data-drawer-scrim]") as HTMLElement | null
  if (d) { d.classList.remove("open"); d.setAttribute("aria-hidden", "true") }
  if (scrim) scrim.hidden = true
}

/**
 * Shared in-design confirm for destructive actions — one consistent dialog for
 * every "sure you want to delete?" across the console, replacing one-click
 * deletes and native window.confirm (which breaks the champagne look). Self-
 * contained: injects its own scrim+card and wires its own buttons, so no screen
 * needs bespoke confirm markup. `onConfirm` runs only when the user confirms.
 */
export function openConfirm(
  shadow: ShadowRoot,
  opts: { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void },
) {
  shadow.querySelector("[data-ww-confirm]")?.remove()
  const wrap = document.createElement("div")
  wrap.setAttribute("data-ww-confirm", "")
  wrap.className = "ww-confirm-scrim"
  wrap.innerHTML = `<div class="ww-confirm" role="dialog" aria-modal="true">
    <div class="wc-title">${escHtml(opts.title)}</div>
    ${opts.message ? `<div class="wc-msg">${escHtml(opts.message)}</div>` : ""}
    <div class="wc-foot"><button class="btn btn-ghost" type="button" data-wc-cancel>${escHtml(opts.cancelLabel || "Rehne dein")}</button><button class="btn ${opts.danger === false ? "btn-primary" : "btn-danger"}" type="button" data-wc-ok>${escHtml(opts.confirmLabel || "Haan, delete karein")}</button></div>
  </div>`
  const close = () => wrap.remove()
  wrap.addEventListener("click", (e) => {
    const t = e.target as HTMLElement
    if (t === wrap || t.closest("[data-wc-cancel]")) { close(); return }
    if (t.closest("[data-wc-ok]")) { close(); try { opts.onConfirm() } catch { /* caller handles */ } }
  })
  shadow.appendChild(wrap)
  requestAnimationFrame(() => (wrap.querySelector("[data-wc-ok]") as HTMLElement | null)?.focus())
}

// ── Shared table pagination ────────────────────────────────────────────────
// One paginator for every list screen: opt in with initTablePager(shadow) after
// filling #wwc. It owns row visibility so it cooperates with BOTH the top-bar /
// toolbar search (the shell delegates to it) and a screen's own tab filter (via
// setPagerFilter). A row is shown only when it passes the filter AND the search
// AND falls on the current page — so paging always reflects the active view.
type PagerState = {
  rows: HTMLElement[]; pageSize: number; page: number
  filter: (tr: HTMLElement) => boolean; search: string
  info: HTMLElement | null; pagesEl: HTMLElement | null; wrap: HTMLElement | null
  rowcount: HTMLElement | null; noun: string; table: HTMLElement | null
}
const PAGERS = new WeakMap<ShadowRoot, PagerState>()

function pagerButtons(page: number, pages: number): string {
  const btn = (p: number) => `<button class="pgnum${p === page ? " on" : ""}" data-pager-page="${p}">${p + 1}</button>`
  const want = new Set<number>([0, 1, pages - 2, pages - 1, page - 1, page, page + 1])
  const list = [...want].filter((p) => p >= 0 && p < pages).sort((a, b) => a - b)
  let html = "", prev = -1
  for (const p of list) { if (prev >= 0 && p - prev > 1) html += `<span class="pgdots">…</span>`; html += btn(p); prev = p }
  return html
}
function pagerRender(st: PagerState) {
  const q = st.search
  const matched = st.rows.filter((tr) => st.filter(tr) && (!q || (tr.textContent || "").toLowerCase().includes(q)))
  const total = matched.length
  const pages = Math.max(1, Math.ceil(total / st.pageSize))
  st.page = Math.min(Math.max(0, st.page), pages - 1)
  const start = st.page * st.pageSize, end = start + st.pageSize
  const on = new Set(matched.slice(start, end))
  st.rows.forEach((tr) => { tr.hidden = !on.has(tr) })
  if (st.rowcount) st.rowcount.textContent = `${total} ${st.noun}`
  if (st.info) st.info.textContent = total === 0 ? "0" : `${start + 1}–${Math.min(end, total)} / ${total}`
  if (st.pagesEl) st.pagesEl.innerHTML = pagerButtons(st.page, pages)
  if (st.wrap) st.wrap.hidden = total <= st.pageSize
}
/** Attach the shared paginator inside #wwc. Idempotent — safe to call again after
 * a re-render (it re-snapshots the rows). Two modes:
 *   • table (default): paginates the first `table.tbl`'s `<tbody> > tr`.
 *   • card list: pass `rows` (a selector for the items to page) and `mount`
 *     (the container the items live in; the pager bar is inserted right after it).
 */
export function initTablePager(shadow: ShadowRoot, opts?: { pageSize?: number; noun?: string; rows?: string; mount?: string }) {
  const wwc = shadow.getElementById("wwc"); if (!wwc) return
  const doc = wwc.ownerDocument!
  let rows: HTMLElement[]; let foot: HTMLElement; let scrollEl: HTMLElement | null
  if (opts?.rows) {
    rows = Array.from(wwc.querySelectorAll(opts.rows)) as HTMLElement[]
    const mount = (opts.mount ? wwc.querySelector(opts.mount) : rows[0]?.parentElement) as HTMLElement | null
    if (!mount || !mount.parentElement) { PAGERS.delete(shadow); return }
    scrollEl = mount
    let f = mount.nextElementSibling as HTMLElement | null
    if (!f || !f.classList.contains("pgfoot")) { f = doc.createElement("div"); f.className = "tbl-foot pgfoot"; mount.parentElement.insertBefore(f, mount.nextSibling) }
    foot = f
  } else {
    const table = wwc.querySelector("table.tbl") as HTMLTableElement | null
    const tbody = table?.querySelector("tbody") as HTMLElement | null
    if (!table || !tbody) { PAGERS.delete(shadow); return }
    rows = Array.from(tbody.querySelectorAll(":scope > tr")) as HTMLElement[]
    scrollEl = table
    const card = (table.closest(".card") as HTMLElement | null) || (table.parentElement as HTMLElement | null)
    let f = card?.querySelector(".tbl-foot") as HTMLElement | null
    if (!f) { f = doc.createElement("div"); f.className = "tbl-foot"; card?.appendChild(f) }
    foot = f
  }
  let rowcount = foot.querySelector("#rowcount") as HTMLElement | null
  if (!rowcount) {
    // Reuse a screen's existing count span (e.g. "193 entries") so we don't
    // render a duplicate; only create one if the foot has none.
    const existing = foot.querySelector("span:not([data-pager] span)") as HTMLElement | null
    if (existing && !existing.closest("[data-pager]")) { existing.id = "rowcount"; rowcount = existing }
    else { rowcount = doc.createElement("span"); rowcount.id = "rowcount"; foot.prepend(rowcount) }
  }
  let wrap = foot.querySelector("[data-pager]") as HTMLElement | null
  if (!wrap) {
    wrap = doc.createElement("div"); wrap.className = "pager"; wrap.setAttribute("data-pager", "")
    wrap.innerHTML = `<button class="pgbtn" data-pager-prev aria-label="Pichla page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button><span class="pgnums" data-pager-pages></span><button class="pgbtn" data-pager-next aria-label="Agla page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button><span class="pager-info" data-pager-info></span>`
    foot.appendChild(wrap)
  }
  const st: PagerState = {
    rows,
    pageSize: opts?.pageSize ?? 25, page: 0, filter: () => true, search: "",
    info: wrap.querySelector("[data-pager-info]"), pagesEl: wrap.querySelector("[data-pager-pages]"),
    wrap, rowcount, noun: opts?.noun ?? "entries", table: scrollEl,
  }
  PAGERS.set(shadow, st)
  pagerRender(st)
}
/** A screen's own tab/segment filter routes through the pager so filter + search
 * + paging stay consistent. Pass a predicate that returns true for rows to keep. */
export function setPagerFilter(shadow: ShadowRoot, filter: (tr: HTMLElement) => boolean) {
  const st = PAGERS.get(shadow); if (!st) return
  st.filter = filter; st.page = 0; pagerRender(st)
}

/** Tiny per-screen preference store (localStorage, SSR-/blocked-safe). Used to
 * remember a screen's active filter tab across reloads and re-navigation. */
export function savePref(key: string, val: string) { try { localStorage.setItem("wwp:" + key, val) } catch { /* storage blocked */ } }
export function loadPref(key: string, fallback = ""): string { try { return localStorage.getItem("wwp:" + key) ?? fallback } catch { return fallback } }
/** Restore a pager-filter screen's saved tab after a re-render: activates the tab
 * chip in `#tabs` and applies its filter via `apply`. Returns the active filter. */
export function restoreTab(shadow: ShadowRoot, key: string, apply: (f: string) => void): string {
  const f = loadPref(key, "all")
  if (f && f !== "all") {
    const tabsEl = shadow.getElementById("tabs")
    if (tabsEl && tabsEl.querySelector(`.tab[data-f="${f}"]`)) {
      tabsEl.querySelectorAll(".tab").forEach((x) => (x as HTMLElement).classList.toggle("on", (x as HTMLElement).dataset.f === f))
      apply(f)
    }
  }
  return f
}

/** Trust-preserving error banner — distinguishes a FAILED load ("missing, not
 * zero") from a genuinely empty result, so a money screen never silently shows
 * an empty table when the fetch broke. Screens render it when `query.isError`
 * and handle the `[data-retry]` button (refetch / invalidate). */
export function errorBannerHtml(msg = "Figures load nahi ho sake — ye missing hain, sifar nahi. Dobara koshish karein."): string {
  return `<div class="errbanner" role="alert"><span class="eb-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg></span><div class="eb-txt"><b>Load nahi hua</b><span>${escHtml(msg)}</span></div><button class="btn btn-ghost sm" data-retry type="button">Dobara koshish</button></div>`
}

/**
 * Inline venue picker for the "aggregate scope, but this screen needs ONE venue"
 * empty state. Renders `data-biz-pick` buttons — the shell's global click handler
 * already turns those into setActiveBusinessId(), so no extra wiring is needed.
 * Replaces dead-end "Pehle ek venue chunein" text with a one-tap chooser.
 */
export function venuePickerHtml(
  businesses: Array<{ id: number; name?: string; city?: string; subArea?: string }>,
  opts: { title?: string; sub?: string } = {},
): string {
  const list = businesses || []
  const title = opts.title || "Kaunsi venue?"
  const sub = opts.sub || "Ye screen ek venue ke liye hai — neeche se chunein."
  if (!list.length) return `<div class="loadwrap">Abhi koi venue nahi.</div>`
  const rows = list
    .map((b) => {
      const nm = b.name || "Venue"
      const sb = [b.city, b.subArea].filter(Boolean).join(" · ")
      return `<button class="vpick" data-biz-pick="${b.id}" type="button"><span class="vp-ava">${escHtml((nm.trim()[0] || "?").toUpperCase())}</span><span class="vp-txt"><span class="vp-nm">${escHtml(nm)}</span>${sb ? `<span class="vp-sub">${escHtml(sb)}</span>` : ""}</span><span class="vp-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></button>`
    })
    .join("")
  return `<div class="vpick-wrap"><div class="vpick-hd"><div class="vpick-t">${escHtml(title)}</div><div class="vpick-s">${escHtml(sub)}</div></div><div class="vpick-list">${rows}</div></div>`
}

export const SHELL_CSS = String.raw`
:host{ position:fixed; inset:0; overflow:auto; z-index:45; display:block; background:var(--bg); color:var(--ink);
  font-family:"Geist","Inter",system-ui,-apple-system,"Segoe UI",sans-serif; font-size:13.5px; line-height:1.5; -webkit-font-smoothing:antialiased; letter-spacing:-.006em;
  --bg:#F7F6F3; --surface:#FFFFFF; --surface-2:#FAF9F6; --surface-3:#F3F1EC; --ink:#1A1815; --ink-2:#605A52; --ink-3:#6E6A62; --ink-4:#8C857B;
  --border:#EBE9E3; --border-2:#DEDBD3; --accent:#B8863B; --accent-ink:#8A6220; --accent-wash:#F5EFE2; --accent-line:#E3D3AE; --on-accent:#FFFFFF;
  --ok:#3F7A55; --ok-wash:#EEF4EF; --warn:#8A6220; --warn-wash:#F6EEDD; --info:#3F6FA6; --info-wash:#EDF2F8; --bad:#A24845; --bad-wash:#F8ECEB; --chart:#B8863B;
  --shadow-xs:0 1px 2px rgba(20,18,15,.04); --shadow-sm:0 1px 3px rgba(20,18,15,.06),0 1px 2px rgba(20,18,15,.04); --shadow-md:0 8px 24px -12px rgba(20,18,15,.16);
  --r:12px; --r-sm:9px; --r-xs:7px; }
@media (prefers-color-scheme:dark){ :host(:not([data-theme="light"])){
  --bg:#0C0B09; --surface:#161410; --surface-2:#121009; --surface-3:#1E1B15; --ink:#F5F2EC; --ink-2:#ABA498; --ink-3:#9A9184; --ink-4:#6B6558;
  --border:#26231C; --border-2:#322E25; --accent:#D8A85A; --accent-ink:#E7C079; --accent-wash:#221B10; --accent-line:#3A2F1A; --on-accent:#231A08;
  --ok:#7FB894; --ok-wash:#16211A; --warn:#D6A94E; --warn-wash:#221B0F; --info:#7FA6D6; --info-wash:#141D28; --bad:#DA9490; --bad-wash:#241614; --chart:#D8A85A;
  --shadow-xs:0 1px 2px rgba(0,0,0,.4); --shadow-sm:0 1px 3px rgba(0,0,0,.5); --shadow-md:0 10px 28px -12px rgba(0,0,0,.6); }}
:host([data-theme="dark"]){
  --bg:#0C0B09; --surface:#161410; --surface-2:#121009; --surface-3:#1E1B15; --ink:#F5F2EC; --ink-2:#ABA498; --ink-3:#9A9184; --ink-4:#6B6558;
  --border:#26231C; --border-2:#322E25; --accent:#D8A85A; --accent-ink:#E7C079; --accent-wash:#221B10; --accent-line:#3A2F1A; --on-accent:#231A08;
  --ok:#7FB894; --ok-wash:#16211A; --warn:#D6A94E; --warn-wash:#221B0F; --info:#7FA6D6; --info-wash:#141D28; --bad:#DA9490; --bad-wash:#241614; --chart:#D8A85A;
  --shadow-xs:0 1px 2px rgba(0,0,0,.4); --shadow-sm:0 1px 3px rgba(0,0,0,.5); --shadow-md:0 10px 28px -12px rgba(0,0,0,.6); }
*{box-sizing:border-box}
.tnum{ font-variant-numeric:tabular-nums; }
h1,h2,h3{ margin:0; line-height:1.2; letter-spacing:-.02em; font-weight:600; }
a{ color:inherit; text-decoration:none; } button{ font:inherit; color:inherit; cursor:pointer; }
::selection{ background:var(--accent-wash); } svg{ display:block; }
.app{ display:grid; grid-template-columns:236px 1fr; min-height:100%; }
.side{ background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; position:sticky; top:0; height:100vh; overflow-y:auto; }
.side-top{ display:flex; align-items:center; gap:10px; width:100%; padding:16px 16px 14px; border:0; border-bottom:1px solid var(--border); background:transparent; text-align:left; transition:background .12s; }
.side-top:hover{ background:var(--surface-3); } .side-top[aria-expanded="true"]{ background:var(--surface-3); } .side-top[aria-expanded="true"] .chev{ color:var(--accent-ink); }
.bizwrap{ position:relative; }
.bizmenu{ position:absolute; left:12px; right:12px; top:calc(100% - 6px); z-index:60; background:var(--surface); border:1px solid var(--border-2); border-radius:11px; box-shadow:var(--shadow-md); padding:6px; max-height:60vh; overflow-y:auto; }
.bizmenu .bm-lbl{ font-size:10.5px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:var(--ink-4); padding:8px 9px 5px; }
.bizmenu .bm-item{ display:flex; align-items:center; gap:10px; width:100%; text-align:left; border:0; background:transparent; padding:8px 9px; border-radius:8px; color:var(--ink); }
.bizmenu .bm-item:hover{ background:var(--surface-3); }
.bizmenu .bm-item .bm-ava{ width:28px; height:28px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink-2); display:grid; place-items:center; font-weight:700; font-size:11px; flex:none; }
.bizmenu .bm-item.on .bm-ava{ background:var(--accent); color:var(--on-accent); border-color:transparent; }
.bizmenu .bm-item .bm-txt{ flex:1; min-width:0; } .bizmenu .bm-item .bm-nm{ display:block; font-size:12.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bizmenu .bm-item .bm-sub{ display:block; font-size:11px; color:var(--ink-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
.bizmenu .bm-item .bm-tick{ margin-left:auto; color:var(--accent-ink); flex:none; } .bizmenu .bm-item .bm-tick svg{ width:16px; height:16px; }
.bizmenu .bm-sep{ height:1px; background:var(--border); margin:5px 4px; }
.logo{ width:32px; height:32px; border-radius:9px; background:var(--accent); color:var(--on-accent); display:grid; place-items:center; font-weight:700; font-size:15px; flex:none; box-shadow:var(--shadow-xs); }
.side-top .st-txt{ flex:1; min-width:0; } .side-top .st-name{ display:block; font-weight:600; font-size:13px; letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.side-top .st-sub{ display:block; font-size:11.5px; color:var(--ink-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; } .side-top .chev{ color:var(--ink-3); flex:none; }
.nav{ padding:10px 12px 4px; } .side-spring{ flex:1 1 auto; min-height:14px; }
.nav-sec{ font-size:11px; font-weight:600; letter-spacing:.04em; color:var(--ink-3); text-transform:uppercase; padding:14px 10px 6px; } .nav-sec:first-child{ padding-top:2px; }
.nav a{ display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; min-height:36px; color:var(--ink-2); font-weight:500; font-size:13px; position:relative; transition:background .12s,color .12s; }
.nav a svg{ width:17px; height:17px; color:var(--ink-3); flex:none; }
.nav a:hover{ background:var(--surface-3); color:var(--ink); } .nav a:hover svg{ color:var(--ink-2); }
.nav a.active{ background:var(--surface-3); color:var(--ink); font-weight:600; } .nav a.active svg{ color:var(--accent-ink); }
.nav a.active::before{ content:""; position:absolute; left:0; top:9px; bottom:9px; width:2.5px; border-radius:0 3px 3px 0; background:var(--accent); }
.nav a .badge{ margin-left:auto; font-size:11px; font-weight:600; color:var(--ink-2); background:var(--surface-3); border:1px solid var(--border); border-radius:20px; padding:0 7px; min-width:20px; text-align:center; }
.nav-more-btn{ display:flex; align-items:center; justify-content:space-between; gap:10px; width:calc(100% - 24px); margin:10px 12px 2px; padding:8px 10px; border-radius:8px; border:0; background:transparent; color:var(--ink-3); font-weight:600; font-size:11px; letter-spacing:.04em; text-transform:uppercase; }
.nav-more-btn:hover{ background:var(--surface-3); color:var(--ink); } .nav-more-btn .mchev{ width:15px; height:15px; transition:transform .15s; color:var(--ink-4); } .nav-more-btn[aria-expanded="true"] .mchev{ transform:rotate(180deg); }
.nav-more[hidden]{ display:none; }
.side-foot{ border-top:1px solid var(--border); padding:10px 12px; } .side-foot .me{ display:flex; align-items:center; gap:10px; padding:7px 8px; border-radius:8px; } .side-foot .me:hover{ background:var(--surface-3); }
.me .m-ava{ width:30px; height:30px; border-radius:8px; background:var(--surface-3); border:1px solid var(--border-2); color:var(--ink); display:grid; place-items:center; font-weight:600; font-size:12px; flex:none; }
.me .m-name{ font-weight:600; font-size:12.5px; } .me .m-sub{ font-size:11px; color:var(--ink-3); } .me .cog{ margin-left:auto; color:var(--ink-3); }
.main{ min-width:0; display:flex; flex-direction:column; }
.topbar{ display:flex; align-items:center; gap:12px; padding:11px 22px; min-height:57px; border-bottom:1px solid var(--border); background:color-mix(in srgb,var(--bg) 80%,transparent); backdrop-filter:blur(10px); position:sticky; top:0; z-index:20; }
.crumb{ font-size:13px; color:var(--ink-3); display:flex; align-items:center; gap:8px; } .crumb b{ color:var(--ink); font-weight:600; } .crumb .sep{ color:var(--border-2); } .tb-spring{ flex:1 }
.search{ width:260px; display:flex; align-items:center; gap:8px; height:36px; padding:0 11px; border:1px solid var(--border); border-radius:9px; background:var(--surface); color:var(--ink-3); }
.search input{ border:0; background:transparent; color:var(--ink); width:100%; outline:none; font-size:13px; } .search input::placeholder{ color:var(--ink-3); }
.kbd{ font-size:10.5px; color:var(--ink-3); border:1px solid var(--border); border-radius:5px; padding:1px 5px; }
.ibtn{ width:36px; height:36px; border-radius:9px; border:1px solid var(--border); background:var(--surface); display:grid; place-items:center; color:var(--ink-2); position:relative; }
.ibtn:hover{ background:var(--surface-3); } .ibtn svg{ width:17px; height:17px; } .ibtn .dot{ position:absolute; top:7px; right:8px; width:7px; height:7px; border-radius:50%; background:var(--bad); border:1.5px solid var(--surface); }
.content{ padding:16px 26px 20px; max-width:1320px; width:100%; margin:0 auto; }
.head{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:14px; flex-wrap:wrap; }
.head h1{ font-size:22px; font-weight:600; letter-spacing:-.025em; } .head .sub{ color:var(--ink-3); font-size:13px; margin-top:5px; } .head .sub b{ color:var(--ink-2); font-weight:600; }
.head-actions{ display:flex; gap:8px; }
.btn{ display:inline-flex; align-items:center; justify-content:center; gap:7px; height:36px; padding:0 14px; border-radius:9px; font-weight:600; font-size:13px; border:1px solid transparent; white-space:nowrap; transition:background .12s,border-color .12s; }
.btn svg{ width:16px; height:16px; } .btn-primary{ background:var(--accent); color:var(--on-accent); box-shadow:var(--shadow-xs); } .btn-primary:hover{ filter:brightness(1.05); }
.btn-ghost{ background:var(--surface); border-color:var(--border-2); color:var(--ink); } .btn-ghost:hover{ background:var(--surface-3); } .btn.sm{ height:32px; padding:0 11px; font-size:12.5px; }
.btn-danger{ background:var(--bad); color:#fff; box-shadow:var(--shadow-xs); } .btn-danger:hover{ filter:brightness(1.06); }
.ww-confirm-scrim{ position:fixed; inset:0; background:rgba(20,18,15,.4); backdrop-filter:blur(2px); z-index:90; display:grid; place-items:center; padding:20px; animation:wwfade .16s ease; }
.ww-confirm{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-md); padding:20px 22px; width:390px; max-width:100%; }
.wc-title{ font-size:15.5px; font-weight:600; letter-spacing:-.01em; }
.wc-msg{ font-size:13px; color:var(--ink-2); margin-top:8px; line-height:1.55; }
.wc-foot{ display:flex; gap:9px; justify-content:flex-end; margin-top:18px; }
.card{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); }
.st{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 8px 2px 7px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); color:var(--ink-2); white-space:nowrap; }
.st i{ width:6px; height:6px; border-radius:50%; flex:none; }
.st.ok i{ background:var(--ok); } .st.ok{ color:var(--ok); background:var(--ok-wash); border-color:transparent; }
.st.warn i{ background:var(--warn); } .st.warn{ color:var(--warn); background:var(--warn-wash); border-color:transparent; }
.st.info i{ background:var(--info); } .st.info{ color:var(--info); background:var(--info-wash); border-color:transparent; }
.st.bad i{ background:var(--bad); } .st.bad{ color:var(--bad); background:var(--bad-wash); border-color:transparent; }
.st.mut i{ background:var(--ink-4); } .st.acc{ color:var(--accent-ink); background:var(--accent-wash); border-color:transparent; } .st.acc i{ background:var(--accent); }
.ava{ width:34px; height:34px; border-radius:9px; flex:none; display:grid; place-items:center; font-weight:600; font-size:11px; background:var(--surface-3); border:1px solid var(--border); color:var(--ink-2); }
.paybar{ height:4px; border-radius:3px; background:var(--surface-3); overflow:hidden; } .paybar span{ display:block; height:100%; border-radius:3px; background:var(--accent); }
.paybar span.zero{ background:repeating-linear-gradient(90deg,var(--border-2) 0 4px,transparent 4px 8px); width:100% !important; opacity:.7; }
.d-ok{ background:var(--ok);} .d-warn{ background:var(--warn);} .d-info{ background:var(--info);} .d-bad{ background:var(--bad);} .d-mut{ background:var(--ink-4);} .d-acc{ background:var(--accent);}
/* toolbar + tabs + segmented */
.toolbar{ display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
.tabs{ display:inline-flex; gap:2px; background:var(--surface-2); border:1px solid var(--border); border-radius:10px; padding:3px; flex-wrap:wrap; }
.tab{ display:inline-flex; align-items:center; gap:7px; height:30px; padding:0 11px; border-radius:7px; border:0; background:transparent; color:var(--ink-2); font-size:12.5px; font-weight:600; }
.tab:hover{ color:var(--ink); } .tab.on{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); }
.tab .dot{ width:7px; height:7px; border-radius:50%; } .tab .cnt{ font-size:11px; font-weight:600; color:var(--ink-3); font-variant-numeric:tabular-nums; } .tab.on .cnt{ color:var(--ink-2); }
.filters{ display:flex; align-items:center; gap:8px; margin-left:auto; }
.f-search{ width:220px; display:flex; align-items:center; gap:8px; height:34px; padding:0 11px; border:1px solid var(--border); border-radius:9px; background:var(--surface); color:var(--ink-3); }
.f-search input{ border:0; background:transparent; color:var(--ink); width:100%; outline:none; font-size:12.5px; } .f-search input::placeholder{ color:var(--ink-3); } .f-search svg{ width:15px; height:15px; }
.fbtn{ display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 11px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--ink-2); font-size:12.5px; font-weight:600; }
.fbtn:hover{ background:var(--surface-3); color:var(--ink); } .fbtn svg{ width:14px; height:14px; color:var(--ink-3); }
/* table — .tbl-wrap is a bounded scroll region (height set by the shell's
   layout manager) so only the ROWS move: the page head, toolbar/tabs and the
   column headers stay frozen. Falls back to a normal auto-height table (page
   scroll) if the manager hasn't sized it yet. */
.tbl-wrap{ overflow:auto; }
.tbl-wrap.ww-bounded{ overflow:auto; } /* height applied inline by the shell */
/* Card/feed lists opt into the same "frozen header, scrolling list" behaviour by
   marking their scroll container with data-ww-list; the shell bounds its height. */
[data-ww-list]{ overflow:auto; }
[data-ww-list].ww-bounded{ overflow:auto; }
table.tbl{ width:100%; border-collapse:collapse; }
.tbl thead{ position:sticky; top:0; z-index:4; }
.tbl thead th{ text-align:left; font-size:11px; font-weight:600; color:var(--ink-3); text-transform:uppercase; letter-spacing:.03em; padding:11px 15px; border-bottom:1px solid var(--border); white-space:nowrap; background:var(--surface-2); position:sticky; top:0; z-index:4; }
.tbl-wrap.ww-bounded thead th{ box-shadow:inset 0 -1px 0 var(--border), 0 4px 8px -6px rgba(20,18,15,.18); }
.tbl thead th.r{ text-align:right; } .tbl thead th:first-child{ border-top-left-radius:var(--r); } .tbl thead th:last-child{ border-top-right-radius:var(--r); }
.tbl tbody td{ padding:12px 15px; border-bottom:1px solid var(--border); vertical-align:middle; white-space:nowrap; font-size:12.5px; }
.tbl tbody tr:last-child td{ border-bottom:0; } .tbl tbody tr{ transition:background .1s; cursor:pointer; } .tbl tbody tr:hover{ background:var(--surface-3); }
.c-couple{ display:flex; align-items:center; gap:11px; } .cc-nm{ font-weight:600; font-size:13px; color:var(--ink); } .cc-ev{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.td-mut{ color:var(--ink-2); } .td-date{ font-weight:500; } .td-date .sub{ color:var(--ink-3); font-weight:400; font-size:11px; } .td-guests{ color:var(--ink-2); font-weight:500; }
.r{ text-align:right; } .td-amt{ font-weight:660; letter-spacing:-.01em; } .td-amt .rs{ font-size:11px; color:var(--ink-3); font-weight:600; } .td-amt .sub{ display:block; font-size:11px; font-weight:500; margin-top:1px; }
.td-amt .sub.due{ color:var(--warn); } .td-amt .sub.ok{ color:var(--ok); }
.pay-mini{ display:flex; align-items:center; gap:9px; min-width:120px; } .pay-mini .paybar{ flex:1; } .pay-mini .pct{ font-size:11px; color:var(--ink-3); font-weight:600; font-variant-numeric:tabular-nums; width:30px; text-align:right; }
.rowmenu{ width:28px; height:28px; border-radius:7px; border:0; background:transparent; color:var(--ink-3); display:grid; place-items:center; } .rowmenu:hover{ background:var(--surface); color:var(--ink); } .rowmenu svg{ width:16px; height:16px; }
.tbl-foot{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 15px; border-top:1px solid var(--border); font-size:12px; color:var(--ink-3); flex-wrap:wrap; }
/* shared paginator */
.pager{ display:flex; align-items:center; gap:4px; margin-left:auto; } .pager[hidden]{ display:none; }
.pager .pgbtn{ width:30px; height:30px; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; } .pager .pgbtn:hover{ background:var(--surface-3); color:var(--ink); } .pager .pgbtn svg{ width:15px; height:15px; }
.pager .pgnums{ display:inline-flex; gap:2px; align-items:center; }
.pager .pgnum{ min-width:30px; height:30px; padding:0 8px; border-radius:8px; border:1px solid transparent; background:transparent; color:var(--ink-2); font-weight:600; font-size:12.5px; font-variant-numeric:tabular-nums; } .pager .pgnum:hover{ background:var(--surface-3); color:var(--ink); }
.pager .pgnum.on{ background:var(--accent); color:var(--on-accent); box-shadow:var(--shadow-xs); }
.pager .pgdots{ color:var(--ink-4); padding:0 3px; } .pager .pager-info{ font-size:11.5px; color:var(--ink-3); margin-left:8px; font-variant-numeric:tabular-nums; white-space:nowrap; }
@media (max-width:640px){ .pager .pager-info{ display:none; } }
.empty{ padding:48px 16px; text-align:center; color:var(--ink-3); font-size:13px; }
.errbanner{ display:flex; align-items:center; gap:12px; padding:13px 15px; margin-bottom:14px; background:var(--bad-wash); border:1px solid color-mix(in srgb,var(--bad) 32%,transparent); border-radius:var(--r); }
.errbanner .eb-ic{ width:34px; height:34px; border-radius:9px; background:var(--surface); display:grid; place-items:center; color:var(--bad); flex:none; } .errbanner .eb-ic svg{ width:18px; height:18px; }
.errbanner .eb-txt{ flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; } .errbanner .eb-txt b{ font-size:13px; color:var(--ink); } .errbanner .eb-txt span{ font-size:12px; color:var(--ink-2); }
.errbanner .btn{ flex:none; }
.foot{ text-align:center; color:var(--ink-4); font-size:11.5px; margin-top:26px; }
/* shared micro — canonical versions of classes screens were each copy-pasting.
   Injected before extraCss, so a screen's own copy still wins; these only supply
   the canon to screens that don't define their own (and stop future drift). */
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
.vpick-wrap{ max-width:440px; margin:44px auto; }
.vpick-hd{ text-align:center; margin-bottom:16px; }
.vpick-t{ font-size:16px; font-weight:660; letter-spacing:-.01em; }
.vpick-s{ font-size:12.5px; color:var(--ink-3); margin-top:4px; }
.vpick-list{ display:grid; gap:8px; }
.vpick{ display:flex; align-items:center; gap:12px; width:100%; text-align:left; padding:12px 14px; background:var(--surface); border:1px solid var(--border); border-radius:var(--r); cursor:pointer; font:inherit; color:var(--ink); }
.vpick:hover{ border-color:var(--accent-line); background:var(--surface-3); }
.vp-ava{ width:34px; height:34px; border-radius:9px; background:var(--accent-wash); border:1px solid var(--accent-line); color:var(--accent-ink); display:grid; place-items:center; font-weight:700; font-size:14px; flex:none; }
.vp-txt{ flex:1; min-width:0; } .vp-nm{ font-weight:600; font-size:13.5px; display:block; } .vp-sub{ font-size:11.5px; color:var(--ink-3); }
.vp-go{ color:var(--ink-3); display:grid; place-items:center; } .vp-go svg{ width:17px; height:17px; }
.iconbtn{ width:32px; height:32px; flex:none; border-radius:8px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:grid; place-items:center; transition:background .12s,color .12s,border-color .12s; }
.iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn svg{ width:15px; height:15px; }
.iconbtn.wa:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn.ok:hover{ color:var(--ok); border-color:var(--ok); } .iconbtn.bad:hover{ color:var(--bad); border-color:var(--bad); } .iconbtn:disabled{ opacity:.4; cursor:default; }
.rs{ font-size:11px; color:var(--ink-3); font-weight:600; }
*{ scrollbar-width:thin; scrollbar-color:var(--border-2) transparent; }
::-webkit-scrollbar{ width:11px; height:11px; } ::-webkit-scrollbar-track{ background:transparent; }
::-webkit-scrollbar-thumb{ background-color:var(--border-2); border-radius:20px; border:3px solid transparent; background-clip:padding-box; } ::-webkit-scrollbar-thumb:hover{ background-color:var(--ink-4); }
@media (max-width:980px){ .filters{ margin-left:0; width:100%; } .f-search{ flex:1; width:auto; } }
@media (max-width:820px){ .app{ grid-template-columns:1fr; } .side{ position:fixed; left:0; top:0; bottom:0; width:236px; transform:translateX(-100%); z-index:50; } .content{ padding:20px 16px 40px; } .search{ display:none; } }
/* right-side drawer (create/edit booking · customer · lead) */
.ww-scrim{ position:fixed; inset:0; background:rgba(20,18,15,.34); backdrop-filter:blur(2px); z-index:80; animation:wwfade .2s ease; } .ww-scrim[hidden]{ display:none; }
@keyframes wwfade{ from{ opacity:0 } to{ opacity:1 } }
.ww-drawer{ position:fixed; top:0; right:0; bottom:0; width:460px; max-width:94vw; background:var(--surface); border-left:1px solid var(--border); box-shadow:-14px 0 44px -20px rgba(20,18,15,.45); z-index:81; transform:translateX(100%); transition:transform .26s cubic-bezier(.4,0,.2,1); display:flex; flex-direction:column; }
.ww-drawer.open{ transform:translateX(0); }
.ww-dhead{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 20px; border-bottom:1px solid var(--border); flex:none; background:linear-gradient(180deg,var(--accent-wash),transparent); }
.ww-dtitle{ font-size:16px; font-weight:600; letter-spacing:-.01em; }
.ww-dx{ width:34px; height:34px; border-radius:9px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; flex:none; } .ww-dx:hover{ background:var(--surface-3); color:var(--ink); } .ww-dx svg{ width:17px; height:17px; }
.ww-dbody{ flex:1; overflow-y:auto; padding:18px 20px 28px; }
.ww-dbody .dfield{ display:flex; flex-direction:column; gap:5px; margin-bottom:14px; } .ww-dbody .dfield.row2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.ww-dbody .dlabel{ font-size:11.5px; font-weight:600; color:var(--ink-2); } .ww-dbody .dlabel .req{ color:var(--bad); }
.ww-dbody input,.ww-dbody select,.ww-dbody textarea{ width:100%; border:1px solid var(--border-2); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:9px 11px; font:inherit; font-size:13px; outline:none; } .ww-dbody input:focus,.ww-dbody select:focus,.ww-dbody textarea:focus{ border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px var(--accent-wash); }
.ww-dbody textarea{ min-height:76px; resize:vertical; }
.ww-dbody .bf-sec{ font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--accent-ink); margin:18px 0 11px; padding-bottom:5px; border-bottom:1px solid var(--border); } .ww-dbody .bf-sec:first-child{ margin-top:0; }
.ww-dbody .bf-hint{ font-size:11.5px; color:var(--ink-3); background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 10px; margin-bottom:14px; line-height:1.5; }
.ww-dfoot{ display:flex; gap:9px; justify-content:flex-end; padding-top:6px; position:sticky; bottom:-28px; background:var(--surface); }
@media (max-width:820px){ .ww-drawer{ width:100vw; max-width:100vw; } }
/* ── Module entries (Khata, Set up) + their secondary sidebar column ──────── */
.nav-mod{ display:flex; align-items:center; gap:10px; margin:8px 12px 2px; padding:9px 10px; border-radius:8px; color:var(--ink); font-weight:600; font-size:13px; position:relative; transition:background .12s,color .12s; }
.nav-mod svg{ width:17px; height:17px; color:var(--ink-3); flex:none; }
.nav-mod .mod-caret{ margin-left:auto; width:14px; height:14px; color:var(--ink-4); }
.nav-mod:hover{ background:var(--surface-3); } .nav-mod:hover svg{ color:var(--ink-2); }
.nav-mod.active{ background:var(--accent-wash); color:var(--accent-ink); } .nav-mod.active svg,.nav-mod.active .mod-caret{ color:var(--accent-ink); }
.nav-more-btn + .nav-mod, .nav-more + .nav-mod{ margin-top:10px; }
.nav-more-btn + .nav-mod::before, .nav-more + .nav-mod::before{ content:""; position:absolute; top:-6px; left:2px; right:2px; height:1px; background:var(--border); }
.sub-side{ background:var(--surface-2); border-right:1px solid var(--border); position:sticky; top:0; height:100vh; overflow-y:auto; padding:16px 12px 24px; }
.sub-side .sp-head{ padding:2px 2px 4px; }
.sp-title{ display:flex; align-items:center; gap:9px; padding:6px 8px; border-radius:8px; font-size:15px; font-weight:600; letter-spacing:-.01em; color:var(--ink); }
.sp-title svg{ width:18px; height:18px; color:var(--accent-ink); flex:none; }
.sp-title:hover{ background:var(--surface-3); } .sp-title.active{ background:var(--surface); box-shadow:var(--shadow-xs); }
.sp-note{ font-size:11px; color:var(--ink-3); padding:6px 9px 2px; }
.sp-grp{ font-size:10.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-4); padding:15px 10px 6px; }
.sp-item{ display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; min-height:34px; color:var(--ink-2); font-weight:500; font-size:12.5px; position:relative; transition:background .12s,color .12s; }
.sp-item svg{ width:16px; height:16px; color:var(--ink-3); flex:none; }
.sp-item span{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sp-item:hover{ background:var(--surface-3); color:var(--ink); } .sp-item:hover svg{ color:var(--ink-2); }
.sp-item.active{ background:var(--surface); color:var(--ink); font-weight:600; box-shadow:var(--shadow-xs); } .sp-item.active svg{ color:var(--accent-ink); }
.sp-item.active::before{ content:""; position:absolute; left:0; top:8px; bottom:8px; width:2.5px; border-radius:0 3px 3px 0; background:var(--accent); }
.app-sub{ grid-template-columns:236px 234px 1fr; }
@media (max-width:1160px){ .app-sub{ grid-template-columns:236px 198px 1fr; } }
@media (max-width:900px){ .app-sub{ grid-template-columns:236px 64px 1fr; } .sub-side{ padding:16px 8px; }
  .sub-side .sp-note,.sub-side .sp-grp,.sub-side .sp-title span{ display:none; }
  .sub-side .sp-title{ justify-content:center; } .sub-side .sp-item{ justify-content:center; padding:8px; } .sub-side .sp-item span{ display:none; } }
@media (max-width:820px){ .app-sub{ grid-template-columns:64px 1fr; } }
@media (prefers-reduced-motion:reduce){ *{ transition:none !important; animation:none !important; } }
`

interface ShellOpts { activeHref: string; crumbBold: string; crumbSub: string; extraCss?: string }

/**
 * Mounts the isolated shell into `hostRef` once, wires theme + client-routing +
 * business/user, and returns the shadow root (via ref) for the screen to fill
 * `#wwc`. `ready` flips true after the shadow tree exists.
 */
export function useArtifactShell(hostRef: React.RefObject<HTMLDivElement | null>, opts: ShellOpts) {
  const shadowRef = React.useRef<ShadowRoot | null>(null)
  const [ready, setReady] = React.useState(false)
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { user } = useUser()
  const { business, businesses } = useBusiness()
  const setActiveBusinessId = useActiveBusinessStore((s) => s.setActiveBusinessId)
  const activeBusinessId = useActiveBusinessStore((s) => s.activeBusinessId)
  const [unread, setUnread] = React.useState(0)
  const setChrome = useShellStore((s) => s.setChrome)
  const resolvedMode = useResolvedThemeMode()

  // Push this screen's crumb + active-route to the persistent React shell.
  React.useEffect(() => {
    setChrome({ activeHref: opts.activeHref, crumbBold: opts.crumbBold, crumbSub: opts.crumbSub })
  }, [opts.activeHref, opts.crumbBold, opts.crumbSub, setChrome])

  // Stamp light/dark on the shadow host so the champagne dark palette
  // (:host([data-theme="dark"])) applies to the content, matching the shell.
  React.useEffect(() => {
    const host = hostRef.current
    if (host) host.dataset.theme = resolvedMode
  }, [resolvedMode, ready, hostRef])

  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return
    // Reuse an existing shadow root across StrictMode double-mounts (attachShadow
    // throws if called twice). Listeners are always (re)attached below so the
    // cleanup→remount cycle can never leave the shell without click/input wiring.
    let shadow = shadowRef.current
    if (!shadow) {
      shadow = host.shadowRoot || host.attachShadow({ mode: "open" })
      shadowRef.current = shadow
      // Content-only: the chrome lives in the persistent React shell now.
      shadow.innerHTML = `<style>${SHELL_CSS}${CONTENT_MODE_CSS}${opts.extraCss || ""}</style>${contentShellHtml()}`
    }
    ACTIVE_CONTENT_SHADOW = shadow
    const closeBizMenu = () => {
      const m = shadow.querySelector("[data-bizmenu]") as HTMLElement | null
      const b = shadow.querySelector("[data-biz-switch]") as HTMLElement | null
      if (m) m.hidden = true
      if (b) b.setAttribute("aria-expanded", "false")
    }
    const onClick = (e: Event) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-act="theme"]')) { e.preventDefault(); setTheme(resolvedTheme === "dark" ? "light" : "dark"); return }
      if (t.closest('[data-act="export-table"]')) { e.preventDefault(); exportWwcTable(shadow, opts.crumbBold); return }
      const moreBtn = t.closest("[data-nav-more]") as HTMLElement | null
      if (moreBtn) { e.preventDefault(); const panel = shadow.querySelector("[data-nav-more-panel]") as HTMLElement | null; if (panel) { const open = !panel.hidden; panel.hidden = open; moreBtn.setAttribute("aria-expanded", String(!open)) } return }
      if (t.closest("[data-drawer-close]") || t.closest("[data-drawer-scrim]")) { e.preventDefault(); closeDrawer(shadow); return }
      // table paginator
      const pg = t.closest("[data-pager-prev],[data-pager-next],[data-pager-page]") as HTMLElement | null
      if (pg) {
        e.preventDefault()
        const st = PAGERS.get(shadow)
        if (st) {
          if (pg.hasAttribute("data-pager-prev")) st.page -= 1
          else if (pg.hasAttribute("data-pager-next")) st.page += 1
          else st.page = Number(pg.getAttribute("data-pager-page")) || 0
          pagerRender(st)
          st.table?.scrollIntoView({ block: "nearest" })
        }
        return
      }
      // venue switcher
      const pick = t.closest("[data-biz-pick]") as HTMLElement | null
      if (pick) { e.preventDefault(); const v = pick.getAttribute("data-biz-pick"); setActiveBusinessId(v === "all" ? null : Number(v)); closeBizMenu(); return }
      const sw = t.closest("[data-biz-switch]") as HTMLElement | null
      if (sw) {
        e.preventDefault()
        const m = shadow.querySelector("[data-bizmenu]") as HTMLElement | null
        if (m) { const open = m.hidden; m.hidden = !open; sw.setAttribute("aria-expanded", String(open)) }
        return
      }
      if (!t.closest("[data-bizmenu]")) closeBizMenu()
      const a = t.closest("a[data-nav]") as HTMLAnchorElement | null
      const b = t.closest("[data-nav-btn]") as HTMLElement | null
      const href = a?.getAttribute("href") || b?.getAttribute("data-nav-btn")
      if (href) {
        // A nested action control inside a navigable row (record-payment button,
        // kebab, WhatsApp…) does its OWN job — don't also navigate the row. The
        // screen's own listener handles the control. Skip nav only when the
        // clicked control is a DIFFERENT element nested inside the nav target.
        const navEl = (a || b) as HTMLElement
        const ctrl = t.closest("button, [data-stop]") as HTMLElement | null
        if (ctrl && ctrl !== navEl && navEl.contains(ctrl)) return
        e.preventDefault(); router.push(href)
      }
    }
    // top-bar + toolbar search: live-filter the current screen's table rows
    const onInput = (e: Event) => {
      const inp = e.target as HTMLInputElement
      if (!inp.closest(".search") && !inp.closest(".f-search")) return
      const q = inp.value.trim().toLowerCase()
      // If this screen opted into the shared paginator, drive it (keeps filter +
      // search + paging consistent). Otherwise fall back to a plain hide-filter.
      const st = PAGERS.get(shadow)
      if (st) { st.search = q; st.page = 0; pagerRender(st); return }
      const wwc = shadow.getElementById("wwc"); if (!wwc) return
      const rows = wwc.querySelectorAll("tbody tr")
      if (!rows.length) return
      let n = 0
      rows.forEach((tr) => { const el = tr as HTMLElement; const show = !q || (el.textContent || "").toLowerCase().includes(q); el.hidden = !show; if (show) n++ })
      const rc = wwc.querySelector("#rowcount"); if (rc) rc.textContent = `${n} entries`
    }
    shadow.addEventListener("click", onClick)
    shadow.addEventListener("input", onInput)
    setReady(true)
    return () => { shadow.removeEventListener("click", onClick); shadow.removeEventListener("input", onInput) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // live unread-notifications count → bell dot
  React.useEffect(() => {
    let alive = true
    NotificationAPI.getUnreadCount().then((c) => { if (alive) setUnread(c) }).catch(() => {})
    return () => { alive = false }
  }, [])
  React.useEffect(() => {
    const s = shadowRef.current; if (!s) return
    const dot = s.querySelector("[data-unread-dot]") as HTMLElement | null
    if (dot) dot.hidden = unread <= 0
    const bell = s.querySelector('[aria-label="Notifications"]') as HTMLElement | null
    if (bell) bell.setAttribute("title", unread > 0 ? `${unread} nayi ittila` : "Ittilaat")
  }, [unread, ready])

  React.useEffect(() => {
    hostRef.current?.setAttribute("data-theme", resolvedTheme === "dark" ? "dark" : "light")
  }, [resolvedTheme, hostRef])

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s) return
    type Biz = { id: number; name?: string; city?: string; subArea?: string }
    const list = (businesses || []) as Biz[]
    const active = activeBusinessId != null ? list.find((b) => b.id === activeBusinessId) || null : null
    const allMode = activeBusinessId == null && list.length > 1
    const subOf = (b?: Biz | null) => (b ? [b.city, b.subArea].filter(Boolean).join(" · ") : "")
    // active venue shown in the sidebar top (not just the first business)
    const shown = active || (list.length === 1 ? list[0] : (business as Biz | null))
    const name = allMode ? "Sabhi venue" : (shown?.name || "Your venue")
    const sub = allMode ? `${list.length} venues` : (subOf(shown) || " ")
    const nEl = s.querySelector("[data-biz]"); if (nEl) nEl.textContent = name
    const logo = s.querySelector("[data-logo]"); if (logo) logo.textContent = (name.trim()[0] || "R").toUpperCase()
    const subEl = s.querySelector("[data-biz-sub]"); if (subEl) subEl.textContent = sub
    // venue-switcher dropdown
    const menu = s.querySelector("[data-bizmenu]") as HTMLElement | null
    const sw = s.querySelector("[data-biz-switch]") as HTMLElement | null
    if (menu) {
      const tick = `<span class="bm-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg></span>`
      const item = (id: string, nm: string, sb: string, on: boolean) =>
        `<button class="bm-item${on ? " on" : ""}" data-biz-pick="${id}" role="option" aria-selected="${on}"><span class="bm-ava">${escHtml((nm.trim()[0] || "?").toUpperCase())}</span><span class="bm-txt"><span class="bm-nm">${escHtml(nm)}</span>${sb ? `<span class="bm-sub">${escHtml(sb)}</span>` : ""}</span>${on ? tick : ""}</button>`
      const allRow = list.length > 1 ? item("all", "Sabhi venue", `${list.length} venues ka rollup`, activeBusinessId == null) + `<div class="bm-sep"></div>` : ""
      const rows = list.map((b) => item(String(b.id), b.name || "Venue", subOf(b), activeBusinessId === b.id)).join("")
      menu.innerHTML = `<div class="bm-lbl">Venue chunein</div>${allRow}${rows || `<div class="bm-lbl" style="text-transform:none">Koi venue nahi</div>`}`
      if (sw) sw.style.display = list.length ? "" : "none"
    }
    const full = (user as { fullName?: string } | null)?.fullName
    if (full) {
      const nm = s.querySelector("[data-user-name]"); if (nm) nm.textContent = full
      const ava = s.querySelector("[data-user-ava]"); if (ava) ava.textContent = initialsOf(full)
    }
  }, [business, businesses, activeBusinessId, user, ready])

  // ── Sticky-list layout ────────────────────────────────────────────────
  // Bound the table's scroll region to the viewport so the page head, toolbar/
  // tabs and column headers stay FROZEN and only the rows scroll (the data-grid
  // pattern). Universal — every list screen gets it with no per-screen code.
  // Degrades safely: if it can't size the wrap, the table keeps its natural
  // height and the page scrolls as before.
  React.useEffect(() => {
    const shadow = shadowRef.current
    const host = hostRef.current
    if (!shadow || !host || !ready) return
    const wwc = shadow.getElementById("wwc")
    if (!wwc) return
    let raf = 0
    // The scroll container is now the persistent React shell's scroll area
    // (.cscroll), an ancestor of the host in the light DOM — find it once.
    const findScroller = (): HTMLElement => {
      let el: HTMLElement | null = host.parentElement
      while (el) { const cs = getComputedStyle(el); if (cs.overflowY === "auto" || cs.overflowY === "scroll") return el; el = el.parentElement }
      return (document.scrollingElement as HTMLElement) || document.documentElement
    }
    const layout = () => {
      raf = 0
      const wrap = wwc.querySelector(".tbl-wrap, [data-ww-list]") as HTMLElement | null
      if (!wrap) return
      const scroller = findScroller()
      // natural (unscrolled) distance from the viewport top to the wrap
      const naturalTop = wrap.getBoundingClientRect().top + (scroller.scrollTop || 0)
      const card = wrap.closest(".card") as HTMLElement | null
      const foot = ((card || wrap.parentElement) as HTMLElement | null)?.querySelector(".tbl-foot") as HTMLElement | null
      const footH = foot ? foot.offsetHeight : 0
      let avail = window.innerHeight - naturalTop - footH - 12
      if (avail >= 200) {
        wrap.style.maxHeight = Math.round(avail) + "px"
        wrap.classList.add("ww-bounded")
        // Self-correct any residual scroll-area overflow (pager bar, sub-pixel
        // rounding, scrollbar) so the header is TRULY frozen — 0 page scroll.
        const over = scroller.scrollHeight - scroller.clientHeight
        if (over > 2) { avail = Math.max(200, avail - over); wrap.style.maxHeight = Math.round(avail) + "px" }
      } else {
        wrap.style.maxHeight = ""
        wrap.classList.remove("ww-bounded")
      }
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(layout) }
    const mo = new MutationObserver(schedule)
    mo.observe(wwc, { childList: true, subtree: true })
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(schedule); ro.observe(wwc) }
    window.addEventListener("resize", schedule)
    schedule()
    return () => { if (raf) cancelAnimationFrame(raf); mo.disconnect(); ro?.disconnect(); window.removeEventListener("resize", schedule) }
  }, [ready])

  return { shadowRef, ready }
}
