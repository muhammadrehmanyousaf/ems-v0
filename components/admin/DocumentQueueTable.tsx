"use client"

// 01-VR-ENHANCE-V1-FE — admin KYC document review queue.
// Redesigned: documents are grouped BY BUSINESS (folder style) with the full
// business context a reviewer needs, inline previews, and approve / reject /
// request-changes with an itemised reason ("points"). A reject or a
// changes-request now REQUIRES a reason so the vendor is told exactly what to fix.

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2, XCircle, MessageSquareWarning, Loader2, ExternalLink,
  Building2, MapPin, Phone, Mail, User as UserIcon, FileText, ShieldCheck,
  ShieldAlert, Gauge, CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { KycStatusPill } from "@/components/ui/verification-badge"
import {
  listDocumentQueue, approveDocument, rejectDocument, requestChangesDocument,
} from "@/lib/api/adminQueue"
// WW-VERIFY-GATES — the identity gates behind the listing: NTN, CNIC, address
// proof, and whether anyone has actually stood in the venue.
import { approveGate, GATE_LABELS, type VerificationGate } from "@/lib/api/adminVerification"
import {
  type VendorDocument, type VendorDocumentStatus, type KycBusiness,
  DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS,
} from "@/lib/api/vendorDocuments"
import { BACKEND_URL } from "@/lib/backend-url"

type ActionKind = "approve" | "reject" | "request_changes"
interface PendingAction { kind: ActionKind; doc: VendorDocument }

const STATUS_TABS: { value: VendorDocumentStatus; label: string }[] = [
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "request_changes", label: "Changes requested" },
]

// Common, checkable rejection / changes reasons — the "points" a reviewer ticks
// so feedback is consistent and the vendor gets specific, actionable guidance.
const REVIEW_POINTS = [
  "Blurry / unreadable",
  "Wrong document type",
  "Doesn't match the business profile",
  "Document expired",
  "Edges cropped / cut off",
  "Suspected tampering or edit",
  "Name / CNIC number mismatch",
  "Low resolution — re-scan",
]

function resolveUrl(rel: string) {
  if (!rel) return "#"
  if (rel.startsWith("http")) return rel
  return BACKEND_URL.replace(/\/$/, "") + rel
}
function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif|bmp|avif)(\?|$)/i.test(url)
}
function fmtDate(v: string | null | undefined) {
  return v ? new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"
}

interface BusinessGroup {
  businessId: number
  business: KycBusiness | null
  docs: VendorDocument[]
}
function groupByBusiness(docs: VendorDocument[]): BusinessGroup[] {
  const map = new Map<number, BusinessGroup>()
  for (const d of docs) {
    if (!map.has(d.businessId)) {
      map.set(d.businessId, { businessId: d.businessId, business: d.business ?? null, docs: [] })
    }
    map.get(d.businessId)!.docs.push(d)
  }
  return [...map.values()]
}

/** One verification fact ("NTN verified 3 Aug" vs "NTN not verified"). */
/**
 * WW-VERIFY-GATES — a gate pill, and the action that sets it.
 *
 * These three pills have been on this screen for a while showing NTN, CNIC and
 * Address as unverified, with no way to change that: the four approve endpoints
 * had no client, so nothing on the platform could stamp `ntnVerifiedAt` and its
 * siblings. Eight backend files read them. Every vendor therefore read as
 * unverified on all three, forever.
 *
 * The action belongs HERE rather than on a queue of its own, because this is the
 * screen where the reviewer already has the NTN certificate open in front of
 * them. Verifying is one click away from the evidence, which is the only place
 * it can honestly be done.
 *
 * `submitted` gates the button: with nothing submitted the server answers 400
 * "No NTN submitted", and offering a button that can only fail is worse than
 * offering none.
 */
function VerifFact({
  label, verified, date, submitted, busy, onVerify,
}: {
  label: string
  verified: boolean
  date?: string | null
  submitted?: boolean
  busy?: boolean
  onVerify?: () => void
}) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
      verified
        ? "border-green-300 bg-green-50 text-green-700"
        : "border-bridal-beige bg-bridal-cream text-bridal-text-soft"
    }`}>
      {verified ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
      {label}{verified && date ? ` · ${fmtDate(date)}` : ""}
      {!verified && submitted && onVerify ? (
        <button
          type="button"
          onClick={onVerify}
          disabled={busy}
          className="ml-1 rounded-full border border-green-300 bg-white px-1.5 py-[1px] text-[10px] font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : "Verify"}
        </button>
      ) : null}
      {!verified && submitted === false ? (
        <span className="ml-0.5 text-[10px] text-bridal-text-soft/80">not submitted</span>
      ) : null}
    </span>
  )
}

export function DocumentQueueTable() {
  const [statusTab, setStatusTab] = useState<VendorDocumentStatus>("pending")
  const [docs, setDocs] = useState<VendorDocument[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [notes, setNotes] = useState("")
  const [points, setPoints] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null)
  // Which gate is mid-flight, keyed "<businessId>:<gate>", so two businesses
  // in the same folder list cannot share a spinner.
  const [gateBusy, setGateBusy] = useState<string | null>(null)

  /**
   * Stamp one identity gate verified.
   *
   * The server's refusals carry the reason — 400 "No NTN submitted", 409
   * "Already verified" — and both are worth showing a reviewer verbatim. A
   * generic "action failed" would leave them clicking a button that will never
   * work without telling them why.
   */
  const verifyGate = async (businessId: number, gate: VerificationGate) => {
    const key = `${businessId}:${gate}`
    setGateBusy(key)
    try {
      await approveGate(businessId, gate)
      toast({ title: `${GATE_LABELS[gate]} verified` })
      await refresh()
    } catch (e: any) {
      toast({
        title: `Could not verify ${GATE_LABELS[gate]}`,
        description: e?.response?.data?.message || "Try again.",
      })
    } finally {
      setGateBusy(null)
    }
  }

  const refresh = async () => {
    try {
      setLoading(true)
      const r = await listDocumentQueue(statusTab, 200, 0)
      setDocs(r.documents)
      setCount(r.count)
    } catch (e: any) {
      toast({ title: "Failed to load documents", description: e?.response?.data?.message || "Try again." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [statusTab])

  const groups = useMemo(() => groupByBusiness(docs), [docs])

  const openAction = (kind: ActionKind, doc: VendorDocument) => {
    setPending({ kind, doc }); setNotes(""); setPoints(new Set())
  }
  const togglePoint = (p: string) =>
    setPoints((prev) => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })

  // Compose the checked points + free text into a single reason string.
  const composedReason = () => {
    const bullets = [...points].map((p) => `• ${p}`)
    const free = notes.trim()
    return [...bullets, free].filter(Boolean).join("\n")
  }

  const performAction = async () => {
    if (!pending) return
    const reason = composedReason()
    const needsReason = pending.kind === "reject" || pending.kind === "request_changes"
    if (needsReason && !reason) {
      toast({ title: "Reason required", description: "Tick at least one point or write a note so the vendor knows what to fix." })
      return
    }
    setSubmitting(true)
    try {
      switch (pending.kind) {
        case "approve":         await approveDocument(pending.doc.id, reason || undefined); break
        case "reject":          await rejectDocument(pending.doc.id, reason); break
        case "request_changes": await requestChangesDocument(pending.doc.id, reason); break
      }
      toast({ title: `Document ${pending.kind.replace("_", " ")}` })
      setPending(null); setNotes(""); setPoints(new Set())
      await refresh()
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.response?.data?.message || "Try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as VendorDocumentStatus)}>
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {count} {count === 1 ? "document" : "documents"} {DOCUMENT_STATUS_LABELS[statusTab].toLowerCase()}
            {" · "}{groups.length} {groups.length === 1 ? "business" : "businesses"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-bridal-text-soft py-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : groups.length === 0 ? (
            <p className="text-sm text-bridal-text-soft py-6 text-center">No documents in this state.</p>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {groups.map((g) => {
                const biz = g.business
                const bizName = biz?.name || `Business #${g.businessId}`
                const typeLabel = biz?.venueType || biz?.vendor?.vendorType || (biz?.subBusinessType?.[0]) || "Vendor"
                return (
                  <AccordionItem
                    key={g.businessId}
                    value={String(g.businessId)}
                    className="border border-bridal-beige rounded-lg bg-white overflow-hidden"
                  >
                    <AccordionTrigger className="px-3 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 min-w-0 text-left w-full">
                        <div className="w-9 h-9 rounded-md bg-bridal-cream border border-bridal-beige flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-bridal-gold-dark" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-bridal-charcoal truncate">{bizName}</p>
                          <p className="text-xs text-bridal-text-soft truncate">
                            {typeLabel}{biz?.city ? ` · ${biz.city}` : ""} · #{g.businessId}
                          </p>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-bridal-blush/50 text-bridal-charcoal border border-bridal-beige shrink-0">
                          {g.docs.length} {g.docs.length === 1 ? "doc" : "docs"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      {/* Business detail block — the context a reviewer needs to decide */}
                      <div className="rounded-md bg-bridal-cream/60 border border-bridal-beige p-3 mb-3 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px] text-bridal-charcoal">
                          <span className="inline-flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-bridal-text-soft" />{biz?.vendor?.fullName || biz?.ownerName || "—"}</span>
                          <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-bridal-text-soft" />{biz?.vendor?.email || "—"}</span>
                          <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-bridal-text-soft" />{biz?.vendor?.phoneE164 || biz?.whatsappNumber || "—"}</span>
                          <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-bridal-text-soft" />{[biz?.subArea, biz?.city].filter(Boolean).join(", ") || "—"}</span>
                          <span className="inline-flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-bridal-text-soft" />Completeness {biz?.completenessScore ?? "—"}{typeof biz?.completenessScore === "number" ? "%" : ""}{typeof biz?.verificationTier === "number" ? ` · Tier ${biz.verificationTier}` : ""}</span>
                          <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-bridal-text-soft" />Joined {fmtDate(biz?.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-bridal-text-soft mr-1">Business status:</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-bridal-beige bg-white text-bridal-charcoal capitalize">{biz?.status || "—"}</span>
                          <VerifFact
                            label="NTN" verified={!!biz?.ntnVerifiedAt} date={biz?.ntnVerifiedAt}
                            submitted={!!biz?.ntnNumber}
                            busy={gateBusy === `${biz?.id}:ntn`}
                            onVerify={biz?.id ? () => verifyGate(biz.id, "ntn") : undefined}
                          />
                          <VerifFact
                            label="CNIC" verified={!!biz?.cnicVerifiedAt} date={biz?.cnicVerifiedAt}
                            // The encrypted CNIC never reaches the client, so a
                            // submitted CNIC is only visible as the document in
                            // this very folder. Offer the action either way and
                            // let the server's 400 be the authority.
                            submitted
                            busy={gateBusy === `${biz?.id}:cnic`}
                            onVerify={biz?.id ? () => verifyGate(biz.id, "cnic") : undefined}
                          />
                          <VerifFact
                            label="Address" verified={!!biz?.addressVerifiedAt} date={biz?.addressVerifiedAt}
                            submitted={!!biz?.addressProofUrl}
                            busy={gateBusy === `${biz?.id}:address`}
                            onVerify={biz?.id ? () => verifyGate(biz.id, "address") : undefined}
                          />
                          {/* A site visit has nothing to submit — it is a record
                              that someone went, so it is always offerable. */}
                          <VerifFact
                            label="Site visit" verified={!!biz?.visitedAt} date={biz?.visitedAt}
                            submitted
                            busy={gateBusy === `${biz?.id}:visited`}
                            onVerify={biz?.id ? () => verifyGate(biz.id, "visited") : undefined}
                          />
                          {biz?.ntnNumber ? <span className="text-[11px] text-bridal-text-soft">NTN {biz.ntnNumber}</span> : null}
                        </div>
                      </div>

                      {/* Documents in this business's "folder" */}
                      <ul className="space-y-2">
                        {g.docs.map((d) => {
                          const url = resolveUrl(d.fileUrl)
                          const img = isImageUrl(url)
                          return (
                            <li key={d.id} className="flex items-start gap-3 rounded-lg border border-bridal-beige bg-white p-2.5">
                              <button
                                type="button"
                                onClick={() => img && setLightbox({ url, label: DOCUMENT_TYPE_LABELS[d.type] })}
                                className="w-16 h-16 rounded-md border border-bridal-beige bg-bridal-cream overflow-hidden shrink-0 flex items-center justify-center"
                                aria-label={img ? `Preview ${DOCUMENT_TYPE_LABELS[d.type]}` : DOCUMENT_TYPE_LABELS[d.type]}
                              >
                                {img
                                  ? <img src={url} alt={DOCUMENT_TYPE_LABELS[d.type]} className="w-full h-full object-cover" />
                                  : <FileText className="w-6 h-6 text-bridal-text-soft" />}
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-bridal-charcoal">{DOCUMENT_TYPE_LABELS[d.type]}</p>
                                  <KycStatusPill status={d.status} />
                                </div>
                                <p className="text-xs text-bridal-text-soft mt-0.5">
                                  Submitted {fmtDate(d.createdAt)}
                                  {d.reviewedAt ? ` · reviewed ${fmtDate(d.reviewedAt)}` : ""}
                                </p>
                                {d.reviewerNotes && (
                                  <p className="text-xs text-bridal-mauve mt-1 whitespace-pre-line">{d.reviewerNotes}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <a href={url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-bridal-mauve hover:text-bridal-gold inline-flex items-center gap-1">
                                    <ExternalLink className="w-3.5 h-3.5" />Open file
                                  </a>
                                  {statusTab === "pending" && (
                                    <>
                                      <Button size="sm" variant="default" onClick={() => openAction("approve", d)}>
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approve
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => openAction("request_changes", d)}>
                                        <MessageSquareWarning className="w-3.5 h-3.5 mr-1" />Request changes
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => openAction("reject", d)}>
                                        <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Approve / reject / request-changes dialog with itemised points */}
      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {pending?.kind.replace("_", " ")} — {pending ? DOCUMENT_TYPE_LABELS[pending.doc.type] : ""}
            </DialogTitle>
            <DialogDescription>
              {pending?.kind === "approve"
                ? "Optional note, recorded in the audit log."
                : "Tick the issues and/or add a note. The vendor sees this reason."}
            </DialogDescription>
          </DialogHeader>

          {pending && pending.kind !== "approve" && (
            <div className="flex flex-wrap gap-1.5">
              {REVIEW_POINTS.map((p) => {
                const on = points.has(p)
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePoint(p)}
                    aria-pressed={on}
                    className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                      on
                        ? "border-bridal-gold-dark bg-bridal-gold/20 text-bridal-charcoal"
                        : "border-bridal-beige bg-white text-bridal-text-soft hover:border-bridal-gold/55"
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          )}

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={pending?.kind === "approve" ? "Optional note" : "Add any extra detail for the vendor…"}
            rows={3}
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
            <Button
              onClick={performAction}
              disabled={submitting}
              variant={pending?.kind === "reject" ? "destructive" : "default"}
            >
              {submitting ? "Working…" : pending?.kind === "approve" ? "Approve" : pending?.kind === "reject" ? "Reject" : "Request changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{lightbox?.label}</DialogTitle>
          </DialogHeader>
          {lightbox && (
            <div className="max-h-[70vh] overflow-auto rounded-md border border-bridal-beige bg-bridal-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox.url} alt={lightbox.label} className="w-full h-auto" />
            </div>
          )}
          <DialogFooter>
            <a href={lightbox?.url || "#"} target="_blank" rel="noopener noreferrer"
              className="text-sm text-bridal-mauve hover:text-bridal-gold inline-flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />Open original
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
