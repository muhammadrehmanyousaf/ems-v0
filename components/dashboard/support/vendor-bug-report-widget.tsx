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
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

const SEVERITY_OPTIONS: Array<{ value: "low" | "medium" | "high" | "critical"; label: string; desc: string; color: string }> = [
  { value: "low", label: "Low", desc: "Small visual or cosmetic question", color: "border-neutral-200 hover:border-neutral-300" },
  { value: "medium", label: "Medium", desc: "Feature not working as expected", color: "border-blue-200 hover:border-blue-400" },
  { value: "high", label: "High", desc: "Affecting active bookings or clients", color: "border-amber-300 hover:border-amber-500" },
  { value: "critical", label: "Critical", desc: "Completely blocks my business", color: "border-red-300 hover:border-red-500" },
]

export function VendorBugReportWidget() {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"new" | "list">("new")
  const [selectedTicketId, setSelectedTicketId] = React.useState<number | null>(null)
  const [replyText, setReplyText] = React.useState("")

  // Form state
  const [category, setCategory] = React.useState<ComplaintCategory>("bug_report")
  const [severity, setSeverity] = React.useState<"low" | "medium" | "high" | "critical">("medium")
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [attachmentUrl, setAttachmentUrl] = React.useState("")
  const [showTelemetryDetails, setShowTelemetryDetails] = React.useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const { business } = useBusiness()

  // Telemetry auto-capture
  const [telemetry, setTelemetry] = React.useState<{
    url: string
    userAgent: string
    screen: string
    businessId: number | null
    businessName: string | null
  }>({
    url: "",
    userAgent: "",
    screen: "",
    businessId: null,
    businessName: null,
  })

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setTelemetry({
        url: window.location.href,
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        businessId: (business as { id?: number } | null)?.id ?? null,
        businessName: (business as { name?: string } | null)?.name ?? null,
      })
    }
  }, [open, business])

  // Queries
  const { data: tickets = [], isLoading: isLoadingTickets, refetch: refetchTickets } = useQuery({
    queryKey: ["vendor-complaints-mine"],
    queryFn: listMyComplaints,
    enabled: open,
    refetchInterval: open ? 15000 : false, // Poll every 15s while open
  })

  const selectedTicket = React.useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || null
  }, [tickets, selectedTicketId])

  // Mutation to submit a new bug report
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
      setActiveTab("list")
      if (data.id) {
        setSelectedTicketId(data.id)
      }
    },
    onError: (err: any) => {
      toast({
        title: "Submission failed",
        description: err?.response?.data?.message || "Could not submit report. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Mutation to send a reply message
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) {
      toast({ title: "Title required", description: "Please enter a short title for your report.", variant: "destructive" })
      return
    }
    if (body.trim().length < 15) {
      toast({ title: "More details needed", description: "Please provide a few sentences describing the issue.", variant: "destructive" })
      return
    }

    submitMutation.mutate({
      category,
      severity,
      subject: subject.trim(),
      body: body.trim(),
      telemetry,
      attachments: attachmentUrl.trim() ? [attachmentUrl.trim()] : [],
      aboutBusinessId: telemetry.businessId,
      contactName: user?.fullName,
      contactEmail: user?.email,
      contactPhone: user?.phoneNumber,
    })
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicketId || !replyText.trim()) return
    replyMutation.mutate({ id: selectedTicketId, message: replyText.trim() })
  }

  // Count tickets waiting on vendor or in progress
  const activeTicketsCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress" || t.status === "waiting_on_vendor"
  ).length

  return (
    <>
      {/* Floating Action Button Docked Bottom-Right (offset from DevTools) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-[76px] max-sm:right-4 z-50 flex items-center gap-3 px-3.5 py-2 rounded-full border border-[#C4A484]/70 shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 hover:border-[#D8A85A] group"
        style={{
          background: "linear-gradient(135deg, #1A1815 0%, #2A251E 100%)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(184, 134, 59, 0.25)",
        }}
        aria-label="Report a bug or get support"
      >
        <span
          className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
          style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #996515 100%)",
            color: "#FFFFFF",
          }}
        >
          <HelpCircle className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5C07B] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F5EFE2]" />
          </span>
        </span>
        <div className="flex flex-col items-start text-left leading-tight pr-1">
          <span
            style={{ color: "#FFFFFF" }}
            className="text-[12.5px] font-bold tracking-tight text-white"
          >
            Need Help?
          </span>
          <span
            style={{ color: "#E5C07B" }}
            className="text-[10.5px] font-semibold tracking-normal"
          >
            Report a Bug / Support
          </span>
        </div>
        {activeTicketsCount > 0 && (
          <span className="ml-0.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#B8863B] text-white shadow-sm">
            {activeTicketsCount}
          </span>
        )}
      </button>

      {/* Main Support & Bug Reporting Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#FAF9F6] dark:bg-[#161410] border-[#EBE9E3] dark:border-[#26231C]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#EBE9E3] dark:border-[#26231C] bg-[#F7F6F3] dark:bg-[#121009] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B8863B] to-[#8A6220] text-white grid place-items-center shadow-sm">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-[#1A1815] dark:text-[#F5F2EC]">
                  Vendor Support &amp; Bug Reports
                </DialogTitle>
                <DialogDescription className="text-xs text-[#605A52] dark:text-[#ABA498]">
                  Direct 2-way channel to Wedding Wala Support &amp; Engineering team.
                </DialogDescription>
              </div>
            </div>

            {/* Tab switch */}
            <div className="flex items-center bg-[#EBE9E3] dark:bg-[#26231C] p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("new")
                  setSelectedTicketId(null)
                }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === "new" && !selectedTicketId
                    ? "bg-white dark:bg-[#1E1B15] text-[#1A1815] dark:text-[#F5F2EC] shadow-xs"
                    : "text-[#6E6A62] dark:text-[#ABA498] hover:text-[#1A1815]"
                }`}
              >
                New Report
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === "list" || selectedTicketId
                    ? "bg-white dark:bg-[#1E1B15] text-[#1A1815] dark:text-[#F5F2EC] shadow-xs"
                    : "text-[#6E6A62] dark:text-[#ABA498] hover:text-[#1A1815]"
                }`}
              >
                My Tickets
                {tickets.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#B8863B]/20 text-[#8A6220] dark:text-[#D8A85A] text-[10px] font-bold grid place-items-center">
                    {tickets.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* VIEW 1: SELECTED TICKET DETAIL & INTERACTIVE THREAD */}
            {selectedTicket ? (
              <div className="space-y-4">
                {/* Back button & ticket summary */}
                <div className="flex items-center justify-between border-b pb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTicketId(null)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#8A6220] dark:text-[#D8A85A] hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to all tickets
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1A1815] dark:text-[#F5F2EC]">
                      {selectedTicket.reference}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        STATUS_THEME[selectedTicket.status]?.className || "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {STATUS_THEME[selectedTicket.status]?.label || selectedTicket.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#1A1815] dark:text-[#F5F2EC]">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#6E6A62] dark:text-[#ABA498]">
                    <span>Category: {CATEGORY_LABEL[selectedTicket.category] || selectedTicket.category}</span>
                    <span>•</span>
                    <span>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                    {selectedTicket.dueAt && (
                      <>
                        <span>•</span>
                        <span className="text-[#8A6220] dark:text-[#D8A85A]">
                          SLA target: {new Date(selectedTicket.dueAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Telemetry pill */}
                {selectedTicket.telemetry && (
                  <div className="p-2.5 rounded-lg bg-[#F3F1EC] dark:bg-[#1E1B15] border border-[#EBE9E3] dark:border-[#26231C] text-xs text-[#605A52] dark:text-[#ABA498] flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Laptop className="w-3.5 h-3.5 shrink-0 text-[#8A6220] dark:text-[#D8A85A]" />
                      <span className="truncate">Captured on: {selectedTicket.telemetry.url || "Vendor portal"}</span>
                    </div>
                    {selectedTicket.telemetry.screen && (
                      <span className="text-[11px] shrink-0 font-mono text-[#8C857B]">
                        {selectedTicket.telemetry.screen}
                      </span>
                    )}
                  </div>
                )}

                {/* Conversation Thread */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs uppercase font-bold tracking-wider text-[#8C857B]">
                    Conversation Thread
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
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
                          className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                            isAdmin
                              ? "bg-white dark:bg-[#1A1815] border-[#E3D3AE] dark:border-[#3A2F1A] shadow-xs ml-4"
                              : "bg-[#F5EFE2]/60 dark:bg-[#221B10] border-[#EADBCE] dark:border-[#322E25] mr-4"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 font-semibold">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 text-[#8A6220] dark:text-[#D8A85A]">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Wedding Wala Support
                                </span>
                              ) : (
                                <span className="text-[#1A1815] dark:text-[#F5F2EC]">
                                  {msg.senderName || "You"}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#8C857B]">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="text-[#1A1815] dark:text-[#F5F2EC] whitespace-pre-wrap">
                            {msg.message}
                          </div>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[#EBE9E3] dark:border-[#26231C]">
                              <p className="text-[10px] text-[#8C857B] mb-1">Attachment:</p>
                              {msg.attachments.map((att, aIdx) => (
                                <a
                                  key={aIdx}
                                  href={att}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-[#8A6220] hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" /> View attachment {aIdx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Resolution Banner if resolved */}
                  {(selectedTicket.status === "resolved" || selectedTicket.status === "dismissed") && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                      <div className="flex items-center gap-2 font-semibold mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Ticket {selectedTicket.status === "resolved" ? "Resolved" : "Closed"}
                      </div>
                      {selectedTicket.resolutionNotes && (
                        <p className="text-emerald-800 dark:text-emerald-300 pl-6">
                          {selectedTicket.resolutionNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reply Box (Active unless closed) */}
                  {selectedTicket.status !== "resolved" && selectedTicket.status !== "dismissed" && (
                    <form onSubmit={handleSendReply} className="pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="reply-input" className="text-xs font-semibold text-[#1A1815] dark:text-[#F5F2EC]">
                          Reply to Support Team
                        </Label>
                        <Textarea
                          id="reply-input"
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply, provide more details, or update us..."
                          className="text-xs bg-white dark:bg-[#1A1815] border-[#DEDBD3] dark:border-[#322E25]"
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={replyMutation.isPending || !replyText.trim()}
                          className="bg-[#B8863B] hover:bg-[#8A6220] text-white text-xs font-medium gap-1.5"
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
              </div>
            ) : activeTab === "list" ? (
              /* VIEW 2: LIST OF MY SUBMITTED TICKETS */
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <p className="text-xs font-semibold text-[#605A52] dark:text-[#ABA498]">
                    Your Submitted Reports ({tickets.length})
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("new")}
                    className="text-xs h-7"
                  >
                    + New Report
                  </Button>
                </div>

                {isLoadingTickets ? (
                  <div className="py-12 flex flex-col items-center justify-center text-xs text-[#8C857B]">
                    <Loader2 className="w-5 h-5 animate-spin mb-2 text-[#B8863B]" />
                    Loading your reports…
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8C857B] space-y-2">
                    <LifeBuoy className="w-8 h-8 text-[#DEDBD3] mx-auto" />
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">No reports filed yet</p>
                    <p>Have an issue or found a glitch? Click &ldquo;New Report&rdquo; to alert our engineers.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className="p-3.5 rounded-xl border border-[#EBE9E3] dark:border-[#26231C] bg-white dark:bg-[#1A1815] hover:border-[#B8863B] dark:hover:border-[#D8A85A] cursor-pointer transition-all hover:shadow-xs group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold text-[#1A1815] dark:text-[#F5F2EC]">
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
                        <h4 className="text-xs font-semibold text-[#1A1815] dark:text-[#F5F2EC] truncate group-hover:text-[#B8863B] transition-colors">
                          {t.subject}
                        </h4>
                        <p className="text-[11px] text-[#6E6A62] dark:text-[#ABA498] line-clamp-1 mt-0.5">
                          {t.body}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3F1EC] dark:border-[#221B10] text-[10px] text-[#8C857B]">
                          <span>{CATEGORY_LABEL[t.category] || t.category}</span>
                          <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[#8A6220] dark:text-[#D8A85A] font-medium">
                            View Thread <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* VIEW 3: INTAKE FORM (NEW REPORT) */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Auto Telemetry Card */}
                <div className="p-3 rounded-xl bg-[#F5EFE2]/70 dark:bg-[#221B10] border border-[#E3D3AE] dark:border-[#3A2F1A] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#8A6220] dark:text-[#D8A85A] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Automatic Diagnostic Telemetry Attached
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTelemetryDetails((p) => !p)}
                      className="text-[11px] text-[#8A6220] underline"
                    >
                      {showTelemetryDetails ? "Hide details" : "View details"}
                    </button>
                  </div>
                  {showTelemetryDetails ? (
                    <div className="mt-2 pt-2 border-t border-[#E3D3AE]/60 space-y-1 font-mono text-[10px] text-[#605A52] dark:text-[#ABA498]">
                      <p>Page: {telemetry.url || "Dashboard"}</p>
                      <p>Viewport: {telemetry.screen}</p>
                      <p>Business: {telemetry.businessName || "General vendor"}</p>
                      <p className="truncate">Browser: {telemetry.userAgent}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#605A52] dark:text-[#ABA498] mt-0.5">
                      Current page URL, browser environment, and business ID are captured automatically so you don&apos;t have to type them.
                    </p>
                  )}
                </div>

                {/* Category & Severity Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#1A1815] dark:text-[#F5F2EC]">
                      Issue Category *
                    </Label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                      className="w-full mt-1.5 h-9 rounded-lg border border-[#DEDBD3] dark:border-[#322E25] bg-white dark:bg-[#1A1815] px-2.5 text-xs text-[#1A1815] dark:text-[#F5F2EC] outline-none focus:ring-1 focus:ring-[#B8863B]"
                    >
                      <option value="bug_report">Bug Report &amp; Glitch</option>
                      <option value="app_problem">Website / App Problem</option>
                      <option value="booking_problem">Booking System Problem</option>
                      <option value="payment_problem">Payment &amp; Billing Issue</option>
                      <option value="listing_incorrect">Listing / Profile Issue</option>
                      <option value="other">General Feedback / Other</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-[#1A1815] dark:text-[#F5F2EC]">
                      Impact / Severity
                    </Label>
                    <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                      {SEVERITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSeverity(opt.value)}
                          className={`h-9 rounded-lg text-xs font-medium border text-center transition-all ${
                            severity === opt.value
                              ? "bg-[#B8863B] text-white border-[#B8863B] shadow-xs"
                              : `bg-white dark:bg-[#1A1815] text-[#605A52] dark:text-[#ABA498] ${opt.color}`
                          }`}
                          title={opt.desc}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="report-subject" className="text-xs font-semibold text-[#1A1815] dark:text-[#F5F2EC]">
                    Subject / Short Title *
                  </Label>
                  <Input
                    id="report-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Calendar bookings filter not loading when switching month"
                    className="text-xs bg-white dark:bg-[#1A1815] border-[#DEDBD3] dark:border-[#322E25]"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="report-body" className="text-xs font-semibold text-[#1A1815] dark:text-[#F5F2EC]">
                    What happened? (Steps to reproduce) *
                  </Label>
                  <Textarea
                    id="report-body"
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Explain what you were trying to do, what happened instead, and any error message you saw..."
                    className="text-xs bg-white dark:bg-[#1A1815] border-[#DEDBD3] dark:border-[#322E25]"
                    required
                  />
                </div>

                {/* Attachment */}
                <div className="space-y-1.5">
                  <Label htmlFor="report-attachment" className="text-xs font-semibold text-[#1A1815] dark:text-[#F5F2EC]">
                    Screenshot or File Link <span className="text-[#8C857B] font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="report-attachment"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://... (image URL or cloud link to screenshot)"
                    className="text-xs bg-white dark:bg-[#1A1815] border-[#DEDBD3] dark:border-[#322E25]"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-[#8C857B]">
                    Guaranteed response SLA: 14 working days
                  </span>
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="bg-[#B8863B] hover:bg-[#8A6220] text-white text-xs font-semibold px-5 shadow-sm"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Submitting…
                      </>
                    ) : (
                      "Submit Bug Report"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
