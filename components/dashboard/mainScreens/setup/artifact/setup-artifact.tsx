"use client"

/**
 * Setup hub — the landing for the "Set up" module, mirroring the live portal's
 * Set up panel. The grouped secondary sidebar (rendered by the shell on every
 * setup route, see artifact-shell.tsx → setupPanelHtml) is the primary way in;
 * this page is the welcoming overview a venue owner lands on, with a card per
 * setup area grouped exactly as the sidebar groups them.
 */

import * as React from "react"
import { useArtifactShell, escHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const svg = (p: string, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 3 14.1a2 2 0 1 1 0-4A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 10 3a2 2 0 1 1 4 0 1.6 1.6 0 0 0 3 1.6 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 21 10a2 2 0 1 1 0 4"/>',
  onboarding: '<path d="M11 6h9M11 12h9M11 18h8"/><path d="M3 6l1.4 1.4L7 5M3 12l1.4 1.4L7 11M3 18l1.4 1.4L7 17"/>',
  auto: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
  policy: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>',
  holds: '<rect x="3" y="4" width="13" height="16" rx="2"/><path d="M3 9h13M7 2v4M12 2v4"/><circle cx="18" cy="16" r="4.2"/><path d="M18 14.4v1.7l1.1.8"/>',
  venueos: '<path d="M3 21h18M6 21V7l6-4 6 4v14"/><path d="M10 21v-4h4v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/>',
  packages: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>',
  inventory: '<path d="M3 8l4-2 4 2v4l-4 2-4-2z"/><path d="M13 8l4-2 4 2v4l-4 2-4-2z"/><path d="M8 16l4-2 4 2v4l-4 2-4-2z"/>',
  fuel: '<path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18M3 12h10M16 6l3 3v9a2 2 0 0 1-4 0V9"/>',
  halal: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  drone: '<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="18" r="2.4"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M7.7 7.7l1.8 1.8M16.3 7.7l-1.8 1.8M7.7 16.3l1.8-1.8M16.3 16.3l-1.8-1.8"/>',
  promote: '<path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M14 7a5 5 0 0 1 0 10"/>',
  collab: '<path d="M8 11.5l2.4 2.4a1.5 1.5 0 0 0 2.1 0L18 8.5"/><path d="M2 12l4-4 4 3M22 12l-4-4-3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
}

type Card = { href: string; label: string; desc: string; ico: string }
const GROUPS: { grp: string; blurb: string; cards: Card[] }[] = [
  {
    grp: "Mera business", blurb: "Business ki bunyadi settings, rules aur reminders.",
    cards: [
      { href: "/dashboard/settings", label: "Business settings", desc: "Naam, images, packages, sub-venues aur profile.", ico: IC.settings },
      { href: "/dashboard/onboarding", label: "Setup checklist", desc: "Onboarding ke qadam mukammal karein.", ico: IC.onboarding },
      { href: "/dashboard/automation", label: "Automation", desc: "Reminder toggles aur no-code rules.", ico: IC.auto },
      { href: "/dashboard/cancellation-policy", label: "Cancellation policy", desc: "Cancel/refund ke terms — kaun paisa rakhta hai.", ico: IC.policy },
      { href: "/dashboard/availability", label: "Availability", desc: "Kab bookable hain — blocked/free dates.", ico: IC.holds },
    ],
  },
  {
    grp: "Venue", blurb: "Halls, packages aur venue-OS configuration.",
    cards: [
      { href: "/dashboard/spaces", label: "Halls & spaces", desc: "Halls, lawns, sections — capacity, rent, mode.", ico: IC.venueos },
      { href: "/dashboard/slots", label: "Bookable slots", desc: "Waqt-slots — capacity, mehmaan cap, kaunse din.", ico: IC.holds },
      { href: "/dashboard/packages", label: "Packages & menus", desc: "Deal packages aur khana menus (one-dish).", ico: IC.packages },
      { href: "/dashboard/venue-os", label: "Venue-OS hub", desc: "Multi-venue money, profit aur operations.", ico: IC.venueos },
    ],
  },
  {
    grp: "Stock & compliance", blurb: "Inventory aur legal compliance ka record.",
    cards: [
      { href: "/dashboard/inventory", label: "Inventory", desc: "Stock items, quantity aur low-stock alerts.", ico: IC.inventory },
      { href: "/dashboard/generator-fuel", label: "Generator fuel", desc: "Tanks, run-hours aur fuel suppliers.", ico: IC.fuel },
      { href: "/dashboard/halal-certs", label: "Halal certs", desc: "Halal certificates aur authority record.", ico: IC.halal },
      { href: "/dashboard/drone-noc", label: "Drone NOC", desc: "PCAA drone permits — pilot, licence, status.", ico: IC.drone },
    ],
  },
  {
    grp: "Grow", blurb: "Listing boost aur partner collaborations.",
    cards: [
      { href: "/dashboard/promote", label: "Promote", desc: "Apni listing boost karein — placements.", ico: IC.promote },
      { href: "/dashboard/collaborations", label: "Collaborations", desc: "Doosre vendors ke saath kaam batein.", ico: IC.collab },
    ],
  },
]

const EXTRA_CSS = String.raw`
.content{ max-width:1120px; }
.setup-hero{ display:flex; align-items:center; gap:15px; padding:20px 22px; margin-bottom:22px; background:linear-gradient(120deg,var(--accent-wash),transparent 70%); border:1px solid var(--accent-line); border-radius:var(--r); }
.setup-hero .h-ic{ width:46px; height:46px; border-radius:13px; background:var(--surface); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .setup-hero .h-ic svg{ width:23px; height:23px; }
.setup-hero h1{ font-size:21px; font-weight:600; letter-spacing:-.02em; } .setup-hero p{ font-size:12.5px; color:var(--ink-2); margin-top:4px; }
.grp{ margin-bottom:24px; } .grp-h{ display:flex; align-items:baseline; gap:10px; margin:2px 2px 12px; }
.grp-h .t{ font-size:13.5px; font-weight:600; letter-spacing:-.01em; } .grp-h .b{ font-size:12px; color:var(--ink-3); }
.cards{ display:grid; grid-template-columns:repeat(3,1fr); gap:13px; }
.scard{ display:flex; align-items:flex-start; gap:13px; padding:15px 16px; background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); text-align:left; transition:border-color .12s,box-shadow .12s,transform .12s; cursor:pointer; }
.scard:hover{ border-color:var(--accent-line); box-shadow:var(--shadow-sm); transform:translateY(-1px); }
.scard .c-ic{ width:40px; height:40px; border-radius:11px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .scard .c-ic svg{ width:20px; height:20px; }
.scard .c-main{ flex:1; min-width:0; } .scard .c-nm{ font-weight:600; font-size:13.5px; display:flex; align-items:center; gap:6px; } .scard .c-desc{ font-size:12px; color:var(--ink-3); line-height:1.5; margin-top:3px; }
.scard .c-arrow{ width:16px; height:16px; color:var(--ink-4); flex:none; margin-top:2px; transition:color .12s,transform .12s; } .scard:hover .c-arrow{ color:var(--accent-ink); transform:translateX(2px); }
@media (max-width:1000px){ .cards{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:620px){ .cards{ grid-template-columns:1fr; } }
`

function render(): string {
  const card = (c: Card) =>
    `<a class="scard" data-nav href="${c.href}"><span class="c-ic">${svg(c.ico)}</span><span class="c-main"><span class="c-nm">${escHtml(c.label)}</span><span class="c-desc">${escHtml(c.desc)}</span></span>${svg(IC.arrow, 2).replace("<svg", '<svg class="c-arrow"')}</a>`
  const groups = GROUPS.map((g) =>
    `<section class="grp"><div class="grp-h"><span class="t">${escHtml(g.grp)}</span><span class="b">${escHtml(g.blurb)}</span></div><div class="cards">${g.cards.map(card).join("")}</div></section>`
  ).join("")
  return `<div class="setup-hero"><span class="h-ic">${svg(IC.settings)}</span><div><h1>Set up</h1><p>Apne venue ki puri configuration, compliance aur growth — sab aik jagah.</p></div></div>${groups}`
}

export function SetupArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/setup",
    crumbBold: "Set up",
    crumbSub: "Venue configuration",
    extraCss: EXTRA_CSS,
  })

  React.useEffect(() => {
    const shadow = shadowRef.current
    if (!ready || !shadow) return
    const wwc = shadow.getElementById("wwc")
    if (wwc) wwc.innerHTML = render()
  }, [ready, shadowRef])

  return <div ref={hostRef} />
}
