"use client";

/**
 * Today board — the flag-free landing view for a venue owner.
 *
 * The live EventNight/console/guest-list panels self-gate on their pilot flags,
 * so the Today tab was empty for a normal vendor. This works for EVERY vendor
 * off the booking list alone and answers the two morning questions:
 *   • "What's coming up?" — today's events, then the next ones, with a day chip.
 *   • "Who do I chase?" — bookings with an unpaid balance, most-urgent first
 *     (an event already past but still unpaid is OVERDUE / red).
 */

import * as React from "react";
import Link from "next/link";
import { useVendorBookings, type VendorBookingLite } from "@/hooks/use-vendor-bookings";
import { StatCard } from "@/components/dashboard/primitives/stat-card";
import { formatPkr } from "@/components/dashboard/primitives/money-cell";
import { Icon } from "@/components/dashboard/shared/icon";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/** How many rows each list shows before it defers to the full screen. */
const LIST_CAP = 12;

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0);
const MS_DAY = 86400000;

function startOfDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

type Row = VendorBookingLite & { days: number | null; revenue: number; received: number; outstanding: number };

/** Human day chip: Today / Tomorrow / weekday / date / overdue. */
function dayChip(days: number | null): { label: string; tone: "today" | "soon" | "future" | "overdue" | "none" } {
  if (days == null) return { label: "no date", tone: "none" };
  if (days < 0) return { label: `${-days}d overdue`, tone: "overdue" };
  if (days === 0) return { label: "Today", tone: "today" };
  if (days === 1) return { label: "Tomorrow", tone: "soon" };
  if (days <= 7) return { label: `in ${days}d`, tone: "soon" };
  return { label: `in ${days}d`, tone: "future" };
}

const CHIP_CLS: Record<ReturnType<typeof dayChip>["tone"], string> = {
  today: "bg-primary/15 text-primary border-primary/30",
  soon: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  future: "bg-muted text-muted-foreground border-border",
  overdue: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  none: "bg-muted text-muted-foreground border-border",
};

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("en-PK", { weekday: "short", day: "2-digit", month: "short" }) : "—";

/**
 * Chase actions — a call and a pre-filled WhatsApp, on the row that names the
 * money. "Collect before the event" with no way to reach the customer left the
 * owner to copy a name into the bookings screen, search it, open the booking and
 * find the number. Both are plain links: WhatsApp opens composed, it never sends.
 */
function ChaseActions({ row }: { row: Row }): React.ReactElement | null {
  const phone = (row.customerPhone || "").trim();
  if (!phone) return null;
  const msg = `Assalam-o-Alaikum ${row.customerName || ""}. Aap ki booking ${fmtDate(row.bookingDate)} ki hai. Baqaya ${formatPkr(row.outstanding)} function se pehle jama karwa dein. Shukriya.`;
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      <a
        href={`tel:${phone}`}
        aria-label={`Call ${row.customerName || `booking ${row.id}`}`}
        title={`Call ${phone}`}
        className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name="Phone" size={15} />
      </a>
      <a
        href={waLink(phone, msg)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${row.customerName || `booking ${row.id}`} about the balance`}
        title="WhatsApp a payment reminder"
        className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name="MessageCircle" size={15} />
      </a>
    </span>
  );
}

/**
 * What the list is NOT showing. Both lists stop at LIST_CAP; the "To collect"
 * card counts every open booking. Without this the difference is invisible and
 * the two numbers simply disagree.
 */
function ListFooter({
  hidden,
  noun,
  shownAmount,
  totalAmount,
  href,
  cta,
}: {
  hidden: number;
  noun: string;
  shownAmount?: number;
  totalAmount?: number;
  href: string;
  cta: string;
}): React.ReactElement | null {
  if (hidden <= 0) return null;
  const money =
    shownAmount != null && totalAmount != null && totalAmount > shownAmount
      ? ` — ${formatPkr(totalAmount - shownAmount)} more`
      : "";
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
      <p className="text-xs text-muted-foreground">
        {hidden} more {noun}
        {hidden === 1 ? "" : "s"} not shown{money}.
      </p>
      <Link href={href} className="shrink-0 text-xs font-medium text-primary hover:underline">
        {cta}
      </Link>
    </div>
  );
}

export function TodayBoard({ hideKpis = false }: { hideKpis?: boolean } = {}): React.ReactElement {
  const { data, isLoading } = useVendorBookings();

  const rows: Row[] = React.useMemo(() => {
    const today = startOfDayMs(new Date());
    return (data ?? [])
      .filter((b) => (b.status || "").toLowerCase() !== "cancelled")
      .map((b) => {
        const t = b.bookingDate ? startOfDayMs(new Date(b.bookingDate)) : null;
        const days = t == null || Number.isNaN(t) ? null : Math.round((t - today) / MS_DAY);
        const revenue = num(b.totalAmount);
        const received = num(b.downPayment);
        return { ...b, days, revenue, received, outstanding: Math.max(0, revenue - received) };
      });
  }, [data]);

  const todayEvents = rows.filter((r) => r.days === 0);
  const next7 = rows.filter((r) => r.days != null && r.days >= 0 && r.days <= 7);
  const upcomingAll = rows.filter((r) => r.days != null && r.days >= 0).sort((a, b) => (a.days as number) - (b.days as number));
  const upcoming = upcomingAll.slice(0, LIST_CAP);
  const chaseAll = rows.filter((r) => r.outstanding > 0).sort((a, b) => (a.days ?? 99999) - (b.days ?? 99999));
  const toChase = chaseAll.slice(0, LIST_CAP);
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const overdue = rows.filter((r) => r.outstanding > 0 && r.days != null && r.days < 0).length;

  // The "To collect" card counts EVERY open booking; the list below it stops at
  // LIST_CAP. On this vendor that is Rs 13.4m in the card against Rs 10.6m of
  // visible rows — Rs 2.8m with nothing on screen to explain it. The footers
  // below name what is hidden and where the rest of it lives.
  const shownOutstanding = toChase.reduce((s, r) => s + r.outstanding, 0);
  const hiddenChase = chaseAll.length - toChase.length;
  const hiddenUpcoming = upcomingAll.length - upcoming.length;

  const Chip = ({ days }: { days: number | null }) => {
    const c = dayChip(days);
    return <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium", CHIP_CLS[c.tone])}>{c.label}</span>;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">What needs you</h3>
        <p className="text-sm text-muted-foreground">Your events coming up and the payments to chase — straight off your bookings.</p>
      </div>

      {!hideKpis && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Events today" value={todayEvents.length} icon="CalendarCheck" />
          <StatCard label="Next 7 days" value={next7.length} icon="Clock" delta="events" />
          <StatCard label="To collect" value={formatPkr(totalOutstanding)} icon="Wallet" delta="across open bookings" />
          <StatCard label="Overdue payments" value={overdue} icon="AlertTriangle" trend={overdue > 0 ? "down" : "flat"} delta={overdue > 0 ? "event passed, unpaid" : "all clear"} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming events */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h4 className="text-sm font-semibold">Upcoming events</h4>
            <p className="text-xs text-muted-foreground">Soonest first.</p>
          </div>
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading your bookings…</p>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
              <Icon name="CalendarCheck" size={20} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border/60">
                {upcoming.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/dashboard/bookings/${r.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <Chip days={r.days} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.customerName || `Booking #${r.id}`}</div>
                        <div className="text-xs text-muted-foreground">{fmtDate(r.bookingDate)}{r.status ? ` · ${r.status}` : ""}</div>
                      </div>
                      <div className="shrink-0 text-right text-sm tabular-nums">{r.revenue > 0 ? formatPkr(r.revenue) : "—"}</div>
                      <Icon name="ChevronRight" size={15} className="shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
              <ListFooter
                hidden={hiddenUpcoming}
                noun="event"
                href="/dashboard/bookings"
                cta="Open all bookings"
              />
            </>
          )}
        </div>

        {/* Who to chase */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h4 className="text-sm font-semibold">Who to chase</h4>
            <p className="text-xs text-muted-foreground">Unpaid balances — collect before the event.</p>
          </div>
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : toChase.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
              <Icon name="CheckCircle2" size={20} className="text-emerald-600" />
              <p className="text-sm text-muted-foreground">Nothing outstanding — you&apos;re all collected.</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border/60">
                {toChase.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/40">
                    <Link href={`/dashboard/bookings/${r.id}`} className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Chip days={r.days} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.customerName || `Booking #${r.id}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {fmtDate(r.bookingDate)} · {r.revenue > 0 ? `${Math.round((r.received / r.revenue) * 100)}% paid` : "unpriced"}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">{formatPkr(r.outstanding)}</div>
                    </Link>
                    <ChaseActions row={r} />
                  </li>
                ))}
              </ul>
              <ListFooter
                hidden={hiddenChase}
                noun="unpaid booking"
                shownAmount={shownOutstanding}
                totalAmount={totalOutstanding}
                href="/dashboard/receivables"
                cta="Open receivables"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodayBoard;
