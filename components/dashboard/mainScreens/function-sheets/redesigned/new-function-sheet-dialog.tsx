"use client"

/**
 * New function-sheet dialog (redesigned) — functional parity for the redesigned
 * Function-sheets list. Creates a draft via FunctionSheetAPI.create, then hands
 * off to the composer (built earlier) to fill line items etc. onCreated returns
 * the new id so the caller can navigate.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { FunctionSheetAPI } from "@/lib/api/functionSheets"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

export function NewFunctionSheetDialog({
  open, onOpenChange, businessId, onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  businessId?: number
  onCreated?: (id: number) => void
}) {
  const [title, setTitle] = React.useState("")
  const [customerName, setCustomerName] = React.useState("")
  const [eventDate, setEventDate] = React.useState("")
  React.useEffect(() => { if (open) { setTitle(""); setCustomerName(""); setEventDate("") } }, [open])

  const createMut = useMutation({
    mutationFn: () => FunctionSheetAPI.create({
      businessId: businessId!,
      title: title.trim(),
      customerName: customerName.trim() || undefined,
      eventDate: eventDate || undefined,
    }),
    onSuccess: (sheet: any) => { showSuccessToast("Function sheet created"); onOpenChange(false); if (sheet?.id) onCreated?.(sheet.id) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't create function sheet"),
  })
  const canSave = title.trim() && businessId != null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New function sheet</DialogTitle><DialogDescription>Start a quote — you'll add line items in the composer next.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <Field label="Title"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wedding Photography — Ahmed & Fatima" autoFocus /></Field>
          <Field label="Customer name"><input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></Field>
          <Field label="Event date"><input type="date" className={inputCls} value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || createMut.isPending} onClick={() => createMut.mutate()}>{createMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Creating…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Create &amp; compose</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NewFunctionSheetDialog
