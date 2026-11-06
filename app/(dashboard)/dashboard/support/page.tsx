"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  LifeBuoy,
  Bug,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Laptop,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Inbox,
  Filter,
} from "lucide-react"
import { ShellChromeSetter } from "@/components/dashboard/layout/champagne-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/context/UserContext"
import { useBusiness } from "@/context/BusinessContext"
import {
  submitComplaint,
  listMyComplaints,
  postComplaintMessage,
  type ComplaintRow,
  type ComplaintCategory,
  type ComplaintStatus,
  CATEGORY_LABEL,
  STATUS_LABEL,
} from "@/lib/api/complaints"

const STATUS_THEME: Record<ComplaintStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Review", className: "bg-amber-50 text-amber-800 border-amber-200" },
  waiting_on_vendor: { label: "Action Required", className: "bg-orange-50 text-orange-800 border-orange-200 animate-pulse" },
  resolved: { label: "Resolved", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  dismissed: { label: "Closed", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
}

export default function VendorSupportPage() {
  const [selectedId, setSelectedId] = React.useState<number | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [replyText, setReplyText] = React.useState("")

  // Form states for new ticket
  const [category, setCategory] = React.useState<ComplaintCategory>("bug_report")
  const [severity, setSeverity] = React.useState<"low" | "medium" | "high" | "critical">("medium")
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [attachmentUrl, setAttachmentUrl] = React.useState("")

  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const { business } = useBusiness()

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ["vendor-complaints-mine"],
    queryFn: listMyComplaints,
  })

  // Select the first ticket automatically if available and none selected
  React.useEffect(() => {
    if (!selectedId && tickets.length > 0 && !isCreating) {
      setSelectedId(tickets[0].id)
    }
  }, [tickets, selectedId, isCreating])

  const selectedTicket = React.useMemo(() => {
    return tickets.find((t) => t.id === selectedId) || null
  }, [tickets, selectedId])

  const filteredTickets = React.useMemo(() => {
    if (filterStatus === "all") return tickets
    return tickets.filter((t) => t.status === filterStatus)
  }, [tickets, filterStatus])

  // New report mutation
  const submitMutation = useMutation({
    mutationFn: submitComplaint,
    onSuccess: (data) => {
      toast({
        title: "Report Submitted Successfully",
        description: `Your ticket reference is ${data.reference || "WW-C"}. Platform support has been alerted.`,
      })
      queryClient.invalidateQueries({ queryKey: ["vendor-complaints-mine"] })
      setSubject("")
      setBody("")
      setAttachmentUrl("")
      setIsCreating(false)
      if (data.id) setSelectedId(data.id)
    },
    onError: (err: any) => {
      toast({
        title: "Submission failed",
        description: err?.response?.data?.message || "Could not submit report. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      postComplaintMessage(id, { message }),
    onSuccess: () => {
      setReplyText("")
      queryClient.invalidateQueries({ queryKey: ["vendor-complaints-mine"] })
      toast({ title: "Reply sent to support" })
    },
    onError: (err: any) => {
      toast({
        title: "Could not send reply",
        description: err?.response?.data?.message || "Please check your network and try again.",
        variant: "destructive",
      })
    },
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      toast({ title: "Title required", description: "Please enter a short title.", variant: "destructive" })
      return
    }
    if (body.trim().length < 15) {
      toast({ title: "More details needed", description: "Please describe the issue in a few sentences.", variant: "destructive" })
      return
    }

    submitMutation.mutate({
      category,
      severity,
      subject: subject.trim(),
      body: body.trim(),
      attachments: attachmentUrl.trim() ? [attachmentUrl.trim()] : [],
      telemetry: {
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        screen: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
        businessId: (business as { id?: number } | null)?.id ?? null,
        businessName: (business as { name?: string } | null)?.name ?? null,
      },
      aboutBusinessId: (business as { id?: number } | null)?.id ?? null,
      contactName: user?.fullName,
      contactEmail: user?.email,
      contactPhone: user?.phoneNumber,
    })
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || !replyText.trim()) return
    replyMutation.mutate({ id: selectedId, message: replyText.trim() })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <ShellChromeSetter
        activeHref="/dashboard/support"
        crumbBold="Support &amp; Bug Reports"
        crumbSub="Help desk &amp; technical reports"
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-[#F7F4EE] to-[#FAF8F5] border border-[#EADBCE]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#B8863B]/10 text-[#8A6220] border border-[#B8863B]/20">
            <LifeBuoy className="w-3.5 h-3.5" />
            Vendor Help Center
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1815] font-serif">
            Support &amp; Bug Reporting
          </h1>
          <p className="text-xs text-[#605A52] max-w-2xl leading-relaxed">
            Report bugs, glitches, billing issues, or feature inquiries directly to the Wedding Wala engineering &amp; support operations team. Every report opens an interactive 2-way conversation.
          </p>
        </div>

        <Button
          onClick={() => {
            setIsCreating(true)
            setSelectedId(null)
          }}
          className="bg-[#B8863B] hover:bg-[#8A6220] text-white shadow-md text-xs font-semibold gap-1.5 shrink-0"
        >
          <Bug className="w-4 h-4" /> Report a Bug / Issue
        </Button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C857B]">
              Your Tickets ({filteredTickets.length})
            </h2>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs h-7 rounded-md border border-[#EBE9E3] bg-white px-2 text-[#605A52] outline-none"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Review</option>
              <option value="waiting_on_vendor">Waiting on You</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-[#8C857B] bg-white rounded-xl border border-[#EBE9E3]">
              <Loader2 className="w-5 h-5 animate-spin mb-2 text-[#B8863B]" />
              Loading tickets…
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8C857B] bg-white rounded-xl border border-[#EBE9E3] p-6 space-y-2">
              <Inbox className="w-8 h-8 text-[#DEDBD3] mx-auto" />
              <p className="font-semibold text-neutral-800">No tickets found</p>
              <p>Click &ldquo;Report a Bug / Issue&rdquo; above to submit your first report.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
              {filteredTickets.map((t) => {
                const isSelected = !isCreating && selectedId === t.id
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedId(t.id)
                      setIsCreating(false)
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#FAF8F5] border-[#B8863B] shadow-xs ring-1 ring-[#B8863B]/20"
                        : "bg-white border-[#EBE9E3] hover:border-[#DEDBD3]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-[#1A1815]">
                        {t.reference}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          STATUS_THEME[t.status]?.className || "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {STATUS_THEME[t.status]?.label || t.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-[#1A1815] truncate">
                      {t.subject}
                    </h3>
                    <p className="text-[11px] text-[#605A52] line-clamp-1 mt-0.5">
                      {t.body}
                    </p>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#F3F1EC] text-[10px] text-[#8C857B]">
                      <span>{CATEGORY_LABEL[t.category] || t.category}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Conversation or Intake Form */}
        <div className="lg:col-span-8">
          {isCreating ? (
            /* NEW TICKET FORM */
            <Card className="border-[#EADBCE] bg-white shadow-xs">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#B8863B]/10 text-[#8A6220] grid place-items-center">
                      <Bug className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1815]">Submit New Bug Report / Support Ticket</h3>
                      <p className="text-[11px] text-[#605A52]">Our engineers will review and respond via this interactive thread.</p>
                    </div>
                  </div>
                  {tickets.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false)
                        setSelectedId(tickets[0]?.id || null)
                      }}
                      className="text-xs text-[#8C857B]"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  {/* Category & Severity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1A1815]">Category *</Label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                        className="w-full h-9 rounded-lg border border-[#DEDBD3] bg-white px-3 text-xs text-[#1A1815] outline-none focus:ring-1 focus:ring-[#B8863B]"
                      >
                        <option value="bug_report">Bug Report &amp; Glitch</option>
                        <option value="app_problem">Website / App Problem</option>
                        <option value="booking_problem">Booking System Problem</option>
                        <option value="payment_problem">Payment &amp; Billing Issue</option>
                        <option value="listing_incorrect">Listing / Profile Issue</option>
                        <option value="other">General Feedback / Other</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1A1815]">Impact / Severity</Label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as any)}
                        className="w-full h-9 rounded-lg border border-[#DEDBD3] bg-white px-3 text-xs text-[#1A1815] outline-none focus:ring-1 focus:ring-[#B8863B]"
                      >
                        <option value="low">Low (Cosmetic / general inquiry)</option>
                        <option value="medium">Medium (Feature malfunctioning)</option>
                        <option value="high">High (Affecting active bookings / clients)</option>
                        <option value="critical">Critical (Completely blocking my business)</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket-subject" className="text-xs font-semibold text-[#1A1815]">
                      Subject / Title *
                    </Label>
                    <Input
                      id="ticket-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Lead inquiry phone number format error"
                      className="text-xs"
                      required
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket-body" className="text-xs font-semibold text-[#1A1815]">
                      Description / Reproduction Steps *
                    </Label>
                    <Textarea
                      id="ticket-body"
                      rows={5}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Explain what happened, steps to reproduce, and any error message you encountered..."
                      className="text-xs"
                      required
                    />
                  </div>

                  {/* Attachment */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket-attachment" className="text-xs font-semibold text-[#1A1815]">
                      Attachment / Screenshot Link (optional)
                    </Label>
                    <Input
                      id="ticket-attachment"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder="https://..."
                      className="text-xs"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t">
                    <p className="text-[11px] text-[#8C857B]">
                      Guaranteed response SLA: 14 working days
                    </p>
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="bg-[#B8863B] hover:bg-[#8A6220] text-white text-xs font-semibold px-6 shadow-sm"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
                        </>
                      ) : (
                        "Submit Report"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : selectedTicket ? (
            /* ACTIVE TICKET THREAD & CONVERSATION */
            <Card className="border-[#EADBCE] bg-white shadow-xs">
              <CardContent className="p-6 space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#1A1815]">
                        {selectedTicket.reference}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          STATUS_THEME[selectedTicket.status]?.className || "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {STATUS_THEME[selectedTicket.status]?.label || selectedTicket.status}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABEL[selectedTicket.category] || selectedTicket.category}
                      </Badge>
                    </div>
                    <h2 className="text-base font-bold text-[#1A1815]">
                      {selectedTicket.subject}
                    </h2>
                  </div>

                  <div className="text-right text-xs text-[#8C857B] shrink-0">
                    <p>Created: {new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                    {selectedTicket.dueAt && (
                      <p className="text-[#8A6220] font-medium">
                        Target: {new Date(selectedTicket.dueAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Telemetry banner if present */}
                {selectedTicket.telemetry && (
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EADBCE] text-xs text-[#605A52] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-[#8A6220]" />
                      <span>Diagnostic: {selectedTicket.telemetry.url || "Dashboard"}</span>
                    </div>
                    {selectedTicket.telemetry.screen && (
                      <span className="font-mono text-[11px] text-[#8C857B]">
                        Viewport: {selectedTicket.telemetry.screen}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Thread */}
                <div className="space-y-4">
                  <div className="text-xs uppercase font-bold tracking-wider text-[#8C857B]">
                    Conversation Thread
                  </div>

                  <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-2">
                    {(selectedTicket.thread && selectedTicket.thread.length > 0
                      ? selectedTicket.thread
                      : [
                          {
                            id: "1",
                            senderId: selectedTicket.raisedByUserId,
                            senderRole: "vendor" as const,
                            senderName: selectedTicket.contactName || "You",
                            message: selectedTicket.body,
                            createdAt: selectedTicket.createdAt,
                          },
                        ]
                    ).map((msg, idx) => {
                      const isAdmin = msg.senderRole === "admin"
                      return (
                        <div
                          key={msg.id || idx}
                          className={`p-4 rounded-xl border text-xs leading-relaxed ${
                            isAdmin
                              ? "bg-white border-[#E3D3AE] shadow-xs ml-6"
                              : "bg-[#F5EFE2]/60 border-[#EADBCE] mr-6"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 font-bold">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1.5 text-[#8A6220]">
                                  <ShieldCheck className="w-4 h-4" />
                                  Wedding Wala Support &amp; Engineering
                                </span>
                              ) : (
                                <span className="text-[#1A1815]">
                                  {msg.senderName || "You"}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#8C857B]">
                              {new Date(msg.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>

                          <div className="text-[#1A1815] whitespace-pre-wrap">
                            {msg.message}
                          </div>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-[#EBE9E3]">
                              <p className="text-[10px] text-[#8C857B] mb-1">Attachments:</p>
                              <div className="flex flex-wrap gap-2">
                                {msg.attachments.map((att, aIdx) => (
                                  <a
                                    key={aIdx}
                                    href={att}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-[#EBE9E3] text-[11px] text-[#8A6220] hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View attachment {aIdx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Resolution banner if resolved */}
                  {(selectedTicket.status === "resolved" || selectedTicket.status === "dismissed") && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Ticket {selectedTicket.status === "resolved" ? "Resolved" : "Closed"}
                      </div>
                      {selectedTicket.resolutionNotes && (
                        <p className="text-emerald-800 pl-6 leading-relaxed">
                          {selectedTicket.resolutionNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reply Box */}
                  {selectedTicket.status !== "resolved" && selectedTicket.status !== "dismissed" && (
                    <form onSubmit={handleSendReply} className="pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="support-page-reply" className="text-xs font-semibold text-[#1A1815]">
                          Send a message to support
                        </Label>
                        <Textarea
                          id="support-page-reply"
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your response or update for the support team..."
                          className="text-xs"
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={replyMutation.isPending || !replyText.trim()}
                          className="bg-[#B8863B] hover:bg-[#8A6220] text-white text-xs font-semibold gap-1.5"
                        >
                          {replyMutation.isPending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" /> Send Reply
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="py-24 text-center text-xs text-[#8C857B] bg-white rounded-xl border border-[#EBE9E3] p-8 space-y-3">
              <LifeBuoy className="w-12 h-12 text-[#DEDBD3] mx-auto" />
              <p className="font-semibold text-base text-neutral-800">Select a ticket to view conversation</p>
              <p className="max-w-md mx-auto">
                Or click &ldquo;Report a Bug / Issue&rdquo; to submit a new inquiry directly to our support team.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
