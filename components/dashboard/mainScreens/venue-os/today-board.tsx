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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDueReminders, logReminder } from "@/lib/api/bookingOrder";
import { useVendorBookings, bookingVenue, type VendorBookingLite } from "@/hooks/use-vendor-bookings";
import { useUser } from "@/context/UserContext";
import { BlockedDatesAPI } from "@/lib/api/dashboard";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { StatCard } from "@/components/dashboard/primitives/stat-card";
import { formatPkr, MoneyCell } from "@/components/dashboard/primitives/money-cell";
import { Icon } from "@/components/dashboard/shared/icon";
import { waLink } from "@/lib/whatsapp";
import { todayInKarachi } from "@/lib/utils/pk-date";
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

/**
 * WWL-538 — this rendered "Thu, 13 Aug" with no year, on lists that already
 * span 93 days forward and 100 back. Nothing is ambiguous inside one calendar
 * year; a booking a year out or a balance overdue since last season rendered
 * identically to one this month. The year appears only when it is not the
 * current one, so the common case stays short.
 */
const fmtDate = (s?: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-PK", {
    weekday: "short", day: "2-digit", month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};

/**
 * WWL-532 — only `cancelled` was filtered, so Pending and Awaiting-Payment
 * bookings sat in "Upcoming events" beside Confirmed ones with nothing but a
 * word at the end of a line to tell them apart. The board told a venue owner
 * they had an event on 7 October worth Rs 2.6 million, on a booking nobody had
 * paid a rupee against and whose own status said it was not confirmed.
 *
 * They are NOT hidden — an unconfirmed Rs 2.6m enquiry is exactly what an owner
 * should be looking at. They are marked, and counted separately, so a held date
 * and a hoped-for one are never the same number.
 */
const COMMITTED = new Set(["confirmed", "completed", "in progress", "ongoing"]);
const isCommitted = (status?: string | null) => COMMITTED.has((status || "").trim().toLowerCase());

/**
 * Chase actions — a call and a pre-filled WhatsApp, on the row that names the
 * money. "Collect before the event" with no way to reach the customer left the
 * owner to copy a name into the bookings screen, search it, open the booking and
 * find the number. Both are plain links: WhatsApp opens composed, it never sends.
 */
/**
 * Measured on live production: the Home dashboard listed THE SAME ELEVEN
 * customers twice — "Who to chase" (780px) and, further down inside the Baqaya
 * panel, "Aaj kis ko yaad dilana hai" (1,070px). 1,850px of an already
 * eight-screen page spent showing eleven people two ways.
 *
 * They were not identical in function, which is why one could not simply be
 * deleted: this list had Call and WhatsApp, the other RECORDED that a reminder
 * was sent (`logReminder`) and showed the date it last went out — the thing
 * that stops a vendor chasing the same family twice in a week.
 *
 * So the capability moves here rather than dying with the duplicate. One row,
 * three jobs: ring them, message them, and note that you did.
 */
function ChaseActions({ row }: { row: Row }): React.ReactElement | null {
  const qc = useQueryClient();
  const { data: due } = useQuery({
    queryKey: ["reminders-due"],
    queryFn: getDueReminders,
    staleTime: 60_000,
  });
  const [justSent, setJustSent] = React.useState(false);
  const reminder = due?.reminders?.find((r) => r.bookingId === row.id);
  const logMut = useMutation({
    mutationFn: () =>
      logReminder(row.id, { trigger: reminder?.trigger, channel: "whatsapp", body: reminder?.message }),
    onSuccess: () => {
      setJustSent(true);
      qc.invalidateQueries({ queryKey: ["reminders-due"] });
    },
  });

  const phone = (row.customerPhone || "").trim();
  if (!phone) return null;
  const msg = `Assalam-o-Alaikum ${row.customerName || ""}. Aap ki booking ${fmtDate(row.bookingDate)} ki hai. Baqaya ${formatPkr(row.outstanding)} function se pehle jama karwa dein. Shukriya.`;
  const lastSent = justSent ? "just now" : reminder?.lastRemindedAt ? fmtDate(reminder.lastRemindedAt) : null;
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {/* Only offered where the reminder engine actually knows this booking —
          a button that silently no-ops is worse than no button. */}
      {reminder && (
        <button
          type="button"
          onClick={() => logMut.mutate()}
          disabled={logMut.isPending}
          aria-label={`Note that you reminded ${row.customerName || `booking ${row.id}`}`}
          title={lastSent ? `Last reminded ${lastSent}` : "Note that you have reminded them"}
          className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <Icon name={lastSent ? "CheckCircle2" : "Clock"} size={15} className={lastSent ? "text-emerald-600" : undefined} />
        </button>
      )}
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
  const { user } = useUser();
  const activeBusinessId = useActiveBusinessId();

  /**
   * WWL-537 — the board read "Events today: 0", which was true of the booking
   * list and false of the venue: all three halls carried a blocked date for
   * that same day. On a screen whose job is "what's happening at your hall
   * right now", every hall being closed did not appear anywhere.
   */
  const todayStr = todayInKarachi();
  const { data: blockedToday } = useQuery({
    queryKey: ["blocked-dates", activeBusinessId ?? "all", "today", todayStr],
    queryFn: () => BlockedDatesAPI.getAll(undefined, activeBusinessId, { from: todayStr, to: todayStr }),
    staleTime: 5 * 60_000,
  });

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

  /**
   * WWL-533 — the account holder's own name was the customer on a Confirmed
   * Rs 665,000 booking seven days out, appearing in Upcoming events, in Who to
   * chase at 0% paid, and inside both the "Next 7 days" count and the "To
   * collect" total. Almost certainly a test row, and it is on production.
   *
   * Not filtered — deleting a real vendor's data on a guess would be far worse
   * than showing it. It is marked, so an owner can see why a figure looks
   * wrong, and act on it themselves.
   */
  const isSelfBooking = React.useCallback(
    (r: Row) => {
      const name = (user?.fullName || "").trim().toLowerCase();
      const email = (user?.email || "").trim().toLowerCase();
      if (name && (r.customerName || "").trim().toLowerCase() === name) return true;
      if (email && (r.customerEmail || "").trim().toLowerCase() === email) return true;
      return false;
    },
    [user?.fullName, user?.email],
  );

  const todayEvents = rows.filter((r) => r.days === 0);
  const next7 = rows.filter((r) => r.days != null && r.days >= 0 && r.days <= 7);
  const next7Committed = next7.filter((r) => isCommitted(r.status)).length;
  const next7Provisional = next7.length - next7Committed;
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

      {/* WWL-537 */}
      {(blockedToday?.length ?? 0) > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
          <Icon name="CalendarCheck" size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium">
              Today is blocked{blockedToday!.length > 1 ? ` on ${blockedToday!.length} of your venues` : ""} —
              couples cannot book it.
            </p>
            {blockedToday!.some((b) => b.reason) && (
              <p className="text-muted-foreground">
                {blockedToday!.filter((b) => b.reason).map((b) => b.reason).join(" · ")}
              </p>
            )}
            <Link href="/dashboard/settings?tab=availability" className="text-xs font-medium text-primary hover:underline">
              Open availability
            </Link>
          </div>
        </div>
      )}

      {!hideKpis && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Events today" value={todayEvents.length} icon="CalendarCheck" />
          {/* WWL-532 — one number for "events" mixed dates the venue is
              committed to with dates it merely hopes for. */}
          <StatCard
            label="Next 7 days"
            value={next7Committed}
            icon="Clock"
            delta={next7Provisional > 0 ? `+${next7Provisional} not yet confirmed` : "confirmed events"}
          />
          <StatCard label="To collect" value={formatPkr(totalOutstanding)} icon="Wallet" delta="across open bookings" />
          <StatCard label="Overdue payments" value={overdue} icon="AlertTriangle" trend={overdue > 0 ? "down" : "flat"} delta={overdue > 0 ? "event passed, unpaid" : "all clear"} />
        </div>
      )}

      {/* `grid` alone gives the single mobile column an `auto` track, which sizes
          to the rows' max-content — measured at 360px: a 502.712px track inside a
          328px container, so both boards were cut off at the right edge.
          `grid-cols-1` emits `repeat(1, minmax(0, 1fr))`, which lets the track
          shrink; `min-w-0` lets the cards inside it do the same. */}
      <div className="grid grid-cols-1 gap-4 [&>*]:min-w-0 lg:grid-cols-2">
        {/* Upcoming events */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h4 className="text-sm font-semibold">Upcoming events</h4>
            <p className="text-xs text-muted-foreground">
              Soonest first. Anything not yet confirmed is marked — it is a date you hope for, not one
              you hold.
            </p>
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
                      className="flex min-w-0 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <Chip days={r.days} />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{r.customerName || `Booking #${r.id}`}</span>
                          {isSelfBooking(r) && (
                            <span
                              title="The customer on this booking is your own account — check whether it is a test row."
                              className="shrink-0 rounded-full border border-border px-1.5 text-[10px] font-medium text-muted-foreground"
                            >
                              your account
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {fmtDate(r.bookingDate)}
                          {bookingVenue(r).name ? ` · ${bookingVenue(r).name}` : ""}
                        </div>
                      </div>
                      {!isCommitted(r.status) && (
                        <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          {r.status || "Not confirmed"}
                        </span>
                      )}
                      {/* Was `formatPkr(...)` in a bare div, so the revenue for
                          every upcoming event rendered at 400 — the same weight
                          as the venue name beside it — while the KPI figures at
                          the top of the same screen sat at 600. One screen, two
                          answers. MoneyCell is the column atom: 500, tabular,
                          right-aligned, and an em dash for nothing, which is
                          what the ternary was doing by hand. */}
                      <div className="shrink-0 text-right text-sm">
                        <MoneyCell amount={r.revenue > 0 ? r.revenue : null} />
                      </div>
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
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{r.customerName || `Booking #${r.id}`}</span>
                          {isSelfBooking(r) && (
                            <span
                              title="The customer on this booking is your own account — check whether it is a test row."
                              className="shrink-0 rounded-full border border-border px-1.5 text-[10px] font-medium text-muted-foreground"
                            >
                              your account
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {fmtDate(r.bookingDate)} · {r.revenue > 0 ? `${Math.round((r.received / r.revenue) * 100)}% paid` : "unpriced"}
                          {bookingVenue(r).name ? ` · ${bookingVenue(r).name}` : ""}
                          {!isCommitted(r.status) ? ` · ${r.status || "not confirmed"}` : ""}
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
