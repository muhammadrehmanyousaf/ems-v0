"use client"

/**
 * The Obligations strip (PLANS-SPEC contract 3) and the money/tax export (contract 4): what a locked vendor still owes
 * their customers, as counts, dates and ONE money total. No customer names, phones or per-booking amounts: those stay
 * behind the lock.
 *
 * A figure the server did not send is shown as "not available" and never as 0 ("missing is not zero"): "Rs 0 still to
 * collect" on a failed answer would tell a vendor with money owed that they owe nothing.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Download, Loader2 } from "lucide-react"
import { downloadMoneyExport, getObligations, isNotThere } from "@/lib/api/billing"
import { fmtPkDate } from "@/lib/plans/access"
import { useOne } from "../bilingual"

export const OBLIGATIONS_KEY = ["plan-obligations"] as const

const NA = <span className="wwp-na">-</span>
const rs = (n: number) => <><span className="rs">Rs</span>{n.toLocaleString("en-PK")}</>

export function ObligationsStrip({ onHold = false }: { onHold?: boolean }) {
  const one = useOne()
  const q = useQuery({
    queryKey: OBLIGATIONS_KEY,
    queryFn: getObligations,
    retry: (n, e) => !isNotThere(e) && n < 1,
    staleTime: 60_000,
  })
  const [busy, setBusy] = React.useState(false)

  const onExport = async () => {
    setBusy(true)
    try { await downloadMoneyExport() } catch { toast.error(one.t("export.failed")) } finally { setBusy(false) }
  }

  // The endpoint does not exist on this server yet: say nothing rather than show an empty strip.
  const absent = q.isError && isNotThere(q.error)
  const o = q.data ?? null

  return (
    <section className="wwp-card wwp-obl" aria-labelledby="wwp-obl-h" data-testid="obligations-strip">
      {/* With the figures: "While your plan is paused". Without them (the summary is not available, or this server does not have it yet) the card is just the vendor's records. */}
      <h2 id="wwp-obl-h">{one.t(o ? (onHold ? "obl.title_hold" : "obl.title") : "export.title")}</h2>
      {one.both && <div className="ru-h">{one.other(o ? (onHold ? "obl.title_hold" : "obl.title") : "export.title")}</div>}

      {q.isLoading ? (
        <div className="resp" role="status">...</div>
      ) : q.isError && !absent ? (
        <div className="wwp-err" role="alert">
          <span>{one.t("obl.error")}</span>
          <button type="button" className="wwp-btn ghost sm" onClick={() => q.refetch()}>{one.t("wall.retry")}</button>
        </div>
      ) : o ? (
        <>
          <p className="resp">{one.t("obl.responsibility")}{one.both ? <span style={{ color: "var(--ink-3)" }}> {one.other("obl.responsibility")}</span> : null}</p>
          <dl className="wwp-rows">
            <Row label="obl.events" value={o.confirmedEventsNext60 === null ? NA : <>{o.confirmedEventsNext60}</>} />
            <Row
              label="obl.next"
              small
              value={o.nextEvent ? <>{fmtPkDate(o.nextEvent.date) || NA}</> : o.confirmedEventsNext60 === 0 ? <span className="wwp-na">{one.t("obl.next_none")}</span> : NA}
              sub={o.nextEvent ? [o.nextEvent.hall, o.nextEvent.slotLabel].filter(Boolean).join(" - ") : undefined}
            />
            <Row label="obl.collect" value={o.totalToCollect === null ? NA : rs(o.totalToCollect)} />
            <Row label="obl.cheques" value={o.chequesDue14d === null ? NA : <>{o.chequesDue14d}</>} />
          </dl>
        </>
      ) : null}

      <div className="wwp-exp">
        <div className="t">
          <div>{one.t("export.note")}</div>
          {one.both && <div className="ru">{one.other("export.note")}</div>}
        </div>
        <button type="button" className="wwp-btn ghost" onClick={onExport} disabled={busy} data-testid="export-csv">
          {busy ? <Loader2 className="animate-spin" /> : <Download />}
          {busy ? one.t("export.busy") : one.t("export.btn")}
        </button>
      </div>
    </section>
  )
}

function Row({ label, value, sub, small }: { label: "obl.events" | "obl.next" | "obl.collect" | "obl.cheques"; value: React.ReactNode; sub?: string; small?: boolean }) {
  const one = useOne()
  return (
    <div className="wwp-row">
      <dt>{one.t(label)}{one.both ? <span>{one.other(label)}</span> : null}</dt>
      <dd className={small ? "sm" : undefined}>{value}{sub ? <small>{sub}</small> : null}</dd>
    </div>
  )
}
