'use client';

/**
 * WW-RECORD-MODE — the vendor's side of a customer payment report.
 *
 * The customer transfers the advance to the venue's own account and taps
 * "I've sent the payment". That files a claim, which moves NO money and changes
 * NO status — it is evidence, not a receipt. Without this panel the claim went
 * nowhere: the vendor got a notification and had no screen to act on.
 *
 * Two actions, and the asymmetry between them is the point:
 *
 *   Confirm  the money is in the account. This is `record-payment` with the
 *            claimId — the SAME endpoint the vendor already uses to log an
 *            offline payment, which advances the booking, writes the
 *            PaymentTransaction and the receipt, and pays down installments.
 *            There is deliberately no second money route to drift from it.
 *
 *   Reject   the money is not there. Requires a reason, because "we couldn't
 *            find it" with no explanation is how a customer who genuinely paid
 *            loses their date.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentInstructionsAPI, type PaymentClaim } from '@/lib/api/paymentInstructions';
import { BookingsAPI, type PaymentType } from '@/lib/api/dashboard';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, Receipt, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/utils/api-error';

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  raast: 'Raast',
  ibft: 'IBFT',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  cash: 'Cash',
};

const formatPkr = (n: number | string) =>
  `Rs ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const formatWhen = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-PK', {
      day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
};

export function PaymentClaimsPanel({ bookingId }: { bookingId: number }) {
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const { data: claims, isLoading } = useQuery<PaymentClaim[]>({
    queryKey: ['payment-claims', bookingId],
    queryFn: () => PaymentInstructionsAPI.list(bookingId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['payment-claims', bookingId] });
    // The booking itself moved — status, paymentStatus, and the money columns.
    qc.invalidateQueries({ queryKey: ['bookings'] });
  };

  const confirmMut = useMutation({
    mutationFn: (claim: PaymentClaim) =>
      BookingsAPI.recordPayment(
        bookingId,
        claim.paymentType as PaymentType,
        claim.method,
        claim.id,
      ),
    onSuccess: () => { toast.success('Payment recorded. The booking is updated.'); invalidate(); },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't record that payment")),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, why }: { id: number; why: string }) =>
      PaymentInstructionsAPI.reject(id, why),
    onSuccess: () => {
      toast.success('Reported back to the customer.');
      setRejectingId(null); setReason(''); invalidate();
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't update that report")),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payment reports…
      </div>
    );
  }

  // No claims is the normal state for most bookings, so it renders nothing at
  // all rather than an empty panel competing for attention on the sheet.
  if (!claims || claims.length === 0) return null;

  const pending = claims.filter((c) => c.status === 'pending');
  const settled = claims.filter((c) => c.status !== 'pending');

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Customer payment reports</h3>
        {pending.length > 0 && (
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {pending.length} to check
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        {pending.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Check your account for these before confirming. Confirming records the
            payment and updates the booking.
          </p>
        )}

        {[...pending, ...settled].map((claim) => (
          <div
            key={claim.id}
            className={
              'rounded-lg border p-3 ' +
              (claim.status === 'pending'
                ? 'border-amber-300 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
                : 'border-border')
            }
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-base font-semibold tabular-nums">{formatPkr(claim.amount)}</span>
              <span className="text-sm text-muted-foreground">
                {METHOD_LABELS[claim.method] || claim.method}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatWhen(claim.claimedAt)}
              </span>
            </div>

            {/* The reference is what the vendor actually matches against their
                bank statement, so it gets weight rather than being a footnote. */}
            {claim.transactionRef && (
              <p className="mt-1.5 text-sm">
                <span className="text-muted-foreground">Ref </span>
                <span className="font-medium tabular-nums">{claim.transactionRef}</span>
              </p>
            )}
            {claim.notes && (
              <p className="mt-1 text-sm text-muted-foreground">&ldquo;{claim.notes}&rdquo;</p>
            )}
            {claim.proofUrl && (
              <a
                href={claim.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View proof
              </a>
            )}

            {claim.status === 'pending' && rejectingId !== claim.id && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={confirmMut.isPending}
                  onClick={() => confirmMut.mutate(claim)}
                >
                  {confirmMut.isPending
                    ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    : <Check className="mr-1.5 h-3.5 w-3.5" />}
                  It&apos;s in my account
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setRejectingId(claim.id); setReason(''); }}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" /> Can&apos;t find it
                </Button>
              </div>
            )}

            {rejectingId === claim.id && (
              <div className="mt-3 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  What should the customer do?
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder="e.g. nothing has arrived with that reference — please check the account number and send us the receipt"
                  className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={reason.trim().length < 3 || rejectMut.isPending}
                    onClick={() => rejectMut.mutate({ id: claim.id, why: reason.trim() })}
                  >
                    {rejectMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Send to customer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {claim.status === 'confirmed' && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Confirmed and recorded
              </p>
            )}
            {claim.status === 'rejected' && (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-destructive">Not found.</span>{' '}
                {claim.reviewNotes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
