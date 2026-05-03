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

const STATUS_LABEL: Record<BookingInstallment["status"], string> = {
  pending: "Due",
  paid: "Paid",
  partial: "Partial",
  waived: "Waived",
  overdue: "Overdue",
};

const LABEL_PRETTY: Record<string, string> = {
  down_payment: "Down payment",
  remaining: "Balance due",
};

function formatPKR(amount: number): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
  }
}

function formatDueAt(dueAt: string): string {
  try {
    const d = new Date(dueAt);
    return d.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dueAt;
  }
}

interface InstallmentRowProps {
  inst: BookingInstallment;
}

function InstallmentRow({ inst }: InstallmentRowProps) {
  const isPaid = inst.status === "paid";
  const isOverdue = inst.status === "overdue";
  const isWaived = inst.status === "waived";

  const Icon = isPaid
    ? CheckCircle2
    : isOverdue
    ? AlertTriangle
    : isWaived
    ? CircleSlash
    : Clock;

  const variant: "default" | "secondary" | "destructive" | "outline" = isPaid
    ? "default"
    : isOverdue
    ? "destructive"
    : "secondary";

  const label = LABEL_PRETTY[inst.label] ?? inst.label;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-3 border-b border-border/60 last:border-b-0",
        isWaived && "opacity-60",
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
            <p className="font-medium text-sm text-foreground">{label}</p>
            <Badge variant={variant} className="text-[10.5px] tracking-wide">
              {STATUS_LABEL[inst.status]}
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {isPaid && inst.paidAt
              ? `Paid on ${formatDueAt(inst.paidAt)}`
              : isWaived
              ? "Not required for this booking"
              : `Due by ${formatDueAt(inst.dueAt)}`}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-medium tabular-nums text-sm text-foreground">
          {formatPKR(inst.amount)}
        </p>
        {inst.amountPaid > 0 && inst.amountPaid < inst.amount ? (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {formatPKR(inst.amountPaid)} paid
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface InstallmentsCardProps {
  bookingId: number | string;
}

/**
 * BK-042 — render the down_payment + remaining schedule for a booking.
 *
 * Auth-gates inside the backend handler (super-admin / customer-by-email /
 * vendor-in-cart); this component just renders what comes back. Empty
 * `installments` array (e.g. legacy booking pre-BK-042) hides the card.
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
        // Hide the card silently on auth/legacy errors — this is informational.
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

  // Legacy booking pre-BK-042: no schedule → hide card.
  if (!data || !Array.isArray(data.installments) || data.installments.length === 0) {
    return null;
  }

  const { installments, totals } = data;
  const totalsKnown =
    totals && typeof totals.scheduled === "number";

  return (
    <SectionCard
      title="Payment schedule"
      description="Down payment and balance breakdown for this booking."
    >
      <div className="divide-y divide-border/60">
        {installments.map((inst) => (
          <InstallmentRow key={inst.id} inst={inst} />
        ))}
      </div>

      {totalsKnown ? (
        <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
              Scheduled
            </p>
            <p className="font-medium tabular-nums text-sm">
              {formatPKR(totals.scheduled)}
            </p>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
              Paid
            </p>
            <p className="font-medium tabular-nums text-sm text-emerald-700">
              {formatPKR(totals.paid)}
            </p>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
              Outstanding
            </p>
            <p
              className={cn(
                "font-medium tabular-nums text-sm",
                totals.outstanding > 0 ? "text-amber-700" : "text-emerald-700",
              )}
            >
              {formatPKR(totals.outstanding)}
            </p>
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

export default InstallmentsCard;
