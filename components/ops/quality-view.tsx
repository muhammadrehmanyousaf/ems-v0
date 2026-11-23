"use client"

// Quality (spec 7.7). Going live without approval is acceptable only because there is a way to catch bad data:
//  - a random share of new listings is sent for a SECOND look (it never takes a listing down; a flag feeds coaching),
//  - a listing with only a spoken "yes" is chased for a written one, and a vendor who said no is on record.
// The server enforces who may review what; nobody reviews their own onboarding.
import Link from "next/link"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ClipboardCheck, ShieldCheck } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, Empty, ErrorState, Field, Modal, Notice, PageHead, Pager, Seg, SkelRows, Status, TabBar, Textarea, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { listingApi } from "@/lib/api/ops-onboarding"
import { opsReportsApi, type ConsentQueueKind, type ConsentQueueRow, type QaRow, type QaView } from "@/lib/api/ops-reports"
import { consentMessage, toWaNumber, waLink } from "@/lib/ops/whatsapp"

type Tab = "qa" | ConsentQueueKind
const PAGE = 25

const consentTone = (c: QaRow["consent"]) => (c === "confirmed_written" ? "ok" : c === "withdrawn" ? "bad" : "warn") as "ok" | "bad" | "warn"
const consentWord = (c: QaRow["consent"]) => (c === "confirmed_written" ? "Written consent" : c === "withdrawn" ? "Said no" : c === "verbal_call" ? "Spoken yes only" : "No consent recorded")
const waitingFor = (hours: number) => (hours < 48 ? `${hours} h` : `${Math.floor(hours / 24)} days`)

function ReviewModal({ row, onClose }: { row: QaRow | null; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [result, setResult] = useState<"passed" | "flagged">("passed")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (row) { setResult(row.qaStatus === "flagged" ? "flagged" : "passed"); setNote(row.qaNote ?? ""); setError(null) } }, [row])
  const save = useMutation({
    mutationFn: () => opsReportsApi.reviewQa(row!.businessId, { result, note: note.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "quality"] })
      qc.invalidateQueries({ queryKey: ["ops", "report"] })
      toast({ title: result === "passed" ? "Marked as checked" : "Flagged for coaching", body: "The decision is in the audit trail." })
      onClose()
    },
    onError: (e) => setError(opsErrorMessage(e)),
  })
  const needsNote = result === "flagged" && note.trim().length < 3
  return (
    <Modal open={!!row} onClose={onClose} title={row ? `Second look: ${row.name}` : "Second look"}
      description="Check the listing the way a couple would see it. A flag never takes the listing down; it tells the team what to fix."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={save.isPending} disabled={needsNote} onClick={() => save.mutate()}>Save decision</Btn></>}>
      {row && (
        <div style={{ display: "grid", gap: 14 }}>
          {error && <Notice tone="bad">{error}</Notice>}
          <div className="small muted">{[row.vendorType, row.city].filter(Boolean).join(" · ")} · taken live by {row.onboardedByName ?? "someone"} on {fmtWhen(row.onboardedAt)}{row.completenessScore != null ? ` · ${row.completenessScore}% complete` : ""}</div>
          <Link href={`/ops/listings/${row.businessId}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost sm" style={{ justifySelf: "start" }}>Open the listing in a new tab</Link>
          <Seg<"passed" | "flagged"> label="Decision" value={result} onChange={(v) => { setResult(v); setError(null) }} options={[{ value: "passed", label: "Looks right" }, { value: "flagged", label: "Something is wrong" }]} />
          <Field label={result === "flagged" ? "What is wrong" : "Note (optional)"} htmlFor="qa-note" required={result === "flagged"} hint={result === "flagged" ? "Be specific, so the agent can be coached. For example: capacity does not match the venue." : undefined}>
            <Textarea id="qa-note" rows={3} maxLength={1000} value={note} onChange={(e) => { setNote(e.target.value); setError(null) }} />
          </Field>
        </div>
      )}
    </Modal>
  )
}

function QaTab() {
  const { me, can } = useOps()
  const [view, setView] = useState<QaView>("queued")
  const [page, setPage] = useState(1)
  const [reviewing, setReviewing] = useState<QaRow | null>(null)
  const q = useQuery({ queryKey: ["ops", "quality", "qa", view, page], queryFn: () => opsReportsApi.qa({ view, page, pageSize: PAGE }), placeholderData: (p) => p })
  const rows = q.data?.rows ?? []
  const c = q.data?.counts
  const mayReviewOwn = can("ops_reports_all") // a manager has no one above them; everyone else needs a second person
  return (
    <>
      <div className="toolbar">
        <Seg<QaView> label="Show" value={view} onChange={(v) => { setView(v); setPage(1) }}
          options={[{ value: "queued", label: `Waiting${c ? ` (${c.queued})` : ""}` }, { value: "flagged", label: `Flagged${c ? ` (${c.flagged})` : ""}` }, { value: "passed", label: `Checked${c ? ` (${c.passed})` : ""}` }, { value: "all", label: "All" }]} />
      </div>
      <Card flush>
        {q.isLoading ? <SkelRows rows={6} /> : q.isError ? <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /> : rows.length === 0 ? (
          <Empty icon={<ClipboardCheck />} title={view === "queued" ? "Nothing is waiting for a second look" : "Nothing here"}>
            {view === "queued" ? "A share of new listings is picked at random when they go live and appears here. The share is set in Settings." : "Listings appear here once they have been reviewed."}
          </Empty>
        ) : rows.map((r) => {
          const own = r.onboardedByUserId === me.user.id && !mayReviewOwn
          return (
            <div key={r.businessId} className="list-row" style={{ alignItems: "flex-start" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="td-name"><Link href={`/ops/listings/${r.businessId}`}>{r.name}</Link></div>
                <div className="td-sub">{[r.vendorType, r.city, `by ${r.onboardedByName ?? "—"}`, fmtWhen(r.onboardedAt)].filter(Boolean).join(" · ")}</div>
                <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  <Status tone="mut">{r.onboardMode === "takeover" ? "Taken over" : "New listing"}</Status>
                  {r.completenessScore != null && <Status tone={r.completenessScore >= 70 ? "ok" : "warn"}>{r.completenessScore}% complete</Status>}
                  {r.needsMoreData && <Status tone="warn">Needs more data</Status>}
                  <Status tone={consentTone(r.consent)}>{consentWord(r.consent)}</Status>
                  {r.businessStatus !== "approved" && <Status tone="bad">{r.businessStatus}</Status>}
                </div>
                {r.qaStatus !== "queued" && (
                  <p className="small" style={{ margin: "8px 0 0", color: r.qaStatus === "flagged" ? "var(--bad)" : "var(--ink-3)" }}>
                    {r.qaStatus === "flagged" ? "Flagged" : "Checked"} by {r.reviewedByName ?? "—"}{r.qaReviewedAt ? `, ${fmtWhen(r.qaReviewedAt)}` : ""}{r.qaNote ? `: ${r.qaNote}` : ""}
                  </p>
                )}
              </div>
              <div className="nw">
                <Btn size="sm" variant={r.qaStatus === "queued" ? "primary" : undefined} disabled={own} title={own ? "Someone else has to review your own onboarding" : undefined} onClick={() => setReviewing(r)}>{r.qaStatus === "queued" ? "Review" : "Change decision"}</Btn>
              </div>
            </div>
          )
        })}
        {rows.length > 0 && <Pager page={page} pageSize={PAGE} total={q.data?.total ?? 0} onPage={setPage} />}
      </Card>
      <ReviewModal row={reviewing} onClose={() => setReviewing(null)} />
    </>
  )
}

function ConsentTab({ kind }: { kind: ConsentQueueKind }) {
  const { can } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [page, setPage] = useState(1)
  const [sayingNo, setSayingNo] = useState<ConsentQueueRow | null>(null)
  const q = useQuery({ queryKey: ["ops", "quality", "consent", kind, page], queryFn: () => opsReportsApi.consentQueue({ kind, page, pageSize: PAGE }), placeholderData: (p) => p })
  const rows = q.data?.rows ?? []
  const done = () => { qc.invalidateQueries({ queryKey: ["ops", "quality"] }); qc.invalidateQueries({ queryKey: ["ops", "report"] }) }
  const confirm = useMutation({
    mutationFn: (id: number) => listingApi.consent(id, { kind: "confirmed_written" }),
    onSuccess: () => { done(); toast({ title: "Written consent recorded" }) },
    onError: (e) => toast({ title: "Couldn't record it", body: opsErrorMessage(e), tone: "bad" }),
  })
  const no = useMutation({
    mutationFn: (id: number) => listingApi.consent(id, { kind: "withdrawn" }),
    onSuccess: (r) => { done(); setSayingNo(null); toast({ title: "Vendor said no", body: r.tookDown ? "The listing was taken off the site." : "Recorded." }) },
    onError: (e) => toast({ title: "Couldn't record it", body: opsErrorMessage(e), tone: "bad" }),
  })
  return (
    <>
      {kind === "awaiting" && q.data && <p className="small muted" style={{ margin: "0 0 12px" }}>Live listings with only a spoken &ldquo;yes&rdquo; (or nothing recorded) for more than {q.data.chaseHours} hours, oldest first. Ask the vendor to confirm in writing; the wait time is set in Settings.</p>}
      {kind === "withdrawn" && <p className="small muted" style={{ margin: "0 0 12px" }}>Vendors who said no. The listing was taken off the site at that moment; this is the record and the follow-up.</p>}
      <Card flush>
        {q.isLoading ? <SkelRows rows={6} /> : q.isError ? <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /> : rows.length === 0 ? (
          <Empty icon={<ShieldCheck />} title={kind === "awaiting" ? "No one is waiting on a written confirmation" : "No vendor has said no"}>
            {kind === "awaiting" ? "Every live listing is either inside the wait time or confirmed in writing." : "If a vendor withdraws, the listing is taken down and appears here."}
          </Empty>
        ) : rows.map((r) => {
          const wa = toWaNumber(r.phone)
          return (
            <div key={r.businessId} className="list-row" style={{ alignItems: "flex-start" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="td-name"><Link href={`/ops/listings/${r.businessId}`}>{r.name}</Link></div>
                <div className="td-sub">{[r.vendorType, r.city, r.phone, `taken live by ${r.onboardedByName ?? "—"}`].filter(Boolean).join(" · ")}</div>
                <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  <Status tone={consentTone(r.consent)}>{consentWord(r.consent)}</Status>
                  {kind === "awaiting" ? <Status tone="warn">Waiting {waitingFor(r.hoursSinceOnboarded)}</Status> : <Status tone="bad">{r.businessStatus}</Status>}
                  {kind === "withdrawn" && r.listed && r.businessStatus === "approved" && <Status tone="bad">Still visible: check it</Status>}
                  {kind === "withdrawn" && r.consentAt && <span className="small muted">said no {fmtWhen(r.consentAt)}</span>}
                </div>
              </div>
              {kind === "awaiting" && (
                <div className="row nw" style={{ gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {wa && <a className="btn btn-ghost sm" target="_blank" rel="noopener noreferrer" href={waLink(r.phone, consentMessage({ businessName: r.name, city: r.city }))}>WhatsApp</a>}
                  {can("ops_onboard_direct") && <Btn size="sm" variant="primary" loading={confirm.isPending && confirm.variables === r.businessId} onClick={() => confirm.mutate(r.businessId)}>Written yes received</Btn>}
                  {can("ops_onboard_direct") && <Btn size="sm" variant="danger" onClick={() => setSayingNo(r)}>Vendor said no</Btn>}
                </div>
              )}
            </div>
          )
        })}
        {rows.length > 0 && <Pager page={page} pageSize={PAGE} total={q.data?.total ?? 0} onPage={setPage} />}
      </Card>
      <Modal open={!!sayingNo} onClose={() => setSayingNo(null)} title={sayingNo ? `${sayingNo.name} said no?` : "Vendor said no"}
        description="This takes the listing off the site straight away. It is recorded, and a manager can bring it back through the normal admin screen."
        footer={<><Btn onClick={() => setSayingNo(null)}>Keep it live</Btn><Btn variant="danger" loading={no.isPending} onClick={() => sayingNo && no.mutate(sayingNo.businessId)}>Take it down</Btn></>} />
    </>
  )
}

export function QualityView() {
  const [tab, setTab] = useState<Tab>("qa")
  // counts for the tab badges come from each queue's own response; fetch the first page of each so the badges are right on every tab
  const qa = useQuery({ queryKey: ["ops", "quality", "qa", "queued", 1], queryFn: () => opsReportsApi.qa({ view: "queued", page: 1, pageSize: PAGE }), placeholderData: (p) => p })
  const consent = useQuery({ queryKey: ["ops", "quality", "consent", "awaiting", 1], queryFn: () => opsReportsApi.consentQueue({ kind: "awaiting", page: 1, pageSize: PAGE }), placeholderData: (p) => p })
  const counts = consent.data?.counts
  return (
    <>
      <PageHead title="Quality" sub="A second look at a share of new listings, and written confirmation from vendors who only said yes on the phone. Nothing here blocks a listing from going live." />
      <div style={{ marginBottom: 14 }}>
        <TabBar<Tab> label="Quality queues" value={tab} onChange={setTab} tabs={[
          { value: "qa", label: "Second look", count: qa.data?.counts.queued },
          { value: "awaiting", label: "Written consent", count: counts?.awaiting },
          { value: "withdrawn", label: "Said no", count: counts?.withdrawn },
        ]} />
      </div>
      {tab === "qa" ? <QaTab /> : <ConsentTab key={tab} kind={tab} />}
    </>
  )
}
