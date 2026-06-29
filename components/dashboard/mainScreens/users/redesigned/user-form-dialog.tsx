"use client"

/**
 * User create/edit dialog (redesigned, admin). Functional parity for the
 * redesigned Users screen — mirrors the original create-user-dialog /
 * edit-user-dialog 1:1: create POSTs to /api/v1/users (with password +
 * roleIds), edit PATCHes /api/v1/users?id= (no password). Roles are picked
 * from RolesAPI.getAll() with "super admin" excluded, exactly like the original.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import axiosInstance from "@/lib/axiosConfig"
import { RolesAPI, type ApiRole, type ApiUser } from "@/lib/api/dashboard"
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

export function UserFormDialog({
  open, onOpenChange, user, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  user?: ApiUser
  onSaved?: () => void
}) {
  const isEdit = !!user
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [roleIds, setRoleIds] = React.useState<Set<number>>(new Set())

  React.useEffect(() => {
    if (!open) return
    setFullName(user?.fullName ?? "")
    setEmail(user?.email ?? "")
    setPhoneNumber(user?.phoneNumber ?? "")
    setPassword("")
    setRoleIds(new Set((user?.roles ?? []).map((r) => r.id)))
  }, [open, user])

  // Assignable roles — load on open and exclude "super admin", matching the
  // original create/edit dialogs 1:1 so an admin can never grant it here.
  const [assignable, setAssignable] = React.useState<ApiRole[]>([])
  React.useEffect(() => {
    if (!open) return
    RolesAPI.getAll()
      .then((rs) => setAssignable((rs || []).filter((r) => r.name?.toLowerCase() !== "super admin")))
      .catch(() => setAssignable([]))
  }, [open])

  const toggleRole = (id: number) =>
    setRoleIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const saveMut = useMutation({
    mutationFn: () => {
      const ids = Array.from(roleIds)
      if (isEdit) {
        return axiosInstance.patch(`/api/v1/users?id=${user!.id}`, {
          fullName: fullName.trim(), email: email.trim(), phoneNumber: phoneNumber.trim(), roleIds: ids,
        })
      }
      return axiosInstance.post("/api/v1/users", {
        fullName: fullName.trim(), email: email.trim(), phoneNumber: phoneNumber.trim(), password, roleIds: ids,
      })
    },
    onSuccess: () => { showSuccessToast(isEdit ? "User updated" : "User created"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save user"),
  })

  const canSave = fullName.trim() && email.trim() && (isEdit || password.length >= 6)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit user" : "New user"}</DialogTitle><DialogDescription>{isEdit ? "Update this user's details and roles." : "Create a user and grant dashboard access via roles."}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <Field label="Full name"><input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ayesha Khan" autoFocus /></Field>
          <Field label="Email"><input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></Field>
          <Field label="Phone"><input className={inputCls} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="03001234567" /></Field>
          {!isEdit && (
            <Field label="Password"><input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" /></Field>
          )}
          <div className="space-y-1.5">
            <label className={labelCls}>Roles</label>
            {assignable.length === 0 ? (
              <p className="text-xs text-muted-foreground">No assignable roles found.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {assignable.map((r) => {
                  const active = roleIds.has(r.id)
                  return (
                    <button key={r.id} type="button" onClick={() => toggleRole(r.id)} aria-pressed={active}
                      className={cn("rounded-full border px-2.5 py-1 text-xs capitalize transition",
                        active ? "border-primary bg-primary/10 font-medium text-primary" : "border-input text-muted-foreground hover:bg-muted")}>
                      {r.name}
                    </button>
                  )
                })}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">Without a role the user can sign in but has no dashboard access.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Save changes" : "Create user"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UserFormDialog
