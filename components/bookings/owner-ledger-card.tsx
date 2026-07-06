"use client";

/**
 * Phase-1 SPINE — owner money ledger ("Receivables" / Baqaya).
 *
 * The single place an owner sees, across EVERY event, what's booked, what
 * came in, and what's still outstanding — read from the order snapshot when
 * present, else the legacy total/down-payment so pre-order bookings still
 * appear. Self-hides when the backend feature is dark (404), so it's safe to
 * mount behind NEXT_PUBLIC_ORDER_BUILDER.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Wallet, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getBookingLedger, type BookingLedger, type LedgerRow } from "@/lib/api/bookingOrder";

const PKR = (n: number | null | undefined) =>
  "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "out" }) {
  return (
    <div className="flex-1 min-w-[130px] rounded-lg border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold tabular-nums", tone === "out" && "text-amber-600 dark:text-amber-500")}>
        {value}
      </p>
    </div>
  );
}

export function OwnerLedgerCard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BookingLedger | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const d = await getBookingLedger();
        if (live) setData(d);
      } catch {
        /* transient — leave hidden */
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  if (loading) return null;
  if (!data) return null; // feature dark

  const { summary, ledger } = data;
  const outstanding = ledger.filter((r) => !r.cancelled && r.balance > 0.5).slice(0, 12);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-primary" />
          <h3 className="font-semibold">Receivables</h3>
          <span className="text-xs text-muted-foreground">Booked · received · baqaya across all events</span>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-3">
          <Stat label="Total booked" value={PKR(summary.booked)} />
          <Stat label="Received" value={PKR(summary.received)} />
          <Stat label="Outstanding" value={PKR(summary.outstanding)} tone="out" />
          <Stat label="Events" value={`${summary.count}`} />
        </div>

        {/* Outstanding events */}
        {outstanding.length === 0 ? (
          <p className="text-sm text-muted-foreground py-1">
            Nothing outstanding — every booked event is fully paid. 🎉
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {summary.outstandingCount} event{summary.outstandingCount === 1 ? "" : "s"} with balance due
            </p>
            <div className="rounded-lg border divide-y">
              {outstanding.map((r) => (
                <LedgerLine key={r.id} row={r} />
              ))}
            </div>
            {summary.outstandingCount > outstanding.length && (
              <p className="text-xs text-muted-foreground pt-1">
                +{summary.outstandingCount - outstanding.length} more with balance due
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LedgerLine({ row }: { row: LedgerRow }) {
  return (
    <Link
      href={`/dashboard/bookings/${row.id}`}
      className="flex items-center gap-3 p-2.5 hover:bg-muted/40 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {row.customerName || `Booking #${row.id}`}
          {row.eventType && <span className="text-muted-foreground font-normal"> · {row.eventType}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{fmtDate(row.date)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-500">{PKR(row.balance)}</p>
        <p className="text-[11px] text-muted-foreground tabular-nums">of {PKR(row.grand)}</p>
      </div>
      {row.moneySource === "legacy" && (
        <Badge variant="outline" className="text-[10px] shrink-0">est.</Badge>
      )}
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </Link>
  );
}

export default OwnerLedgerCard;
