"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  CircleSlash,
  Loader2,
} from "lucide-react";
import { SectionCard } from "@/components/user-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BookingAPI,
  type BookingInstallment,
  type InstallmentsResponse,
} from "@/lib/api/bookings";
import { dayText, moneyOf, qistStateCustomer, rsText } from "@/lib/utils/qist";

/**
 * WW-QIST-SCHEDULE — the customer's view of the SAME schedule the vendor edits.
 *
 * Every figure comes from the server's single schedule object (no arithmetic
 * here): the qists, their true state ("Overdue by 4 days", "Part paid", "Due
 * today"), what has been paid, what is left, and the next one to pay. A waived
 * qist is shown as waived and is not part of what is owed (the booking total was
 * lowered by the same amount).
 *
 * The pay button and the single "amount due" figure live on the booking page and
 * read the server's payment-instructions `amountDue`; this card only explains the
 * plan behind that number.
 */

const TONE_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ok: "default",
  bad: "destructive",
  warn: "secondary",
  info: "secondary",
  acc: "outline",
  mut: "outline",
};

function Row({ q }: { q: BookingInstallment }) {
  const view = qistStateCustomer(q);
  const isPaid = q.state === "paid";
  const isOverdue = q.state === "overdue";
  const isWaived = q.state === "waived";
  const Icon = isPaid ? CheckCircle2 : isOverdue ? AlertTriangle : isWaived ? CircleSlash : Clock;
  const paid = moneyOf(q.amountPaid);
  const left = moneyOf(q.remaining);
  const heading = q.order != null ? `Instalment ${q.order}: ${q.title || q.label}` : `${q.title || q.label} (waived)`;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-3 border-b border-border/60 last:border-b-0",
        (isWaived || q.state === "cancelled") && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={cn(
            "mt-0.5 rounded-full p-1.5",
            isPaid && "bg-emerald-100 text-emerald-700",
            isOverdue && "bg-red-100 text-red-700",
            !isPaid && !isOverdue && !isWaived && "bg-amber-100 text-amber-700",
            isWaived && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm text-foreground">{heading}</p>
            <Badge variant={TONE_BADGE[view.tone] ?? "secondary"} className="text-[10.5px] tracking-wide">
              {view.label}
            </Badge>
          </div>
          <p className={cn("text-[12px] mt-0.5", isOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
            {isPaid
              ? q.paidAt
                ? `Paid on ${dayText(String(q.paidAt).slice(0, 10))}`
                : "Paid"
              : view.detail || `Due ${dayText(q.dueDate)}`}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("font-medium tabular-nums text-sm text-foreground", isWaived && "line-through")}>
          {rsText(q.amount)}
        </p>
        {!isWaived && paid > 0 && left > 0 ? (
          <p className="text-[11px] text-muted-foreground tabular-nums">{rsText(paid)} paid</p>
        ) : null}
      </div>
    </div>
  );
}

interface InstallmentsCardProps {
  bookingId: number | string;
}

/**
 * BK-042 — render the payment schedule for a booking.
 *
 * Auth-gates inside the backend handler (super-admin / customer / vendor on the
 * booking); this component just renders what comes back. An empty `installments`
 * array (a booking with nothing to collect) hides the card.
 */
export function InstallmentsCard({ bookingId }: InstallmentsCardProps) {
  const [data, setData] = useState<InstallmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    BookingAPI.getInstallments(Number(bookingId))
      .then((res) => {
        if (!alive) return;
        setData(res);
      })
      .catch((e) => {
        if (!alive) return;
        // Hide the card silently on auth errors — this is informational.
        if (e?.response?.status === 403 || e?.response?.status === 404) {
          setData(null);
        } else {
          setError(e?.response?.data?.message ?? "Couldn't load schedule");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <SectionCard title="Payment schedule">
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading payment schedule…
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full mt-2" />
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard title="Payment schedule">
        <p className="text-sm text-red-600">{error}</p>
      </SectionCard>
    );
  }

  if (!data || !Array.isArray(data.installments) || data.installments.length === 0) {
    return null;
  }

  const { installments, money, nextDue } = data;
  const settled = !!money && money.outstanding <= 0 && !money.cancelled;

  return (
    <SectionCard
      title="Payment schedule"
      description={
        money?.cancelled
          ? "This booking is cancelled — nothing further is payable."
          : settled
            ? "Every instalment has been paid."
            : "Your instalments for this booking, with what is due and when."
      }
    >
      {nextDue && !money?.cancelled && !settled ? (
        <div
          className={cn(
            "mb-3 rounded-lg border px-3 py-2 text-sm",
            nextDue.state === "overdue" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          {nextDue.state === "overdue"
            ? `Overdue by ${nextDue.daysOverdue} day${nextDue.daysOverdue === 1 ? "" : "s"}: `
            : nextDue.state === "due_today"
              ? "Due today: "
              : "Next payment: "}
          <span className="font-semibold tabular-nums">{rsText(nextDue.remaining)}</span>
          {nextDue.state === "overdue" || nextDue.state === "due_today" ? "" : ` on ${dayText(nextDue.dueDate)}`}
        </div>
      ) : null}

      <div className="divide-y divide-border/60">
        {installments.map((q, i) => (
          <Row key={q.id ?? `row-${i}`} q={q} />
        ))}
      </div>

      {money ? (
        <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="font-medium tabular-nums text-sm">{rsText(money.total)}</p>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Paid</p>
            <p className="font-medium tabular-nums text-sm text-emerald-700">{rsText(money.received)}</p>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Remaining</p>
            <p className={cn("font-medium tabular-nums text-sm", money.outstanding > 0 ? "text-amber-700" : "text-emerald-700")}>
              {money.cancelled ? "—" : rsText(money.outstanding)}
            </p>
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

export default InstallmentsCard;
