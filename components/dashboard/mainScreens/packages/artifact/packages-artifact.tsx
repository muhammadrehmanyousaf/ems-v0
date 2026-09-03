"use client"

/**
 * Packages & Menus — world-class catalogue on the champagne shell.
 * Two tabs:
 *   • Packages — PackagesAPI CRUD + bundle a menu, features, guest band, service
 *     style, sub-venue, min-guarantee.
 *   • Menus — MenusAPI CRUD with a dish builder (per-dish course classification,
 *     bulk paste) + a live one-dish salan nudge, pricing, sub-venue.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PackagesAPI, MenusAPI, type ApiPackage, type ApiMenu } from "@/lib/api/dashboard"
import { venueSpacesApi, type SubVenueNode } from "@/lib/api/venueSpaces"
import { COUNTS_AS_LABELS, COUNTS_AS, flattenMenuItems, type CountsAs } from "@/lib/compliance/one-dish"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml, openDrawer, closeDrawer, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const unitLabel = (u?: string | null) => (u === "per_head" ? "/ mehmaan" : "/ event")
const SERVICE_LABEL: Record<string, string> = { buffet: "Buffet", sit_down: "Sit-down", family: "Family style", hi_tea: "Hi-tea", stations: "Live stations" }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  pkg: '<path d="M16 3l5 3v12l-9 3-9-3V6l5-3M3 6l9 3 9-3M12 9v12"/>', users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>', plate: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>', food: '<path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M6 2v20M14 2c-1.5 1-2 3-2 5s.5 4 2 5v10"/>',
  menu: '<path d="M4 3h16v18l-2-1-2 1-2-1-2 1-2-1-2 1-2-1V3z"/><path d="M8 8h8M8 12h8M8 16h5"/>', check: '<path d="M20 6 9 17l-5-5"/>', warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
}
const flattenSpaces = (tree: SubVenueNode[]): SubVenueNode[] => { const out: SubVenueNode[] = []; const w = (ns: SubVenueNode[]) => { for (const n of ns) { out.push(n); if (n.children?.length) w(n.children) } }; w(tree || []); return out }
type Dish = { name: string; countsAs: CountsAs }
const menuDishes = (m: ApiMenu): Dish[] => flattenMenuItems(m.data).map((d) => ({ name: d.name, countsAs: d.countsAs }))
const salanCount = (dishes: Dish[]) => dishes.filter((d) => d.countsAs === "salan").length

const EXTRA_CSS = String.raw`
.tabs{ display:inline-flex; gap:2px; background:var(--surface-2); border:1px solid var(--border); border-radius:10px; padding:3px; margin-bottom:18px; }
.tab{ height:32px; padding:0 15px; border-radius:7px; border:0; background:transparent; color:var(--ink-2); font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:7px; } .tab svg{ width:15px; height:15px; } .tab.on{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); } .tab .cnt{ font-size:11px; color:var(--ink-3); }
.pkg-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; }
.pkgcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); display:flex; flex-direction:column; overflow:hidden; transition:box-shadow .12s,border-color .12s; } .pkgcard:hover{ box-shadow:var(--shadow-md); border-color:var(--accent-line); }
.pkg-h{ padding:15px 16px 12px; border-bottom:1px solid var(--border); }
.pkg-top{ display:flex; align-items:flex-start; gap:10px; }
.pkg-ic{ width:36px; height:36px; border-radius:10px; background:var(--accent-wash); border:1px solid var(--accent-line); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .pkg-ic svg{ width:18px; height:18px; }
.pkg-nm{ font-weight:660; font-size:15px; } .pkg-price{ font-size:16px; font-weight:700; letter-spacing:-.02em; margin-top:3px; } .pkg-price .rs{ font-size:11px; color:var(--ink-3); font-weight:600; } .pkg-price .per{ font-size:11px; color:var(--ink-3); font-weight:500; }
.pkg-body{ padding:13px 16px; flex:1; }
.pkg-desc{ font-size:12.5px; color:var(--ink-2); line-height:1.55; margin-bottom:12px; }
.feat{ display:flex; flex-direction:column; gap:5px; margin-bottom:12px; } .feat .f{ display:flex; align-items:center; gap:7px; font-size:12px; color:var(--ink-2); } .feat .f svg{ width:13px; height:13px; color:var(--accent-ink); flex:none; }
.pkg-meta{ display:flex; flex-wrap:wrap; gap:7px; }
.pmeta{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); color:var(--ink-2); } .pmeta svg{ width:12px; height:12px; color:var(--ink-4); }
.pmeta.food{ color:var(--ok); background:var(--ok-wash); border-color:transparent; } .pmeta.menu{ color:var(--accent-ink); background:var(--accent-wash); border-color:transparent; }
.pmeta[data-menuopen]{ cursor:pointer; transition:filter .12s,box-shadow .12s; } .pmeta[data-menuopen]:hover{ filter:brightness(.96); box-shadow:0 0 0 1px var(--accent-line) inset; }
.pkg-foot{ display:flex; gap:7px; padding:12px 16px; border-top:1px solid var(--border); }
.pkg-foot .sp{ flex:1; }
.mini{ height:30px; padding:0 11px; border-radius:8px; font-size:12px; font-weight:600; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-2); display:inline-flex; align-items:center; gap:5px; } .mini:hover{ background:var(--surface-3); color:var(--ink); } .mini svg{ width:13px; height:13px; } .mini.bad:hover{ color:var(--bad); border-color:var(--bad); }
.fhint{ font-size:10.5px; color:var(--ink-4); font-weight:500; }
/* Rs-prefix suffix (drawer inputs are auto-styled by the shell) */
.suffix{ position:relative; } .suffix input{ padding-left:32px; } .suffix .rs{ position:absolute; left:11px; top:50%; transform:translateY(-50%); font-size:11.5px; color:var(--ink-3); font-weight:600; z-index:1; }
.tgl-inline{ display:flex; align-items:center; gap:10px; } .tgl{ width:42px; height:24px; border-radius:20px; border:1px solid var(--border-2); background:var(--surface-3); position:relative; flex:none; padding:0; } .tgl .dot{ position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:var(--surface); box-shadow:var(--shadow-xs); transition:left .15s; } .tgl[aria-pressed="true"]{ background:var(--accent); border-color:transparent; } .tgl[aria-pressed="true"] .dot{ left:20px; }
/* dish builder */
.dishwrap{ border:1px solid var(--border); border-radius:10px; background:var(--surface-2); padding:12px; margin-bottom:14px; }
.dishwrap .dw-h{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; } .dw-t{ font-size:12.5px; font-weight:600; } .dw-verdict{ font-size:11.5px; font-weight:600; padding:2px 9px; border-radius:6px; } .dw-verdict.ok{ color:var(--ok); background:var(--ok-wash); } .dw-verdict.warn{ color:var(--warn); background:var(--warn-wash); }
.dishrow{ display:flex; gap:8px; align-items:center; margin-bottom:8px; } .dishrow .dish-name{ flex:1; } .dishrow .dish-counts{ width:210px; flex:none; } .dishrow .dx{ width:30px; height:34px; flex:none; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; } .dishrow .dx:hover{ color:var(--bad); border-color:var(--bad); } .dishrow .dx svg{ width:14px; height:14px; }
.dishbtns{ display:flex; gap:8px; margin-top:6px; }
.mcard{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); overflow:hidden; transition:box-shadow .12s,border-color .12s; } .mcard:hover{ box-shadow:var(--shadow-md); border-color:var(--accent-line); }
.mc-h{ padding:15px 16px 12px; border-bottom:1px solid var(--border); display:flex; align-items:flex-start; gap:10px; }
.mc-body{ padding:13px 16px; } .mc-dishes{ display:flex; flex-wrap:wrap; gap:6px; } .dchip{ font-size:11px; padding:2px 8px; border-radius:6px; background:var(--surface-2); border:1px solid var(--border); color:var(--ink-2); } .dchip.salan{ background:var(--accent-wash); border-color:transparent; color:var(--accent-ink); }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
`

/* ── Packages ─────────────────────────────────────────────── */
function pkgCard(p: ApiPackage): string {
  const svc = p.serviceStyle ? SERVICE_LABEL[p.serviceStyle] || p.serviceStyle : ""
  const band = (p.guestRangeMin || p.guestRangeMax) ? `${p.guestRangeMin || "?"}–${p.guestRangeMax || "?"} mehmaan` : ""
  const feats = Array.isArray(p.features) ? (p.features as string[]).filter(Boolean).slice(0, 4) : []
  return `<div class="pkgcard">
    <div class="pkg-h"><div class="pkg-top"><span class="pkg-ic">${svg(IC.pkg, 1.8)}</span><div style="flex:1;min-width:0"><div class="pkg-nm">${escHtml(p.name)}</div><div class="pkg-price"><span class="rs">Rs</span> ${pkNum(money(p.price))} <span class="per">${unitLabel(p.pricingUnit)}</span></div></div></div></div>
    <div class="pkg-body">${p.description ? `<div class="pkg-desc">${escHtml(p.description)}</div>` : ""}
      ${feats.length ? `<div class="feat">${feats.map((f) => `<div class="f">${svg(IC.check, 2.4)} ${escHtml(f)}</div>`).join("")}</div>` : ""}
      <div class="pkg-meta">${band ? `<span class="pmeta">${svg(IC.users, 1.9)} ${escHtml(band)}</span>` : ""}${svc ? `<span class="pmeta">${svg(IC.plate, 1.9)} ${escHtml(svc)}</span>` : ""}${p.includesFood ? `<span class="pmeta food">${svg(IC.food, 1.8)} Khana shamil</span>` : ""}${p.bundledMenu?.title ? `<span class="pmeta menu" data-menuopen="${p.bundledMenu.id}" role="button" tabindex="0" title="Menu kholein">${svg(IC.menu, 1.8)} ${escHtml(p.bundledMenu.title)}</span>` : ""}${p.pricingUnit === "per_head" && p.minGuaranteeCount ? `<span class="pmeta">Min ${p.minGuaranteeCount}</span>` : ""}${p.subVenue?.name ? `<span class="pmeta">${escHtml(p.subVenue.name)}</span>` : ""}</div></div>
    <div class="pkg-foot"><span class="sp"></span><button class="mini" data-pkgedit="${p.id}">${svg(IC.edit)} Edit</button><button class="mini" data-pkgdup="${p.id}" title="Iski copy banayein">${svg(IC.copy)} Copy</button><button class="mini bad" data-pkgdel="${p.id}">${svg(IC.trash)} Delete</button></div></div>`
}

function subVenueOpts(spaces: SubVenueNode[], sel?: number | null): string {
  return `<option value="">Poore venue mein (sab jagah)</option>` + spaces.map((sp) => `<option value="${sp.id}"${sel === sp.id ? " selected" : ""}>${"— ".repeat(sp.depth)}${escHtml(sp.name)}</option>`).join("")
}

function pkgFormBody(p: ApiPackage | null, duplicate: boolean, menus: ApiMenu[], spaces: SubVenueNode[]): string {
  const idVal = p && !duplicate ? String(p.id) : ""
  const name = p ? (duplicate ? `${p.name} (copy)` : p.name) : ""
  const unit = p?.pricingUnit === "per_head" ? "per_head" : "per_event"
  const svc = p?.serviceStyle || ""
  const menuId = p?.menuId ?? null
  const food = !!p?.includesFood
  const menuOpts = `<option value=""${menuId == null ? " selected" : ""}>— koi menu bundle nahi —</option>` + menus.map((m) => `<option value="${m.id}"${menuId === m.id ? " selected" : ""}>${escHtml(m.title)}</option>`).join("")
  return `
    <input type="hidden" id="p-id" value="${idVal}"/>
    <div class="dfield"><label class="dlabel">Package ka naam <span class="req">*</span></label><input type="text" id="p-name" value="${escHtml(name)}" placeholder="Jaise: Gold Package"/></div>
    <div class="dfield row2">
      <div><label class="dlabel">Qeemat <span class="req">*</span></label><div class="suffix"><span class="rs">Rs</span><input type="number" id="p-price" min="0" value="${p ? money(p.price) : ""}" placeholder="0"/></div></div>
      <div><label class="dlabel">Kaise charge hota hai</label><select id="p-unit"><option value="per_event"${unit !== "per_head" ? " selected" : ""}>Poore event ka (flat)</option><option value="per_head"${unit === "per_head" ? " selected" : ""}>Per mehmaan (per head)</option></select></div>
    </div>
    <div class="dfield row2">
      <div><label class="dlabel">Kam se kam mehmaan</label><input type="number" id="p-gmin" min="0" value="${p?.guestRangeMin != null ? p.guestRangeMin : ""}" placeholder="200"/></div>
      <div><label class="dlabel">Zyada se zyada mehmaan</label><input type="number" id="p-gmax" min="0" value="${p?.guestRangeMax != null ? p.guestRangeMax : ""}" placeholder="800"/></div>
    </div>
    <div class="dfield"><label class="dlabel">Khana shamil hai?</label><div class="tgl-inline"><button type="button" class="tgl" id="p-food" aria-pressed="${food ? "true" : "false"}"><span class="dot"></span></button><span style="font-size:12px;color:var(--ink-3)" id="p-food-lbl">${food ? "Haan" : "Nahi"}</span></div></div>
    <div class="dfield row2">
      <div><label class="dlabel">Khaana kaise serve hoga</label><select id="p-svc"><option value=""${!svc ? " selected" : ""}>— chunein —</option>${Object.keys(SERVICE_LABEL).map((k) => `<option value="${k}"${svc === k ? " selected" : ""}>${escHtml(SERVICE_LABEL[k])}</option>`).join("")}</select></div>
      <div><label class="dlabel">Konsa menu bundle <span class="fhint">(optional)</span></label><select id="p-menu">${menuOpts}</select></div>
    </div>
    <div class="dfield row2">
      <div><label class="dlabel">Konsi jagah bikta hai</label><select id="p-sub">${subVenueOpts(spaces, p?.subVenueId ?? null)}</select></div>
      <div><label class="dlabel">Min guarantee <span class="fhint">(sirf per-head)</span></label><input type="number" id="p-mingt" min="0" value="${p?.minGuaranteeCount != null ? p.minGuaranteeCount : ""}" placeholder="optional"/></div>
    </div>
    <div class="dfield"><label class="dlabel">Kya kya shamil hai <span class="fhint">(har line ek feature)</span></label><textarea id="p-feats" placeholder="Stage decoration&#10;Welcome drinks&#10;Free parking">${Array.isArray(p?.features) ? escHtml((p!.features as string[]).join("\n")) : ""}</textarea></div>
    <div class="dfield"><label class="dlabel">Tafseel</label><textarea id="p-desc" placeholder="Package mein kya kya shamil hai…">${p?.description ? escHtml(p.description) : ""}</textarea></div>
    <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" id="pf-save">Package save karein</button></div>`
}

/* ── Menus ────────────────────────────────────────────────── */
function menuCard(m: ApiMenu): string {
  const dishes = menuDishes(m); const sc = salanCount(dishes)
  const chips = dishes.slice(0, 10).map((d) => `<span class="dchip${d.countsAs === "salan" ? " salan" : ""}">${escHtml(d.name)}</span>`).join("")
  const verdict = sc > 1 ? `<span class="pmeta" style="color:var(--warn);background:var(--warn-wash);border-color:transparent">${svg(IC.warn, 1.9)} ${sc} salan — one-dish check</span>` : dishes.length ? `<span class="pmeta food">${svg(IC.check, 2.2)} One-dish theek</span>` : ""
  return `<div class="mcard">
    <div class="mc-h"><span class="pkg-ic">${svg(IC.menu, 1.8)}</span><div style="flex:1;min-width:0"><div class="pkg-nm">${escHtml(m.title)}</div><div class="pkg-price"><span class="rs">Rs</span> ${pkNum(money(m.price))} <span class="per">${unitLabel(m.pricingUnit)}</span></div></div></div>
    <div class="mc-body"><div class="pkg-meta" style="margin-bottom:10px"><span class="pmeta">${dishes.length} dishes</span>${verdict}${m.minGuaranteeCount ? `<span class="pmeta">Min ${m.minGuaranteeCount}</span>` : ""}</div>
      <div class="mc-dishes">${chips || `<span class="dchip">Koi dish nahi</span>`}${dishes.length > 10 ? `<span class="dchip">+${dishes.length - 10}</span>` : ""}</div></div>
    <div class="pkg-foot"><span class="sp"></span><button class="mini" data-menuedit="${m.id}">${svg(IC.edit)} Edit</button><button class="mini" data-menudup="${m.id}" title="Iski copy banayein">${svg(IC.copy)} Copy</button><button class="mini bad" data-menudel="${m.id}">${svg(IC.trash)} Delete</button></div></div>`
}

const countsOpts = (sel?: string) => COUNTS_AS.map((c) => `<option value="${c}"${sel === c ? " selected" : ""}>${escHtml(COUNTS_AS_LABELS[c])}</option>`).join("")
function dishRowHtml(d?: Dish): string {
  return `<div class="dishrow"><input type="text" class="dish-name" placeholder="Dish ka naam" value="${d ? escHtml(d.name) : ""}"/><select class="dish-counts">${countsOpts(d?.countsAs)}</select><button class="dx" data-dishremove title="Hataayein">${svg(IC.x, 2.2)}</button></div>`
}
function menuFormBody(m: ApiMenu | null, duplicate: boolean, spaces: SubVenueNode[]): string {
  const idVal = m && !duplicate ? String(m.id) : ""
  const title = m ? (duplicate ? `${m.title} (copy)` : m.title) : ""
  const unit = m?.pricingUnit === "per_event" ? "per_event" : "per_head"
  const dishesHtml = (m ? menuDishes(m) : []).map((d) => dishRowHtml(d)).join("") || dishRowHtml()
  return `
    <input type="hidden" id="m-id" value="${idVal}"/>
    <div class="dfield"><label class="dlabel">Menu ka naam <span class="req">*</span></label><input type="text" id="m-title" value="${escHtml(title)}" placeholder="Jaise: Standard Buffet"/></div>
    <div class="dfield row2">
      <div><label class="dlabel">Qeemat <span class="req">*</span></label><div class="suffix"><span class="rs">Rs</span><input type="number" id="m-price" min="0" value="${m ? money(m.price) : ""}" placeholder="0"/></div></div>
      <div><label class="dlabel">Kaise charge</label><select id="m-unit"><option value="per_head"${unit !== "per_event" ? " selected" : ""}>Per mehmaan</option><option value="per_event"${unit === "per_event" ? " selected" : ""}>Poore event ka (flat)</option></select></div>
    </div>
    <div class="dfield row2">
      <div><label class="dlabel">Min guarantee</label><input type="number" id="m-mingt" min="0" value="${m?.minGuaranteeCount != null ? m.minGuaranteeCount : ""}" placeholder="optional"/></div>
      <div><label class="dlabel">Konsi jagah</label><select id="m-sub">${subVenueOpts(spaces, m?.subVenueId ?? null)}</select></div>
    </div>
    <div class="dishwrap">
      <div class="dw-h"><span class="dw-t">Dishes — har dish ka course batayein</span><span class="dw-verdict ok" id="m-verdict">One-dish theek</span></div>
      <div id="dishlist">${dishesHtml}</div>
      <div class="dishbtns"><button type="button" class="mini" id="dish-add">${svg(IC.plus)} Dish add karein</button><button type="button" class="mini" id="dish-bulk">${svg(IC.plus)} Bulk (paste list)</button></div>
      <div id="bulkwrap" style="display:none;margin-top:10px"><div class="dfield"><label class="dlabel">Har line ek dish</label><textarea id="m-bulk" placeholder="Chicken Karahi&#10;Beef Biryani&#10;Zarda"></textarea></div><button type="button" class="mini" id="dish-bulk-add" style="margin-top:6px">Add list</button></div>
    </div>
    <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" id="mf-save">Menu save karein</button></div>`
}

function buildContent(tab: string, packages: ApiPackage[], menus: ApiMenu[]): string {
  const tabs = `<div class="tabs" id="tabs">
    <button class="tab${tab === "packages" ? " on" : ""}" data-tab="packages">${svg(IC.pkg, 1.8)} Packages <span class="cnt">${packages.length}</span></button>
    <button class="tab${tab === "menus" ? " on" : ""}" data-tab="menus">${svg(IC.menu, 1.8)} Menus <span class="cnt">${menus.length}</span></button>
  </div>`
  if (tab === "menus") {
    const grid = menus.length ? `<div class="pkg-grid">${menus.map(menuCard).join("")}</div>` : `<div class="empty">Abhi koi menu nahi. "Naya menu" se pehla banayein — customers ko dishes dikhengi.</div>`
    return `
    <div class="head"><div><h1>Packages & Menus</h1><div class="sub">Aapke pricing packages aur khaana menus — customers inhi se choose karte hain.</div></div><div class="head-actions"><button class="btn btn-primary" id="menu-addbtn">${svg(IC.plus, 2.2)} Naya menu</button></div></div>
    ${tabs}${grid}
    <div class="foot">WeddingWala vendor console · Packages & Menus</div>`
  }
  const grid = packages.length ? `<div class="pkg-grid">${packages.map(pkgCard).join("")}</div>` : `<div class="empty">Abhi koi package nahi. "Naya package" se pehla banayein.</div>`
  return `
  <div class="head"><div><h1>Packages & Menus</h1><div class="sub">Aapke pricing packages aur khaana menus — customers inhi se choose karte hain.</div></div><div class="head-actions"><button class="btn btn-primary" id="pkg-addbtn">${svg(IC.plus, 2.2)} Naya package</button></div></div>
  ${tabs}${grid}
  <div class="foot">WeddingWala vendor console · Packages & Menus</div>`
}

export function PackagesArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/packages", crumbBold: "Catalog", crumbSub: "Packages & Menus", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const { business } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const [tab, setTab] = React.useState<"packages" | "menus">("packages")
  const tabRef = React.useRef(tab); tabRef.current = tab
  const pkgQ = useQuery({ queryKey: ["pkgs", bizId], enabled: !!bizId, queryFn: () => PackagesAPI.getAll(Number(bizId)) })
  const menuQ = useQuery({ queryKey: ["menus", bizId], enabled: !!bizId, queryFn: () => MenusAPI.getAll(Number(bizId)) })
  const spaceQ = useQuery({ queryKey: ["pkg-spaces", bizId], enabled: !!bizId, queryFn: () => venueSpacesApi.getTree(Number(bizId)).then((r) => flattenSpaces(r.tree)).catch(() => [] as SubVenueNode[]) })
  const packages = React.useMemo(() => (pkgQ.data ?? []) as ApiPackage[], [pkgQ.data])
  const menus = React.useMemo(() => (menuQ.data ?? []) as ApiMenu[], [menuQ.data])
  const spaces = React.useMemo(() => (spaceQ.data ?? []) as SubVenueNode[], [spaceQ.data])
  const pkgRef = React.useRef(packages); pkgRef.current = packages
  const menuRef = React.useRef(menus); menuRef.current = menus
  const spaceRef = React.useRef(spaces); spaceRef.current = spaces
  const isError = pkgQ.isError || menuQ.isError

  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!bizId) { wwc.innerHTML = `<div class="loadwrap">Pehle ek venue select karein.</div>`; return }
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Packages & Menus</h1></div></div>${errorBannerHtml()}`; return }
    if (!pkgQ.data && !menuQ.data) { wwc.innerHTML = `<div class="loadwrap">Load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(tab, packages, menus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tab, pkgQ.data, menuQ.data, spaceQ.data, bizId, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready || bound.current) return
    bound.current = true
    const refetchPkg = () => qc.invalidateQueries({ queryKey: ["pkgs", bizRef.current] })
    const refetchMenu = () => qc.invalidateQueries({ queryKey: ["menus", bizRef.current] })
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)?.value?.trim() ?? ""
    const set = (id: string, v: string) => { const el = s.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null; if (el) el.value = v }
    const updateVerdict = () => {
      const rows = [...s.querySelectorAll("#dishlist .dishrow")]
      const salan = rows.filter((r) => (r.querySelector(".dish-counts") as HTMLSelectElement)?.value === "salan").length
      const v = s.getElementById("m-verdict"); if (v) { v.className = "dw-verdict " + (salan > 1 ? "warn" : "ok"); v.textContent = salan > 1 ? `${salan} salan — one-dish check karein` : "One-dish theek" }
    }
    const openPkgForm = (pkg?: ApiPackage, duplicate = false) => {
      const title = pkg ? (duplicate ? "Package ki copy" : "Package edit karein") : "Naya package"
      openDrawer(s, title, pkgFormBody(pkg ?? null, duplicate, menuRef.current, spaceRef.current))
    }
    const openMenuForm = (m?: ApiMenu, duplicate = false) => {
      const title = m ? (duplicate ? "Menu ki copy" : "Menu edit karein") : "Naya menu"
      openDrawer(s, title, menuFormBody(m ?? null, duplicate, spaceRef.current))
      updateVerdict()
    }
    s.addEventListener("change", (e) => { if ((e.target as HTMLElement)?.classList?.contains("dish-counts")) updateVerdict() })
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["pkgs", bizRef.current] }); qc.invalidateQueries({ queryKey: ["menus", bizRef.current] }); return }
      const tb = t.closest("[data-tab]") as HTMLElement | null
      if (tb?.dataset.tab) { setTab(tb.dataset.tab as "packages" | "menus"); return }
      // ── packages ──
      if (t.closest("#pkg-addbtn")) { openPkgForm(); return }
      const food = t.closest("#p-food") as HTMLElement | null
      if (food) { const on = food.getAttribute("aria-pressed") === "true"; food.setAttribute("aria-pressed", on ? "false" : "true"); const fl = s.getElementById("p-food-lbl"); if (fl) fl.textContent = on ? "Nahi" : "Haan"; return }
      const pedit = t.closest("[data-pkgedit]") as HTMLElement | null
      if (pedit?.dataset.pkgedit) { const pkg = pkgRef.current.find((p) => p.id === Number(pedit.dataset.pkgedit)); if (pkg) openPkgForm(pkg); return }
      const pdup = t.closest("[data-pkgdup]") as HTMLElement | null
      if (pdup?.dataset.pkgdup) { const pkg = pkgRef.current.find((p) => p.id === Number(pdup.dataset.pkgdup)); if (pkg) openPkgForm(pkg, true); return }
      const mopen = t.closest("[data-menuopen]") as HTMLElement | null
      if (mopen?.dataset.menuopen) {
        const mid = Number(mopen.dataset.menuopen)
        const m = menuRef.current.find((x) => x.id === mid)
        if (m) { if (tabRef.current !== "menus") setTab("menus"); openMenuForm(m) }
        return
      }
      const pdel = t.closest("[data-pkgdel]") as HTMLElement | null
      if (pdel?.dataset.pkgdel) { const id = Number(pdel.dataset.pkgdel); openConfirm(s, { title: "Package delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => { try { await PackagesAPI.delete(id); toast.success("Package hata diya"); refetchPkg() } catch { toast.error("Delete nahi hua") } } }); return }
      if (t.closest("#pf-save")) {
        const name = val("p-name"); const price = Number(val("p-price"))
        if (!name) { toast.error("Package ka naam likhein"); return }
        if (!price || price <= 0) { toast.error("Sahi qeemat likhein"); return }
        const bId = Number(bizRef.current); if (!bId) return
        const editId = Number(val("p-id"))
        const foodOn = s.getElementById("p-food")?.getAttribute("aria-pressed") === "true"
        const gmin = Number(val("p-gmin")), gmax = Number(val("p-gmax"))
        const body: Record<string, unknown> = { name, price, businessId: bId, pricingUnit: val("p-unit"), includesFood: foodOn, description: val("p-desc") || undefined }
        if (gmin > 0) body.guestRangeMin = gmin
        if (gmax > 0) body.guestRangeMax = gmax
        if (val("p-svc")) body.serviceStyle = val("p-svc")
        body.menuId = val("p-menu") ? Number(val("p-menu")) : null
        body.subVenueId = val("p-sub") ? Number(val("p-sub")) : null
        const feats = val("p-feats").split("\n").map((x) => x.trim()).filter(Boolean); if (feats.length) body.features = feats
        const mingt = Number(val("p-mingt")); if (mingt > 0 && val("p-unit") === "per_head") body.minGuaranteeCount = mingt
        const btn = s.getElementById("pf-save") as HTMLButtonElement | null; if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try { if (editId) await PackagesAPI.update(editId, body as never); else await PackagesAPI.create(body as never); toast.success(editId ? "Package update ho gaya" : "Package ban gaya"); closeDrawer(s); refetchPkg() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = "Package save karein" } }
        return
      }
      // ── menus ──
      if (t.closest("#menu-addbtn")) { openMenuForm(); return }
      if (t.closest("#dish-add")) { const dl = s.getElementById("dishlist"); if (dl) dl.insertAdjacentHTML("beforeend", dishRowHtml()); return }
      if (t.closest("#dish-bulk")) { const bw = s.getElementById("bulkwrap"); if (bw) bw.style.display = bw.style.display === "none" ? "block" : "none"; return }
      if (t.closest("#dish-bulk-add")) { const lines = val("m-bulk").split("\n").map((x) => x.trim()).filter(Boolean); const dl = s.getElementById("dishlist"); if (dl && lines.length) { dl.insertAdjacentHTML("beforeend", lines.map((l) => dishRowHtml({ name: l, countsAs: "other" })).join("")); set("m-bulk", ""); const bw = s.getElementById("bulkwrap"); if (bw) bw.style.display = "none"; updateVerdict() } return }
      const dremove = t.closest("[data-dishremove]") as HTMLElement | null
      if (dremove) { dremove.closest(".dishrow")?.remove(); updateVerdict(); return }
      const medit = t.closest("[data-menuedit]") as HTMLElement | null
      if (medit?.dataset.menuedit) { const m = menuRef.current.find((x) => x.id === Number(medit.dataset.menuedit)); if (m) openMenuForm(m); return }
      const mdup = t.closest("[data-menudup]") as HTMLElement | null
      if (mdup?.dataset.menudup) { const m = menuRef.current.find((x) => x.id === Number(mdup.dataset.menudup)); if (m) openMenuForm(m, true); return }
      const mdel = t.closest("[data-menudel]") as HTMLElement | null
      if (mdel?.dataset.menudel) { const id = Number(mdel.dataset.menudel); openConfirm(s, { title: "Menu delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => { try { await MenusAPI.delete(id); toast.success("Menu hata diya"); refetchMenu() } catch { toast.error("Delete nahi hua") } } }); return }
      if (t.closest("#mf-save")) {
        const title = val("m-title"); const price = Number(val("m-price"))
        if (!title) { toast.error("Menu ka naam likhein"); return }
        if (!price || price <= 0) { toast.error("Sahi qeemat likhein"); return }
        const bId = Number(bizRef.current); if (!bId) return
        const editId = Number(val("m-id"))
        const dishes: Dish[] = [...s.querySelectorAll("#dishlist .dishrow")].map((r) => ({ name: (r.querySelector(".dish-name") as HTMLInputElement)?.value?.trim() || "", countsAs: (r.querySelector(".dish-counts") as HTMLSelectElement)?.value as CountsAs })).filter((d) => d.name)
        const body: { title: string; price: number; businessId: number; data: Record<string, unknown>; subVenueId: number | null; pricingUnit: "per_event" | "per_head"; minGuaranteeCount?: number } = {
          title, price, businessId: bId, data: { items: dishes }, subVenueId: val("m-sub") ? Number(val("m-sub")) : null, pricingUnit: val("m-unit") as "per_event" | "per_head",
        }
        const mingt = Number(val("m-mingt")); if (mingt > 0) body.minGuaranteeCount = mingt
        const btn = s.getElementById("mf-save") as HTMLButtonElement | null; if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try { if (editId) await MenusAPI.update(editId, body); else await MenusAPI.create(body); toast.success(editId ? "Menu update ho gaya" : "Menu ban gaya"); closeDrawer(s); refetchMenu() }
        catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = "Menu save karein" } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default PackagesArtifact
