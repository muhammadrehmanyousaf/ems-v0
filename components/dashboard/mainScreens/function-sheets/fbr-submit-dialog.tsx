'use client';

/**
 * FBR e-invoicing submit dialog (Phase 3 #9.1).
 *
 * Pakistan's Federal Board of Revenue mandates electronic invoicing
 * for vendors above the Tier-1 threshold. Submitted invoices receive
 * an FBR Invoice Number + QR code which MUST be printed on the
 * customer-facing invoice. Failure = audit exposure.
 *
 * This dialog:
 *   - Pre-flights eligibility (state must be invoiced/paid)
 *   - Lets vendor add optional buyer NTN / CNIC + paymentMode override
 *   - Calls /fbr-submit; surfaces no_provider gracefully
 *   - On success shows the assigned FBR Invoice # + QR preview
 *   - On rejection shows the per-field errors so vendor can fix
 *     (e.g. "vendor.ntn missing", "lineItemsJson empty")
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  FunctionSheetAPI,
  type FunctionSheet,
} from '@/lib/api/functionSheets';

interface FbrSubmitDialogProps {
  sheet: FunctionSheet | null;
  onOpenChange: (v: boolean) => void;
  onSubmitted?: () => Promise<void> | void;
}

export function FbrSubmitDialog({
  sheet,
  onOpenChange,
  onSubmitted,
}: FbrSubmitDialogProps) {
  const [buyerNtn, setBuyerNtn] = useState('');
  const [buyerNic, setBuyerNic] = useState('');
  const [paymentMode, setPaymentMode] = useState<string>('default');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<
    Awaited<ReturnType<typeof FunctionSheetAPI.submitFbr>> | null
  >(null);

  useEffect(() => {
    if (sheet) {
      setBuyerNtn('');
      setBuyerNic('');
      setPaymentMode('default');
      setLastResult(null);
    }
  }, [sheet?.id]);

  if (!sheet) return null;

  const eligible = sheet.state === 'invoiced' || sheet.state === 'paid';
  const alreadyAccepted = sheet.fbrSubmissionStatus === 'accepted';

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await FunctionSheetAPI.submitFbr(sheet.id, {
        buyerNtn: buyerNtn.trim() || undefined,
        buyerNic: buyerNic.trim() || undefined,
        paymentMode:
          paymentMode && paymentMode !== 'default' ? paymentMode : undefined,
      });
      setLastResult(res);
      if (res.result.ok) {
        toast.success(
          `FBR accepted · Invoice # ${res.result.fbrInvoiceNumber || '—'}`,
        );
      } else if (res.result.reason === 'no_provider') {
        toast.warning(
          "FBR provider not configured. Payload was saved for replay when sandbox creds arrive.",
        );
      } else {
        toast.error(
          `FBR rejected: ${res.result.reason || 'see errors'}`,
        );
      }
      if (onSubmitted) await onSubmitted();
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.data?.errors) {
        // Show validation errors inline (FBR_PAYLOAD_INVALID).
        setLastResult({
          provider: 'preflight',
          result: {
            ok: false,
            reason: 'payload_invalid',
            errors: data.data.errors,
          },
          row: {
            fbrSubmittedAt: null,
            fbrInvoiceNumber: null,
            fbrQrCodePayload: null,
            fbrSubmissionStatus: null,
            fbrSubmissionErrors: data.data.errors,
          },
        });
      }
      toast.error(data?.message || 'Could not submit to FBR');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!sheet} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Submit to FBR
          </DialogTitle>
          <DialogDescription>
            Sends the invoice to the Pakistan Federal Board of Revenue
            for electronic registration. Required for Tier-1 vendors
            (&gt; Rs. 10M / year retail; sales-tax-registered
            businesses). FBR returns an Invoice # + QR code; the QR
            auto-prints on future PDF generations.
          </DialogDescription>
        </DialogHeader>

        {!eligible && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            This sheet is in <strong>{sheet.state}</strong> state. FBR
            only accepts <strong>invoiced</strong> or <strong>paid</strong>{' '}
            sheets. Advance the state first.
          </div>
        )}

        {alreadyAccepted && (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            <CheckCircle2 className="mr-1 inline h-3 w-3" />
            Already accepted by FBR. Invoice #{' '}
            <strong className="font-mono">
              {sheet.fbrInvoiceNumber || '—'}
            </strong>
            {sheet.fbrSubmittedAt && (
              <>
                {' '}submitted{' '}
                {new Date(sheet.fbrSubmittedAt).toLocaleString('en-PK')}
              </>
            )}
            .
          </div>
        )}

        {eligible && !alreadyAccepted && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Optional buyer identity — FBR prefers an NTN or CNIC on
              the invoice when the customer is registered for sales
              tax. Leave blank for end-consumer / walk-in customers.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">
                  Buyer NTN
                </label>
                <Input
                  value={buyerNtn}
                  onChange={(e) => setBuyerNtn(e.target.value)}
                  placeholder="1234567-8"
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Buyer CNIC
                </label>
                <Input
                  value={buyerNic}
                  onChange={(e) => setBuyerNic(e.target.value)}
                  placeholder="35202-1234567-1"
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Payment mode
              </label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    Auto (Credit when invoiced, Cash when paid)
                  </SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="BankTransfer">Bank transfer</SelectItem>
                  <SelectItem value="MobileWallet">
                    Mobile wallet (JazzCash / Easypaisa / Raast)
                  </SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Result panel */}
        {lastResult && (
          <div
            className={`space-y-2 rounded-md border px-3 py-2 text-xs ${
              lastResult.result.ok
                ? 'border-emerald-300 bg-emerald-50/40'
                : lastResult.result.reason === 'no_provider'
                  ? 'border-amber-300 bg-amber-50/40'
                  : 'border-rose-300 bg-rose-50/40'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {lastResult.result.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              ) : lastResult.result.reason === 'no_provider' ? (
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-700" />
              )}
              Provider: {lastResult.provider}
              <Badge
                variant="outline"
                className="ml-auto font-mono text-[10px]"
              >
                {lastResult.row.fbrSubmissionStatus || 'unknown'}
              </Badge>
            </div>
            {lastResult.result.ok && lastResult.row.fbrInvoiceNumber && (
              <div>
                FBR Invoice #{' '}
                <strong className="font-mono">
                  {lastResult.row.fbrInvoiceNumber}
                </strong>
              </div>
            )}
            {lastResult.row.fbrQrCodePayload && (
              <a
                href={lastResult.row.fbrQrCodePayload}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 underline"
              >
                <ExternalLink className="h-3 w-3" />
                Verify on FBR
              </a>
            )}
            {Array.isArray(lastResult.result.errors) &&
              lastResult.result.errors.length > 0 && (
                <ul className="ml-5 list-disc space-y-0.5">
                  {lastResult.result.errors.map((e, i) => (
                    <li key={i}>
                      {e.path ? (
                        <span className="font-mono">{e.path}: </span>
                      ) : null}
                      {e.message}
                    </li>
                  ))}
                </ul>
              )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Close
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !eligible}
            className={alreadyAccepted ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Receipt className="mr-1 h-3 w-3" />
            {alreadyAccepted ? 'Re-submit (overwrites)' : 'Submit to FBR'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
