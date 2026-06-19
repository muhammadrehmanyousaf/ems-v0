"use client"

// Admin "claim requests" queue. Lists VendorClaim records from
// GET /api/v1/claims/admin/claims and lets a super-admin Approve (emails the
// claimant a set-password link) or Reject (with a reason). Refreshes after
// each action. Auth header is attached automatically by axiosConfig.

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, Loader2, FileText, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  listClaims,
  approveClaim,
  rejectClaim,
  type AdminClaim,
  type ClaimStatus,
} from "@/lib/api/claims"

const STATUS_TABS: { value: ClaimStatus; label: string }[] = [
  { value: "pending_review", label: "Awaiting review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "auto_approved", label: "Auto-approved" },
]

const METHOD_LABEL: Record<AdminClaim["method"], string> = {
  phone_match: "Phone match",
  evidence: "Evidence",
}

interface PendingAction {
  kind: "approve" | "reject"
  claim: AdminClaim
}

function businessName(c: AdminClaim): string {
  return c.business?.name || c.listing?.name || `Listing #${c.businessId}`
}

export function ClaimsQueueTable() {
  const [statusTab, setStatusTab] = useState<ClaimStatus>("pending_review")
  const [claims, setClaims] = useState<AdminClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const refresh = async () => {
    try {
      setLoading(true)
      const rows = await listClaims(statusTab)
      setClaims(rows)
    } catch (e: any) {
      toast({
        title: "Failed to load claims",
        description: e?.response?.data?.message || "Try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab])

  const performAction = async () => {
    if (!pendingAction) return
    const { kind, claim } = pendingAction
    if (kind === "reject" && !reason.trim()) {
      toast({ title: "Reason required", description: "Please add a rejection reason." })
      return
    }
    setSubmitting(true)
    try {
      if (kind === "approve") {
        await approveClaim(claim.id)
        toast({
          title: "Claim approved",
          description: `${businessName(claim)} — a set-password link was emailed to the claimant.`,
        })
      } else {
        await rejectClaim(claim.id, reason.trim())
        toast({ title: "Claim rejected", description: businessName(claim) })
      }
      setPendingAction(null)
      setReason("")
      await refresh()
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.response?.data?.message || "Try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as ClaimStatus)}>
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {claims.length} {claims.length === 1 ? "claim" : "claims"}{" "}
            {statusTab.replace("_", " ")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-bridal-text-soft py-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : claims.length === 0 ? (
            <p className="text-sm text-bridal-text-soft py-6 text-center">
              No claims in this state.
            </p>
          ) : (
            <div className="space-y-3">
              {claims.map((c) => (
                <div
                  key={c.id}
                  className="rounded-md border border-bridal-beige/70 p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-bridal-charcoal">
                        {businessName(c)}
                      </div>
                      <div className="text-xs text-bridal-text-soft">
                        {c.business?.city || "—"} · Listing #{c.businessId}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-bridal-beige/50 text-bridal-text-soft">
                        {METHOD_LABEL[c.method] || c.method}
                      </span>
                      <span className="text-xs text-bridal-text-soft">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Claimant */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="min-w-0">
                      <div className="text-bridal-charcoal truncate">
                        {c.claimantName || "—"}
                      </div>
                      <div className="text-xs text-bridal-text-soft">Claimant</div>
                    </div>
                    <div className="min-w-0 flex items-center gap-1.5 text-bridal-text-soft">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{c.claimantEmail || "—"}</span>
                    </div>
                    <div className="min-w-0 flex items-center gap-1.5 text-bridal-text-soft">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{c.claimantPhoneE164 || "—"}</span>
                    </div>
                  </div>

                  {/* Evidence */}
                  {c.evidenceNote && (
                    <div className="rounded-md bg-bridal-ivory border border-bridal-beige/60 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-bridal-text-soft mb-1">
                        <FileText className="w-3.5 h-3.5" />
                        Evidence
                      </div>
                      <p className="text-sm text-bridal-charcoal/90 whitespace-pre-wrap break-words">
                        {c.evidenceNote}
                      </p>
                      {c.evidenceDocUrl && (
                        <a
                          href={c.evidenceDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-2 text-xs text-bridal-gold-dark underline underline-offset-2"
                        >
                          View attached document
                        </a>
                      )}
                    </div>
                  )}

                  {c.status === "rejected" && c.rejectionReason && (
                    <p className="text-xs text-bridal-coral">
                      Rejected: {c.rejectionReason}
                    </p>
                  )}

                  {/* Actions — only for pending review */}
                  {c.status === "pending_review" && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setPendingAction({ kind: "approve", claim: c })
                          setReason("")
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setPendingAction({ kind: "reject", claim: c })
                          setReason("")
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={!!pendingAction} onOpenChange={(o) => !o && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {pendingAction?.kind} —{" "}
              {pendingAction ? businessName(pendingAction.claim) : ""}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.kind === "approve"
                ? "On approval the listing is handed over and a one-time set-password link is emailed to the claimant."
                : "The claimant is notified. Add a clear reason — it may be emailed to them."}
            </DialogDescription>
          </DialogHeader>

          {pendingAction?.kind === "reject" && (
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection (required)"
              rows={4}
            />
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={performAction}
              disabled={submitting}
              variant={pendingAction?.kind === "reject" ? "destructive" : "default"}
            >
              {submitting ? "Working…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
