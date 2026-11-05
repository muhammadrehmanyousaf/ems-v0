"use client"

/**
 * Super-admin complaints queue.
 *
 * Sorted oldest-first, deliberately. A complaints queue sorted newest-first
 * buries the complaints that have been waiting longest, which are exactly the
 * ones about to breach the 14-working-day SLA the acknowledgement email
 * promises out loud.
 */

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  MessageSquare,
  Send,
  Laptop,
  ExternalLink,
  Clock,
  Inbox,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react"
import PageContainer from "@/components/dashboard/layout/page-container"
import { PageHeader } from "@/components/dashboard/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  listComplaints,
  resolveComplaint,
  setComplaintStatus,
  postComplaintMessage,
  type ComplaintRow,
  type ComplaintStatus,
} from "@/lib/api/complaints"

type TabValue = "open" | "in_progress" | "overdue" | "resolved" | "all"

const TABS: { value: TabValue; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "overdue", label: "Overdue" },
  { value: "resolved", label: "Closed" },
  { value: "all", label: "All" },
]

const STATUS_VARIANT: Record<ComplaintStatus, "default" | "secondary" | "destructive" | "outline"> =
  {
    open: "secondary",
    in_progress: "outline",
    waiting_on_vendor: "outline",
    resolved: "default",
    dismissed: "destructive",
  }

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function daysLeft(dueAt: string | null): number | null {
  if (!dueAt) return null
  const ms = new Date(dueAt).getTime() - Date.now()
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

export function ComplaintsQueueView() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<TabValue>("open")
  const [search, setSearch] = useState("")
  const [active, setActive] = useState<ComplaintRow | null>(null)
  const [notes, setNotes] = useState("")
  const [escalation, setEscalation] = useState("")
  const [threadTicket, setThreadTicket] = useState<ComplaintRow | null>(null)
  const [adminReply, setAdminReply] = useState("")

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      postComplaintMessage(id, { message }),
    onSuccess: (updated) => {
      toast({ title: "Reply sent to vendor" })
      setAdminReply("")
      invalidate()
      setThreadTicket(updated)
    },
    onError: () =>
      toast({ title: "Couldn't send reply", variant: "destructive" }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "open" | "in_progress" | "waiting_on_vendor" }) =>
      setComplaintStatus(id, status),
    onSuccess: (updated) => {
      toast({ title: `Status updated to ${STATUS_LABEL[updated.status]}` })
      invalidate()
      setThreadTicket(updated)
    },
    onError: () =>
      toast({ title: "Couldn't update status", variant: "destructive" }),
  })

  const params = useMemo(() => {
    if (tab === "overdue") return { overdue: true, q: search || undefined }
    if (tab === "all") return { q: search || undefined }
    return { status: tab as ComplaintStatus, q: search || undefined }
  }, [tab, search])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-complaints", params],
    queryFn: () => listComplaints(params),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-complaints"] })

  const claimMutation = useMutation({
    mutationFn: (id: number) => setComplaintStatus(id, "in_progress"),
    onSuccess: () => {
      toast({ title: "Marked in progress" })
      invalidate()
    },
    onError: () =>
      toast({ title: "Couldn't update the complaint", variant: "destructive" }),
  })

  const resolveMutation = useMutation({
    mutationFn: (vars: { id: number; status: "resolved" | "dismissed" }) =>
      resolveComplaint(vars.id, {
        status: vars.status,
        resolutionNotes: notes,
        escalationPath: escalation || undefined,
      }),
    onSuccess: (_row, vars) => {
      toast({
        title: vars.status === "resolved" ? "Complaint resolved" : "Complaint dismissed",
        description: "The complainant has been emailed the outcome.",
      })
      setActive(null)
      setNotes("")
      setEscalation("")
      invalidate()
    },
    onError: () => toast({ title: "Couldn't close the complaint", variant: "destructive" }),
  })

  const rows = data?.rows ?? []
  const counts = data?.counts

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Admin · Support"
        title="Complaints"
        description="Formal complaints about the platform. Every one was acknowledged by email with a reference number and a 14-working-day resolution promise."
      />

      {counts && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Inbox className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-2xl font-bold">{counts.open}</p>
                <p className="text-xs text-neutral-500">Open</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-neutral-500" />
              <div>
                <p className="text-2xl font-bold">{counts.inProgress}</p>
                <p className="text-xs text-neutral-500">In progress</p>
              </div>
            </CardContent>
          </Card>
          <Card className={counts.overdue > 0 ? "border-red-300 bg-red-50/50" : undefined}>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle
                className={`w-5 h-5 ${counts.overdue > 0 ? "text-red-600" : "text-neutral-500"}`}
              />
              <div>
                <p
                  className={`text-2xl font-bold ${counts.overdue > 0 ? "text-red-700" : ""}`}
                >
                  {counts.overdue}
                </p>
                <p className="text-xs text-neutral-500">Past the promised date</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="flex-1">
          <TabsList className="flex-wrap h-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            className="pl-9"
            placeholder="Reference, email, or title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-neutral-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading complaints…
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-neutral-600">Couldn&apos;t load the complaints queue.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-medium text-neutral-900">Nothing here</p>
            <p className="text-sm text-neutral-500 mt-1">
              No complaints match this filter.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {rows.map((row) => {
          const left = daysLeft(row.dueAt)
          const isOpen = row.status === "open" || row.status === "in_progress"
          const overdue = isOpen && left !== null && left < 0
          return (
            <Card key={row.id} className={overdue ? "border-red-300" : undefined}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-neutral-900">
                        {row.reference}
                      </span>
                      <Badge variant={STATUS_VARIANT[row.status]}>
                        {STATUS_LABEL[row.status]}
                      </Badge>
                      <Badge variant="outline">{CATEGORY_LABEL[row.category]}</Badge>
                      {overdue && (
                        <Badge variant="destructive">
                          {Math.abs(left as number)}d past due
                        </Badge>
                      )}
                      {isOpen && !overdue && left !== null && (
                        <span className="text-xs text-neutral-500">{left}d left</span>
                      )}
                    </div>

                    <p className="font-medium text-neutral-900 truncate">{row.subject}</p>
                    <p className="text-sm text-neutral-600 line-clamp-2 mt-1">{row.body}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {row.contactEmail}
                      </span>
                      {row.contactPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {row.contactPhone}
                        </span>
                      )}
                      <span>Raised {formatDate(row.createdAt)}</span>
                      {row.bookingId && <span>Booking #{row.bookingId}</span>}
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setThreadTicket(row)}
                      className="gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      View thread &amp; reply
                    </Button>
                    {row.status === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={claimMutation.isPending}
                        onClick={() => claimMutation.mutate(row.id)}
                      >
                        Start work
                      </Button>
                    )}
                    {isOpen && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setActive(row)
                          setNotes("")
                          setEscalation("")
                        }}
                      >
                        Close
                      </Button>
                    )}
                    {!isOpen && row.resolvedAt && (
                      <span className="text-xs text-neutral-500 self-center">
                        Closed {formatDate(row.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {row.resolutionNotes && (
                  <div className="mt-3 pt-3 border-t text-sm">
                    <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                      Outcome sent to complainant
                    </p>
                    <p className="text-neutral-700 whitespace-pre-wrap">
                      {row.resolutionNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Close {active?.reference}</DialogTitle>
            <DialogDescription>
              What you write here is emailed to {active?.contactEmail} as the outcome.
              Write it for them, not for the file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolution-notes">Outcome *</Label>
              <Textarea
                id="resolution-notes"
                rows={5}
                placeholder="What we found, what we did, and what happens next."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escalation-path">
                Escalation path <span className="text-neutral-400">(optional)</span>
              </Label>
              <Textarea
                id="escalation-path"
                rows={2}
                placeholder="Leave blank to use the standard senior-review wording."
                value={escalation}
                onChange={(e) => setEscalation(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              disabled={resolveMutation.isPending || notes.trim().length < 10}
              onClick={() =>
                active && resolveMutation.mutate({ id: active.id, status: "dismissed" })
              }
            >
              Dismiss
            </Button>
            <Button
              disabled={resolveMutation.isPending || notes.trim().length < 10}
              onClick={() =>
                active && resolveMutation.mutate({ id: active.id, status: "resolved" })
              }
            >
              {resolveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
                </>
              ) : (
                "Resolve & email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2-Way Live Thread & Telemetry Dialog */}
      <Dialog open={!!threadTicket} onOpenChange={(o) => !o && setThreadTicket(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-neutral-50/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-neutral-900">
                    {threadTicket?.reference}
                  </span>
                  {threadTicket?.status && (
                    <Badge variant={STATUS_VARIANT[threadTicket.status]}>
                      {STATUS_LABEL[threadTicket.status]}
                    </Badge>
                  )}
                  {threadTicket?.category && (
                    <Badge variant="outline">
                      {CATEGORY_LABEL[threadTicket.category]}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-base font-semibold mt-1">
                  {threadTicket?.subject}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Complainant: {threadTicket?.contactName || "Vendor"} ({threadTicket?.contactEmail})
                </DialogDescription>
              </div>

              {/* Status Selector */}
              {threadTicket && threadTicket.status !== "resolved" && threadTicket.status !== "dismissed" && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-neutral-500">Status:</span>
                  <select
                    value={threadTicket.status}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: threadTicket.id,
                        status: e.target.value as any,
                      })
                    }
                    className="text-xs h-8 rounded-md border border-neutral-300 bg-white px-2 font-medium"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="waiting_on_vendor">Waiting on vendor</option>
                  </select>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Telemetry metadata */}
            {threadTicket?.telemetry && (
              <div className="p-3 rounded-lg bg-neutral-100/70 border border-neutral-200 text-xs text-neutral-700 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-neutral-900">
                  <Laptop className="w-3.5 h-3.5 text-neutral-500" />
                  Diagnostic Telemetry Captured
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-neutral-600 pt-1">
                  <p className="truncate">URL: {threadTicket.telemetry.url || "—"}</p>
                  <p>Screen: {threadTicket.telemetry.screen || "—"}</p>
                  <p>Business: {threadTicket.telemetry.businessName || "—"}</p>
                  <p className="truncate">Agent: {threadTicket.telemetry.userAgent || "—"}</p>
                </div>
              </div>
            )}

            {/* Conversation messages */}
            <div className="space-y-3">
              <div className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                Message History
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {(threadTicket?.thread && threadTicket.thread.length > 0
                  ? threadTicket.thread
                  : [
                      {
                        id: "1",
                        senderId: threadTicket?.raisedByUserId || null,
                        senderRole: "vendor" as const,
                        senderName: threadTicket?.contactName || "Vendor",
                        message: threadTicket?.body || "",
                        createdAt: threadTicket?.createdAt || "",
                      },
                    ]
                ).map((msg, idx) => {
                  const isAdmin = msg.senderRole === "admin"
                  return (
                    <div
                      key={msg.id || idx}
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        isAdmin
                          ? "bg-amber-50/50 border-amber-200 text-neutral-900 ml-6"
                          : "bg-white border-neutral-200 text-neutral-900 mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 font-semibold">
                        <span className={isAdmin ? "text-amber-800 flex items-center gap-1" : "text-neutral-800"}>
                          {isAdmin && <ShieldCheck className="w-3.5 h-3.5" />}
                          {msg.senderName || (isAdmin ? "Admin" : "Vendor")}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(msg.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.message}</div>
                    </div>
                  )
                })}
              </div>

              {/* Reply Box */}
              {threadTicket && threadTicket.status !== "resolved" && threadTicket.status !== "dismissed" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!threadTicket || !adminReply.trim()) return
                    replyMutation.mutate({ id: threadTicket.id, message: adminReply.trim() })
                  }}
                  className="pt-2 border-t space-y-2"
                >
                  <Label htmlFor="admin-reply-box" className="text-xs font-semibold">
                    Reply to Vendor
                  </Label>
                  <Textarea
                    id="admin-reply-box"
                    rows={3}
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    placeholder="Write an interactive response to the vendor..."
                    className="text-xs"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActive(threadTicket)
                        setNotes("")
                        setEscalation("")
                        setThreadTicket(null)
                      }}
                      className="text-xs text-neutral-600"
                    >
                      Close &amp; Email Outcome
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={replyMutation.isPending || !adminReply.trim()}
                      className="text-xs font-medium gap-1.5"
                    >
                      {replyMutation.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Send Reply to Vendor
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
