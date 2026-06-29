"use client"

/**
 * Role create/edit dialog (redesigned, admin). Functional parity for the
 * redesigned Roles screen. Wired to RolesAPI.create/update.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { RolesAPI, type ApiRole } from "@/lib/api/dashboard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className={labelCls}>{label}</label>{children}</div>
}

export function RoleFormDialog({
  open, onOpenChange, role, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  role?: ApiRole
  onSaved?: () => void
}) {
  const isEdit = !!role
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [type, setType] = React.useState("custom")
  React.useEffect(() => {
    if (open) { setName(role?.name ?? ""); setDescription(role?.description ?? ""); setType(role?.type ?? "custom") }
  }, [open, role])

  const saveMut = useMutation({
    mutationFn: () => {
      const body = { name: name.trim(), description: description.trim() || undefined, type: type.trim() || undefined }
      return isEdit ? RolesAPI.update(role!.id, body) : RolesAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Role updated" : "Role created"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save role"),
  })
  const canSave = name.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit role" : "New role"}</DialogTitle><DialogDescription>Group permissions and assign to team members.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <Field label="Role name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Front-desk manager" autoFocus /></Field>
          <Field label="Type"><input className={inputCls} value={type} onChange={(e) => setType(e.target.value)} placeholder="custom" /></Field>
          <Field label="Description"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role can do" /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update role" : "Create role"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RoleFormDialog
