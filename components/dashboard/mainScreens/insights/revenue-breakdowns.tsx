"use client";

/**
 * Revenue breakdowns (audit gaps G1 + G6 + G7) — mounted on the
 * Insights page below the existing 12-month avg-ticket-size chart.
 *
 * Three "where is my money coming from?" answers in one section:
 *   • Payment-method mix (Cash / Easypaisa / JazzCash / Raast /
 *     IBFT / Bank / Other) — % bar with Rs total + count per method.
 *   • Top customers (top 20 by revenue) — name + phone (tel:) +
 *     email (mailto:), totalRevenue, bookingCount, last booking,
 *     repeat badge.
 *   • By business — for vendors that run multiple businesses (e.g.
 *     a chain hall + catering arm), the per-business revenue slice.
 *
 * Self-contained: fetches its own data on mount via AnalyticsAPI.
 * Skeleton + error states. PK currency formatter.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard, Crown, Building2, Phone, Mail, Repeat,
} from "lucide-react";
import {
  AnalyticsAPI,
  type RevenueBreakdownsData,
  type PaymentMethodSlice,
} from "@/lib/api/analytics";

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  raast: "Raast",
  ibft: "IBFT / Online",
  bank_transfer: "Bank transfer",
  other: "Other",
};

const METHOD_TONE: Record<string, string> = {
  cash: "bg-emerald-500",
  jazzcash: "bg-rose-500",
  easypaisa: "bg-emerald-700",
  raast: "bg-violet-500",
  ibft: "bg-blue-500",
  bank_transfer: "bg-amber-500",
  other: "bg-neutral-500",
};

const fmtPKR = (n: number) =>
  `Rs. ${Math.round(n).toLocaleString("en-PK")}`;

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
};

function MethodBar({ slice }: { slice: PaymentMethodSlice }) {
  const m = slice.method;
  const label = METHOD_LABEL[m] || m;
  const tone = METHOD_TONE[m] || "bg-neutral-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {fmtPKR(slice.total)}
          <span className="ml-1 text-[10px]">· {slice.count}×</span>
          <span className="ml-2 font-semibold tabular-nums text-neutral-900">
            {slice.pct.toFixed(1)}%
          </span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${tone} transition-all`}
          style={{ width: `${Math.min(100, slice.pct)}%` }}
        />
      </div>
    </div>
  );
}

export default function RevenueBreakdowns() {
  const [data, setData] = useState<RevenueBreakdownsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getRevenueBreakdowns("this_year")
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-72" />
        <Skeleton className="h-72 md:col-span-2" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No revenue data yet for this year.
        </CardContent>
      </Card>
    );
  }

  const { byPaymentMethod, topCustomers, byBusiness, totals } = data;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {/* Payment-method mix (G7) */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="h-4 w-4 text-bridal-gold-dark" />
            Payment-method mix
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            How {totals.paymentMethodTotal > 0 ? fmtPKR(totals.paymentMethodTotal) : "Rs 0"}
            {" "}came in this year.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {byPaymentMethod.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No payment receipts logged in this period.
            </p>
          ) : (
            byPaymentMethod.map((s) => <MethodBar key={s.method} slice={s} />)
          )}
        </CardContent>
      </Card>

      {/* Top customers (G6) */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Crown className="h-4 w-4 text-bridal-gold-dark" />
            Top customers (by revenue)
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Your top {Math.min(20, topCustomers.length)} customers this year —
            give them VIP treatment.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {topCustomers.length === 0 ? (
            <p className="p-5 text-xs text-muted-foreground italic">
              No bookings in this period.
            </p>
          ) : (
            <div className="divide-y">
              {topCustomers.map((c, idx) => {
                const key = (
                  c.customerEmail || c.customerPhone || c.customerName || `c${idx}`
                ).toLowerCase();
                return (
                  <div key={key} className="p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-bridal-gold-dark/10 text-bridal-gold-dark text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">
                          {c.customerName || "Unnamed"}
                        </p>
                        {c.isRepeat && (
                          <Badge variant="outline"
                            className="bg-emerald-50 border-emerald-200 text-emerald-800 gap-1 text-[10px]">
                            <Repeat className="h-2.5 w-2.5" /> Repeat
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10.5px] text-muted-foreground">
                        {c.customerPhone && (
                          <a href={`tel:${c.customerPhone}`}
                            className="flex items-center gap-1 hover:text-bridal-gold-dark">
                            <Phone className="h-3 w-3" /> {c.customerPhone}
                          </a>
                        )}
                        {c.customerEmail && (
                          <a href={`mailto:${c.customerEmail}`}
                            className="flex items-center gap-1 hover:text-bridal-gold-dark truncate">
                            <Mail className="h-3 w-3" /> {c.customerEmail}
                          </a>
                        )}
                        <span className="ml-auto whitespace-nowrap">
                          Last: {fmtDate(c.lastBookingAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums">
                        {fmtPKR(c.totalRevenue)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.bookingCount} booking{c.bookingCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* By business (G1) — only shown if multiple businesses, or if
          single business has data (still useful to see one row). */}
      {byBusiness.length > 0 && (
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-bridal-gold-dark" />
              Revenue by business
              {byBusiness.length > 1 && (
                <Badge variant="outline" className="text-[10px] ml-1">
                  {byBusiness.length} businesses
                </Badge>
              )}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              For multi-business vendors — see which arm of your operation
              earns the most.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {byBusiness.map((b) => {
              const top = byBusiness[0]?.totalRevenue || 1;
              const widthPct = Math.min(100, (b.totalRevenue / top) * 100);
              return (
                <div key={b.businessId} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold truncate">{b.businessName}</span>
                      {b.businessType && (
                        <Badge variant="outline" className="text-[10px]">
                          {b.businessType}
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground tabular-nums shrink-0">
                      {fmtPKR(b.totalRevenue)}
                      <span className="ml-1 text-[10px]">· {b.bookingCount}×</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-bridal-gold-dark transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
