"use client"

/**
 * Function-sheet E-SIGNATURE (redesigned, Track C — interactive).
 * Closes the contract loop. The vendor signs their side (type-to-sign OR
 * draw-on-canvas) → persisted to signaturesJson.vendor via FunctionSheetAPI.update
 * (backend STRICT mode: vendor may only set the vendor signature; customer is
 * owned by the public link). The customer signs via a tokenised link
 * (issueShareToken → {origin}/sign/{token}). When both sides are signed and the
 * sheet is at contract_pending, "Advance to Signed" runs the transition (the
 * state machine enforces both-signatures-required). Route
 * /dashboard/function-sheet-sign-new. Loads the latest sheet (or ?id=).
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FunctionSheetAPI, STATE_LABELS, type FunctionSheet } from "@/lib/api/functionSheets"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { DetailSkeleton } from "@/components/dashboard/primitives/skeletons"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const SIGNATURE_FONT = '"Brush Script MT", "Segoe Script", cursive'
const fmtWhen = (s?: string | null) => {
  if (!s) return ""
  const d = new Date(s)
  return isNaN(d.getTime()) ? "" : d.toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function FunctionSheetSignView() {
  const qc = useQueryClient()
  const { data: sheet, isLoading, isError } = useQuery<FunctionSheet | null>({
    queryKey: ["fs-sign"],
    queryFn: async () => {
      const idParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null
      if (idParam) return FunctionSheetAPI.get(Number(idParam))
      const list = await FunctionSheetAPI.list()
      const first = list?.functionSheets?.[0]
      return first ? FunctionSheetAPI.get(first.id) : null
    },
  })

  const sigs = (sheet?.signaturesJson || {}) as any
  const vendorSig = sigs.vendor
  const customerSig = sigs.customer
  const [shareLink, setShareLink] = React.useState<string | null>(null)

  const signVendorMut = useMutation({
    mutationFn: (data: { name: string; mode: string; dataUrl?: string }) =>
      FunctionSheetAPI.update(sheet!.id, { signaturesJson: { vendor: data } } as any),
    onSuccess: () => { showSuccessToast("Vendor signature saved"); qc.invalidateQueries({ queryKey: ["fs-sign"] }) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save signature"),
  })

  const issueLinkMut = useMutation({
    mutationFn: () => FunctionSheetAPI.issueShareToken(sheet!.id),
    onSuccess: (d: any) => {
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      setShareLink(`${origin}/sign/${d.token}`)
      showSuccessToast("Signing link generated")
    },
    onError: (e: any) => toast.error(e?.message || "Couldn't generate link"),
  })

  const advanceMut = useMutation({
    mutationFn: () => FunctionSheetAPI.transition(sheet!.id, { to: "signed" }),
    onSuccess: () => { showSuccessToast("Contract marked Signed"); qc.invalidateQueries({ queryKey: ["fs-sign"] }) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't advance"),
  })

  if (isLoading) return <div className="p-4 md:p-6"><DetailSkeleton /></div>
  if (isError || !sheet) return <div className="p-4 md:p-6"><EmptyState icon="FileText" title="No function sheet" description="Create a function sheet first to sign it." /></div>

  const bothSigned = Boolean(vendorSig?.signedAt && customerSig?.signedAt)
  const canAdvance = sheet.state === "contract_pending" && bothSigned

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate · Sign"
        title="Sign contract"
        description="Capture both signatures to lock the agreement."
        breadcrumb={
          <a href="/dashboard/function-sheet-detail-new" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Icon name="ChevronLeft" size={14} /> {sheet.title || "Function sheet"}
          </a>
        }
        actions={<StatusPill tone={sheet.state === "signed" ? "success" : "info"}>{STATE_LABELS[sheet.state]}</StatusPill>}
      />

      {/* Agreement summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <div className="text-sm font-semibold">{sheet.title}</div>
          <div className="text-xs text-muted-foreground">{sheet.customerName || "Customer"} · {sheet.business?.name || "Vendor"}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Grand total</div>
          <div className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatPkr(Number(sheet.grandTotal) || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Vendor signature */}
        <VendorSignatureCard sig={vendorSig} pending={signVendorMut.isPending} onSign={(d) => signVendorMut.mutate(d)} />

        {/* Customer signature */}
        <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Icon name="User" size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold">Customer signature</h2>
            {customerSig?.signedAt && <StatusPill tone="success" className="ml-auto">Signed</StatusPill>}
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            {customerSig?.signedAt ? (
              <SignedBlock sig={customerSig} who={sheet.customerName || "Customer"} />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">The customer signs on their own device via a secure link — you can't sign for them.</p>
                {shareLink ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <input readOnly value={shareLink} className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(shareLink); showSuccessToast("Link copied") }}><Icon name="Copy" size={14} /></Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Share via WhatsApp/SMS. The link expires in 30 days; generating a new one revokes the old.</p>
                  </div>
                ) : (
                  <Button variant="outline" className="self-start" disabled={issueLinkMut.isPending} onClick={() => issueLinkMut.mutate()}>
                    {issueLinkMut.isPending ? <Spinner size={14} className="mr-1.5" /> : <Icon name="Send" size={14} className="mr-1.5" />} Generate signing link
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lifecycle */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <Icon name={bothSigned ? "CheckCircle2" : "Clock"} size={16} className={bothSigned ? "text-emerald-600" : "text-muted-foreground"} />
          {bothSigned ? "Both parties have signed." : "Awaiting both signatures."}
        </div>
        {sheet.state === "contract_pending" && (
          <Button disabled={!canAdvance || advanceMut.isPending} onClick={() => advanceMut.mutate()}>
            {advanceMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Advancing…</> : <>Advance to Signed <Icon name="ChevronRight" size={15} className="ml-1" /></>}
          </Button>
        )}
      </div>
    </div>
  )
}

function SignedBlock({ sig, who }: { sig: any; who: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      {sig.dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sig.dataUrl} alt="signature" className="h-16 object-contain" />
      ) : (
        <div className="text-2xl leading-none text-foreground" style={{ fontFamily: SIGNATURE_FONT }}>{sig.name}</div>
      )}
      <div className="mt-2 text-xs text-muted-foreground">{who} · signed {fmtWhen(sig.signedAt)}</div>
    </div>
  )
}

function VendorSignatureCard({ sig, pending, onSign }: { sig: any; pending: boolean; onSign: (d: { name: string; mode: string; dataUrl?: string }) => void }) {
  const [mode, setMode] = React.useState<"type" | "draw">("type")
  const [name, setName] = React.useState("")
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const drawing = React.useRef(false)
  const hasInk = React.useRef(false)

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!; const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }
  }
  const start = (e: React.PointerEvent) => { drawing.current = true; const ctx = canvasRef.current!.getContext("2d")!; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!; const p = pos(e)
    ctx.lineTo(p.x, p.y); ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.stroke(); hasInk.current = true
  }
  const end = () => { drawing.current = false }
  const clearCanvas = () => { const c = canvasRef.current; if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height); hasInk.current = false }

  const signTyped = () => { if (!name.trim()) { toast.error("Type your name to sign"); return } onSign({ name: name.trim(), mode: "typed" }) }
  const signDrawn = () => {
    const c = canvasRef.current
    if (!c || !hasInk.current) { toast.error("Draw your signature first"); return }
    if (!name.trim()) { toast.error("Add your name alongside the drawing"); return }
    onSign({ name: name.trim(), mode: "drawn", dataUrl: c.toDataURL("image/png") })
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon name="Pencil" size={16} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold">Vendor signature</h2>
        {sig?.signedAt && <StatusPill tone="success" className="ml-auto">Signed</StatusPill>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {sig?.signedAt ? (
          <>
            <SignedBlock sig={sig} who="You" />
            <Button variant="outline" size="sm" className="self-start" disabled>
              <Icon name="CheckCircle2" size={14} className="mr-1.5" /> Signed
            </Button>
          </>
        ) : (
          <>
            <div className="inline-flex w-fit rounded-lg border border-border p-0.5">
              {(["type", "draw"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={cn("rounded-md px-3 py-1 text-xs font-medium capitalize", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{m}</button>
              ))}
            </div>
            <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
            {mode === "type" ? (
              <>
                <div className="grid h-20 place-items-center rounded-lg border border-dashed border-border bg-muted/30">
                  <span className="text-2xl text-foreground" style={{ fontFamily: SIGNATURE_FONT }}>{name || "Your signature"}</span>
                </div>
                <Button className="self-start" disabled={pending} onClick={signTyped}>{pending ? <Spinner size={14} className="mr-1.5" /> : <Icon name="Pencil" size={14} className="mr-1.5" />} Sign as vendor</Button>
              </>
            ) : (
              <>
                <canvas ref={canvasRef} width={520} height={120} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} className="h-28 w-full touch-none rounded-lg border border-dashed border-border bg-muted/20" />
                <div className="flex gap-2">
                  <Button className="self-start" disabled={pending} onClick={signDrawn}>{pending ? <Spinner size={14} className="mr-1.5" /> : <Icon name="Pencil" size={14} className="mr-1.5" />} Save signature</Button>
                  <Button variant="ghost" size="sm" onClick={clearCanvas}><Icon name="Trash2" size={14} className="mr-1.5" /> Clear</Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FunctionSheetSignView
