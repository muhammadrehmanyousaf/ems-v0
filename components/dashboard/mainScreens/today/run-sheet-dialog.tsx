"use client"

/**
 * F-9 — day-of Run Sheet (run-of-show), distinct from the billing function sheet.
 *
 * A clean, print-ready sheet the floor manager hands the team on event day: every
 * timeline task grouped by phase (setup → event → teardown) or by person, with
 * time, duration, assignee and a tick box. Reuses the timeline the vendor already
 * built — no new data. Print CSS isolates the sheet so it prints black-on-white
 * without the dashboard chrome.
 */

import * as React from "react"
import type { TimelineTask } from "@/lib/api/bookingTimeline"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/shared/icon"

const CATEGORY_ORDER: TimelineTask["category"][] = ["setup", "event", "teardown"]
const CATEGORY_LABEL: Record<TimelineTask["category"], string> = { setup: "Setup", event: "Event", teardown: "Teardown" }

function fmtTime(t: string | null): string {
  if (!t) return "—"
  const [h, m] = t.split(":")
  const hh = Number(h)
  if (!Number.isFinite(hh)) return t
  const ap = hh < 12 ? "AM" : "PM"
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${h12}:${m ?? "00"} ${ap}`
}
const fmtDur = (d: number | null) => (d && d > 0 ? `${d}m` : "")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
}
const byTime = (a: TimelineTask, b: TimelineTask) =>
  (a.scheduledTime || "99").localeCompare(b.scheduledTime || "99") || a.sortOrder - b.sortOrder

export interface RunSheetSubject {
  customerName: string | null
  bookingDate: string | null
  bookingTime: string | null
  status?: string | null
  venueName?: string | null
}

export function RunSheetDialog({
  open, onOpenChange, subject, tasks,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  subject: RunSheetSubject
  tasks: TimelineTask[]
}) {
  const [groupByPerson, setGroupByPerson] = React.useState(false)

  const groups = React.useMemo(() => {
    const active = tasks.filter((t) => t.status !== "skipped")
    if (groupByPerson) {
      const map = new Map<string, TimelineTask[]>()
      for (const t of [...active].sort(byTime)) {
        const key = (t.assignedTo || "").trim() || "Unassigned"
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(t)
      }
      return [...map.entries()].map(([label, items]) => ({ label, items }))
    }
    return CATEGORY_ORDER
      .map((c) => ({ label: CATEGORY_LABEL[c], items: active.filter((t) => t.category === c).sort(byTime) }))
      .filter((g) => g.items.length > 0)
  }, [tasks, groupByPerson])

  const total = tasks.filter((t) => t.status !== "skipped").length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0" data-runsheet>
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            [data-runsheet], [data-runsheet] * { visibility: visible !important; }
            [data-runsheet] { position: fixed !important; inset: 0 !important; max-width: none !important; max-height: none !important; width: 100% !important; box-shadow: none !important; border: 0 !important; overflow: visible !important; background: #fff !important; color: #000 !important; }
            [data-print-hide] { display: none !important; }
            .rs-group { break-inside: avoid; }
          }
        `}</style>

        {/* Toolbar (screen only) */}
        <div data-print-hide className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 px-5 py-3 backdrop-blur">
          <span className="text-sm font-semibold">Run sheet</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={groupByPerson ? "outline" : "default"} onClick={() => setGroupByPerson(false)}>By time</Button>
            <Button size="sm" variant={groupByPerson ? "default" : "outline"} onClick={() => setGroupByPerson(true)}>By person</Button>
            <Button size="sm" onClick={() => window.print()}><Icon name="Printer" size={15} className="mr-1.5" /> Print</Button>
          </div>
        </div>

        {/* Printable sheet */}
        <div className="px-6 py-5 text-[13px] text-neutral-900">
          <header className="mb-4 border-b border-neutral-300 pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight">Run Sheet</h1>
              <span className="text-xs uppercase tracking-wider text-neutral-500">Day-of run-of-show</span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[13px]">
              <div><span className="text-neutral-500">Client:</span> <span className="font-medium">{subject.customerName || "—"}</span></div>
              <div><span className="text-neutral-500">Date:</span> <span className="font-medium">{fmtDate(subject.bookingDate)}</span></div>
              {subject.venueName && <div><span className="text-neutral-500">Venue:</span> <span className="font-medium">{subject.venueName}</span></div>}
              <div><span className="text-neutral-500">Start:</span> <span className="font-medium">{subject.bookingTime || "—"}</span></div>
            </div>
          </header>

          {total === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500" data-print-hide>
              No timeline yet. Add day-of tasks (or seed a template) on this booking, then print the run sheet.
            </p>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <section key={g.label} className="rs-group">
                  <h2 className="mb-1 border-b border-neutral-200 pb-1 text-[11px] font-bold uppercase tracking-widest text-neutral-600">{g.label}</h2>
                  <table className="w-full border-collapse text-[13px]">
                    <tbody>
                      {g.items.map((t) => (
                        <tr key={t.id} className="border-b border-neutral-100 align-top">
                          <td className="w-[74px] whitespace-nowrap py-1 pr-2 font-medium tabular-nums">{fmtTime(t.scheduledTime)}</td>
                          <td className="w-[42px] py-1 pr-2 text-neutral-500 tabular-nums">{fmtDur(t.durationMin)}</td>
                          <td className="py-1 pr-2">
                            <span className={t.status === "done" ? "line-through text-neutral-400" : ""}>{t.label}</span>
                            {t.notes ? <span className="block text-[11px] text-neutral-500">{t.notes}</span> : null}
                          </td>
                          {!groupByPerson && <td className="w-[110px] py-1 pr-2 text-neutral-600">{t.assignedTo || "—"}</td>}
                          <td className="w-[26px] py-1 text-center align-middle text-neutral-400">
                            <span className="inline-block h-3.5 w-3.5 rounded-[3px] border border-neutral-400">{t.status === "done" ? "✓" : ""}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          )}

          <footer className="mt-5 border-t border-neutral-300 pt-2 text-[10px] text-neutral-400">
            {total} step{total === 1 ? "" : "s"} · Wedding Wala run sheet · times are Asia/Karachi
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RunSheetDialog
