"use client"

// A staff-made listing after it exists: what stands between it and going live, the owner's e-mail and sign-in link, their consent, photos,
// and edits on their behalf. Nothing is public until "Go live", and the server refuses it until every gap here is closed.
import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, Circle, KeyRound, MessageCircle, Phone, Rocket, ShieldCheck } from "lucide-react"

import { MediaManager } from "@/components/ops/media-manager"
import { useOps } from "@/components/ops/ops-shell"
import { SheetFields } from "@/components/ops/sheet-form"
import { Btn, Card, CopyButton, ErrorState, Field, Input, Modal, Notice, PageHead, SkelRows, Status, Textarea, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { listingApi, opsErrorData, type ConsentKind, type FieldError, type GoLiveGap, type PasswordLink, type SheetData } from "@/lib/api/ops-onboarding"
import { consentMessage, signInMessage, toWaNumber, waLink } from "@/lib/ops/whatsapp"

const GAP: Record<GoLiveGap, { label: string; hint: string }> = {
  email: { label: "Owner’s e-mail", hint: "Needed so they can sign in (they get a code by e-mail) and receive inquiries." },
  image: { label: "At least one photo", hint: "A listing without a photo looks broken to couples." },
  consent: { label: "Owner’s consent", hint: "Record that the owner agreed to be listed." },
  name: { label: "Business name", hint: "" }, vendorType: { label: "Vendor type", hint: "" }, city: { label: "City", hint: "Fix it in Details below." }, area: { label: "Area", hint: "Fix it in Details below." },
  phone: { label: "Phone number", hint: "" }, ownerName: { label: "Owner’s name", hint: "" }, subBusinessType: { label: "Listing type", hint: "Fix it in Details below." },
  capacity: { label: "Guest capacity", hint: "Fix it in Details below." }, priceOrMenu: { label: "A price, package or menu", hint: "Ask the owner to add pricing after they sign in, or a manager can relax this requirement." },
}
const CONSENT_LABEL: Record<ConsentKind, string> = { verbal_call: "Agreed on the call", confirmed_written: "Confirmed in writing", withdrawn: "Withdrawn" }
const STATUS_TONE: Record<string, "ok" | "warn" | "bad" | "mut"> = { approved: "ok", submitted: "warn", suspended: "bad" }
const STATUS_LABEL: Record<string, string> = { approved: "Live", submitted: "Not public yet", suspended: "Taken down" }

export function ListingView({ id }: { id: number }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const { can } = useOps()
  const q = useQuery({ queryKey: ["ops", "listing", id], queryFn: () => listingApi.get(id), staleTime: 0, refetchOnWindowFocus: false })
  const refresh = () => { qc.invalidateQueries({ queryKey: ["ops", "listing", id] }); qc.invalidateQueries({ queryKey: ["ops", "prospects"] }) }

  const [goLiveOpen, setGoLiveOpen] = useState(false)
  const [consentKind, setConsentKind] = useState<ConsentKind | null>(null)
  const [note, setNote] = useState("")
  const [evidence, setEvidence] = useState("")
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [link, setLink] = useState<PasswordLink | null>(null)

  const goLive = useMutation({
    mutationFn: () => listingApi.goLive(id),
    onSuccess: (r) => { setGoLiveOpen(false); refresh(); toast({ title: "The listing is live", body: r.needsMoreData ? "It is public, but flagged as needing more detail." : r.qaQueued ? "A lead will take a second look." : undefined }) },
    onError: (e) => {
      setGoLiveOpen(false)
      const d = opsErrorData<{ gaps?: GoLiveGap[] }>(e)
      refresh()
      toast({ title: d?.code === "GO_LIVE_BLOCKED" ? "Not ready yet" : "Could not go live", body: d?.gaps ? d.gaps.map((g) => GAP[g]?.label ?? g).join(", ") : opsErrorMessage(e), tone: "bad" })
    },
  })
  const consent = useMutation({
    mutationFn: () => listingApi.consent(id, { kind: consentKind!, note: note.trim() || undefined, evidenceUrl: evidence.trim() || undefined }),
    onSuccess: (r) => { setConsentKind(null); setNote(""); setEvidence(""); refresh(); toast({ title: r.tookDown ? "Consent withdrawn: the listing was taken down" : "Consent recorded" }) },
    onError: (e) => toast({ title: "Could not record consent", body: opsErrorMessage(e), tone: "bad" }),
  })
  const setMail = useMutation({
    mutationFn: () => listingApi.ownerEmail(id, email.trim()),
    onSuccess: () => { setEmail(""); setEmailError(null); refresh(); toast({ title: "E-mail saved", body: "The owner’s free trial has started." }) },
    onError: (e) => setEmailError(opsErrorMessage(e)),
  })
  const mint = useMutation({
    mutationFn: () => listingApi.passwordLink(id),
    onSuccess: (l) => setLink(l),
    onError: (e) => toast({ title: "Could not create the link", body: opsErrorMessage(e), tone: "bad" }),
  })

  if (q.isLoading) return <><PageHead title="Listing" /><Card flush><SkelRows rows={8} /></Card></>
  if (q.isError || !q.data) {
    const d = opsErrorData(q.error)
    return <ErrorState message={d?.code === "LISTING_NOT_FOUND" ? "This listing was not found, or it is not one of yours." : opsErrorMessage(q.error)} onRetry={() => q.refetch()} />
  }
  const L = q.data
  const b = L.business
  const live = b.status === "approved"
  const latest = L.consents[0]?.kind ?? null
  const canWork = can("ops_onboard_direct")

  return (
    <>
      <PageHead
        title={b.name}
        sub={<><Status tone={STATUS_TONE[b.status] ?? "mut"}>{STATUS_LABEL[b.status] ?? b.status}</Status>{" "}<span style={{ color: "var(--ink-3)" }}>{[b.city, b.subArea].filter(Boolean).join(" · ")}{L.meta.onboardMode === "takeover" ? " · taken over" : ""}</span></>}
        actions={L.meta.prospectId ? <Link href={`/ops/prospects/${L.meta.prospectId}`} className="btn btn-ghost"><ArrowLeft size={15} />Prospect</Link> : undefined}
      />

      <div className="cols-main">
        <div className="stack">
          {/* ------------------------------- go live ------------------------------- */}
          <Card title={live ? "This listing is live" : b.status === "suspended" ? "This listing was taken down" : "Before it can go live"}
            sub={live ? "Couples can find it now." : b.status === "suspended" ? "The owner withdrew consent. It can be restored only by an admin." : "Close every item below. The server checks them again when you press Go live."}>
            {live ? (
              <div style={{ display: "grid", gap: 10 }}>
                <Notice tone="ok">Public. Completeness {b.completenessScore ?? 0}%{L.meta.needsMoreData ? " · flagged: needs more detail" : ""}{L.meta.qaStatus === "queued" ? " · queued for a second look" : ""}.</Notice>
              </div>
            ) : b.status === "suspended" ? (
              <Notice tone="bad">Hidden from the public. Ask an admin to restore it if the owner changes their mind.</Notice>
            ) : (
              <>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
                  {(["email", "image", "consent"] as GoLiveGap[]).concat(L.readiness.gaps.filter((g) => !["email", "image", "consent"].includes(g))).map((g) => {
                    const open = L.readiness.gaps.includes(g)
                    if (!open && !["email", "image", "consent"].includes(g)) return null
                    return (
                      <li key={g} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        {open ? <Circle size={17} aria-hidden style={{ color: "var(--ink-4, var(--ink-3))", marginTop: 1, flex: "none" }} /> : <CheckCircle2 size={17} aria-hidden style={{ color: "var(--ok)", marginTop: 1, flex: "none" }} />}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: open ? "var(--ink)" : "var(--ink-3)" }}>{GAP[g]?.label ?? g}{!open ? " ✓" : ""}</div>
                          {open && GAP[g]?.hint ? <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{GAP[g].hint}</div> : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <div style={{ marginTop: 18 }}>
                  <Btn variant="primary" icon={<Rocket aria-hidden />} disabled={!canWork || !L.readiness.ready} onClick={() => setGoLiveOpen(true)}>Go live</Btn>
                  {!L.readiness.ready ? <span style={{ marginLeft: 12, fontSize: 12, color: "var(--ink-3)" }}>{L.readiness.gaps.length} to go</span> : null}
                </div>
              </>
            )}
          </Card>

          <MediaManager listingId={id} businessName={b.name} ownerName={L.owner.fullName} ownerPhone={L.owner.phoneNumber} onChanged={refresh} />

          {can("ops_listing_edit_on_behalf") ? <DetailsEditor id={id} onSaved={refresh} /> : null}
        </div>

        <div className="stack">
          {/* ------------------------------- owner ------------------------------- */}
          <Card title="Owner and sign-in">
            <dl className="kv" style={{ marginBottom: 14 }}>
              <dt>Name</dt><dd>{L.owner.fullName ?? "—"}</dd>
              <dt>Phone</dt>
              <dd style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {L.owner.phoneNumber ?? "—"}
                {L.owner.phoneNumber ? <a className="btn btn-ghost sm" href={`tel:${L.owner.phoneNumber}`}><Phone size={13} aria-hidden />Call</a> : null}
              </dd>
              <dt>E-mail</dt><dd>{L.owner.emailIsPlaceholder ? <Status tone="warn">Not collected yet</Status> : L.owner.email}</dd>
            </dl>

            {L.owner.emailIsPlaceholder ? (
              <form onSubmit={(e) => { e.preventDefault(); setEmailError(null); setMail.mutate() }} style={{ display: "grid", gap: 10 }}>
                <Field label="Owner’s e-mail" htmlFor="owner-email" error={emailError} hint="Ask for it on the call. They need it to sign in and to receive inquiries.">
                  <Input id="owner-email" type="email" inputMode="email" autoComplete="off" value={email} invalid={!!emailError} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <div><Btn type="submit" variant="primary" loading={setMail.isPending} disabled={!canWork || !email.trim()}>Save e-mail</Btn></div>
              </form>
            ) : (
              <>
                <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
                  They choose their own password with a one-time link. At sign-in they will also get a code by e-mail.
                </p>
                <Btn icon={<KeyRound aria-hidden />} loading={mint.isPending} disabled={!canWork} onClick={() => mint.mutate()}>Create sign-in link</Btn>
              </>
            )}
          </Card>

          {/* ------------------------------- consent ------------------------------- */}
          <Card title="Owner’s consent" sub="Proof that they agreed to be listed.">
            <div style={{ marginBottom: 12 }}>
              {latest ? <Status tone={latest === "withdrawn" ? "bad" : "ok"}>{CONSENT_LABEL[latest]}</Status> : <Status tone="warn">Not recorded</Status>}
            </div>
            {L.consents.length ? (
              <ul style={{ margin: "0 0 14px", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                {L.consents.map((c) => (
                  <li key={c.id} style={{ fontSize: 12.5 }}>
                    <strong>{CONSENT_LABEL[c.kind]}</strong> <span style={{ color: "var(--ink-3)" }}>· {fmtWhen(c.at)}{c.recordedByName ? ` · ${c.recordedByName}` : ""}</span>
                    {c.note ? <div style={{ color: "var(--ink-2)" }}>{c.note}</div> : null}
                    {c.evidenceUrl ? <a href={c.evidenceUrl} target="_blank" rel="noopener noreferrer" className="btn-link">Screenshot</a> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {canWork ? (
              <div style={{ display: "grid", gap: 8 }}>
                <Btn icon={<ShieldCheck aria-hidden />} onClick={() => setConsentKind("verbal_call")}>Owner agreed on the call</Btn>
                <Btn onClick={() => setConsentKind("confirmed_written")}>Owner confirmed in writing</Btn>
                {toWaNumber(L.owner.phoneNumber) ? <a className="btn btn-ghost" target="_blank" rel="noopener noreferrer" href={waLink(L.owner.phoneNumber, consentMessage({ ownerName: L.owner.fullName, businessName: b.name, city: b.city }))}><MessageCircle size={15} aria-hidden />Ask for a written YES on WhatsApp</a> : null}
                <Btn variant="danger" onClick={() => setConsentKind("withdrawn")}>Owner said no</Btn>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      {/* ------------------------------- dialogs ------------------------------- */}
      <Modal open={goLiveOpen} onClose={() => setGoLiveOpen(false)} title="Publish this listing?" description="Couples will be able to find it straight away. You can take it down by recording that the owner withdrew consent."
        footer={<><Btn onClick={() => setGoLiveOpen(false)}>Not yet</Btn><Btn variant="primary" icon={<Rocket aria-hidden />} loading={goLive.isPending} onClick={() => goLive.mutate()}>Go live</Btn></>}>
        <dl className="kv"><dt>Listing</dt><dd>{b.name}</dd><dt>Photos</dt><dd>{b.images}</dd><dt>Consent</dt><dd>{latest ? CONSENT_LABEL[latest] : "—"}</dd></dl>
      </Modal>

      <Modal open={!!consentKind} onClose={() => setConsentKind(null)}
        title={consentKind === "withdrawn" ? "Owner said no" : consentKind === "confirmed_written" ? "Owner confirmed in writing" : "Owner agreed on the call"}
        description={consentKind === "withdrawn" ? (live ? "This takes the listing down from the public site immediately." : "The listing stays hidden.") : "This is kept as proof. It cannot be edited later."}
        footer={<><Btn onClick={() => setConsentKind(null)}>Cancel</Btn><Btn variant={consentKind === "withdrawn" ? "danger" : "primary"} loading={consent.isPending} onClick={() => consent.mutate()}>{consentKind === "withdrawn" ? "Record and take down" : "Record consent"}</Btn></>}>
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Note (optional)" htmlFor="consent-note"><Textarea id="consent-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={consentKind === "verbal_call" ? "I read the summary aloud and he agreed." : ""} /></Field>
          {consentKind === "confirmed_written" ? <Field label="Link to the screenshot (optional)" htmlFor="consent-ev"><Input id="consent-ev" type="url" value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="https://…" /></Field> : null}
        </div>
      </Modal>

      <Modal open={!!link} onClose={() => setLink(null)} title="Sign-in link" description={link ? `Shown once. It works one time and expires in ${link.hours} hours. Send it only to the owner.` : undefined}
        footer={<><Btn onClick={() => setLink(null)}>Done</Btn>
          {link ? <a className="btn btn-primary" target="_blank" rel="noopener noreferrer" href={waLink(L.owner.phoneNumber, signInMessage({ ownerName: L.owner.fullName, businessName: b.name, url: link.url, hours: link.hours }))}><MessageCircle aria-hidden size={15} />Send on WhatsApp</a> : null}</>}>
        {link ? <div style={{ display: "grid", gap: 10 }}><input className="inp" readOnly value={link.url} aria-label="Sign-in link" onFocus={(e) => e.currentTarget.select()} /><div><CopyButton text={link.url} label="Copy link" /></div></div> : null}
      </Modal>
    </>
  )
}

/* ------------------------- edit on the vendor's behalf ------------------------- */

function DetailsEditor({ id, onSaved }: { id: number; onSaved: () => void }) {
  const toast = useOpsToast()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ["ops", "listing", id, "details"], queryFn: () => listingApi.details(id), staleTime: 0, refetchOnWindowFocus: false })
  const [vals, setVals] = useState<SheetData | null>(null)
  const [changed, setChanged] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<FieldError[]>([])
  const data = vals ?? q.data?.values ?? {}

  const save = useMutation({
    mutationFn: () => listingApi.edit(id, Object.fromEntries([...changed].map((k) => [k, data[k] ?? ""]))),
    onSuccess: (r) => {
      setChanged(new Set()); setErrors([]); setVals(null)
      qc.invalidateQueries({ queryKey: ["ops", "listing", id, "details"] }); onSaved()
      toast({ title: r.changed.length ? "Saved" : "Nothing changed", body: r.changed.length ? "Every change is recorded with your name." : undefined })
    },
    onError: (e) => {
      const d = opsErrorData<{ errors?: FieldError[]; fields?: string[] }>(e)
      if (d?.code === "VALIDATION" && d.errors) setErrors(d.errors)
      toast({ title: "Could not save", body: d?.code === "REQUIRED_FIELD" ? "These fields cannot be left empty." : opsErrorMessage(e), tone: "bad" })
    },
  })

  const fields = q.data?.fields ?? []
  if (q.isLoading) return <Card title="Details"><SkelRows rows={5} /></Card>
  if (q.isError || !q.data) {
    const d = opsErrorData(q.error)
    return <Card title="Details"><Notice tone="info">{d?.code === "SHEET_NOT_AVAILABLE" ? "Editing this type of vendor from here is not available yet." : opsErrorMessage(q.error)}</Notice></Card>
  }
  return (
    <Card title="Details" sub="Location, capacity, facilities and policies. Prices, the owner’s identity and the business name are changed by the owner after they sign in.">
      <SheetFields fields={fields} data={data} errors={errors}
        onChange={(k, v) => { setVals({ ...data, [k]: v }); setChanged((s) => new Set(s).add(k)); setErrors((es) => es.filter((x) => x.field !== k)) }} />
      <div style={{ marginTop: 20, display: "flex", gap: 8, alignItems: "center" }}>
        <Btn variant="primary" loading={save.isPending} disabled={!changed.size} onClick={() => save.mutate()}>Save changes</Btn>
        {changed.size ? <Btn onClick={() => { setVals(null); setChanged(new Set()); setErrors([]) }}>Discard</Btn> : null}
      </div>
    </Card>
  )
}
