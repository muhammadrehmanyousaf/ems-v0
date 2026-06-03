'use client';

/**
 * Phase 0 #2 — Bank Details admin tab.
 *
 * Vendors without bank details cannot receive payouts. The backend
 * has had full CRUD + admin verification wired for months; the
 * dashboard simply lacked a UI for it. This tab closes that gap.
 *
 * Surfaces:
 *   - List of the vendor's bank accounts (a vendor may keep multiple
 *     accounts but only ONE is the active payout target at a time)
 *   - "Active" / "Verified" badges per row
 *   - Add / Edit / Set-active / Delete actions
 *   - Inline form modal for create / update
 *
 * Verification is admin-triggered (POST /admin/bank-details/:id/verify
 * is gated by superAdminMiddleware); vendors see verification status
 * read-only here.
 *
 * Live-system safety: this is a pure-additive new tab. No existing
 * behaviour changes. Bank-details endpoints have been live for
 * months — we're only adding the UI surface.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Star,
  Trash2,
  Pencil,
  Building,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

import {
  BankDetailsAPI,
  type BankDetail,
} from '@/lib/api/bankDetails';
// 03-DRAFT-RESILIENCE — bank details intentionally do NOT use
// useFormDraft (localStorage plaintext for financial PII would be a
// regulatory and security incident on a shared device). Instead we use
// the beforeunload guard + a Cancel confirmation so an accidental
// refresh or close turns into a deliberate two-click decision.
import { useBeforeUnloadGuard } from '@/lib/hooks/useBeforeUnloadGuard';

const formSchema = z.object({
  bankName: z
    .string()
    .min(2, { message: 'Bank name is required (e.g. HBL, Meezan, UBL).' })
    .max(120),
  accountHolderName: z
    .string()
    .min(2, { message: 'Account holder name is required (per CNIC).' })
    .max(120),
  accountNumber: z
    .string()
    .min(6, { message: 'Account number is required.' })
    .max(40),
  iban: z.string().max(34).optional(),
  branchCode: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function maskAccount(acc: string): string {
  if (!acc) return '—';
  if (acc.length <= 4) return `••${acc}`;
  return `••••${acc.slice(-4)}`;
}

const BankDetailsTab = () => {
  const [accounts, setAccounts] = useState<BankDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BankDetail | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      iban: '',
      branchCode: '',
      isActive: false,
    },
  });

  // 03-DRAFT-RESILIENCE — warn the vendor before refresh/close while
  // they have unsaved bank-details typing. Active only when the dialog
  // is open AND the form is dirty. See lib/hooks/useBeforeUnloadGuard.ts
  // for why we don't use the localStorage draft layer here.
  const isDirty = form.formState.isDirty;
  useBeforeUnloadGuard({
    enabled: dialogOpen && isDirty && !saving,
    message: "You have unsaved bank-details. Leave anyway?",
  });

  // Wrapped close handler that confirms BEFORE dismissing the dialog
  // when the form has unsaved changes. Covers all three dismiss paths:
  // explicit Cancel click, outside click, and Esc key (the Dialog's
  // onOpenChange fires for all of them).
  const closeWithConfirm = React.useCallback(
    (force = false) => {
      if (!force && isDirty && !saving) {
        const ok = typeof window !== "undefined"
          ? window.confirm("Discard your unsaved bank-details?")
          : true;
        if (!ok) return;
      }
      setDialogOpen(false);
    },
    [isDirty, saving],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await BankDetailsAPI.listMine();
      setAccounts(rows || []);
    } catch (e) {
      toast.error('Could not load bank accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.reset({
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      iban: '',
      branchCode: '',
      // First account auto-active so vendor doesn't get stuck without a payout target.
      isActive: accounts.length === 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (row: BankDetail) => {
    setEditing(row);
    form.reset({
      bankName: row.bankName || '',
      accountHolderName: row.accountHolderName || '',
      // Backend returns masked on read; clearing the field forces a
      // re-entry IF the vendor wants to change it (and resets the
      // verification flag server-side). Leaving it blank on submit
      // preserves the existing value via the strip-undefined pattern.
      accountNumber: '',
      iban: row.iban || '',
      branchCode: row.branchCode || '',
      isActive: !!row.isActive,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editing) {
        // Strip an empty account-number so we don't overwrite the
        // existing one with "". The backend treats missing keys as
        // "leave untouched".
        const payload: Record<string, unknown> = {
          bankName: values.bankName,
          accountHolderName: values.accountHolderName,
          iban: values.iban || null,
          branchCode: values.branchCode || null,
          isActive: !!values.isActive,
        };
        if (values.accountNumber && values.accountNumber.trim().length >= 6) {
          payload.accountNumber = values.accountNumber.trim();
        }
        await BankDetailsAPI.update(editing.id, payload);
        toast.success('Bank account updated');
      } else {
        await BankDetailsAPI.create({
          bankName: values.bankName,
          accountHolderName: values.accountHolderName,
          accountNumber: values.accountNumber.trim(),
          iban: values.iban?.trim() || null,
          branchCode: values.branchCode?.trim() || null,
          isActive: !!values.isActive,
        });
        toast.success('Bank account added');
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save bank account');
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (row: BankDetail) => {
    setActivatingId(row.id);
    try {
      await BankDetailsAPI.setActive(row.id);
      toast.success(`Payouts will now go to ${row.bankName}`);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to set active');
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await BankDetailsAPI.remove(confirmDelete.id);
      toast.success('Bank account removed');
      setConfirmDelete(null);
      await load();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      {/* Heading + add button */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Bank accounts</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-prose">
            Add the bank account where you want to receive payouts. You can keep
            multiple accounts, but only one is marked <strong>active</strong> for
            payouts at a time. Each new account must be verified by Wedding Wala
            before it&apos;s used for payouts.
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add bank account
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Building className="h-8 w-8 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">No bank account yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Add your bank details so Wedding Wala can release payouts after
                each event. Cash bookings don&apos;t require this; online bookings
                do.
              </p>
            </div>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add your first bank account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {accounts.map((row) => (
            <Card key={row.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{row.bankName}</p>
                      {row.isActive && (
                        <Badge variant="default" className="gap-1 text-[10px]">
                          <Star className="h-3 w-3 fill-current" />
                          Active payout
                        </Badge>
                      )}
                      {row.isVerified ? (
                        <Badge
                          variant="outline"
                          className="gap-1 text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 text-[10px] text-amber-700 border-amber-300 bg-amber-50"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          Pending verification
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {row.accountHolderName} ·{' '}
                      <span className="tabular-nums">
                        {maskAccount(row.accountNumber)}
                      </span>
                      {row.iban ? ` · IBAN ${row.iban}` : ''}
                      {row.branchCode ? ` · Branch ${row.branchCode}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!row.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleSetActive(row)}
                        disabled={activatingId === row.id}
                      >
                        {activatingId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Star className="h-3.5 w-3.5" />
                        )}
                        Set as active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(row)}
                      aria-label="Edit bank account"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(row)}
                      aria-label="Delete bank account"
                      disabled={deletingId === row.id}
                    >
                      {deletingId === row.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / edit dialog. onOpenChange routes through closeWithConfirm
          so Esc / outside-click / Cancel all prompt before discarding. */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          if (next) setDialogOpen(true);
          else closeWithConfirm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit bank account' : 'Add bank account'}
            </DialogTitle>
            <DialogDescription>
              Use the exact account holder name as it appears on your CNIC and
              bank record. Mismatches cause payout delays.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pt-2"
            >
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="HBL / Meezan / UBL / Allied / Bank Alfalah ..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account holder name</FormLabel>
                    <FormControl>
                      <Input placeholder="As printed on your CNIC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Account number
                      {editing && (
                        <span className="text-[10px] text-muted-foreground ml-2">
                          (leave blank to keep current)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={editing ? '••••' + (editing.accountNumber?.slice(-4) || '') : '12-digit account number'}
                        {...field}
                      />
                    </FormControl>
                    {editing && (
                      <FormDescription className="text-[11px]">
                        Changing the account number will reset verification —
                        Wedding Wala will need to re-verify before payouts
                        resume.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="PK36SCBL0000001123456702" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch code (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="0234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0 pt-2">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(c) => field.onChange(!!c)}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-tight">
                      <FormLabel className="cursor-pointer">
                        Use this account for payouts
                      </FormLabel>
                      <FormDescription className="text-[11px]">
                        Marks this as your active payout target. Any other
                        account currently active will be deactivated.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeWithConfirm()}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  {editing ? 'Save changes' : 'Add account'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bank account?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.isActive
                ? 'This is your active payout account — deleting it will leave you with no payout target until you mark another one active.'
                : 'You can always re-add it later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BankDetailsTab;
