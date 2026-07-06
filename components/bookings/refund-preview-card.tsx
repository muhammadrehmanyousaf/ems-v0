"use client";

/**
 * Phase-2 EPIC 5 · 5.4/5.6 — layman refund preview.
 *
 * "Agar customer aaj cancel kare to kitna wapas, kitna zabt" — computed from a
 * chosen cancellation policy over the spine (deal total + paid + days-to-event).
 * The vendor flips between the three presets (Aasaan / Aam / Sakht) and sees the
 * rupee split live, plus a one-tap WhatsApp line to send the customer. Read-only:
 * this previews the number, it does NOT move money. Behind DISPUTE_ENGINE_ENABLED
 * (self-hides on 404).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle, Shield } from "lucide-react";
import { getRefundPreview, type RefundPreview } from "@/lib/api/bookingOrder";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const rs = (n: number) => "Rs " + Math.round(n || 0).toLocaleString("en-PK");

export function RefundPreviewCard({ bookingId }: { bookingId: number }) {
  const [policy, setPolicy] = useState("standard");
  const { data, isLoading } = useQuery<RefundPreview | null>({
    queryKey: ["refund-preview", bookingId, policy],
    queryFn: () => getRefundPreview(bookingId, { policy }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Refund preview…
        </CardContent>
      </Card>
    );
  }
  if (!data) return null; // feature off (404) or no booking money yet

  const { preview, comparison, daysBefore, totalPaid } = data;
  const waText = `Assalam-o-Alaikum.\n${data.policy.labelUr} policy ke mutabiq — agar aap ${daysBefore} din pehle cancel karte hain:\nWapas: ${rs(preview.refund)}\nZabt (advance/deposit): ${rs(preview.forfeit)}\nShukriya — Wedding Wala`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Cancellation / Refund</h3>
          </div>
          <span className="text-xs text-muted-foreground">{daysBefore} din pehle</span>
        </div>

        {/* Policy preset picker */}
        <div className="inline-flex rounded-md border p-0.5 text-xs w-full">
          {comparison.map((c) => (
            <button
              key={c.key}
              onClick={() => setPolicy(c.key)}
              className={cn(
                "flex-1 px-2 py-1.5 rounded transition-colors",
                policy === c.key ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {c.labelUr}
            </button>
          ))}
        </div>

        {/* The rupee split */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 p-3">
            <p className="text-xs text-muted-foreground">Customer ko wapas</p>
            <p className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">{rs(preview.refund)}</p>
          </div>
          <div className="rounded-lg border border-amber-300 dark:border-amber-900/50 p-3">
            <p className="text-xs text-muted-foreground">Zabt (aap ke paas)</p>
            <p className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-400 mt-0.5">{rs(preview.forfeit)}</p>
          </div>
        </div>

        {/* Breakdown line */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div className="flex justify-between"><span>Kul jama (paid)</span><span className="tabular-nums">{rs(totalPaid)}</span></div>
          <div className="flex justify-between"><span>Booking deposit ({data.policy.depositPct}% — non-refundable)</span><span className="tabular-nums">−{rs(preview.breakdown.deposit)}</span></div>
          <div className="flex justify-between">
            <span>Advance wapsi ({preview.tier.refundPct}% tier)</span>
            <span className="tabular-nums text-emerald-700 dark:text-emerald-400">{rs(preview.breakdown.advanceRefund)}</span>
          </div>
          {preview.breakdown.overpayment > 0 && (
            <div className="flex justify-between"><span>Zyada jama (wapas)</span><span className="tabular-nums text-emerald-700 dark:text-emerald-400">{rs(preview.breakdown.overpayment)}</span></div>
          )}
        </div>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 w-full rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 transition-colors"
        >
          <MessageCircle className="size-4" /> Customer ko refund bhejein
        </a>
        <p className="text-[10px] text-muted-foreground text-center">Sirf hisaab — paisa abhi move nahi hota.</p>
      </CardContent>
    </Card>
  );
}

export default RefundPreviewCard;
