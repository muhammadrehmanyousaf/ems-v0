"use client";

/**
 * Phase-2 EPIC 9 · 9.1/9.2 — money-truth reconciliation banner.
 *
 * Read-only. Shows the ONE reconciled number — true received (Σ receipts) vs
 * what the booking currently displays — and only raises an alert when they
 * DISAGREE (the "shown 200k, actually collected 350k, real baqaya 650k" lie).
 * When everything reconciles it collapses to a quiet green confirmation. Behind
 * PAISA_HUB_ENABLED (self-hides on 404).
 */
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getPaisaReconcile } from "@/lib/api/bookingOrder";
import { Card, CardContent } from "@/components/ui/card";

const rs = (n: number) => "Rs " + Math.round(n || 0).toLocaleString("en-PK");

export function PaisaReconcileCard({ bookingId }: { bookingId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["paisa-reconcile", bookingId],
    queryFn: () => getPaisaReconcile(bookingId),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Paisa reconcile…
        </CardContent>
      </Card>
    );
  }
  if (!data) return null; // feature off (404)

  // Everything agrees → quiet confirmation.
  if (data.reconciled) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span className="text-muted-foreground">
            Paisa milta hai — {data.receiptCount} receipt, kul {rs(data.receiptsTotal)} wasool. Baqaya {rs(data.trueBalance)}.
          </span>
        </CardContent>
      </Card>
    );
  }

  // They disagree → the alert.
  const shownMore = data.displayedAdvance > data.receiptsTotal;
  return (
    <Card className="border-amber-300 dark:border-amber-900/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600 shrink-0" />
          <h3 className="text-sm font-semibold">Paisa mismatch — check karein</h3>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Screen par &quot;wasool&quot;</span><span className="tabular-nums">{rs(data.displayedAdvance)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Asal receipts ({data.receiptCount})</span><span className="tabular-nums font-semibold">{rs(data.receiptsTotal)}</span></div>
          <div className="flex justify-between border-t pt-1"><span className="text-muted-foreground">Asal baqaya</span><span className="tabular-nums font-semibold text-amber-700 dark:text-amber-400">{rs(data.trueBalance)}</span></div>
          {data.overpaid > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Zyada jama (overpaid)</span><span className="tabular-nums text-emerald-700 dark:text-emerald-400">{rs(data.overpaid)}</span></div>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {data.receiptCount === 0
            ? "Is booking par koi receipt log nahi — jo raqam mili hai wo ‘Paisa mila’ se record karein."
            : shownMore
              ? "Screen zyada dikha raha hai — shayad koi receipt cancel/refund hua. Receipts se milaein."
              : "Aap ne screen se zyada wasool kiya hai — receipts asal figure hain."}
        </p>
      </CardContent>
    </Card>
  );
}

export default PaisaReconcileCard;
