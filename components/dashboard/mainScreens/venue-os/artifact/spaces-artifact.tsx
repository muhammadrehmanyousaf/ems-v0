"use client"

/**
 * Halls & Spaces — champagne rebuild of the venue hierarchy manager.
 * A venue owner adds halls/lawns/marquees (and floors/sections inside them),
 * sets each one's capacity, rent, booking mode, who it can host, and a wet-
 * weather fallback. Wired to venueSpacesApi (sub-venue tree + merge groups).
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { venueSpacesApi, type SubVenueNode, type MergeGroup, type BookingMode } from "@/lib/api/venueSpaces"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useBusiness } from "@/context/BusinessContext"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml, openDrawer, closeDrawer, openConfirm } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const KINDS = ["HALL", "LAWN", "MARQUEE", "ROOFTOP", "BASEMENT", "FLOOR", "SECTION", "OTHER"]
const KIND_LABEL: Record<string, string> = { HALL: "Hall", LAWN: "Lawn", MARQUEE: "Marquee", ROOFTOP: "Rooftop", BASEMENT: "Basement", FLOOR: "Floor", SECTION: "Section", OTHER: "Aur" }
const GENDERS = ["MIXED", "SEGREGABLE", "ZENANA", "MARDANA"]
const GENDER_LABEL: Record<string, string> = { MIXED: "Mixed", SEGREGABLE: "Alag ho sakta", ZENANA: "Zenana", MARDANA: "Mardana" }
const MODES: BookingMode[] = ["SESSION", "WHOLE_DAY"]
const MODE_LABEL: Record<string, string> = { SESSION: "Session (per shift)", WHOLE_DAY: "Poora din" }
const OPEN_AIR = new Set(["LAWN", "ROOFTOP"])
const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  building: '<path d="M3 21h18M6 21V7l6-4 6 4v14"/><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4"/>', users: '<path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>', warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>', sub: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>', merge: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/>',
}
const kindLabel = (k: string) => KIND_LABEL[k] || k

function flatten(tree: SubVenueNode[]): SubVenueNode[] {
  const out: SubVenueNode[] = []
  const walk = (nodes: SubVenueNode[]) => { for (const n of nodes) { out.push(n); if (n.children?.length) walk(n.children) } }
  walk(tree || [])
  return out
}

const EXTRA_CSS = String.raw`
.content{ max-width:1080px; }
.sp-tiles{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); } .tile.warn .t-val{ color:var(--warn); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:21px; font-weight:680; margin-top:8px; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.warnbox{ display:flex; gap:10px; align-items:flex-start; padding:12px 15px; margin-bottom:14px; background:var(--warn-wash); border:1px solid transparent; border-radius:var(--r); } .warnbox svg{ width:17px; height:17px; color:var(--warn); flex:none; margin-top:1px; } .warnbox .wb-t{ font-size:12.5px; font-weight:600; color:var(--warn); } .warnbox .wb-l{ font-size:12px; color:var(--ink-2); margin-top:3px; line-height:1.5; }
.nmlnk{ color:var(--accent-ink); font-weight:600; cursor:pointer; } .nmlnk:hover{ text-decoration:underline; }
.hallcard{ margin-bottom:12px; overflow:hidden; transition:box-shadow .12s,border-color .12s; } .hallcard:hover{ box-shadow:var(--shadow-md); border-color:var(--accent-line); }
.sprow{ display:flex; align-items:center; gap:13px; padding:14px 16px; border-bottom:1px solid var(--border); transition:background .1s; } .sprow:last-child{ border-bottom:0; } .sprow:hover{ background:var(--surface-2); } .sprow.inactive{ opacity:.6; }
.sprow.header{ background:linear-gradient(90deg,var(--accent-wash),transparent 60%); } .sprow.header .sp-nm{ font-size:14.5px; }
.sprow.child{ position:relative; } .sprow.child::before{ content:""; position:absolute; left:0; top:0; bottom:0; width:2px; background:var(--accent-line); }
.sp-ic{ width:38px; height:38px; border-radius:10px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .sp-ic svg{ width:19px; height:19px; }
.sprow.header .sp-ic{ background:var(--accent); color:var(--on-accent); border-color:transparent; }
.capbar{ height:5px; border-radius:3px; background:var(--surface-3); overflow:hidden; max-width:170px; margin-top:7px; } .capbar span{ display:block; height:100%; border-radius:3px; background:var(--accent); }
.sp-main{ flex:1; min-width:0; }
.sp-nm{ font-weight:600; font-size:13.5px; display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.kindpill{ font-size:10.5px; font-weight:600; padding:1px 8px; border-radius:6px; background:var(--accent-wash); color:var(--accent-ink); }
.sp-facts{ font-size:12px; color:var(--ink-3); margin-top:4px; display:flex; gap:14px; flex-wrap:wrap; } .sp-facts b{ color:var(--ink-2); font-weight:600; }
.sp-acts{ display:flex; align-items:center; gap:7px; flex:none; }
.tgl{ width:40px; height:23px; border-radius:20px; border:1px solid var(--border-2); background:var(--surface-3); position:relative; flex:none; padding:0; } .tgl .dot{ position:absolute; top:2px; left:2px; width:17px; height:17px; border-radius:50%; background:var(--surface); box-shadow:var(--shadow-xs); transition:left .15s; } .tgl[aria-pressed="true"]{ background:var(--ok); border-color:transparent; } .tgl[aria-pressed="true"] .dot{ left:19px; }
.iconbtn{ width:30px; height:30px; border-radius:7px; border:1px solid var(--border-2); background:var(--surface); color:var(--ink-3); display:grid; place-items:center; } .iconbtn:hover{ background:var(--surface-3); color:var(--ink); } .iconbtn.bad:hover{ color:var(--bad); border-color:var(--bad); } .iconbtn svg{ width:14px; height:14px; }
.fhint{ font-size:10.5px; color:var(--ink-4); }
.sec-h{ font-size:12.5px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:var(--ink-3); margin:22px 2px 12px; display:flex; align-items:center; gap:8px; } .sec-h svg{ width:15px; height:15px; color:var(--accent-ink); }
.mg-item{ display:flex; align-items:center; gap:11px; padding:12px 15px; border-bottom:1px solid var(--border); } .mg-item:last-child{ border-bottom:0; } .mg-nm{ font-weight:600; font-size:13px; } .mg-sub{ font-size:11.5px; color:var(--ink-3); margin-top:2px; }
.chk-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:8px; } .chk{ display:flex; align-items:center; gap:8px; font-size:12.5px; padding:7px 10px; border:1px solid var(--border-2); border-radius:8px; cursor:pointer; } .chk input{ width:auto; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; text-align:center; }
@media (max-width:900px){ .sp-tiles{ grid-template-columns:1fr 1fr; } }
`

function spaceFormBody(flat: SubVenueNode[], node?: SubVenueNode | null, parentId?: number | null): string {
  const kindSel = node?.kind || "HALL"
  const genderSel = node?.genderMode || "MIXED"
  const modeSel = node?.bookingMode || "SESSION"
  const parentSel = node ? (node.parentSubVenueId != null ? String(node.parentSubVenueId) : "") : (parentId != null ? String(parentId) : "")
  const backupSel = node?.backupSubVenueId != null ? String(node.backupSubVenueId) : ""
  const parentOpts = `<option value="">— Top level (koi hall ke andar nahi) —</option>` + flat
    .map((s) => `<option value="${s.id}"${String(s.id) === parentSel ? " selected" : ""}>${"— ".repeat(s.depth)}${escHtml(s.name)}</option>`).join("")
  const backupOpts = `<option value="">— koi nahi —</option>` + flat.filter((s) => !OPEN_AIR.has(s.kind)).map((s) => `<option value="${s.id}"${String(s.id) === backupSel ? " selected" : ""}>${escHtml(s.name)}</option>`).join("")
  const kindOpts = KINDS.map((k) => `<option value="${k}"${k === kindSel ? " selected" : ""}>${escHtml(kindLabel(k))}</option>`).join("")
  const genderOpts = GENDERS.map((g) => `<option value="${g}"${g === genderSel ? " selected" : ""}>${escHtml(GENDER_LABEL[g])}</option>`).join("")
  const modeOpts = MODES.map((m) => `<option value="${m}"${m === modeSel ? " selected" : ""}>${escHtml(MODE_LABEL[m])}</option>`).join("")
  return `
  <input type="hidden" id="sv-id" value="${node ? node.id : ""}"/><input type="hidden" id="sv-oldparent" value="${node?.parentSubVenueId != null ? node.parentSubVenueId : ""}"/>
  <div class="dfield"><label class="dlabel">Naam <span class="req">*</span></label><input type="text" id="sv-name" value="${node ? escHtml(node.name) : ""}" placeholder="Jaise: Grand Hall"/></div>
  <div class="dfield row2">
    <div><label class="dlabel">Ye kya hai?</label><select id="sv-kind">${kindOpts}</select></div>
    <div><label class="dlabel">Kis ke andar? <span class="fhint">(hall/floor)</span></label><select id="sv-parent">${parentOpts}</select></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Comfortable seating <span class="fhint">(advisory)</span></label><input type="number" id="sv-comfort" min="0" value="${node?.comfortCapacity != null ? node.comfortCapacity : ""}" placeholder="500"/></div>
    <div><label class="dlabel">Maximum mehmaan <span class="fhint">(enforced — khaali = koi limit nahi)</span></label><input type="number" id="sv-fire" min="0" value="${node?.fireRatedCapacity != null ? node.fireRatedCapacity : ""}" placeholder="800"/></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Base rent (Rs)</label><input type="number" id="sv-price" min="0" value="${node?.basePricePkr != null ? money(node.basePricePkr) : ""}" placeholder="0"/></div>
    <div><label class="dlabel">Kaise let hota hai?</label><select id="sv-mode">${modeOpts}</select></div>
  </div>
  <div class="dfield row2">
    <div><label class="dlabel">Kaun host kar sakta hai?</label><select id="sv-gender">${genderOpts}</select></div>
    <div><label class="dlabel">Baarish mein move karein <span class="fhint">(open-air ke liye)</span></label><select id="sv-backup">${backupOpts}</select></div>
  </div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" id="af-save">${node ? "Update karein" : "Space save karein"}</button></div>`
}

function mgFormBody(flat: SubVenueNode[], group?: MergeGroup | null): string {
  const memberIds = new Set((group?.members || []).map((m) => m.subVenueId))
  const spaceChecks = flat.filter((s) => s.active).map((s) => `<label class="chk"><input type="checkbox" class="mg-chk" value="${s.id}"${memberIds.has(s.id) ? " checked" : ""}/> ${escHtml(s.name)}</label>`).join("")
  return `
  <input type="hidden" id="mg-id" value="${group ? group.id : ""}"/>
  ${group ? `<div class="bf-hint">Combo edit karein — dubara save par purana hata ke naya ban jayega.</div>` : `<div class="bf-hint">Kai halls ko ek unit ki tarah bechein — kam se kam 2 spaces chunein.</div>`}
  <div class="dfield"><label class="dlabel">Naam <span class="req">*</span></label><input type="text" id="mg-name" value="${group ? escHtml(group.name) : ""}" placeholder="Jaise: Grand + Lawn combo"/></div>
  <div class="dfield"><label class="dlabel">Kaunse spaces <span class="req">*</span></label><div class="chk-grid">${spaceChecks || `<div class="fhint">Koi active space nahi.</div>`}</div></div>
  <div class="dfield"><label class="dlabel">Combined rent (Rs)</label><input type="number" id="mg-price" min="0" value="${group?.combinedPricePkr != null ? money(group.combinedPricePkr) : ""}" placeholder="optional"/></div>
  <div class="ww-dfoot"><button class="btn btn-ghost" type="button" data-drawer-close>Cancel</button><button class="btn btn-primary" type="button" id="mg-save">${group ? "Update karein" : "Combine karein"}</button></div>`
}

function buildContent(nodes: SubVenueNode[], warnings: { subVenueId: number; name: string; overBy: number }[], groups: MergeGroup[]): string {
  const flat = flatten(nodes)
  const active = flat.filter((s) => s.active)
  const noLimit = flat.filter((s) => s.fireRatedCapacity == null).length
  const tiles = `<div class="sp-tiles">
    <div class="tile hl"><div class="t-cap">${svg(IC.building, 1.7)} Kul spaces</div><div class="t-val tnum">${flat.length}</div><div class="t-sub">halls, lawns, sections</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.building, 1.7)} Active</div><div class="t-val tnum">${active.length}</div><div class="t-sub">couples ko dikhte hain</div></div>
    <div class="tile ${noLimit > 0 ? "warn" : ""}"><div class="t-cap">${svg(IC.users, 1.7)} Guest limit set nahi</div><div class="t-val tnum">${noLimit}</div><div class="t-sub">max mehmaan missing</div></div>
    <div class="tile ${warnings.length ? "warn" : ""}"><div class="t-cap">${svg(IC.warn, 1.7)} Capacity warnings</div><div class="t-val tnum">${warnings.length}</div><div class="t-sub">bachon ka total zyada</div></div>
  </div>`
  const warnBox = warnings.length ? `<div class="warnbox">${svg(IC.warn, 1.9)}<div><div class="wb-t">Capacity dhyaan dein</div>${warnings.map((w) => `<div class="wb-l"><span class="nmlnk" data-edit="${w.subVenueId}">${escHtml(w.name)}</span> — andar ke spaces ka total <b>${w.overBy}</b> mehmaan zyada hai.</div>`).join("")}</div></div>` : ""

  const rowHtml = (s: SubVenueNode, isHeader: boolean) => {
    const pills = [
      !s.active ? `<span class="st mut"><i></i> Hidden</span>` : "",
      s.fireRatedCapacity == null ? `<span class="st warn"><i></i> Koi limit nahi</span>` : "",
      OPEN_AIR.has(s.kind) && s.backupSubVenueId == null ? `<span class="st info"><i></i> Rain plan nahi</span>` : "",
    ].join("")
    const cap = s.fireRatedCapacity != null && s.comfortCapacity != null && s.fireRatedCapacity > 0
      ? `<div class="capbar" title="Comfort ${s.comfortCapacity} / Max ${s.fireRatedCapacity}"><span style="width:${Math.min(100, Math.round((s.comfortCapacity / s.fireRatedCapacity) * 100))}%"></span></div>` : ""
    return `<div class="sprow ${isHeader ? "header" : "child"}${s.active ? "" : " inactive"}" style="padding-left:${16 + (isHeader ? 0 : s.depth * 22)}px">
      <span class="sp-ic">${svg(IC.building, 1.7)}</span>
      <div class="sp-main">
        <div class="sp-nm">${escHtml(s.name)} <span class="kindpill">${escHtml(kindLabel(s.kind))}</span> ${pills}</div>
        <div class="sp-facts"><span>Comfort: <b>${s.comfortCapacity != null ? pkNum(s.comfortCapacity) : "—"}</b></span><span>Max: <b>${s.fireRatedCapacity != null ? pkNum(s.fireRatedCapacity) : "koi limit nahi"}</b></span><span>Rent: <b>${s.basePricePkr != null ? "Rs " + pkNum(money(s.basePricePkr)) : "—"}</b></span><span>${escHtml(MODE_LABEL[s.bookingMode] || s.bookingMode)}</span><span>${escHtml(GENDER_LABEL[s.genderMode] || s.genderMode)}</span></div>
        ${cap}
      </div>
      <div class="sp-acts">
        <button class="tgl" data-active="${s.id}" data-on="${s.active}" aria-pressed="${s.active}" title="${s.active ? "Hide karein" : "Wapas dikhayein"}"><span class="dot"></span></button>
        <button class="iconbtn" data-addchild="${s.id}" title="Andar space">${svg(IC.plus)}</button>
        <button class="iconbtn" data-edit="${s.id}" title="Edit">${svg(IC.edit)}</button>
        <button class="iconbtn bad" data-del="${s.id}" title="Delete">${svg(IC.trash)}</button>
      </div>
    </div>`
  }
  const hallCard = (node: SubVenueNode) => { const rows = flatten([node]); return `<div class="card hallcard">${rows.map((s, i) => rowHtml(s, i === 0)).join("")}</div>` }
  const list = nodes.length ? nodes.map(hallCard).join("") : `<div class="card"><div class="empty">Abhi koi hall/space nahi. "Naya space" se pehla hall add karein.</div></div>`

  // merge groups
  const nameById = new Map(flat.map((s) => [s.id, s.name] as const))
  const mgList = groups.length ? `<div class="card">${groups.map((g) => {
    const mems = g.members || []
    const memLinks = mems.map((m) => { const nm = nameById.get(m.subVenueId); return nm ? `<span class="nmlnk" data-edit="${m.subVenueId}">${escHtml(nm)}</span>` : "" }).filter(Boolean).join(", ")
    return `<div class="mg-item"><span class="sp-ic">${svg(IC.merge, 1.7)}</span><div style="flex:1"><div class="mg-nm">${escHtml(g.name)}</div><div class="mg-sub">${memLinks || `${mems.length} spaces`}${g.combinedPricePkr != null ? ` · Rs ${pkNum(money(g.combinedPricePkr))}` : ""}</div></div><button class="iconbtn" data-mgedit="${g.id}" title="Edit">${svg(IC.edit)}</button><button class="iconbtn bad" data-mgdel="${g.id}" title="Delete">${svg(IC.trash)}</button></div>`
  }).join("")}</div>` : ""

  return `
  <div class="head"><div><h1>Halls & Spaces</h1><div class="sub">Apni jagahein — har hall ki capacity, rent, aur booking tareeqa set karein.</div></div><div class="head-actions"><button class="btn btn-primary" id="addbtn">${svg(IC.plus, 2.2)} Naya space</button></div></div>
  ${tiles}${warnBox}${list}
  <div class="sec-h">${svg(IC.merge, 1.8)} Combined spaces</div>
  <div style="margin-bottom:12px"><button class="btn btn-ghost" id="mgaddbtn">${svg(IC.plus, 2)} Spaces combine karein</button></div>
  ${mgList}
  <div class="foot">WeddingWala vendor console · Halls & Spaces</div>`
}

export function SpacesArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, { activeHref: "/dashboard/spaces", crumbBold: "Venue", crumbSub: "Halls & Spaces", extraCss: EXTRA_CSS })
  const qc = useQueryClient()
  const { business } = useBusiness()
  const activeBusinessId = useActiveBusinessId()
  const bizId = activeBusinessId ?? (business as { id?: number } | null)?.id ?? null
  const bizRef = React.useRef(bizId); bizRef.current = bizId
  const treeQ = useQuery({ queryKey: ["spaces-tree", bizId], enabled: !!bizId, queryFn: () => venueSpacesApi.getTree(Number(bizId)) })
  const warnQ = useQuery({ queryKey: ["spaces-warn", bizId], enabled: !!bizId, queryFn: () => venueSpacesApi.capacityWarnings(Number(bizId)).catch(() => ({ businessId: Number(bizId), warnings: [] })) })
  const mgQ = useQuery({ queryKey: ["spaces-mg", bizId], enabled: !!bizId, queryFn: () => venueSpacesApi.listMergeGroups(Number(bizId)).catch(() => ({ businessId: Number(bizId), groups: [] })) })
  const isError = treeQ.isError
  const flatRef = React.useRef<SubVenueNode[]>([])
  const groupsRef = React.useRef<MergeGroup[]>([])

  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (!bizId) { wwc.innerHTML = `<div class="loadwrap">Pehle ek venue select karein.<br/>Venue switcher (upar left) se apni marquee chunein.</div>`; return }
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Halls & Spaces</h1></div></div>${errorBannerHtml()}`; return }
    if (!treeQ.data) { wwc.innerHTML = `<div class="loadwrap">Spaces load ho rahe hain…</div>`; return }
    const nodes = treeQ.data.tree ?? []
    flatRef.current = flatten(nodes)
    groupsRef.current = mgQ.data?.groups ?? []
    wwc.innerHTML = buildContent(nodes, warnQ.data?.warnings ?? [], mgQ.data?.groups ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, treeQ.data, warnQ.data, mgQ.data, bizId, isError])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current; if (!s || !ready || bound.current) return
    bound.current = true
    const refetch = () => { qc.invalidateQueries({ queryKey: ["spaces-tree", bizRef.current] }); qc.invalidateQueries({ queryKey: ["spaces-warn", bizRef.current] }); qc.invalidateQueries({ queryKey: ["spaces-mg", bizRef.current] }) }
    const val = (id: string) => (s.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value?.trim() ?? ""
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { refetch(); return }
      if (t.closest("#addbtn")) { openDrawer(s, "Naya space", spaceFormBody(flatRef.current, null, null)); return }
      const addchild = t.closest("[data-addchild]") as HTMLElement | null
      if (addchild?.dataset.addchild) { openDrawer(s, "Naya space", spaceFormBody(flatRef.current, null, Number(addchild.dataset.addchild))); return }
      const edit = t.closest("[data-edit]") as HTMLElement | null
      if (edit?.dataset.edit) { const n = flatRef.current.find((x) => x.id === Number(edit.dataset.edit)); if (n) openDrawer(s, "Space edit karein", spaceFormBody(flatRef.current, n)); return }
      const act = t.closest("[data-active]") as HTMLElement | null
      if (act?.dataset.active) { const id = Number(act.dataset.active), on = act.dataset.on === "true"; try { await venueSpacesApi.updateSubVenue(id, { active: !on }); toast.success(!on ? "Wapas dikh raha hai" : "Hide kar diya"); refetch() } catch { toast.error("Nahi hua") } return }
      const del = t.closest("[data-del]") as HTMLElement | null
      if (del?.dataset.del) {
        const id = Number(del.dataset.del); const node = flatRef.current.find((x) => x.id === id)
        const kids = node ? flatRef.current.filter((x) => (x.path ?? "").startsWith(node.path ?? "") && x.id !== id).length : 0
        openConfirm(s, {
          title: kids > 0 ? `"${node?.name}" aur uske andar ke ${kids} spaces delete karein?` : `"${node?.name}" delete karein?`,
          message: "Ye record hat jayega — wapas nahi aayega.", danger: true,
          onConfirm: async () => {
            try { await venueSpacesApi.deleteSubVenue(id); toast.success("Delete ho gaya"); refetch() } catch { toast.error("Delete nahi hua") }
          },
        })
        return
      }
      // merge groups
      if (t.closest("#mgaddbtn")) { openDrawer(s, "Spaces combine karein", mgFormBody(flatRef.current, null)); return }
      const mgedit = t.closest("[data-mgedit]") as HTMLElement | null
      if (mgedit?.dataset.mgedit) { const g = groupsRef.current.find((x) => x.id === Number(mgedit.dataset.mgedit)); if (g) openDrawer(s, "Combo edit karein", mgFormBody(flatRef.current, g)); return }
      const mgdel = t.closest("[data-mgdel]") as HTMLElement | null
      if (mgdel?.dataset.mgdel) {
        const mgId = Number(mgdel.dataset.mgdel)
        openConfirm(s, { title: "Combo delete karein?", message: "Ye record hat jayega — wapas nahi aayega.", danger: true, onConfirm: async () => {
          try { await venueSpacesApi.deleteMergeGroup(mgId); toast.success("Combo hata diya"); refetch() } catch { toast.error("Nahi hua") }
        } })
        return
      }
      const mgSave = t.closest("#mg-save") as HTMLButtonElement | null
      if (mgSave) {
        const name = val("mg-name"); if (!name) { toast.error("Combo ka naam likhein"); return }
        const ids = [...s.querySelectorAll(".mg-chk")].filter((c) => (c as HTMLInputElement).checked).map((c) => Number((c as HTMLInputElement).value))
        if (ids.length < 2) { toast.error("Kam se kam 2 spaces chunein"); return }
        const body: { name: string; subVenueIds: number[]; combinedPricePkr?: number } = { name, subVenueIds: ids }
        if (val("mg-price")) body.combinedPricePkr = Number(val("mg-price"))
        const mgEditId = val("mg-id") ? Number(val("mg-id")) : null
        const mgOrig = mgSave.textContent; mgSave.disabled = true; mgSave.textContent = "Save ho raha…"
        try {
          if (mgEditId) await venueSpacesApi.deleteMergeGroup(mgEditId)
          await venueSpacesApi.createMergeGroup(Number(bizRef.current), body)
          toast.success(mgEditId ? "Combo update ho gaya" : "Spaces combine ho gaye"); closeDrawer(s); refetch()
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nahi hua"); mgSave.disabled = false; if (mgOrig) mgSave.textContent = mgOrig }
        return
      }
      if (t.closest("#af-save")) {
        const name = val("sv-name"); if (!name) { toast.error("Space ka naam likhein"); return }
        const bId = Number(bizRef.current); if (!bId) { toast.error("Venue select karein"); return }
        const editId = Number(val("sv-id"))
        const comfort = val("sv-comfort") ? Number(val("sv-comfort")) : null
        const fire = val("sv-fire") ? Number(val("sv-fire")) : null
        const price = val("sv-price") ? Number(val("sv-price")) : null
        const backup = val("sv-backup") ? Number(val("sv-backup")) : null
        const parent = val("sv-parent") ? Number(val("sv-parent")) : null
        const btn = s.getElementById("af-save") as HTMLButtonElement | null; const btnOrig = btn?.textContent; if (btn) { btn.disabled = true; btn.textContent = "Save ho raha…" }
        try {
          if (editId) {
            await venueSpacesApi.updateSubVenue(editId, { name, kind: val("sv-kind"), genderMode: val("sv-gender"), bookingMode: val("sv-mode") as BookingMode, comfortCapacity: comfort, fireRatedCapacity: fire, basePricePkr: price, backupSubVenueId: backup })
            const oldParent = val("sv-oldparent") ? Number(val("sv-oldparent")) : null
            if (parent !== oldParent) await venueSpacesApi.moveSubVenue(editId, parent)
          } else {
            const cbody: { name: string; kind: string; genderMode: string; bookingMode: BookingMode; parentSubVenueId: number | null; comfortCapacity?: number; fireRatedCapacity?: number; basePricePkr?: number } = { name, kind: val("sv-kind"), genderMode: val("sv-gender"), bookingMode: val("sv-mode") as BookingMode, parentSubVenueId: parent }
            if (comfort != null) cbody.comfortCapacity = comfort
            if (fire != null) cbody.fireRatedCapacity = fire
            if (price != null) cbody.basePricePkr = price
            const created = await venueSpacesApi.createSubVenue(bId, cbody)
            if (backup != null && created?.id) await venueSpacesApi.updateSubVenue(created.id, { backupSubVenueId: backup })
          }
          toast.success(editId ? "Space update ho gaya" : "Space ban gaya"); closeDrawer(s); refetch()
        } catch (err: unknown) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save nahi hua"); if (btn) { btn.disabled = false; btn.textContent = btnOrig || "Space save karein" } }
        return
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default SpacesArtifact
