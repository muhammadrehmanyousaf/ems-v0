"use client";

/**
 * Phase-2 EPIC 2 — per-event P&L ("Is shadi pe kitna bacha").
 *
 * A glanceable Aya / Gaya / Bacha card on the booking, projected from the order
 * (the spine already computes profit = what-the-customer-pays − the vendor's
 * cost lines). Loss shows a red "Nuqsan" badge; costs break into
 * Catering/Staff/Utility/Other chips; the summary shares to WhatsApp. Owner-only,
 * self-hides when there are no costs to talk about (or the feature is dark).
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, MessageCircle } from "lucide-react";
import { getBookingOrder, type OrderLine } from "@/lib/api/bookingOrder";
import { useBusiness } from "@/context/BusinessContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PKR = (n: number | null | undefined) => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const isCost = (l: OrderLine) => l.kind === "cost" || l.moneyFlow === "expense";
const effQty = (l: OrderLine) =>
  (l.basis === "per_head" || l.basis === "per_serving") && (l.guaranteedQty != null || l.servedQty != null)
    ? Math.max(num(l.guaranteedQty), num(l.servedQty)) : num(l.qty);

/** Bucket a cost line into a layman category from its name. */
function costCategory(name: string): "Catering" | "Staff" | "Utility" | "Other" {
  const s = (name || "").toLowerCase();
  if (/degh|food|raw|catering|khana|dish|menu|meat|rice|masala|sabzi|drink|water/.test(s)) return "Catering";
  if (/staff|dihari|waiter|crew|labour|labor|bearer|cook|mali|guard/.test(s)) return "Staff";
  if (/diesel|generator|genset|utility|bijli|gas|electric|fuel|petrol/.test(s)) return "Utility";
  return "Other";
}

const CAT_STYLE: Record<string, string> = {
  Catering: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  Staff: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  Utility: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  Other: "bg-muted text-muted-foreground",
};

export function EventPnlCard({ bookingId }: { bookingId: number }) {
  const { business } = useBusiness();
  const vendor = business?.name ?? "Wedding Wala";
  const { data, isLoading } = useQuery({ queryKey: ["booking-order", bookingId], queryFn: () => getBookingOrder(bookingId) });

  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of data?.lines ?? []) {
      if (!isCost(l)) continue;
      const cat = costCategory(l.name);
      map[cat] = (map[cat] ?? 0) + effQty(l) * num(l.rate);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [data]);

  if (isLoading || !data?.profit) return null;
  const { revenue, cost, profit, margin } = data.profit;
  if (cost <= 0) return null; // nothing to talk about until a cost is entered

  const loss = profit < 0;
  const shareText = `${vendor} — ${data.header?.eventType || "Event"}\nAya (customer): ${PKR(revenue)}\nGaya (kharch): ${PKR(cost)}\n${loss ? "Nuqsan" : "Bacha"}: ${PKR(Math.abs(profit))} (${Math.round(margin)}%)`;
  // Owner share — no fixed recipient; wa.me/?text= opens the contact picker prefilled.
  const shareHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <Card className={cn(loss ? "border-rose-300 dark:border-rose-900/60" : "border-emerald-200 dark:border-emerald-900/50")}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {loss ? <TrendingDown className="size-4 text-rose-600" /> : <TrendingUp className="size-4 text-emerald-600" />}
            <h3 className="font-semibold">Is event pe kitna bacha?</h3>
            <span className="text-[11px] text-muted-foreground">(sirf aap dekh sakte hain)</span>
          </div>
          {loss ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">Nuqsan</span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{Math.round(margin)}% margin</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Aya</div>
            <div className="text-lg font-bold tabular-nums">{PKR(revenue)}</div>
          </div>
          <div className="rounded-lg border p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Gaya</div>
            <div className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">−{PKR(cost)}</div>
          </div>
          <div className={cn("rounded-lg border p-2.5", loss ? "bg-rose-50 dark:bg-rose-950/30" : "bg-emerald-50 dark:bg-emerald-950/30")}>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{loss ? "Nuqsan" : "Bacha"}</div>
            <div className={cn("text-lg font-bold tabular-nums", loss ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400")}>{PKR(Math.abs(profit))}</div>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {breakdown.map(([cat, amt]) => (
              <span key={cat} className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", CAT_STYLE[cat])}>
                {cat} {PKR(amt)}
              </span>
            ))}
          </div>
        )}

        <Button asChild size="sm" variant="outline" className="text-emerald-700 border-emerald-300">
          <a href={shareHref} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4 mr-1.5" /> Share on WhatsApp</a>
        </Button>
      </CardContent>
    </Card>
  );
}

export default EventPnlCard;
