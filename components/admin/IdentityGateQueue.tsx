"use client"

/**
 * WW-VERIFY-GATES — businesses waiting on an identity check.
 *
 * ── The gap this fills ────────────────────────────────────────────────────
 *
 * `DocumentQueueTable` is organised around uploaded FILES: it lists what is in
 * `/admin/documents` and shows the four identity gates alongside, so a reviewer
 * looking at a CNIC scan can stamp the CNIC gate while they are there.
 *
 * That means a business only ever appears there if it has a document pending.
 * A vendor who typed their NTN and uploaded nothing is waiting on a human, and
 * appears on no admin screen at all — `listVerificationQueue` was written for
 * exactly this and was called by nothing.
 *
 * Driving the queue against production found two such businesses. Both are real
 * Lahore venues, both submitted an NTN, and neither had ever been visible to a
 * reviewer.
 *
 * ── Why the two screens stay separate ─────────────────────────────────────
 *
 * They answer different questions. Documents asks "what has been sent in that
 * someone must look at". This asks "who is waiting on us". A business with a
 * verified NTN and an unread utility bill belongs on the first and not the
 * second; a business with a typed NTN and no uploads belongs on the second and
 * not the first.
 */

import { useCallback, useEffect, useState } from "react"
import {
  ShieldCheck, ShieldAlert, Loader2, Mail, Phone, MapPin, Gauge, Building2, Inbox,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  listVerificationQueue,
  approveGate,
  rejectGate,
  GATE_LABELS,
  VERIFICATION_GATES,
  type VerificationGate,
  type VerificationRow,
} from "@/lib/api/adminVerification"

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"

/** "All" is the server's default (no `gate` param) — every pending gate at once. */
type Filter = "all" | VerificationGate

/** What each gate needs before it can be stamped, and whether it is done. */
function gateState(row: VerificationRow, gate: VerificationGate) {
  switch (gate) {
    case "ntn":
      return { submitted: !!row.ntnNumber, verifiedAt: row.ntnVerifiedAt, detail: row.ntnNumber }
    case "cnic":
      return { submitted: row.cnicSubmitted, verifiedAt: row.cnicVerifiedAt, detail: row.cnicSubmitted ? "on file" : null }
    case "address":
      return { submitted: !!row.addressProofUrl, verifiedAt: row.addressVerifiedAt, detail: row.addressProofUrl }
    case "visited":
      // A site visit has nothing to submit — it is a record that someone went.
      return { submitted: true, verifiedAt: row.visitedAt, detail: null }
  }
}

export function IdentityGateQueue() {
  const [filter, setFilter] = useState<Filter>("all")
  const [rows, setRows] = useState<VerificationRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listVerificationQueue({ gate: filter === "all" ? undefined : filter, limit: 50 })
      setRows(res.rows)
      setCount(res.count)
    } catch (e: any) {
      toast({
        title: "Could not load the queue",
        description: e?.response?.data?.message || "Try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { void load() }, [load])

  /**
   * The server is the authority on whether a gate can be stamped: 400 when
   * nothing was submitted, 409 when it is already verified. Both messages say
   * something a reviewer needs, so they are surfaced verbatim rather than
   * flattened into "something went wrong".
   */
  const act = async (row: VerificationRow, gate: VerificationGate, mode: "approve" | "reject") => {
    const key = `${row.id}:${gate}:${mode}`
    if (mode === "reject") {
      const reason = window.prompt(
        `Why is ${row.name}'s ${GATE_LABELS[gate]} being turned down?\n\nThis CLEARS what they submitted — they will have to send it again — and the reason is recorded against their business.`,
      )
      if (!reason?.trim()) return
      setBusy(key)
      try {
        // `force` covers the case the server guards with WW-176: rejecting an
        // ALREADY-VERIFIED gate permanently erases the value, so it refuses
        // unless the intent is explicit. The reviewer is asked again, plainly.
        const verified = !!gateState(row, gate).verifiedAt
        if (verified) {
          const sure = window.confirm(
            `${GATE_LABELS[gate]} is already verified. Rejecting it will permanently erase the value — it cannot be recovered.\n\nContinue?`,
          )
          if (!sure) { setBusy(null); return }
        }
        await rejectGate(row.id, gate, reason.trim(), verified)
        toast({ title: `${GATE_LABELS[gate]} turned down`, description: `${row.name} has been asked to resubmit.` })
        await load()
      } catch (e: any) {
        toast({ title: "Not turned down", description: e?.response?.data?.message || "Try again.", variant: "destructive" })
      } finally { setBusy(null) }
      return
    }

    setBusy(key)
    try {
      await approveGate(row.id, gate)
      toast({ title: `${GATE_LABELS[gate]} verified`, description: row.name || `Business #${row.id}` })
      await load()
    } catch (e: any) {
      toast({ title: "Not verified", description: e?.response?.data?.message || "Try again.", variant: "destructive" })
    } finally { setBusy(null) }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Waiting on an identity check</CardTitle>
        <p className="text-sm text-bridal-text-soft">
          Businesses that submitted an NTN, CNIC or address proof that nobody has checked yet — including
          those with no documents in the folder above.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All pending</TabsTrigger>
            {VERIFICATION_GATES.map((g) => (
              <TabsTrigger key={g} value={g}>{GATE_LABELS[g]}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <p className="flex items-center gap-2 py-8 text-sm text-bridal-text-soft">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Inbox className="h-8 w-8 text-bridal-text-soft/60" />
            <p className="text-sm text-bridal-text-soft">
              {filter === "all"
                ? "Nobody is waiting on an identity check."
                : `No business is waiting on a ${GATE_LABELS[filter as VerificationGate]} check.`}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-bridal-charcoal">
              {count} {count === 1 ? "business" : "businesses"} waiting
              {rows.length < count ? <span className="font-normal text-bridal-text-soft"> · showing {rows.length}</span> : null}
            </p>
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row.id} className="rounded-xl border border-bridal-beige bg-bridal-cream/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium text-bridal-charcoal">
                        <Building2 className="h-4 w-4 text-bridal-text-soft" />
                        {row.name || `Business #${row.id}`}
                      </p>
                      <p className="mt-0.5 text-xs text-bridal-text-soft">
                        {[row.subArea, row.city].filter(Boolean).join(", ") || "—"} · #{row.id} · Joined {fmtDate(row.createdAt)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-bridal-text-soft">
                      <Gauge className="h-3.5 w-3.5" />
                      Completeness {row.completenessScore ?? "—"}
                      {typeof row.completenessScore === "number" ? "%" : ""}
                    </span>
                  </div>

                  {/* Who to contact if the filing looks wrong. */}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-bridal-text-soft">
                    <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{row.vendor?.email || "—"}</span>
                    <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{row.vendor?.phoneNumber || "—"}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{row.vendor?.fullName || "—"}</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {VERIFICATION_GATES.map((gate) => {
                      const st = gateState(row, gate)
                      const verified = !!st.verifiedAt
                      return (
                        <div key={gate} className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`inline-flex min-w-[7.5rem] items-center gap-1.5 rounded-full border px-2 py-0.5 ${
                            verified
                              ? "border-green-300 bg-green-50 text-green-700"
                              : st.submitted
                                ? "border-amber-300 bg-amber-50 text-amber-800"
                                : "border-bridal-beige bg-white text-bridal-text-soft"
                          }`}>
                            {verified ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                            {GATE_LABELS[gate]}
                            {verified ? ` · ${fmtDate(st.verifiedAt)}` : st.submitted ? "" : " · not submitted"}
                          </span>

                          {/* The submitted value itself. This queue is the only
                              surface entitled to it — the public detail endpoint
                              strips ntnNumber for every non-owner. */}
                          {st.detail && !verified ? (
                            <span className="truncate font-mono text-[11px] text-bridal-charcoal">{st.detail}</span>
                          ) : null}

                          {!verified && st.submitted ? (
                            <button
                              type="button"
                              onClick={() => act(row, gate, "approve")}
                              disabled={busy === `${row.id}:${gate}:approve`}
                              className="rounded-full border border-green-300 bg-white px-2 py-[2px] text-[11px] font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              {busy === `${row.id}:${gate}:approve`
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : "Verify"}
                            </button>
                          ) : null}

                          {st.submitted ? (
                            <button
                              type="button"
                              onClick={() => act(row, gate, "reject")}
                              disabled={busy === `${row.id}:${gate}:reject`}
                              className="rounded-full border border-red-300 bg-white px-2 py-[2px] text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {busy === `${row.id}:${gate}:reject`
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : "Turn down"}
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
