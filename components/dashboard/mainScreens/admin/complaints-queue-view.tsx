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
    </PageContainer>
  )
}
