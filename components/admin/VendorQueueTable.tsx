"use client"

// 01-VR-ENHANCE-V1-FE — admin vendor approval queue.

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, MessageSquareWarning, PauseCircle, PlayCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  listVendorQueue,
  approveBusiness, rejectBusiness, requestChangesBusiness,
  suspendBusiness, restoreBusiness,
  type BusinessStatus, type QueueBusiness,
} from "@/lib/api/adminQueue"

type ActionKind = "approve" | "reject" | "request_changes" | "suspend" | "restore"

interface PendingAction {
  kind: ActionKind
  business: QueueBusiness
}

const STATUS_TABS: { value: BusinessStatus; label: string }[] = [
  { value: "submitted", label: "Awaiting review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
  { value: "draft", label: "Drafts" },
]

export function VendorQueueTable() {
  const [statusTab, setStatusTab] = useState<BusinessStatus>("submitted")
  const [businesses, setBusinesses] = useState<QueueBusiness[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const refresh = async () => {
    try {
      setLoading(true)
      const r = await listVendorQueue(statusTab, 50, 0)
      setBusinesses(r.businesses)
      setCount(r.count)
    } catch (e: any) {
      toast({ title: "Failed to load queue", description: e?.response?.data?.message || "Try again." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [statusTab])

  const performAction = async () => {
    if (!pendingAction) return
    const { kind, business } = pendingAction
    setSubmitting(true)
    try {
      switch (kind) {
        case "approve":         await approveBusiness(business.id, notes || undefined); break
        case "reject":          await rejectBusiness(business.id, notes || undefined); break
        case "request_changes": await requestChangesBusiness(business.id, notes || undefined); break
        case "suspend":         await suspendBusiness(business.id, notes || undefined); break
        case "restore":         await restoreBusiness(business.id, notes || undefined); break
      }
      toast({ title: `Business ${kind.replace("_", " ")}`, description: business.name })
      setPendingAction(null)
      setNotes("")
      await refresh()
    } catch (e: any) {
      toast({ title: "Action failed", description: e?.response?.data?.message || "Try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as BusinessStatus)}>
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {count} {count === 1 ? "business" : "businesses"} {statusTab.replace("_", " ")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-bridal-text-soft py-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : businesses.length === 0 ? (
            <p className="text-sm text-bridal-text-soft py-6 text-center">No businesses in this state.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-bridal-beige">
                    <th className="py-2 pr-3 font-medium">Business</th>
                    <th className="py-2 pr-3 font-medium">Vendor</th>
                    <th className="py-2 pr-3 font-medium">Type</th>
                    <th className="py-2 pr-3 font-medium">Tier</th>
                    <th className="py-2 pr-3 font-medium">Score</th>
                    <th className="py-2 pr-3 font-medium">Submitted</th>
                    <th className="py-2 pl-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b) => (
                    <tr key={b.id} className="border-b border-bridal-beige/50">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-bridal-charcoal">{b.name}</div>
                        <div className="text-xs text-bridal-text-soft">{b.city || "—"}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="text-bridal-charcoal">{b.vendor?.fullName || "—"}</div>
                        <div className="text-xs text-bridal-text-soft">{b.vendor?.email || "—"}</div>
                      </td>
                      <td className="py-2 pr-3 text-bridal-text-soft">{b.vendor?.vendorType || "—"}</td>
                      <td className="py-2 pr-3">{b.verificationTier}/4</td>
                      <td className="py-2 pr-3">{b.completenessScore}%</td>
                      <td className="py-2 pr-3 text-xs text-bridal-text-soft">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pl-3 text-right">
                        <div className="inline-flex flex-wrap gap-1.5 justify-end">
                          {(statusTab === "submitted" || statusTab === "draft") && (
                            <Button size="sm" variant="default"
                              onClick={() => { setPendingAction({ kind: "approve", business: b }); setNotes("") }}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approve
                            </Button>
                          )}
                          {statusTab === "submitted" && (
                            <>
                              <Button size="sm" variant="outline"
                                onClick={() => { setPendingAction({ kind: "request_changes", business: b }); setNotes("") }}>
                                <MessageSquareWarning className="w-3.5 h-3.5 mr-1" />Changes
                              </Button>
                              <Button size="sm" variant="destructive"
                                onClick={() => { setPendingAction({ kind: "reject", business: b }); setNotes("") }}>
                                <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                              </Button>
                            </>
                          )}
                          {statusTab === "approved" && (
                            <Button size="sm" variant="outline"
                              onClick={() => { setPendingAction({ kind: "suspend", business: b }); setNotes("") }}>
                              <PauseCircle className="w-3.5 h-3.5 mr-1" />Suspend
                            </Button>
                          )}
                          {statusTab === "suspended" && (
                            <Button size="sm" variant="default"
                              onClick={() => { setPendingAction({ kind: "restore", business: b }); setNotes("") }}>
                              <PlayCircle className="w-3.5 h-3.5 mr-1" />Restore
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action confirmation dialog with optional notes */}
      <Dialog open={!!pendingAction} onOpenChange={(o) => !o && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {pendingAction?.kind.replace("_", " ")} — {pendingAction?.business.name}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.kind === "reject" || pendingAction?.kind === "request_changes" || pendingAction?.kind === "suspend"
                ? "Notes will be emailed to the vendor."
                : "Optional notes recorded in the audit log."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for the vendor (optional)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingAction(null)}>Cancel</Button>
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
