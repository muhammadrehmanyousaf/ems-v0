"use client"

// "Start calling": ask the server for the next prospect (it claims one for you with a lease) and open it. If nobody is ready,
// say why in plain words, so an empty queue is never a blank page.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { CalendarClock, Headphones, Upload } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, Empty, ErrorState, PageHead, SkelRows } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { prospectsApi } from "@/lib/api/ops-prospects"

export function CallStartView() {
  const { can } = useOps()
  const router = useRouter()
  const started = useRef(false)
  const [state, setState] = useState<{ kind: "loading" } | { kind: "empty"; later: number; review: number } | { kind: "error"; message: string }>({ kind: "loading" })

  const go = async () => {
    setState({ kind: "loading" })
    try {
      const r = await prospectsApi.next()
      if (r.empty || !r.id) { setState({ kind: "empty", later: r.scheduledLater ?? 0, review: r.needsReview ?? 0 }); return }
      router.replace(`/ops/prospects/${r.id}?from=queue`)
    } catch (e) { setState({ kind: "error", message: opsErrorMessage(e) }) }
  }
  useEffect(() => {
    if (started.current) return // React strict mode runs effects twice in development; one Next is enough
    started.current = true
    void go()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageHead title="Call queue" sub="The next vendor to call is picked for you: callbacks that are due first, then the oldest." />
      <Card flush>
        {state.kind === "loading" && <SkelRows rows={5} />}
        {state.kind === "error" && <ErrorState message={state.message} onRetry={go} />}
        {state.kind === "empty" && (
          <Empty icon={<Headphones />} title="Nobody is ready to call right now"
            action={<div className="row" style={{ justifyContent: "center" }}>
              {can("ops_prospect_import") && <Link href="/ops/import" className="btn btn-primary"><Upload aria-hidden />Import a sheet</Link>}
              <Link href="/ops/prospects" className="btn btn-ghost">See all prospects</Link>
              <Btn onClick={go}>Check again</Btn>
            </div>}>
            {state.later > 0 && <span style={{ display: "block" }}><CalendarClock size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} aria-hidden />{state.later} prospect{state.later === 1 ? " is" : "s are"} waiting for their callback time.</span>}
            {state.review > 0 && <span style={{ display: "block" }}>{state.review} need{state.review === 1 ? "s" : ""} your lead to decide (no answer after many tries).</span>}
            {state.later === 0 && state.review === 0 && <span>Import a sheet of vendors, or ask your lead to assign you some.</span>}
          </Empty>
        )}
      </Card>
    </>
  )
}
