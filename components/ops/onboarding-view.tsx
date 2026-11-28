"use client"

// The call sheet for one prospect. The agent works down the steps while on the phone; answers autosave, so a dropped call or a refresh
// loses nothing. "Create listing" makes the vendor's listing HIDDEN; going live is a separate, checked step on the listing screen.
// The server re-validates everything: this screen only shows what is missing and offers the valid actions.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert, Store } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { SheetFields, stepMissing } from "@/components/ops/sheet-form"
import { Btn, Card, Empty, ErrorState, Notice, PageHead, SkelRows, Status, TabBar, cx, useOpsToast } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { onboardingApi, opsErrorData, type FieldError, type SheetData } from "@/lib/api/ops-onboarding"
import { prospectsApi } from "@/lib/api/ops-prospects"

const SAVE_DELAY_MS = 900

export function OnboardingView({ prospectId }: { prospectId: number }) {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const { can } = useOps()

  const sheetQ = useQuery({ queryKey: ["ops", "onboarding", prospectId], queryFn: () => onboardingApi.get(prospectId), staleTime: 0, refetchOnWindowFocus: false })
  const prospectQ = useQuery({ queryKey: ["ops", "prospect", prospectId], queryFn: () => prospectsApi.get(prospectId), staleTime: 0, refetchOnWindowFocus: false })

  const [data, setData] = useState<SheetData>({})
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [serverMissing, setServerMissing] = useState<string[]>([])
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [stale, setStale] = useState(false)
  const [blocker, setBlocker] = useState<{ title: string; body: string } | null>(null)

  const pending = useRef<SheetData>({})
  const rev = useRef(0)
  const timer = useRef<number | null>(null)
  const inflight = useRef<Promise<void> | null>(null)
  const loadedFor = useRef<number | null>(null)

  useEffect(() => {
    if (sheetQ.data && loadedFor.current !== prospectId) {
      loadedFor.current = prospectId
      setData(sheetQ.data.data)
      setServerMissing(sheetQ.data.missing)
      rev.current = sheetQ.data.rev
    }
  }, [sheetQ.data, prospectId])

  const sheet = sheetQ.data?.sheet
  const prospect = prospectQ.data?.prospect
  const listing = prospectQ.data?.listing ?? null
  const matched = !!prospect?.matchedBusinessId && !prospect?.businessId

  const flush = useCallback(async () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null }
    if (inflight.current) await inflight.current
    const changes = pending.current
    if (!Object.keys(changes).length) return
    pending.current = {}
    setSaveState("saving")
    const run = (async () => {
      try {
        const res = await onboardingApi.save(prospectId, changes, rev.current || undefined)
        rev.current = res.rev
        setServerMissing(res.missing)
        // the server fills what it can work out (the listing type follows the venue type): take those answers back, never over what was typed
        setData((d) => {
          const out = { ...d }
          for (const [k, v] of Object.entries(res.data)) {
            const have = out[k]
            const empty = have === undefined || have === null || (typeof have === "string" && have.trim() === "") || (Array.isArray(have) && have.length === 0)
            if (empty && !(k in pending.current) && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) && v !== "") out[k] = v
          }
          return out
        })
        setErrors([])
        setStale(false)
        setSaveState("saved")
      } catch (e) {
        pending.current = { ...changes, ...pending.current } // keep the answers: nothing typed is ever thrown away
        const d = opsErrorData<{ errors?: FieldError[]; currentRev?: number }>(e)
        if (d?.code === "VALIDATION" && d.errors) setErrors(d.errors)
        else if (d?.code === "STALE_DRAFT") setStale(true)
        setSaveState("error")
        if (d?.code !== "VALIDATION" && d?.code !== "STALE_DRAFT") toast({ title: "Could not save", body: opsErrorMessage(e), tone: "bad" })
      }
    })()
    inflight.current = run
    await run
    inflight.current = null
  }, [prospectId, toast])

  const edit = useCallback((key: string, value: unknown) => {
    setData((d) => ({ ...d, [key]: value }))
    pending.current = { ...pending.current, [key]: value }
    setErrors((es) => es.filter((x) => x.field !== key))
    setSaveState("idle")
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { void flush() }, SAVE_DELAY_MS)
  }, [flush])

  // leaving the screen must not drop the last answers
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); if (Object.keys(pending.current).length) void onboardingApi.save(prospectId, pending.current, undefined).catch(() => null) }, [prospectId])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (Object.keys(pending.current).length) { e.preventDefault(); e.returnValue = "" } }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [])

  const labelOf = useMemo(() => {
    const m = new Map<string, string>()
    sheet?.steps.forEach((s) => s.fields.forEach((f) => m.set(f.key, f.label)))
    return (k: string) => m.get(k) || k
  }, [sheet])

  const localMissing = useMemo(() => (sheet ? sheet.steps.flatMap((s) => stepMissing(s.fields, data)) : []), [sheet, data])
  const takeoverMissing = useMemo(() => ["email", "ownerName", "phoneNumber"].filter((k) => !String(data[k] ?? "").trim()), [data])

  const after = (r: { businessId: number }) => {
    qc.invalidateQueries({ queryKey: ["ops", "prospect", prospectId] })
    qc.invalidateQueries({ queryKey: ["ops", "prospects"] })
    router.push(`/ops/listings/${r.businessId}`)
  }
  const explain = (e: unknown) => {
    const d = opsErrorData<{ missing?: string[]; businessId?: number; name?: string; email?: string }>(e)
    if (d?.code === "INCOMPLETE" && d.missing) { setServerMissing(d.missing); setBlocker({ title: "The call sheet is not complete", body: `Still needed: ${d.missing.map(labelOf).join(", ")}.` }); return }
    if (d?.code === "PHONE_EXISTS") { setBlocker({ title: "This phone number already has a listing", body: `${d.name ?? "A listing"} on Wedding Wala already uses it. If it is the same business, take it over instead of creating a second listing.` }); return }
    if (d?.code === "EMAIL_TAKEN") { setBlocker({ title: "That e-mail already has an account", body: "Ask the owner for a different e-mail, or check whether they already have a listing." }); return }
    if (d?.code === "USE_TAKEOVER") { setBlocker({ title: "This business is already on Wedding Wala", body: "Use “Take over this listing” so the owner keeps the same page and its inquiries." }); qc.invalidateQueries({ queryKey: ["ops", "prospect", prospectId] }); return }
    setBlocker({ title: "Could not continue", body: opsErrorMessage(e) })
  }

  const create = useMutation({
    mutationFn: async () => { await flush(); return onboardingApi.onboard(prospectId) },
    onSuccess: (r) => { toast({ title: "Listing created", body: "It is not public yet. Add photos and the owner’s consent, then go live." }); after(r) },
    onError: explain,
  })
  const take = useMutation({
    mutationFn: async () => { await flush(); return onboardingApi.takeover(prospectId) },
    onSuccess: (r) => { toast({ title: "Listing taken over", body: r.inheritedLeads ? `${r.inheritedLeads} inquiries were waiting for this owner.` : undefined }); after(r) },
    onError: explain,
  })

  if (sheetQ.isLoading || prospectQ.isLoading) return <><PageHead title="Call sheet" /><Card flush><SkelRows rows={8} /></Card></>
  if (sheetQ.isError) {
    const d = opsErrorData(sheetQ.error)
    if (d?.code === "SHEET_NOT_AVAILABLE" || d?.code === "NO_VENDOR_TYPE") {
      return (
        <>
          <PageHead title="Call sheet" actions={<Link href={`/ops/prospects/${prospectId}`} className="btn btn-ghost"><ArrowLeft size={15} />Back to prospect</Link>} />
          <Card><Empty icon={<Store />} title={d.code === "NO_VENDOR_TYPE" ? "Set the vendor type first" : "This vendor type is not ready yet"}>
            {d.code === "NO_VENDOR_TYPE" ? "Choose what kind of business this is on the prospect page, then come back." : "The call sheet for this type of vendor has not been added yet. You can keep calling; onboarding for it will open soon."}
          </Empty></Card>
        </>
      )
    }
    return <ErrorState message={opsErrorMessage(sheetQ.error)} onRetry={() => sheetQ.refetch()} />
  }
  if (!sheet || !prospect) return null

  const draft = sheetQ.data!
  if (draft.businessId || prospect.businessId) {
    const bid = draft.businessId || prospect.businessId
    return (
      <>
        <PageHead title="Call sheet" sub={prospect.name} />
        <Card><Empty icon={<CheckCircle2 />} title="This vendor already has a listing" action={<Link href={`/ops/listings/${bid}`} className="btn btn-primary">Open the listing</Link>}>
          The call sheet is closed once a listing exists. Changes go through the listing screen.
        </Empty></Card>
      </>
    )
  }

  const current = sheet.steps[Math.min(step, sheet.steps.length - 1)]
  const ready = serverMissing.length === 0 && localMissing.length === 0
  const busy = create.isPending || take.isPending
  const canCreate = can("ops_onboard_direct")
  const canTake = can("ops_takeover_listing")

  return (
    <>
      <PageHead
        title="Call sheet"
        sub={<>{prospect.name}{prospect.cityName ? ` · ${prospect.cityName}` : ""} · {sheet.type}</>}
        actions={
          <>
            <span aria-live="polite" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All answers saved" : saveState === "error" ? "Not saved yet" : Object.keys(pending.current).length ? "Unsaved changes" : ""}
            </span>
            <Link href={`/ops/prospects/${prospectId}`} className="btn btn-ghost"><ArrowLeft size={15} />Prospect</Link>
          </>
        }
      />

      {stale ? <div style={{ marginBottom: 16 }}><Notice tone="warn">Someone saved newer answers on this call sheet. <button type="button" className="btn-link" onClick={() => window.location.reload()}>Reload to see them</button> before you continue.</Notice></div> : null}

      <div className="cols-main">
        <div className="stack">
          <div style={{ overflowX: "auto" }}>
            <TabBar<string> label="Call sheet steps" value={current.id} onChange={(v) => { void flush(); setStep(Math.max(0, sheet.steps.findIndex((s) => s.id === v))) }}
              tabs={sheet.steps.map((s) => ({ value: s.id, label: s.title, count: stepMissing(s.fields, data).length || undefined }))} />
          </div>

          <Card title={current.title} sub={current.script ? current.script.replace("{name}", prospect.name) : "Answer as you speak; everything saves by itself."}>
            <SheetFields fields={current.fields} data={data} onChange={edit} errors={errors} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 20 }}>
              <Btn disabled={step === 0} onClick={() => { void flush(); setStep((s) => Math.max(0, s - 1)) }}><ArrowLeft size={15} />Back</Btn>
              {step < sheet.steps.length - 1
                ? <Btn variant="primary" onClick={() => { void flush(); setStep((s) => Math.min(sheet.steps.length - 1, s + 1)) }}>Next<ArrowRight size={15} /></Btn>
                : <span />}
            </div>
          </Card>
        </div>

        <div className="stack">
          {matched ? (
            <Card title="Already on Wedding Wala" sub="This business has a page nobody has claimed yet.">
              <p style={{ margin: "0 0 10px", fontSize: 13 }}>{listing?.name ?? "A matching listing"}{listing?.city ? ` · ${listing.city}` : ""}</p>
              {listing && listing.leads > 0 ? <Notice tone="ok"><strong>{listing.leads} couple{listing.leads === 1 ? "" : "s"} already asked about this venue</strong>{listing.newLeads ? ` (${listing.newLeads} unanswered)` : ""}. Tell the owner: they will see them as soon as the listing is theirs.</Notice> : <p className="hint" style={{ margin: 0, color: "var(--ink-3)", fontSize: 12.5 }}>No inquiries yet.</p>}
            </Card>
          ) : null}

          <Card title={matched ? "Take over the listing" : "Create the listing"} sub={matched ? "The owner keeps the same page and its inquiries." : "It stays hidden until you add photos, record consent and go live."}>
            {blocker ? <div style={{ marginBottom: 12 }}><Notice tone="bad"><strong>{blocker.title}.</strong> {blocker.body}</Notice></div> : null}
            {matched ? (
              takeoverMissing.length ? (
                <p className="hint" style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ink-3)" }}>Still needed to take over: <strong>{takeoverMissing.map(labelOf).join(", ")}</strong>.</p>
              ) : <Status tone="ok">Ready to take over</Status>
            ) : ready ? <Status tone="ok">Everything required is filled in</Status> : (
              <div>
                <p className="hint" style={{ margin: "0 0 8px", fontSize: 12.5, color: "var(--ink-3)" }}>Still needed ({(serverMissing.length ? serverMissing : localMissing).length}):</p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                  {(serverMissing.length ? serverMissing : localMissing).map((k) => (
                    <li key={k}><button type="button" className="btn-link" onClick={() => {
                      const i = sheet.steps.findIndex((s) => s.fields.some((f) => f.key === k)); if (i >= 0) { void flush(); setStep(i) }
                    }}>{labelOf(k)}</button></li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              {errors.length > 0 && (
                <p className="hint" style={{ fontSize: 12, color: "var(--bad)" }}>
                  Fix {errors.length} highlighted field{errors.length === 1 ? "" : "s"} first before continuing.
                </p>
              )}
              {matched
                ? <Btn variant="primary" loading={take.isPending} disabled={!canTake || busy || takeoverMissing.length > 0 || errors.length > 0 || saveState === "error"} onClick={() => { setBlocker(null); take.mutate() }}>Take over this listing</Btn>
                : <Btn variant="primary" loading={create.isPending} disabled={!canCreate || busy || !ready || errors.length > 0 || saveState === "error"} onClick={() => { setBlocker(null); create.mutate() }}>Create listing</Btn>}
              {!matched && !ready ? <span className="hint" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>The button wakes up when the required answers are in.</span> : null}
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <ShieldAlert size={16} aria-hidden style={{ flex: "none", marginTop: 2, color: "var(--accent)" }} />
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
                Never ask for bank, JazzCash or Easypaisa details, or a CNIC. The owner adds their payment account themselves after they sign in.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
