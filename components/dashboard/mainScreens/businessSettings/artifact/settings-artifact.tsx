"use client"

/**
 * Business Settings — premium rebuild on the shared champagne shell.
 *
 * The three everyday tabs (Profile, Capacity & pricing, Amenities & services)
 * are real forms wired to BusinessesAPI.update with dirty-tracking and a sticky
 * save bar. The heavy CRUD managers (Images, Packages, Menus, Bank, Listing,
 * Type-specific) are NOT reimplemented here — they keep living in the classic
 * hub at /dashboard/settings/advanced, deep-linked from their tabs, so nothing
 * money-critical is re-wired from scratch.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
import { CITIES } from "@/lib/seo/constants"
import { useArtifactShell, escHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

type FT = "str" | "num" | "bool"
const FIELD_TYPE: Record<string, FT> = {
  name: "str", ownerName: "str", description: "str", city: "str", subArea: "str", ownerBio: "str", services: "str",
  yearsInBusiness: "num", weddingsCompleted: "num", minCapacity: "num", maxCapacity: "num", minimumPrice: "num", downPayment: "num", carParkingCapacity: "num",
  downPaymentType: "str",
  catering: "bool", parking: "bool", provideSoundSystem: "bool", provideSeatingArrangement: "bool", provideWaiter: "bool", providePlate: "bool", provideDecorationItem: "bool", provideFoodTesting: "bool",
}
function serial(v: unknown, t: FT): string {
  if (t === "bool") return String(!!v)
  if (t === "num") return v == null || v === "" ? "" : String(v)
  return v == null ? "" : String(v)
}

const IC = {
  building: '<path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6"/>',
  dollar: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 3 14.1a2 2 0 1 1 0-4A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 10 3a2 2 0 1 1 4 0 1.6 1.6 0 0 0 3 1.6 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 21 10a2 2 0 1 1 0 4"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  pkg: '<path d="M16 3l5 3v12l-9 3-9-3V6l5-3M3 6l9 3 9-3M12 9v12"/>',
  menu: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>',
  bank: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  save: '<path d="M20 6 9 17l-5-5"/>',
  warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
}
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`

type TabKey = "profile" | "pricing" | "amenities" | "listing" | "type-specific" | "images" | "packages" | "menus" | "bank"
const TABS: { key: TabKey; label: string; icon: string; form: boolean; hint?: string }[] = [
  { key: "profile", label: "Profile", icon: IC.building, form: true },
  { key: "pricing", label: "Capacity & pricing", icon: IC.dollar, form: true },
  { key: "amenities", label: "Amenities & services", icon: IC.sliders, form: true },
  { key: "listing", label: "Listing content", icon: IC.shield, form: false, hint: "Rich profile — story, USPs, FAQs." },
  { key: "type-specific", label: "Type-specific", icon: IC.settings, form: false, hint: "Aapki category ke unique settings." },
  { key: "images", label: "Images", icon: IC.image, form: false, hint: "Gallery photos upload & reorder." },
  { key: "packages", label: "Packages", icon: IC.pkg, form: false, hint: "Pricing packages & bundles." },
  { key: "menus", label: "Menus", icon: IC.menu, form: false, hint: "Catering menus & per-head pricing." },
  { key: "bank", label: "Bank details", icon: IC.bank, form: false, hint: "Payout accounts for receivables." },
]

const EXTRA_CSS = String.raw`
.content{ max-width:1180px; padding-bottom:96px; }
.set-topline{ display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
.bizswitch{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
.biztab{ display:flex; flex-direction:column; gap:2px; min-width:150px; padding:9px 13px; border-radius:10px; border:1px solid var(--border); background:var(--surface); text-align:left; transition:border-color .12s,background .12s; }
.biztab:hover{ background:var(--surface-3); } .biztab.on{ border-color:var(--accent); background:var(--accent-wash); box-shadow:var(--shadow-xs); }
.biztab .bt-nm{ font-weight:600; font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:190px; }
.biztab .bt-sc{ font-size:11px; color:var(--ink-3); } .biztab.on .bt-sc{ color:var(--accent-ink); font-weight:600; }
.set-grid{ display:grid; grid-template-columns:230px 1fr; gap:16px; align-items:start; }
.tabrail{ display:flex; flex-direction:column; gap:2px; position:sticky; top:74px; }
.trow{ display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:9px; border:0; background:transparent; color:var(--ink-2); font-weight:500; font-size:13px; text-align:left; width:100%; transition:background .12s,color .12s; }
.trow svg{ width:16px; height:16px; color:var(--ink-3); flex:none; } .trow:hover{ background:var(--surface-3); color:var(--ink); }
.trow.on{ background:var(--surface-3); color:var(--ink); font-weight:600; position:relative; } .trow.on svg{ color:var(--accent-ink); }
.trow.on::before{ content:""; position:absolute; left:0; top:8px; bottom:8px; width:2.5px; border-radius:0 3px 3px 0; background:var(--accent); }
.trow .tr-tag{ margin-left:auto; font-size:10px; color:var(--ink-4); }
.panel{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow-xs); }
.panel-h{ display:flex; align-items:center; gap:12px; padding:16px 18px 14px; border-bottom:1px solid var(--border); }
.panel-ic{ width:36px; height:36px; border-radius:10px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .panel-ic svg{ width:18px; height:18px; }
.panel-h h2{ font-size:15px; font-weight:600; } .panel-h .sub{ font-size:12px; color:var(--ink-3); margin-top:2px; }
.panel-body{ padding:18px; }
.frow{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
@media (max-width:560px){ .frow{ grid-template-columns:1fr; } }
.frow.one{ grid-template-columns:1fr; }
.field{ display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
.field:last-child{ margin-bottom:0; }
.flabel{ font-size:12px; font-weight:600; color:var(--ink-2); }
.fhint{ font-size:11px; color:var(--ink-3); }
.field input[type=text],.field input[type=number],.field textarea,.field select{ width:100%; border:1px solid var(--border-2); border-radius:9px; background:var(--surface-2); color:var(--ink); padding:9px 11px; font:inherit; font-size:13px; outline:none; transition:border-color .12s,background .12s; }
.field input:focus,.field textarea:focus,.field select:focus{ border-color:var(--accent); background:var(--surface); box-shadow:0 0 0 3px var(--accent-wash); }
.field textarea{ min-height:88px; resize:vertical; line-height:1.55; }
.field .suffix{ position:relative; } .field .suffix input{ padding-left:34px; } .field .suffix .rs{ position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:12px; color:var(--ink-3); font-weight:600; }
/* toggle switch */
.tgls{ display:flex; flex-direction:column; }
.tgl-row{ display:flex; align-items:center; gap:12px; padding:12px 2px; border-bottom:1px solid var(--border); } .tgl-row:last-child{ border-bottom:0; }
.tgl-main{ flex:1; min-width:0; } .tgl-lbl{ font-weight:500; font-size:13px; } .tgl-sub{ font-size:11.5px; color:var(--ink-3); margin-top:1px; }
.tgl{ width:42px; height:24px; border-radius:20px; border:1px solid var(--border-2); background:var(--surface-3); position:relative; flex:none; transition:background .15s,border-color .15s; padding:0; }
.tgl .dot{ position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:var(--surface); box-shadow:var(--shadow-xs); transition:left .15s; }
.tgl[aria-pressed="true"]{ background:var(--accent); border-color:transparent; } .tgl[aria-pressed="true"] .dot{ left:20px; }
/* manager panel */
.mgr{ padding:34px 24px; text-align:center; }
.mgr-ic{ width:52px; height:52px; border-radius:14px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); margin:0 auto 14px; } .mgr-ic svg{ width:24px; height:24px; }
.mgr h3{ font-size:15px; font-weight:600; } .mgr p{ font-size:12.5px; color:var(--ink-3); margin:6px auto 16px; max-width:360px; line-height:1.55; }
.mgr .btn{ display:inline-flex; }
/* missing banner */
.missing{ display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:10px; background:var(--warn-wash); border:1px solid var(--accent-line); margin-bottom:14px; font-size:12.5px; color:var(--warn); }
.missing svg{ width:16px; height:16px; flex:none; } .missing b{ color:var(--ink); font-weight:600; }
.missing .fix{ margin-left:auto; font-weight:600; color:var(--accent-ink); text-decoration:underline; cursor:pointer; }
/* sticky save bar */
/* Settings is a Set-up route, so the shell renders a SECOND sidebar (app-sub:
   primary 236 + setup 234). The fixed save bar must start after BOTH. */
.savebar{ position:fixed; left:470px; right:0; bottom:0; z-index:30; display:flex; align-items:center; gap:12px; padding:12px 26px; background:color-mix(in srgb,var(--surface) 90%,transparent); backdrop-filter:blur(10px); border-top:1px solid var(--border); transform:translateY(120%); transition:transform .2s; }
@media (max-width:1160px){ .savebar{ left:434px; } }
.savebar.on{ transform:translateY(0); }
.savebar .sb-txt{ font-size:12.5px; color:var(--ink-2); font-weight:500; } .savebar .sb-sp{ flex:1; }
.savebar .btn[disabled]{ opacity:.6; cursor:default; }
@media (max-width:900px){ .set-grid{ grid-template-columns:1fr; } .tabrail{ position:static; flex-direction:row; overflow-x:auto; } .savebar{ left:300px; } }
@media (max-width:820px){ .savebar{ left:64px; } }
`

function fieldText(label: string, field: string, val: string, hint?: string, ta = false, num = false): string {
  const input = ta
    ? `<textarea data-field="${field}">${escHtml(val)}</textarea>`
    : `<input type="${num ? "number" : "text"}" data-field="${field}" value="${escHtml(val)}"/>`
  return `<div class="field"><label class="flabel">${escHtml(label)}</label>${input}${hint ? `<span class="fhint">${escHtml(hint)}</span>` : ""}</div>`
}
function fieldMoney(label: string, field: string, val: string, hint?: string): string {
  return `<div class="field"><label class="flabel">${escHtml(label)}</label><div class="suffix"><span class="rs">Rs</span><input type="number" data-field="${field}" value="${escHtml(val)}"/></div>${hint ? `<span class="fhint">${escHtml(hint)}</span>` : ""}</div>`
}
function toggle(label: string, field: string, on: boolean, sub?: string): string {
  return `<div class="tgl-row"><div class="tgl-main"><div class="tgl-lbl">${escHtml(label)}</div>${sub ? `<div class="tgl-sub">${escHtml(sub)}</div>` : ""}</div><button class="tgl" data-field="${field}" data-bool aria-pressed="${on}" aria-label="${escHtml(label)}"><span class="dot"></span></button></div>`
}

function panelProfile(b: ApiBusiness): string {
  const cityOpts = ["", ...CITIES.map((c) => c.name)].map((c) => `<option value="${escHtml(c)}"${(b.city || "") === c ? " selected" : ""}>${escHtml(c || "— sheher chunein —")}</option>`).join("")
  return `<div class="panel" data-panel="profile">
    <div class="panel-h"><span class="panel-ic">${svg(IC.building, 1.8)}</span><div><h2>Profile</h2><div class="sub">Aapka business couples ko kaise dikhta hai.</div></div></div>
    <div class="panel-body">
      <div class="frow"><div class="field"><label class="flabel">Business ka naam</label><input type="text" data-field="name" value="${escHtml(b.name || "")}"/></div>
        ${fieldText("Malik ka naam", "ownerName", b.ownerName || "", "Contracts aur quotes par dikhta hai.")}</div>
      ${fieldText("Tafseel (description)", "description", b.description || "", "80+ characters — couples pehle yahi parhte hain.", true)}
      <div class="frow"><div class="field"><label class="flabel">Sheher</label><select data-field="city">${cityOpts}</select></div>
        ${fieldText("Ilaqa / locality", "subArea", b.subArea || "", "Jaise: Johar Town, DHA Phase 5.")}</div>
      <div class="frow">${fieldText("Kitne saal se", "yearsInBusiness", b.yearsInBusiness != null ? String(b.yearsInBusiness) : "", "Tajurba trust barhata hai.", false, true)}
        ${fieldText("Kitni shaadiyan ki", "weddingsCompleted", b.weddingsCompleted != null ? String(b.weddingsCompleted) : "", undefined, false, true)}</div>
      ${fieldText("Malik ka taaruf (bio)", "ownerBio", b.ownerBio || "", "Do line — aap kaun hain, kya khaas karte hain.", true)}
    </div></div>`
}
function panelPricing(b: ApiBusiness): string {
  const dpt = b.downPaymentType || ""
  const dptOpts = ["", "Percentage", "Fixed Amount"].map((o) => `<option value="${o}"${dpt === o ? " selected" : ""}>${o || "— chunein —"}</option>`).join("")
  return `<div class="panel" data-panel="pricing" hidden>
    <div class="panel-h"><span class="panel-ic">${svg(IC.dollar, 1.8)}</span><div><h2>Capacity & pricing</h2><div class="sub">Kitne mehmaan, kya rate, kitna advance.</div></div></div>
    <div class="panel-body">
      <div class="frow">${fieldText("Kam se kam mehmaan", "minCapacity", b.minCapacity != null ? String(b.minCapacity) : "", undefined, false, true)}
        ${fieldText("Zyada se zyada mehmaan", "maxCapacity", b.maxCapacity != null ? String(b.maxCapacity) : "", undefined, false, true)}</div>
      ${fieldMoney("Shuru ki qeemat (minimum)", "minimumPrice", b.minimumPrice != null ? String(b.minimumPrice) : "", "Search filters isi se chalte hain.")}
      <div class="frow"><div class="field"><label class="flabel">Advance ka tareeqa</label><select data-field="downPaymentType">${dptOpts}</select><span class="fhint">Percentage ya fixed amount.</span></div>
        ${fieldText("Advance", "downPayment", b.downPayment != null ? String(b.downPayment) : "", "% ya rupees — upar wale tareeqe ke mutabiq.", false, true)}</div>
    </div></div>`
}
function panelAmenities(b: ApiBusiness): string {
  return `<div class="panel" data-panel="amenities" hidden>
    <div class="panel-h"><span class="panel-ic">${svg(IC.sliders, 1.8)}</span><div><h2>Amenities & services</h2><div class="sub">Aap kya kya offer karte hain.</div></div></div>
    <div class="panel-body">
      <div class="tgls">
        ${toggle("In-house catering", "catering", !!b.catering, "Khud ka khana / caterer")}
        ${toggle("Parking", "parking", !!b.parking, "Mehmaanon ke liye")}
        ${toggle("Sound system", "provideSoundSystem", !!b.provideSoundSystem)}
        ${toggle("Seating arrangement", "provideSeatingArrangement", !!b.provideSeatingArrangement)}
        ${toggle("Waiter service", "provideWaiter", !!b.provideWaiter)}
        ${toggle("Crockery / plates", "providePlate", !!b.providePlate)}
        ${toggle("Decoration items", "provideDecorationItem", !!b.provideDecorationItem)}
        ${toggle("Food tasting", "provideFoodTesting", !!b.provideFoodTesting)}
      </div>
      <div style="margin-top:16px">${fieldText("Parking capacity (gaariyan)", "carParkingCapacity", b.carParkingCapacity != null ? String(b.carParkingCapacity) : "", undefined, false, true)}</div>
      <div style="margin-top:4px">${fieldText("Extra services (free text)", "services", b.services || "", "Jaise: valet, bridal room, generator backup.", true)}</div>
    </div></div>`
}
// Packages & Menus already have a full champagne-shell editor at /dashboard/packages,
// so deep-link there instead of the legacy /settings/advanced hub (which renders the
// OLD icon-rail chrome). The remaining managers (listing/type-specific/images/bank)
// have no champagne screen yet, so they still open the classic hub.
const CHAMP_MANAGER: Partial<Record<TabKey, string>> = { packages: "/dashboard/packages", menus: "/dashboard/packages" }
function panelManager(t: { key: TabKey; label: string; icon: string; hint?: string }): string {
  const target = CHAMP_MANAGER[t.key] || `/dashboard/settings/advanced?tab=${t.key}`
  return `<div class="panel" data-panel="${t.key}" hidden><div class="mgr">
    <span class="mgr-ic">${svg(t.icon, 1.7)}</span>
    <h3>${escHtml(t.label)}</h3><p>${escHtml(t.hint || "")} Ye section apne poore editor mein khulta hai.</p>
    <button class="btn btn-primary" data-nav-btn="${target}">${escHtml(t.label)} kholein ${svg(IC.arrow)}</button>
  </div></div>`
}

function buildContent(b: ApiBusiness, all: ApiBusiness[]): string {
  const switcher = all.length > 1
    ? `<div class="bizswitch">${all.map((x) => `<button class="biztab${x.id === b.id ? " on" : ""}" data-biz="${x.id}"><span class="bt-nm">${escHtml(x.name)}</span><span class="bt-sc">${escHtml((x.city || "—"))} · ${escHtml(x.status || "")}</span></button>`).join("")}</div>`
    : ""
  const missing = !b.brandLogo
    ? `<div class="missing">${svg(IC.warn, 2)} <span><b>1 cheez missing</b> — brand logo nahi laga.</span><span class="fix" data-nav-btn="/dashboard/settings/advanced?tab=images">Theek karein</span></div>`
    : ""
  const rail = TABS.map((t) => `<button class="trow${t.key === "profile" ? " on" : ""}" data-tab="${t.key}">${svg(t.icon, 1.8)} ${escHtml(t.label)}${t.form ? "" : `<span class="tr-tag">›</span>`}</button>`).join("")
  const panels = [
    panelProfile(b), panelPricing(b), panelAmenities(b),
    ...TABS.filter((t) => !t.form).map((t) => panelManager(t)),
  ].join("")
  return `
  <div class="head"><div><h1>${escHtml(b.name)}</h1><div class="sub">Aapki public profile, pricing aur services.</div></div><div class="head-actions"><span class="st ${b.status === "approved" ? "ok" : "warn"}"><i></i> ${escHtml(b.status || "—")}</span></div></div>
  ${switcher}
  ${missing}
  <div class="set-grid">
    <div class="tabrail">${rail}</div>
    <div>${panels}</div>
  </div>
  <div class="savebar" id="savebar"><span class="sb-txt" id="sbtxt">Sab mehfooz hai</span><span class="sb-sp"></span><button class="btn btn-ghost" id="sbreset">Waapas</button><button class="btn btn-primary" id="sbsave">Save changes</button></div>`
}

export function SettingsArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/settings", crumbBold: "Set up", crumbSub: "Settings", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ["settings-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  const all = React.useMemo(() => (data ?? []) as ApiBusiness[], [data])
  const [sel, setSel] = React.useState<number | null>(null)
  const active = all.find((b) => b.id === sel) || all[0] || null
  const baseline = React.useRef<Record<string, string>>({})
  const activeRef = React.useRef(active); activeRef.current = active
  const allRef = React.useRef(all); allRef.current = all

  const save = useMutation({
    mutationFn: (patch: Partial<ApiBusiness>) => BusinessesAPI.update(activeRef.current!.id, patch),
    onSuccess: () => { toast.success("Changes save ho gaye"); qc.invalidateQueries({ queryKey: ["settings-businesses"] }); qc.invalidateQueries({ queryKey: ["onboarding-completeness"] }) },
    onError: () => toast.error("Save nahi hua — dobara koshish karein"),
  })

  const computeBaseline = React.useCallback((b: ApiBusiness) => {
    const bl: Record<string, string> = {}
    Object.keys(FIELD_TYPE).forEach((f) => { bl[f] = serial((b as unknown as Record<string, unknown>)[f], FIELD_TYPE[f]) })
    baseline.current = bl
  }, [])

  // Render on data / selection change.
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!data) { wwc.innerHTML = `<div style="padding:80px 16px;text-align:center;color:var(--ink-3)">Settings load ho rahi hain…</div>`; return }
    if (!active) { wwc.innerHTML = `<div style="padding:80px 16px;text-align:center;color:var(--ink-3)">Abhi koi business nahi.</div>`; return }
    computeBaseline(active)
    wwc.innerHTML = buildContent(active, all)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, sel])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true

    const readVal = (el: HTMLElement): string => {
      if (el.hasAttribute("data-bool")) return el.getAttribute("aria-pressed") || "false"
      return (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value ?? ""
    }
    const refreshDirty = () => {
      const bar = s.getElementById("savebar"); if (!bar) return
      let dirty = 0
      s.querySelectorAll("[data-field]").forEach((el) => { const f = (el as HTMLElement).dataset.field!; if (readVal(el as HTMLElement) !== (baseline.current[f] ?? "")) dirty++ })
      const txt = s.getElementById("sbtxt")
      bar.classList.toggle("on", dirty > 0)
      if (txt) txt.textContent = dirty > 0 ? `${dirty} cheez badli — save karein` : "Sab mehfooz hai"
    }

    const showTab = (key: string) => {
      s.querySelectorAll(".trow").forEach((r) => r.classList.toggle("on", (r as HTMLElement).dataset.tab === key))
      s.querySelectorAll("[data-panel]").forEach((p) => { (p as HTMLElement).hidden = (p as HTMLElement).dataset.panel !== key })
    }

    s.addEventListener("click", (e) => {
      const t = e.target as HTMLElement
      const biz = t.closest("[data-biz]") as HTMLElement | null
      if (biz?.dataset.biz) { setSel(Number(biz.dataset.biz)); return }
      const tab = t.closest("[data-tab]") as HTMLElement | null
      if (tab?.dataset.tab) { showTab(tab.dataset.tab); return }
      const tgl = t.closest("[data-bool]") as HTMLElement | null
      if (tgl) { tgl.setAttribute("aria-pressed", tgl.getAttribute("aria-pressed") === "true" ? "false" : "true"); refreshDirty(); return }
      if (t.closest("#sbreset")) { computeAndReset(); return }
      if (t.closest("#sbsave")) { doSave(); return }
    })
    s.addEventListener("input", (e) => { if ((e.target as HTMLElement).hasAttribute?.("data-field")) refreshDirty() })
    s.addEventListener("change", (e) => { if ((e.target as HTMLElement).hasAttribute?.("data-field")) refreshDirty() })

    const computeAndReset = () => {
      // re-render current active to discard edits
      const a = activeRef.current
      const wwc = s.getElementById("wwc"); if (wwc && a) { computeBaseline(a); wwc.innerHTML = buildContent(a, allRef.current); refreshDirty() }
    }
    const doSave = () => {
      const patch: Record<string, unknown> = {}
      s.querySelectorAll("[data-field]").forEach((el) => {
        const f = (el as HTMLElement).dataset.field!; const cur = readVal(el as HTMLElement)
        if (cur === (baseline.current[f] ?? "")) return
        const ty = FIELD_TYPE[f]
        patch[f] = ty === "bool" ? cur === "true" : ty === "num" ? (cur === "" ? null : Number(cur)) : cur
      })
      if (!Object.keys(patch).length) return
      const btn = s.getElementById("sbsave") as HTMLButtonElement | null
      if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
      save.mutate(patch as Partial<ApiBusiness>, {
        onSettled: () => { if (btn) { btn.disabled = false; btn.textContent = "Save changes" } },
        onSuccess: () => {
          Object.keys(patch).forEach((f) => { baseline.current[f] = serial(patch[f], FIELD_TYPE[f]) })
          refreshDirty()
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default SettingsArtifact
