"use client"

/**
 * Phase 5 — AI-drafted reply for an inbound lead.
 *
 * The vendor's real bottleneck is the first reply: a lead sits unanswered for
 * hours because writing "yes 14 Feb is free, our Walima package for 350 is…"
 * takes effort. This drafts it in Roman-Urdu/English mix, then hands the vendor
 * a WhatsApp deep link.
 *
 * Two deliberate constraints:
 *
 *  - The draft lands in an EDITABLE textarea, never auto-sent. A model that
 *    invents a price or confirms a date the vendor hasn't checked would cost a
 *    real booking, so a human always approves the text. (The system prompt also
 *    forbids inventing prices/dates, but that's a mitigation, not a guarantee.)
 *  - Nothing renders unless the deployment has AI configured — the caller gates
 *    on useAiFeature("leadReply"), and a 503 here closes the dialog cleanly.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { AiAPI } from "@/lib/api/ai"
import type { Lead } from "@/lib/api/leads"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { toWaNumber } from "@/lib/ai/coerce"

interface Props {
  lead: Lead | null
  onOpenChange: (open: boolean) => void
}

export function LeadReplyDialog({ lead, onOpenChange }: Props) {
  const [text, setText] = React.useState("")
  const [model, setModel] = React.useState<string | null>(null)

  const draft = useMutation({
    mutationFn: (leadId: number) => AiAPI.draftLeadReply(leadId),
    onSuccess: (r) => {
      if (!r) {
        // 503 → provider went away between the status check and this call.
        toast.error("AI isn't configured on this deployment yet.")
        onOpenChange(false)
        return
      }
      setText(r.suggestion)
      setModel(r.model)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Couldn't draft a reply"),
  })

  // Draft once per lead, when the dialog opens.
  const leadId = lead?.id ?? null
  React.useEffect(() => {
    if (leadId == null) return
    setText("")
    setModel(null)
    draft.mutate(leadId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  const wa = toWaNumber(lead?.contactPhone)
  const busy = draft.isPending

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Reply copied")
    } catch {
      toast.error("Couldn't copy — select the text and copy manually")
    }
  }

  return (
    <Dialog open={lead != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Sparkles" size={16} className="text-bridal-gold" />
            Draft a reply{lead?.contactName ? ` to ${lead.contactName}` : ""}
          </DialogTitle>
          <DialogDescription>
            Written from this lead&apos;s event details. Read it before you send — edit anything that isn&apos;t right.
          </DialogDescription>
        </DialogHeader>

        {busy ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Spinner size={16} /> Drafting a reply…
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              className="resize-y text-sm"
              placeholder="The draft will appear here…"
            />
            <p className="text-[11px] text-muted-foreground">
              AI-drafted{model ? ` · ${model}` : ""} — never sent automatically. Prices and dates are not verified.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy || leadId == null}
            onClick={() => leadId != null && draft.mutate(leadId)}
          >
            <Icon name="RefreshCw" size={14} className="mr-1.5" /> Redraft
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!text.trim()} onClick={copy}>
              <Icon name="Copy" size={14} className="mr-1.5" /> Copy
            </Button>
            {wa && (
              <Button
                type="button"
                size="sm"
                disabled={!text.trim()}
                onClick={() => {
                  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
                  onOpenChange(false)
                }}
              >
                <Icon name="MessageCircle" size={14} className="mr-1.5" /> Send on WhatsApp
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LeadReplyDialog
