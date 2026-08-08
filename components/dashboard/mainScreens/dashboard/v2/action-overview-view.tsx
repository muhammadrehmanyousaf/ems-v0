"use client";

/**
 * Phase-1 EPIC 5 · T5.2 — the "Ghar" action panel.
 *
 * Answers "what needs me today?" in one glance: the big baqaya (to-collect)
 * number, today's events, new enquiries, a 7-day slot strip, and the two
 * actions a vendor actually reaches for (new booking / go to money). Replaces
 * the vanity KPI tiles as the FIRST thing on the home screen. Behind
 * NEXT_PUBLIC_ORDER_BUILDER; self-hides on the backend 404.
 */
import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Wallet, CalendarClock, Inbox, ChevronRight } from "lucide-react";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { getActionSummary } from "@/lib/api/bookingOrder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PKR = (n: number | null | undefined) => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");
const fmtDay = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return { dow: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2), dom: d.getDate() };
};
const fmtTime = (t: string | null) => (t ? t.slice(0, 5) : "");

export function ActionOverviewView() {
  const businessId = useActiveBusinessId() ?? undefined;
  const { data, isLoading } = useQuery({
    queryKey: ["action-summary", businessId ?? "default"],
    queryFn: () => getActionSummary(businessId),
  });

  const todayIso = useMemo(() => data?.today, [data]);
  if (isLoading || !data) return null; // resolving / feature dark

  const dues = data.duesToChase;
  const events = data.todaysEvents;

  return (
    <div className="space-y-4">
      {/* Big baqaya + primary actions */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Wallet className="size-3.5" /> Baqaya · to collect
              </p>
              <p className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-500 mt-1">{PKR(dues.total)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                across {dues.count} event{dues.count === 1 ? "" : "s"} ·{" "}
                <Link href="/dashboard/bookings" className="text-primary hover:underline">see all</Link>
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link href="/dashboard/bookings"><Plus className="size-4 mr-1.5" /> Nayi Booking</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/payments">Paisa</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's events + new enquiries */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Aaj ke events</h3>
              <span className="ml-auto text-xs text-muted-foreground">{events.count} today</span>
            </div>
            {events.count === 0 ? (
              <p className="text-sm text-muted-foreground py-1">No events today.</p>
            ) : (
              <div className="divide-y">
                {events.items.slice(0, 5).map((e) => (
                  <Link key={e.id} href={`/dashboard/bookings/${e.id}`} className="flex items-center gap-3 py-2 hover:bg-muted/40 -mx-1 px-1 rounded">
                    <span className="text-xs tabular-nums text-muted-foreground w-10">{fmtTime(e.time) || "—"}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {e.customerName || `Booking #${e.id}`}
                      {e.eventType && <span className="text-muted-foreground font-normal"> · {e.eventType}</span>}
                    </span>
                    {e.balance > 0 && <span className="text-xs text-amber-600 dark:text-amber-500 tabular-nums">{PKR(e.balance)} due</span>}
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Inbox className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Naye Rabtay</h3>
            </div>
            <Link href="/dashboard/leads" className="block rounded-lg border p-3 hover:border-primary hover:bg-primary/5 transition-colors">
              <span className="text-2xl font-bold tabular-nums">{data.newEnquiries}</span>
              <span className="text-sm text-muted-foreground ml-2">new enquir{data.newEnquiries === 1 ? "y" : "ies"} to reply</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 7-day slot strip */}
      {data.calendarStrip.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock className="size-4 text-primary" />
              <h3 className="font-semibold text-sm">Agle 7 din</h3>
              <Link href="/dashboard/calendar" className="ml-auto text-xs text-primary hover:underline">open calendar</Link>
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {data.calendarStrip.map((d) => {
                const c = fmtDay(d.date);
                const isToday = d.date === todayIso;
                const busy = d.bookedSlots > 0 && d.freeSlots === 0;
                return (
                  <Link
                    key={d.date}
                    href="/dashboard/calendar"
                    className={cn(
                      "flex-1 min-w-[42px] rounded-lg border p-2 text-center",
                      isToday && "ring-1 ring-primary",
                      busy ? "bg-fuchsia-50 dark:bg-fuchsia-950/30" : d.freeSlots > 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "",
                    )}
                  >
                    <div className="text-[10px] uppercase text-muted-foreground">{c.dow}</div>
                    <div className="text-sm font-semibold tabular-nums">{c.dom}</div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      {d.freeSlots + d.bookedSlots === 0 ? "—" : `${d.freeSlots}✓`}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase-2 EPIC 8 — recovery reminders (self-hides when WHATSAPP_TIER1_ENABLED is off / 404). */}
      {/* RemindersDueCard removed from Home.
          
          Measured live: it listed the SAME ELEVEN customers already shown by
          "Who to chase" above it — 1,070px on top of that list's 780px, on a
          dashboard that was eight screens long. Two lists of the same people,
          in two languages, a screen apart.

          Nothing is lost. Its one unique capability — recording that a reminder
          went out, and showing when it last did — moved INTO the chase rows in
          today-board.tsx, so a vendor now rings, messages and notes it from a
          single row instead of scrolling between two lists to do one job. */}
    </div>
  );
}

export default ActionOverviewView;
