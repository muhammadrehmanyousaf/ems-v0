"use client";

/**
 * Event Profit board — the flag-free answer to "did each shaadi make money?".
 *
 * The GL-based per-event P&L panels (EventPnlView / EventCostedPnlView) only
 * light up for pilots with GL_ENGINE_ON, so a normal venue owner sees nothing.
 * This works for EVERY vendor: it pairs each booking's revenue + received (off
 * the booking) with the expenses tagged to it (VendorExpense.bookingId) to show
 * revenue vs received vs spent vs NET profit vs margin per function — plus the
 * portfolio totals up top. No flags, no GL.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useVendorBookings } from "@/hooks/use-vendor-bookings";
import { ExpensesAPI } from "@/lib/api/vendorExpenses";
import { StatCard } from "@/components/dashboard/primitives/stat-card";
import { formatPkr } from "@/components/dashboard/primitives/money-cell";
import { Icon } from "@/components/dashboard/shared/icon";
import { cn } from "@/lib/utils";

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0);
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

type SortKey = "date" | "net" | "revenue";
const MAX_ROWS = 40;

export function EventProfitBoard(): React.ReactElement {
  const [sort, setSort] = React.useState<SortKey>("date");
  const bookingsQ = useVendorBookings();
  const expensesQ = useQuery({ queryKey: ["event-profit-expenses"], queryFn: () => ExpensesAPI.list() });

  const bookings = bookingsQ.data ?? [];
  const expenses = expensesQ.data?.expenses ?? [];
  const loading = bookingsQ.isLoading || expensesQ.isLoading;

  const spentByBooking = React.useMemo(() => {
    const m = new Map<number, number>();
    expenses.forEach((e) => {
      if (e.bookingId != null) m.set(e.bookingId, (m.get(e.bookingId) || 0) + num(e.amount));
    });
    return m;
  }, [expenses]);

  const rows = React.useMemo(() => {
    const r = bookings
      .map((b) => {
        /*
         * A cancelled shaadi earned nothing — this card asks "did each shaadi
         * make money?", and one that never happened made none.
         *
         * Verified live on production (vendor 3351): booking 175
         * "Usman Tariq & Hira Usman" is Cancelled with a total of Rs 2,742,400
         * and was ranked #1 under BOTH "Most profit" and "Biggest". Three
         * cancelled bookings worth Rs 3,855,050 were being counted as revenue,
         * which also inflated every headline tile below — including
         * "Outstanding · to collect", telling the vendor to chase money for
         * events that were called off.
         *
         * Tagged spend is deliberately KEPT: if the venue had already bought
         * flowers before the cancellation, that rupee left the account and is a
         * real loss. So a cancelled row now shows revenue 0 against whatever was
         * spent — which is exactly what it cost them.
         */
        const cancelled = /^(cancel|refund)/i.test(String(b.status ?? ""));
        const revenue = cancelled ? 0 : num(b.totalAmount);
        const received = cancelled ? 0 : num(b.downPayment);
        const spent = spentByBooking.get(b.id) || 0;
        const net = revenue - spent;
        return {
          id: b.id,
          name: b.customerName || `Booking #${b.id}`,
          date: b.bookingDate,
          status: b.status,
          revenue,
          received,
          outstanding: Math.max(0, revenue - received),
          spent,
          net,
          margin: revenue > 0 ? net / revenue : 0,
        };
      })
      // drop empty shells (no money either side) so the board stays signal-only
      .filter((x) => x.revenue > 0 || x.spent > 0);
    r.sort((a, b) =>
      sort === "net" ? b.net - a.net : sort === "revenue" ? b.revenue - a.revenue : (b.date || "").localeCompare(a.date || ""),
    );
    return r;
  }, [bookings, spentByBooking, sort]);

  const totals = React.useMemo(() => {
    const booked = rows.reduce((s, r) => s + r.revenue, 0);
    const received = rows.reduce((s, r) => s + r.received, 0);
    const spent = rows.reduce((s, r) => s + r.spent, 0);
    const net = booked - spent;
    return { booked, received, spent, net, outstanding: rows.reduce((s, r) => s + r.outstanding, 0), margin: booked > 0 ? net / booked : 0 };
  }, [rows]);

  const shown = rows.slice(0, MAX_ROWS);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">Did each shaadi make money?</h3>
        <p className="text-sm text-muted-foreground">
          Revenue vs what you&apos;ve received vs what you spent on it — per function. Tag expenses to a booking to see the spend side fill in.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Booked" value={formatPkr(totals.booked)} icon="CalendarCheck" />
        <StatCard label="Received" value={formatPkr(totals.received)} icon="Wallet" delta={totals.booked > 0 ? `${Math.round((totals.received / totals.booked) * 100)}% collected` : undefined} trend="up" />
        <StatCard label="Outstanding" value={formatPkr(totals.outstanding)} icon="Clock" delta="to collect" />
        <StatCard label="Spent (tagged)" value={formatPkr(totals.spent)} icon="TrendingDown" />
        <StatCard label="Net profit" value={formatPkr(totals.net)} icon="TrendingUp" delta={`${Math.round(totals.margin * 100)}% margin`} trend={totals.net >= 0 ? "up" : "down"} />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Per function</span>
          <div className="inline-flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Sort:</span>
            {([["date", "Recent"], ["net", "Most profit"], ["revenue", "Biggest"]] as [SortKey, string][]).map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSort(k)}
                className={cn("rounded px-2 py-1 transition-colors", sort === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading your bookings…</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
            <Icon name="CalendarCheck" size={22} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No priced bookings yet.</p>
            <p className="text-xs text-muted-foreground">Once you have bookings with a price, each shaadi&apos;s profit shows here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Function</th>
                  <th className="px-4 py-2 text-right font-medium">Revenue</th>
                  <th className="px-4 py-2 text-right font-medium">Received</th>
                  <th className="px-4 py-2 text-right font-medium">Spent</th>
                  <th className="px-4 py-2 text-right font-medium">Net</th>
                  <th className="px-4 py-2 text-right font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{fmtDate(r.date)}{r.status ? ` · ${r.status}` : ""}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatPkr(r.revenue)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatPkr(r.received)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-rose-600 dark:text-rose-400">{r.spent > 0 ? formatPkr(r.spent) : "—"}</td>
                    <td className={cn("px-4 py-2.5 text-right font-semibold tabular-nums", r.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {formatPkr(r.net)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.revenue > 0 ? `${Math.round(r.margin * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > MAX_ROWS && (
              <p className="px-4 py-2 text-center text-xs text-muted-foreground">Showing {MAX_ROWS} of {rows.length} — refine in the Bookings screen.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventProfitBoard;
