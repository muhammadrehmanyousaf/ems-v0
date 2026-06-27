"use client"

/**
 * Bank accounts manager (redesigned, Track C — interactive).
 * Self-contained CRUD for the vendor's payout accounts (BankDetailsAPI:
 * listMine/create/setActive/remove). Used inside the business-settings hub's
 * Bank tab. Its own mutations (NOT the hub's BusinessesAPI save bar). Account
 * numbers are masked on read by the backend.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BankDetailsAPI, type BankDetail, type UpsertBankDetailInput } from "@/lib/api/bankDetails"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
const EMPTY: UpsertBankDetailInput = { bankName: "", accountHolderName: "", accountNumber: "", iban: "", branchCode: "", isActive: false }

export function BankAccountsManager() {
  const qc = useQueryClient()
  const { data: accounts, isLoading } = useQuery<BankDetail[]>({ queryKey: ["bank-accounts"], queryFn: () => BankDetailsAPI.listMine() })
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [form, setForm] = React.useState<UpsertBankDetailInput>(EMPTY)
  const set = (k: keyof UpsertBankDetailInput, v: any) => setForm((f) => ({ ...f, [k]: v }))
  const reset = () => { setForm(EMPTY); setAdding(false); setEditingId(null) }
  const invalidate = () => qc.invalidateQueries({ queryKey: ["bank-accounts"] })
  // Account number is masked on read — start it blank so a blank save keeps the existing one.
  const startEdit = (a: BankDetail) => {
    setForm({ bankName: a.bankName ?? "", accountHolderName: a.accountHolderName ?? "", accountNumber: "", iban: a.iban ?? "", branchCode: a.branchCode ?? "", isActive: a.isActive })
    setEditingId(a.id); setAdding(true)
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const body: UpsertBankDetailInput = { ...form }
      // On edit, omit the account number unless the user typed a new one (avoid persisting the mask).
      if (editingId && !(form.accountNumber || "").trim()) delete body.accountNumber
      return editingId ? BankDetailsAPI.update(editingId, body) : BankDetailsAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(editingId ? "Bank account updated" : "Bank account added"); reset(); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save account"),
  })
  const activeMut = useMutation({
    mutationFn: (id: number) => BankDetailsAPI.setActive(id),
    onSuccess: () => { showSuccessToast("Default payout account updated"); invalidate() },
    onError: (e: any) => toast.error(e?.message || "Couldn't set active"),
  })
  const removeMut = useMutation({
    mutationFn: (id: number) => BankDetailsAPI.remove(id),
    onSuccess: () => { showSuccessToast("Bank account removed"); invalidate() },
    onError: (e: any) => toast.error(e?.message || "Couldn't remove account"),
  })

  const canSave = (form.bankName || "").trim() && (form.accountHolderName || "").trim() && (!!editingId || (form.accountNumber || "").trim())

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="CreditCard" size={16} /></span>
        <div className="mr-auto"><h2 className="text-sm font-semibold">Bank details</h2><p className="text-xs text-muted-foreground">Payout accounts for your receivables.</p></div>
        {!adding && <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Icon name="Plus" size={14} className="mr-1" /> Add account</Button>}
      </div>

      <div className="space-y-3 p-4">
        {/* Add form */}
        {adding && (
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs font-semibold text-primary">{editingId ? "Edit account" : "New account"}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><label className={labelCls}>Bank name</label><input className={inputCls} value={form.bankName ?? ""} onChange={(e) => set("bankName", e.target.value)} placeholder="e.g. Meezan Bank, HBL, UBL" /></div>
              <div className="space-y-1.5"><label className={labelCls}>Account holder</label><input className={inputCls} value={form.accountHolderName ?? ""} onChange={(e) => set("accountHolderName", e.target.value)} placeholder="As on the account" /></div>
              <div className="space-y-1.5"><label className={labelCls}>Account number</label><input className={inputCls} value={form.accountNumber ?? ""} onChange={(e) => set("accountNumber", e.target.value)} placeholder={editingId ? "Leave blank to keep current" : "Account / 16-digit"} /></div>
              <div className="space-y-1.5"><label className={labelCls}>IBAN</label><input className={inputCls} value={form.iban ?? ""} onChange={(e) => set("iban", e.target.value)} placeholder="PK00XXXX0000000000000000" /></div>
              <div className="space-y-1.5"><label className={labelCls}>Branch code</label><input className={inputCls} value={form.branchCode ?? ""} onChange={(e) => set("branchCode", e.target.value)} placeholder="Optional" /></div>
              <label className="flex items-center gap-2 self-end pb-1.5 text-sm"><input type="checkbox" className="h-4 w-4" checked={Boolean(form.isActive)} onChange={(e) => set("isActive", e.target.checked)} /> Make this the default payout account</label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={14} className="mr-1.5" /> {editingId ? "Update account" : "Save account"}</>}</Button>
              <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Spinner size={16} /> Loading accounts…</div>
        ) : !accounts?.length && !adding ? (
          <EmptyState icon="CreditCard" title="No payout accounts yet" description="Add a bank account so we can route your receivables." />
        ) : (
          accounts?.map((a) => (
            <div key={a.id} className={cn("flex flex-wrap items-center gap-3 rounded-lg border p-3", a.isActive ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20" : "border-border")}>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="CreditCard" size={16} /></span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">{a.bankName}
                  {a.isActive && <StatusPill tone="success">Default</StatusPill>}
                  <StatusPill tone={a.isVerified ? "info" : "neutral"}>{a.isVerified ? "Verified" : "Unverified"}</StatusPill>
                </div>
                <div className="truncate text-xs text-muted-foreground">{a.accountHolderName} · {a.accountNumber}{a.iban ? ` · ${a.iban}` : ""}</div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {!a.isActive && <Button size="sm" variant="ghost" disabled={activeMut.isPending} onClick={() => activeMut.mutate(a.id)}><Icon name="Star" size={14} className="mr-1" /> Set default</Button>}
                <Button size="sm" variant="ghost" onClick={() => startEdit(a)} aria-label="Edit account"><Icon name="Pencil" size={14} className="text-muted-foreground" /></Button>
                <Button size="sm" variant="ghost" disabled={removeMut.isPending} onClick={() => removeMut.mutate(a.id)} aria-label="Remove account"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default BankAccountsManager
