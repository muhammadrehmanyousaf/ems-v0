"use client"

/**
 * Automation-rule create/edit dialog (redesigned) — functional parity for the
 * redesigned Automation screen. Wired to AutomationRulesAPI.create/update. The
 * available trigger/action types come from the list() response and are passed in.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { AutomationRulesAPI, type AutomationRule, type TriggerType, type ActionType } from "@/lib/api/automationRules"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const lbl = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

export function RuleFormDialog({
  open, onOpenChange, rule, triggerTypes, actionTypes, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rule?: AutomationRule
  triggerTypes: TriggerType[]
  actionTypes: ActionType[]
  onSaved?: () => void
}) {
  const isEdit = !!rule
  const [name, setName] = React.useState("")
  const [triggerType, setTriggerType] = React.useState<string>("")
  const [offsetDays, setOffsetDays] = React.useState("0")
  const [actionType, setActionType] = React.useState<string>("")
  const [message, setMessage] = React.useState("")
  const loaded = React.useRef<number | "new" | null>(null)

  React.useEffect(() => {
    if (open) {
      const key = rule?.id ?? "new"
      if (loaded.current !== key) {
        setName(rule?.name ?? "")
        setOffsetDays(String(rule?.offsetDays ?? 0))
        setMessage(rule?.message ?? "")
        loaded.current = key
      }
    } else { loaded.current = null }
  }, [open, rule])

  // Default the selects once the trigger/action options load (or for the edited rule).
  React.useEffect(() => {
    if (!open) return
    setTriggerType((t) => t || rule?.triggerType || triggerTypes[0] || "")
    setActionType((a) => a || rule?.actionType || actionTypes[0] || "")
  }, [open, rule, triggerTypes, actionTypes])

  const saveMut = useMutation({
    mutationFn: () => {
      const body = { name: name.trim(), triggerType: triggerType as TriggerType, offsetDays: Number(offsetDays) || 0, actionType: (actionType || undefined) as ActionType | undefined, message: message.trim() || undefined }
      return isEdit ? AutomationRulesAPI.update(rule!.id, body) : AutomationRulesAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Rule updated" : "Rule created"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save rule"),
  })
  const canSave = name.trim() && triggerType

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit rule" : "New automation rule"}</DialogTitle><DialogDescription>Automate a follow-up around an event.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <Field label="Rule name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 3-day pre-event reminder" autoFocus /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Trigger">
              <select className={inputCls} value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>{triggerTypes.map((t) => <option key={t} value={t}>{lbl(t)}</option>)}</select>
            </Field>
            <Field label="Offset (days)"><input type="number" className={cn(inputCls, "tabular-nums")} value={offsetDays} onChange={(e) => setOffsetDays(e.target.value)} /></Field>
          </div>
          <Field label="Action">
            <select className={inputCls} value={actionType} onChange={(e) => setActionType(e.target.value)}>{actionTypes.map((t) => <option key={t} value={t}>{lbl(t)}</option>)}</select>
          </Field>
          <Field label="Message (optional)"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Template sent when the rule fires" /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update rule" : "Create rule"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RuleFormDialog
