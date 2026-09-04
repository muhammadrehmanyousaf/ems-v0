"use client"

/**
 * Annual tax report — premium rebuild on the shared champagne shell.
 * Real data via TaxReportAPI.getAnnualReport (Pakistani fiscal year by default,
 * calendar optional) with a genuine PDF download via pdfBlob. Read-only report:
 * summary tiles, month-by-month revenue vs expenses, category breakdown, FBR.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { TaxReportAPI, type AnnualTaxReport } from "@/lib/api/tax"
import { useArtifactShell, pkNum, escHtml, errorBannerHtml } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const money = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const svg = (p: string, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}">${p}</svg>`
const IC = {
  dl: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', up: '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>',
  down: '<path d="M3 3v18h18"/><path d="M7 8l3 3 3-3 5 6"/>', scale: '<path d="M12 3v18M5 8l7-5 7 5M4 21h16"/>', doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
}
const CAT_LABEL: Record<string, string> = {
  ingredients: "Saman / raashan", fuel: "Fuel", labour: "Mazdoori", salary: "Tankhwah", electricity: "Bijli",
  rentals: "Kiraya", repairs: "Marammat", marketing: "Marketing", brokerage: "Brokerage", tax: "Tax", supplies: "Supplies", transport: "Transport", other: "Deegar",
}

const EXTRA_CSS = String.raw`
.tax-tiles{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:10px; }
.tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:10px 13px; box-shadow:var(--shadow-xs); }
.tile.hl{ background:linear-gradient(155deg,var(--accent-wash),color-mix(in srgb,var(--surface) 72%,var(--accent-wash))); border-color:var(--accent-line); } .tile.hl .t-cap,.tile.hl .t-val{ color:var(--accent-ink); }
.tile.pos .t-val{ color:var(--ok); } .tile.neg .t-val{ color:var(--bad); }
.t-cap{ font-size:11.5px; color:var(--ink-3); font-weight:500; display:flex; align-items:center; gap:6px; } .t-cap svg{ width:13px; height:13px; }
.t-val{ font-size:17px; font-weight:680; letter-spacing:-.02em; margin-top:4px; } .t-val .rs{ font-size:12px; color:var(--ink-3); font-weight:600; } .t-sub{ font-size:11px; color:var(--ink-3); margin-top:4px; }
.seg{ display:inline-flex; gap:2px; background:var(--surface-2); border:1px solid var(--border); border-radius:9px; padding:3px; } .seg button{ height:28px; padding:0 12px; border-radius:7px; border:0; background:transparent; color:var(--ink-2); font-size:12px; font-weight:600; } .seg button.on{ background:var(--surface); color:var(--ink); box-shadow:var(--shadow-xs); }
.yearsel{ height:34px; border:1px solid var(--border); border-radius:9px; background:var(--surface); color:var(--ink); padding:0 10px; font:inherit; font-size:12.5px; font-weight:600; outline:none; }
.legend{ display:flex; gap:16px; padding:0 16px 8px; font-size:11.5px; color:var(--ink-3); } .legend i{ display:inline-block; width:9px; height:9px; border-radius:2px; margin-right:5px; vertical-align:middle; }
.mbars{ display:flex; align-items:flex-end; gap:8px; height:170px; padding:8px 16px 0; }
.mcol{ flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; min-width:0; }
.mcol .pair{ display:flex; align-items:flex-end; gap:3px; height:140px; width:100%; justify-content:center; }
.mcol .bar{ width:11px; border-radius:3px 3px 0 0; } .mcol .bar.rev{ background:var(--accent); } .mcol .bar.exp{ background:var(--ink-4); opacity:.55; }
.mcol .ml{ font-size:10px; color:var(--ink-3); white-space:nowrap; }
.catbars{ display:flex; flex-direction:column; gap:9px; padding:8px 16px 16px; }
.catbar{ display:grid; grid-template-columns:130px 1fr auto; gap:12px; align-items:center; }
.cb-nm{ font-size:12px; color:var(--ink-2); } .cb-track{ height:7px; border-radius:4px; background:var(--surface-3); overflow:hidden; } .cb-track span{ display:block; height:100%; border-radius:4px; background:var(--accent); } .cb-amt{ font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; }
.fbr{ display:flex; align-items:flex-start; gap:11px; padding:14px 16px; } .fbr-ic{ width:36px; height:36px; border-radius:10px; background:var(--surface-3); border:1px solid var(--border); display:grid; place-items:center; color:var(--accent-ink); flex:none; } .fbr-ic svg{ width:18px; height:18px; }
.fbr-t{ font-weight:600; font-size:13px; } .fbr-s{ font-size:11.5px; color:var(--ink-3); margin-top:3px; line-height:1.5; }
.loadwrap{ display:grid; place-items:center; padding:80px 16px; color:var(--ink-3); font-size:13px; }
@media (max-width:980px){ .tax-tiles{ grid-template-columns:repeat(2,1fr); } }
`

function buildContent(r: AnnualTaxReport, year: number, basis: string): string {
  const s = r.summary
  const net = money(s.netPnl)
  const totalRev = money(s.bookingRevenue) + money(s.sheetRevenue)
  const months = r.months || []
  const maxM = Math.max(1, ...months.map((m) => Math.max(money(m.revenue), money(m.expenses))))
  const cats = (Object.entries(r.expensesByCategory || {}) as [string, number][]).filter(([, v]) => money(v) > 0).sort((a, b) => money(b[1]) - money(a[1]))
  const maxCat = cats.length ? money(cats[0][1]) : 1

  const years = [year + 1, year, year - 1, year - 2].filter((y) => y <= new Date().getFullYear() + 1)
  const toolbar = `<div class="toolbar">
    <div class="seg" id="basis"><button class="${basis === "fiscal" ? "on" : ""}" data-basis="fiscal">Fiscal (Jul–Jun)</button><button class="${basis === "calendar" ? "on" : ""}" data-basis="calendar">Calendar</button></div>
    <select class="yearsel" id="yearsel">${years.map((y) => `<option value="${y}"${y === year ? " selected" : ""}>${y}</option>`).join("")}</select>
    <div class="filters"><button class="btn btn-primary" id="pdfbtn">${svg(IC.dl)} PDF download</button></div></div>`

  const tiles = `<div class="tax-tiles">
    <div class="tile"><div class="t-cap">${svg(IC.up, 1.9)} Kul revenue</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(totalRev)}</div><div class="t-sub">${s.bookingCount} bookings</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.down, 1.9)} Kul kharcha</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(money(s.totalExpenses))}</div><div class="t-sub">${s.expenseCount} entries</div></div>
    <div class="tile ${net >= 0 ? "pos" : "neg"} hl"><div class="t-cap">${svg(IC.scale, 1.9)} Net P&L</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(net)}</div><div class="t-sub">revenue − kharcha</div></div>
    <div class="tile"><div class="t-cap">${svg(IC.doc, 1.9)} FBR jama</div><div class="t-val tnum"><span class="rs">Rs</span> ${pkNum(money(s.fbrSubmittedValue))}</div><div class="t-sub">${s.fbrSubmittedCount} submissions</div></div>
  </div>`

  const chart = `<div class="card" style="margin-bottom:14px"><div class="card-h" style="padding:14px 16px 4px"><div><h2 style="font-size:13.5px;font-weight:600">Mahine ke hisaab se</h2><div class="sub" style="font-size:11.5px;color:var(--ink-3)">Revenue vs kharcha</div></div></div>
    <div class="legend"><span><i style="background:var(--accent)"></i>Revenue</span><span><i style="background:var(--ink-4);opacity:.55"></i>Kharcha</span></div>
    <div class="mbars">${months.map((m) => `<div class="mcol"><div class="pair"><span class="bar rev" style="height:${Math.max(2, Math.round((money(m.revenue) / maxM) * 138))}px" title="Rev Rs ${pkNum(money(m.revenue))}"></span><span class="bar exp" style="height:${Math.max(2, Math.round((money(m.expenses) / maxM) * 138))}px" title="Kharcha Rs ${pkNum(money(m.expenses))}"></span></div><span class="ml">${escHtml((m.monthLabel || "").slice(0, 3))}</span></div>`).join("")}</div></div>`

  const catCard = cats.length ? `<div class="card" style="margin-bottom:14px"><div class="card-h" style="padding:14px 16px 4px"><div><h2 style="font-size:13.5px;font-weight:600">Kharcha — category ke hisaab se</h2></div></div><div class="catbars">${cats.slice(0, 8).map(([c, v]) => `<div class="catbar"><span class="cb-nm">${escHtml(CAT_LABEL[c] || c)}</span><span class="cb-track"><span style="width:${Math.round((money(v) / maxCat) * 100)}%"></span></span><span class="cb-amt tnum">Rs ${pkNum(money(v))}</span></div>`).join("")}</div></div>` : ""

  const fbrNote = s.fbrConfigured === false || (s.fbrProvider && s.fbrProvider === "noop")
    ? "FBR e-filing abhi is account par switch on nahi — ye report record ke liye hai. Apne tax consultant ke saath file karein."
    : "FBR submissions upar dikhaye gaye hain. Report PDF apne records/consultant ke liye download karein."
  const fbrCard = `<div class="card"><div class="fbr"><span class="fbr-ic">${svg(IC.doc, 1.7)}</span><div><div class="fbr-t">FBR / filing</div><div class="fbr-s">${escHtml(fbrNote)}</div></div></div></div>`

  return `
  <div class="head"><div><h1>Tax report</h1><div class="sub"><b>${escHtml(r.period?.label || "")}</b> · Pakistani ${basis === "fiscal" ? "fiscal saal (Jul–Jun)" : "calendar saal"}</div></div></div>
  ${toolbar}${tiles}${chart}${catCard}${fbrCard}
  <div class="foot">WeddingWala vendor console · Tax report</div>`
}

export function TaxArtifact() {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const { shadowRef, ready } = useArtifactShell(hostRef, {
    activeHref: "/dashboard/tax", crumbBold: "Khata", crumbSub: "Tax report", extraCss: EXTRA_CSS,
  })
  const qc = useQueryClient()
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [basis, setBasis] = React.useState<"fiscal" | "calendar">("fiscal")
  const { data, isError } = useQuery({ queryKey: ["tax-art", year, basis], queryFn: () => TaxReportAPI.getAnnualReport(year, basis) })
  const stateRef = React.useRef({ year, basis }); stateRef.current = { year, basis }

  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready) return
    const wwc = s.getElementById("wwc"); if (!wwc) return
    if (isError) { wwc.innerHTML = `<div class="head"><div><h1>Tax report</h1></div></div>${errorBannerHtml()}`; return }
    if (!data) { wwc.innerHTML = `<div class="loadwrap">Tax report load ho raha hai…</div>`; return }
    wwc.innerHTML = buildContent(data, year, basis)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, isError, year, basis])

  const bound = React.useRef(false)
  React.useEffect(() => {
    const s = shadowRef.current
    if (!s || !ready || bound.current) return
    bound.current = true
    s.addEventListener("click", async (e) => {
      const t = e.target as HTMLElement
      if (t.closest("[data-retry]")) { qc.invalidateQueries({ queryKey: ["tax-art"] }); return }
      const b = t.closest("[data-basis]") as HTMLElement | null
      if (b?.dataset.basis) { setBasis(b.dataset.basis as "fiscal" | "calendar"); return }
      if (t.closest("#pdfbtn")) {
        const { year: y, basis: bs } = stateRef.current
        const btn = s.getElementById("pdfbtn") as HTMLButtonElement | null
        if (btn) { btn.disabled = true }
        try {
          const blob = await TaxReportAPI.pdfBlob(y, bs)
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a"); a.href = url; a.download = `tax-report-${y}-${bs}.pdf`
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000)
          toast.success("PDF download ho gayi")
        } catch { toast.error("PDF nahi bani — dobara koshish karein") }
        finally { if (btn) btn.disabled = false }
        return
      }
    })
    s.addEventListener("change", (e) => {
      const t = e.target as HTMLElement
      if (t.id === "yearsel") setYear(Number((t as HTMLSelectElement).value))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={hostRef} />
}

export default TaxArtifact
