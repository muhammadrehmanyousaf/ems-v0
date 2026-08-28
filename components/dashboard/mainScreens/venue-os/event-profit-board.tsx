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

type SortKey = "date" | "cash" | "net" | "revenue";
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
          cancelled,
          revenue,
          received,
          outstanding: Math.max(0, revenue - received),
          spent,
          net,
          /**
           * WWL-009 — `net` is booked minus spent, and when nothing is tagged
           * it is simply the booking total. That produced rows reading
           * "Net Rs 1,546,000 · 100% margin" on a wedding that had received
           * Rs 386,500 and had no recorded cost at all. A margin computed from
           * no cost is not a margin, so rows with nothing tagged report null
           * and the column shows "—" rather than a fabricated 100%.
           */
          margin: spent > 0 && revenue > 0 ? net / revenue : null,
          /** What this function has actually put in the account, less what it took out. */
          cash: received - spent,
        };
      })
      // drop empty shells (no money either side) so the board stays signal-only
      .filter((x) => x.revenue > 0 || x.spent > 0);
    r.sort((a, b) =>
      sort === "cash" ? b.cash - a.cash
        : sort === "net" ? b.net - a.net
        : sort === "revenue" ? b.revenue - a.revenue
        : (b.date || "").localeCompare(a.date || ""),
    );
    return r;
  }, [bookings, spentByBooking, sort]);

  const totals = React.useMemo(() => {
    const booked = rows.reduce((s, r) => s + r.revenue, 0);
    const received = rows.reduce((s, r) => s + r.received, 0);
    const spent = rows.reduce((s, r) => s + r.spent, 0);
    const net = booked - spent;

    /**
     * WWL-541 / WWL-542 / WWL-554 — the headline read "Net profit
     * Rs 25,508,850 · 76% margin" and was wrong three independent ways:
     *
     *   WWL-541  it is BOOKED minus spent, and Rs 13,417,229 of that had not
     *            arrived. It is not profit until it is collected.
     *   WWL-542  seven functions showed 100% margin because nothing was tagged
     *            to them — Rs 9,702,750 of "profit" with no recorded cost at all.
     *   WWL-554  it ignores the Money tab's Rs 8,847,000 of fixed overheads
     *            entirely, which are real money leaving the account.
     *
     * The number is not deleted — it is a useful gross figure — but it is
     * labelled for what it actually is, and the two distortions are counted and
     * disclosed underneath instead of being silently baked in.
     */
    const untagged = rows.filter((r) => r.spent <= 0 && r.revenue > 0);
    const untaggedRevenue = untagged.reduce((s, r) => s + r.revenue, 0);
    const costedRows = rows.filter((r) => r.spent > 0);
    const costedBooked = costedRows.reduce((s, r) => s + r.revenue, 0);
    const costedNet = costedRows.reduce((s, r) => s + r.net, 0);

    return {
      booked,
      received,
      spent,
      net,
      /**
       * WWL-009 — the one figure on this board that is neither a projection
       * nor an average: money in, less money out. Live that is Rs 20,076,621
       * received against Rs 7,985,000 spent — Rs 12,091,621 — while the "Net
       * profit" headline read Rs 29,363,900, overstating the realised
       * position by roughly Rs 17.3M.
       */
      cash: received - spent,
      outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
      // Margin over the functions that actually have a cost against them.
      // Averaging in rows with zero recorded cost is what produced "76%".
      margin: costedBooked > 0 ? costedNet / costedBooked : 0,
      untaggedCount: untagged.length,
      untaggedRevenue,
      costedCount: costedRows.length,
    };
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Booked" value={formatPkr(totals.booked)} icon="CalendarCheck" />
        <StatCard label="Received" value={formatPkr(totals.received)} icon="Wallet" delta={totals.booked > 0 ? `${Math.round((totals.received / totals.booked) * 100)}% collected` : undefined} trend="up" />
        <StatCard label="Outstanding" value={formatPkr(totals.outstanding)} icon="Clock" delta="to collect" />
        <StatCard label="Spent (tagged)" value={formatPkr(totals.spent)} icon="TrendingDown" />
        {/* WWL-009 — the figure the owner can actually act on: money in less
            money out. It sits beside the gross number rather than replacing it,
            because both are useful and only one of them is cash. */}
        <StatCard
          label="Cash position"
          value={formatPkr(totals.cash)}
          icon="Wallet"
          delta="received − tagged spend"
          trend={totals.cash >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Booked − tagged spend"
          value={formatPkr(totals.net)}
          icon="TrendingUp"
          delta={totals.costedCount > 0 ? `${Math.round(totals.margin * 100)}% margin on costed events` : "no costed events yet"}
          trend={totals.net >= 0 ? "up" : "down"}
        />
      </div>

      {/* WWL-541 / 542 / 554 — say what this number is not, in the vendor's own
          figures, rather than presenting it as net profit. */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <p className="font-medium">This is not your net profit.</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px]">
          <li>
            It counts <strong>{formatPkr(totals.outstanding)}</strong> you have booked but not yet
            received.
          </li>
          {totals.untaggedCount > 0 && (
            <li>
              <strong>
                {totals.untaggedCount} function{totals.untaggedCount === 1 ? "" : "s"}
              </strong>{" "}
              worth <strong>{formatPkr(totals.untaggedRevenue)}</strong> have no expense tagged to
              them, so they count as pure profit. Tag their costs and this figure will drop.
            </li>
          )}
          <li>
            {/* Named the "Money" tab until 2026-08-29, when that tab was
                switched off (PRIMARY_TABS in venue-os-hub-view.tsx). Pointing a
                vendor at a tab that is no longer on screen is worse than not
                explaining where the number comes from, so the caveat now stands
                on its own. Put the tab name back if Venue money returns. */}
            It does not include fixed overheads — rent, salaries and utilities are not
            counted here.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Per function</span>
          <div className="inline-flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Sort:</span>
            {/* WWL-008/009 — "Most profit" sorted by booked-minus-spent, so the
                top of the list was the functions with the least cost recorded
                against them, and a cancelled wedding at Rs 0 received led it.
                Each control now names the column it actually sorts. */}
            {([["date", "Recent"], ["cash", "Most cash"], ["net", "Booked − spent"], ["revenue", "Biggest"]] as [SortKey, string][]).map(([k, lbl]) => (
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
                  <th scope="col" className="px-4 py-2 font-medium">Function</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Revenue</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Received</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Spent</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Cash</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Booked − spent</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Margin</th>
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
                    <td className={cn("px-4 py-2.5 text-right font-semibold tabular-nums", r.cash >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {formatPkr(r.cash)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {formatPkr(r.net)}
                    </td>
                    {/* WWL-009 — "—" where nothing is tagged. A margin computed
                        from no cost is not a margin; printing 100% told the
                        owner their least-documented events were their best. */}
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {r.margin == null ? (
                        <span title="No expenses tagged to this function yet">—</span>
                      ) : (
                        `${Math.round(r.margin * 100)}%`
                      )}
                    </td>
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
