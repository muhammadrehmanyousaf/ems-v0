"use client"

// 01-VR-ENHANCE-V1-FE — admin KYC document review queue.

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, XCircle, MessageSquareWarning, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { KycStatusPill } from "@/components/ui/verification-badge"
import {
  listDocumentQueue, approveDocument, rejectDocument, requestChangesDocument,
} from "@/lib/api/adminQueue"
import {
  type VendorDocument, type VendorDocumentStatus,
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

export function DocumentQueueTable() {
  const [statusTab, setStatusTab] = useState<VendorDocumentStatus>("pending")
  const [docs, setDocs] = useState<VendorDocument[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const refresh = async () => {
    try {
      setLoading(true)
      const r = await listDocumentQueue(statusTab, 50, 0)
      setDocs(r.documents)
      setCount(r.count)
    } catch (e: any) {
      toast({ title: "Failed to load documents", description: e?.response?.data?.message || "Try again." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [statusTab])

  const performAction = async () => {
    if (!pending) return
    if (pending.kind === "request_changes" && !notes.trim()) {
      toast({ title: "Notes required", description: "Add a note explaining what needs changing." })
      return
    }
    setSubmitting(true)
    try {
      switch (pending.kind) {
        case "approve":         await approveDocument(pending.doc.id, notes || undefined); break
        case "reject":          await rejectDocument(pending.doc.id, notes || undefined); break
        case "request_changes": await requestChangesDocument(pending.doc.id, notes); break
      }
      toast({ title: `Document ${pending.kind.replace("_", " ")}` })
      setPending(null)
      setNotes("")
      await refresh()
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.response?.data?.message || "Try again." })
    } finally {
      setSubmitting(false)
    }
  }

  const fileUrl = (rel: string) => {
    if (!rel) return "#"
    if (rel.startsWith("http")) return rel
    return BACKEND_URL.replace(/\/$/, "") + rel
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-bridal-text-soft py-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : docs.length === 0 ? (
            <p className="text-sm text-bridal-text-soft py-6 text-center">No documents in this state.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-bridal-beige bg-white p-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-bridal-charcoal">
                        {DOCUMENT_TYPE_LABELS[d.type]}{" "}
                        <span className="text-xs text-bridal-text-soft font-normal">
                          · business #{d.businessId}
                        </span>
                      </p>
                      <p className="text-xs text-bridal-text-soft">
                        Submitted {new Date(d.createdAt).toLocaleDateString()}
                        {d.reviewerNotes && ` · ${d.reviewerNotes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <KycStatusPill status={d.status} />
                    <a
                      href={fileUrl(d.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-bridal-mauve hover:text-bridal-gold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View file
                    </a>
                    {statusTab === "pending" && (
                      <>
                        <Button size="sm" variant="default"
                          onClick={() => { setPending({ kind: "approve", doc: d }); setNotes("") }}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => { setPending({ kind: "request_changes", doc: d }); setNotes("") }}>
                          <MessageSquareWarning className="w-3.5 h-3.5 mr-1" />Changes
                        </Button>
                        <Button size="sm" variant="destructive"
                          onClick={() => { setPending({ kind: "reject", doc: d }); setNotes("") }}>
                          <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {pending?.kind.replace("_", " ")} document
            </DialogTitle>
            <DialogDescription>
              {pending?.kind === "request_changes"
                ? "A note explaining what to fix is required."
                : "Optional notes recorded in the audit log."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for the vendor"
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
            <Button
              onClick={performAction}
              disabled={submitting}
              variant={pending?.kind === "reject" ? "destructive" : "default"}
            >
              {submitting ? "Working…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
