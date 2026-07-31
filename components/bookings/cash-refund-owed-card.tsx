'use client';

/**
 * WW-CASHREFUND — money this vendor owes the customer back, not yet handed over.
 *
 * Created when a booking's price drops (a reschedule to a cheaper date, or an
 * approved change request) and the card rail cannot reverse it — because the
 * booking was paid in cash, which is how most Pakistani bookings are paid, or
 * because a Stripe refund failed part-way.
 *
 * Until this card existed the obligation was recorded and shown nowhere. That
 * was better than the money silently disappearing, which is what happened
 * before the settlement fix — but a debt a vendor cannot see is a debt they
 * cannot pay, and the customer is the one who chases it.
 *
 * Renders only when something is owed. A permanent "Rs 0 owed" panel on every
 * booking is noise, and noise is how a real one gets missed.
 */

import * as React from 'react';
import { useState } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { PaymentAPI } from '@/lib/api/payments';

export interface CashRefundOwed {
  id: number;
  amount: number;
  reason: string | null;
  owedSince: string;
}

function fmtPKR(n: number): string {
  return `Rs. ${Math.round(Number(n) || 0).toLocaleString('en-PK')}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function CashRefundOwedCard({
  refunds,
  onSettled,
}: {
  refunds: CashRefundOwed[];
  onSettled?: () => void;
}) {
  const [settling, setSettling] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());

  const outstanding = refunds.filter((r) => !done.has(r.id));
  if (outstanding.length === 0) return null;

  const total = outstanding.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const settle = async (id: number) => {
    setSettling(id);
    try {
      await PaymentAPI.settleCashRefund(id);
      // Mark locally so the row disappears immediately — the vendor has just
      // handed cash over and should not be left wondering whether it saved.
      setDone((prev) => new Set(prev).add(id));
      toast({
        title: 'Marked as returned',
        description: 'This refund is settled. Nothing further is owed on it.',
      });
      onSettled?.();
    } catch (e: any) {
      toast({
        title: "Couldn't mark it settled",
        description:
          e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSettling(null);
    }
  };

  return (
    <Card className="border-amber-300 bg-amber-50/60">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span className="text-sm font-semibold text-amber-900">
              You owe this customer a refund
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-amber-300 bg-white text-amber-900 text-xs"
          >
            {fmtPKR(total)}
          </Badge>
        </div>

        <p className="text-[12px] leading-relaxed text-amber-900/80">
          The price of this booking went down, and the money came in as cash — so
          there is no card payment to reverse. Hand it back to the customer, then
          mark it returned here.
        </p>

        <ul className="space-y-1.5">
          {outstanding.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-2.5 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-neutral-800">
                  {fmtPKR(r.amount)}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  {r.reason || 'Refund owed'}
                  {r.owedSince ? ` · since ${fmtDate(r.owedSince)}` : ''}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 gap-1.5 border-amber-300 text-xs"
                disabled={settling === r.id}
                onClick={() => settle(r.id)}
              >
                {settling === r.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Mark returned
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default CashRefundOwedCard;
