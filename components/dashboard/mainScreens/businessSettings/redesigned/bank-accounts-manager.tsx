"use client"

/**
 * Bank accounts manager (redesigned, Track C — interactive).
 * Self-contained CRUD for the vendor's payout accounts (BankDetailsAPI:
 * listMine/create/setActive/remove). Used inside the business-settings hub's
 * Bank tab. Its own mutations (NOT the hub's BusinessesAPI save bar). Account
 * numbers are masked on read by the backend.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BankDetailsAPI, type BankDetail, type UpsertBankDetailInput } from "@/lib/api/bankDetails"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useBeforeUnloadGuard } from "@/lib/hooks/useBeforeUnloadGuard"
import {
  FormBlockedHint,
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validateName,
  validatePkIban,
  validateAccountNumber,
} from "@/components/dashboard/primitives/field-error"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
const EMPTY: UpsertBankDetailInput = { accountType: "bank", bankName: "", accountHolderName: "", accountNumber: "", iban: "", branchCode: "", isActive: false, showToCustomers: false }

/**
 * WW-DIRECT-PAY — the rails a customer can actually pay a Pakistani venue on.
 *
 * `CustomerPaymentClaims.method` has accepted `jazzcash` and `easypaisa` from
 * the start, so a customer could always REPORT paying by wallet — the product
 * simply had nowhere for the vendor to say which number to send it to. Every
 * other counterparty in the system (suppliers, staff, brokers) already carried
 * `jazzcashNumber` / `easypaisaNumber`; the one party a customer actually pays
 * did not.
 */
const ACCOUNT_TYPES: { value: NonNullable<UpsertBankDetailInput["accountType"]>; label: string; hint: string }[] = [
  { value: "bank", label: "Bank account", hint: "IBFT, Raast or a branch deposit" },
  { value: "jazzcash", label: "JazzCash", hint: "mobile wallet" },
  { value: "easypaisa", label: "Easypaisa", hint: "mobile wallet" },
]

export function BankAccountsManager() {
  const qc = useQueryClient()
  const { data: accounts, isLoading } = useQuery<BankDetail[]>({ queryKey: ["bank-accounts"], queryFn: () => BankDetailsAPI.listMine() })
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  // Errors surface only after a field is touched, so opening the form doesn't
  // immediately flag an empty IBAN the vendor hasn't reached yet.
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))
  const [form, setForm] = React.useState<UpsertBankDetailInput>(EMPTY)
  const set = (k: keyof UpsertBankDetailInput, v: any) => setForm((f) => ({ ...f, [k]: v }))

  // Bank details are the one form in the vendor portal that deliberately does
  // NOT use the localStorage draft layer — an IBAN and account number in
  // plaintext on a shared device is a financial-incident risk, so nothing is
  // persisted. That makes an accidental refresh unrecoverable: 24 characters of
  // IBAN typed off a chequebook, gone. This converts a one-click refresh into a
  // deliberate two-click decision. Only armed while something is actually typed.
  const hasUnsaved =
    adding &&
    Boolean(
      (form.bankName || "").trim() ||
        (form.accountHolderName || "").trim() ||
        (form.accountNumber || "").trim() ||
        (form.iban || "").trim() ||
        (form.branchCode || "").trim(),
    )
  useBeforeUnloadGuard({ enabled: hasUnsaved, message: "Your bank account details haven't been saved yet. Leave anyway?" })
  const reset = () => { setForm(EMPTY); setAdding(false); setEditingId(null) }
  const invalidate = () => qc.invalidateQueries({ queryKey: ["bank-accounts"] })
  // Account number is masked on read — start it blank so a blank save keeps the existing one.
  const startEdit = (a: BankDetail) => {
    // accountType first: it decides which fields the form even renders, and
    // an edit that dropped it reopened a JazzCash row as a bank account.
    setForm({ accountType: a.accountType ?? "bank", bankName: a.bankName ?? "", accountHolderName: a.accountHolderName ?? "", accountNumber: "", iban: a.iban ?? "", branchCode: a.branchCode ?? "", isActive: a.isActive, showToCustomers: a.showToCustomers === true })
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
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save account")),
  })
  const activeMut = useMutation({
    mutationFn: (id: number) => BankDetailsAPI.setActive(id),
    onSuccess: () => { showSuccessToast("Default payout account updated"); invalidate() },
    onError: (e: any) => toast.error(
        errorMessage(e, "Couldn't set active"),
        { duration: 8000 },
      ),
  })
  const removeMut = useMutation({
    mutationFn: (id: number) => BankDetailsAPI.remove(id),
    onSuccess: () => { showSuccessToast("Bank account removed"); invalidate() },
    onError: (e: any) => toast.error(
        errorMessage(e, "Couldn't remove account"),
        { duration: 8000 },
      ),
  })

  // This is the form the vendor's MONEY is paid into, and it had no format
  // checking at all — `.trim()` on the account number, nothing whatsoever on the
  // IBAN. A mistyped IBAN either bounces or routes a payout to a real stranger's
  // account, and the realistic failure is a single wrong character or two
  // transposed digits while copying 24 characters off a chequebook. Length alone
  // would miss exactly that, so validatePkIban runs the ISO 13616 mod-97
  // checksum, which is what the check digits exist for.
  //
  // On EDIT the account number is intentionally write-only (blank keeps the
  // stored one), so it is only validated when the vendor actually types one.
  /**
   * WW-DIRECT-PAY — a wallet is validated as a MOBILE NUMBER, not as an
   * account number, and has no IBAN or bank name to check.
   *
   * Running the bank rules over a JazzCash row would demand an IBAN a wallet
   * does not have and accept an 11-digit mobile number as a 16-digit account
   * number. Mirrors the server's own guard in bankDetailsController, so the
   * form refuses what the API would refuse rather than round-tripping to find
   * out.
   */
  const isWallet = form.accountType === "jazzcash" || form.accountType === "easypaisa"
  const walletDigits = (form.accountNumber ?? "").replace(/\D/g, "")
  const walletNumberError =
    !editingId || walletDigits.length > 0
      ? /^03\d{9}$/.test(walletDigits)
        ? undefined
        : "Enter the mobile number the account is registered to, e.g. 03001234567."
      : undefined

  const errs = isWallet
    ? {
        // The rail IS the name for a wallet; the server fills it in.
        bankName: undefined,
        accountHolderName: validateName(form.accountHolderName ?? "", { label: "Registered name", min: 2, max: 120 }),
        accountNumber: walletNumberError,
        iban: undefined,
      }
    : {
        bankName: validateName(form.bankName ?? "", { label: "Bank name", min: 2, max: 100 }),
        accountHolderName: validateName(form.accountHolderName ?? "", { label: "Account holder", min: 2, max: 120 }),
        accountNumber: validateAccountNumber(form.accountNumber ?? "", {
          required: !editingId,
        }),
        iban: validatePkIban(form.iban ?? ""),
      }
  const shown = {
    bankName: touched.bankName ? errs.bankName : undefined,
    accountHolderName: touched.accountHolderName ? errs.accountHolderName : undefined,
    accountNumber: touched.accountNumber ? errs.accountNumber : undefined,
    iban: touched.iban ? errs.iban : undefined,
  }
  const canSave = !errs.bankName && !errs.accountHolderName && !errs.accountNumber && !errs.iban

  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason =
    !canSave && !Object.values(shown).some(Boolean)
      ? isWallet
        ? "Add the registered name and the mobile number to save."
        : "Add a bank name, an account holder name and an account number to save."
      : undefined

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
            {/* WW-DIRECT-PAY — which rail, chosen first, because it decides
                which of the fields below even apply. */}
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="bank-type">How can customers pay you?</label>
              <div id="bank-type" className="flex flex-wrap gap-2">
                {ACCOUNT_TYPES.map((t) => {
                  const active = (form.accountType ?? "bank") === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        // Clearing the bank-only fields on switch, so a wallet
                        // can never be saved carrying a leftover IBAN from a
                        // half-filled bank row.
                        setForm((f) => ({
                          ...f,
                          accountType: t.value,
                          ...(t.value === "bank" ? {} : { iban: "", branchCode: "", bankName: "" }),
                        }))
                        setTouched({})
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-accent/50",
                      )}
                      aria-pressed={active}
                    >
                      <span className="block font-medium">{t.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{t.hint}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!isWallet && (
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="bank-name">Bank name</label>
                <input id="bank-name" className={cn(inputCls, shown.bankName && ERROR_INPUT_CLS)} value={form.bankName ?? ""} onChange={(e) => { set("bankName", e.target.value); touch("bankName") }} onBlur={() => touch("bankName")} maxLength={100} placeholder="e.g. Meezan Bank, HBL, UBL" {...fieldAria("bank-name", shown.bankName)} />
                <FieldError id="bank-name" message={shown.bankName} />
              </div>
              )}
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="bank-holder">{isWallet ? "Registered name" : "Account holder"}</label>
                <input id="bank-holder" className={cn(inputCls, shown.accountHolderName && ERROR_INPUT_CLS)} value={form.accountHolderName ?? ""} onChange={(e) => { set("accountHolderName", e.target.value); touch("accountHolderName") }} onBlur={() => touch("accountHolderName")} maxLength={120} placeholder={isWallet ? "Name the wallet is registered in" : "As on the account"} {...fieldAria("bank-holder", shown.accountHolderName)} />
                <FieldError id="bank-holder" message={shown.accountHolderName} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="bank-acct">{isWallet ? "Mobile number" : "Account number"}</label>
                <input id="bank-acct" inputMode="numeric" autoComplete="off" className={cn(inputCls, shown.accountNumber && ERROR_INPUT_CLS)} value={form.accountNumber ?? ""} onChange={(e) => { set("accountNumber", e.target.value); touch("accountNumber") }} onBlur={() => touch("accountNumber")} maxLength={isWallet ? 13 : 26} placeholder={editingId ? "Leave blank to keep current" : isWallet ? "03001234567" : "Account / 16-digit"} {...fieldAria("bank-acct", shown.accountNumber)} />
                <FieldError id="bank-acct" message={shown.accountNumber} />
              </div>
              {/* A wallet has neither an IBAN nor a branch code. Showing the
                  fields greyed would still invite a vendor to paste something
                  into them; not showing them is the honest form. */}
              {!isWallet && (
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="bank-iban">IBAN</label>
                <input id="bank-iban" autoComplete="off" autoCapitalize="characters" spellCheck={false} className={cn(inputCls, shown.iban && ERROR_INPUT_CLS, "uppercase")} value={form.iban ?? ""} onChange={(e) => { set("iban", e.target.value.toUpperCase()); touch("iban") }} onBlur={() => touch("iban")} maxLength={29} placeholder="PK00XXXX0000000000000000" {...fieldAria("bank-iban", shown.iban)} />
                <FieldError id="bank-iban" message={shown.iban} />
              </div>
              )}
              {!isWallet && (
              <div className="space-y-1.5"><label className={labelCls}>Branch code</label><input className={inputCls} value={form.branchCode ?? ""} onChange={(e) => set("branchCode", e.target.value)} placeholder="Optional" /></div>
              )}
              <label className="flex items-center gap-2 self-end pb-1.5 text-sm"><input type="checkbox" className="h-4 w-4" checked={Boolean(form.isActive)} onChange={(e) => set("isActive", e.target.checked)} /> Make this the default payout account</label>
            </div>

            {/* WW-RECORD-MODE — publishing this account to customers.
                Until now these rows existed only for payouts and no customer
                ever saw them; the booking screen showed a hardcoded placeholder
                IBAN instead. Customers now pay the venue directly, so a real
                account is needed — but which one, and whether to publish it at
                all, is the vendor's call, not an inference from a payout row. */}
            <label className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={Boolean(form.showToCustomers)}
                onChange={(e) => set("showToCustomers", e.target.checked)}
              />
              <span>
                <span className="font-medium">Show this account to customers paying me</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {form.showToCustomers
                    ? "Customers booking you will see these details on their payment screen, with a reference to quote. Shown only once we've verified the account."
                    : "Off — customers won't see this account. They'll be asked to contact you to arrange payment instead."}
                </span>
              </span>
            </label>
            <div className="flex gap-2">
              <FormBlockedHint message={blockedReason} />
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
              {/* A wallet gets its own icon: a vendor with three rows needs to
                  tell them apart at a glance, and every row carrying a credit
                  card made the list read as three bank accounts. */}
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icon name={a.accountType === "jazzcash" || a.accountType === "easypaisa" ? "Wallet" : "CreditCard"} size={16} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {a.accountType === "jazzcash" ? "JazzCash" : a.accountType === "easypaisa" ? "Easypaisa" : a.bankName}
                  {a.isActive && <StatusPill tone="success">Default</StatusPill>}
                  <StatusPill tone={a.isVerified ? "info" : "neutral"}>{a.isVerified ? "Verified" : "Unverified"}</StatusPill>
                  {a.showToCustomers && <StatusPill tone="info">Shown to customers</StatusPill>}
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
