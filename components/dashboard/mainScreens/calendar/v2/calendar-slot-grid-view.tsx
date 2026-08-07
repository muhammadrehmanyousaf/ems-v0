"use client";

/**
 * Phase-1 EPIC 2 · T2.2 — mobile halls×slots availability grid.
 *
 * The redesigned calendar is read-only and the slot-chip engine lived only in
 * legacy main-calendar. This renders the grid the vendor needs on a phone:
 * halls (and capacity slots) as rows × days as columns, colored from the SAME
 * fused endpoint that enforces booking — so a booked date is visibly walled
 * BEFORE the vendor taps (the "catch a double-booking" aha). Behind
 * venue_os_v2; non-pilot vendors keep the current calendar.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { useBusiness } from "@/context/BusinessContext";
import { venueOsApi, type CellState } from "@/lib/api/venueOs";
import { BlockedDatesAPI } from "@/lib/api/dashboard";
import { gregorianToHijri } from "@/lib/hijri";
import { IslamicEventsStrip } from "../components/islamic-events-strip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QuickBookingSheet } from "./quick-booking-sheet";
import { AssignSpaceDialog } from "@/components/dashboard/shared/assign-space-dialog";

const WINDOW = 14; // two-week window per page (≤60d endpoint cap)

const CELL: Record<CellState, string> = {
  free: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:ring-2 hover:ring-emerald-400",
  booked: "bg-fuchsia-200 text-fuchsia-900 dark:bg-fuchsia-900/50 dark:text-fuchsia-200",
  held: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  partial: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300/90",
  blocked: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 line-through",
};
const LABEL: Record<CellState, string> = {
  free: "Free", booked: "Booked", held: "Held", partial: "Partly booked", blocked: "Blocked",
};

export function CalendarSlotGridView() {
  const active = useActiveBusinessId();
  const { business } = useBusiness();
  const businessId = active ?? business?.id ?? null;
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<{ row: string; day: string; state: CellState } | null>(null);
  const [quickDate, setQuickDate] = useState<string | null>(null); // free-cell tap → quick-add
  // WWL-100 — the booking whose hall the vendor is recording.
  const [assignBookingId, setAssignBookingId] = useState<number | null>(null);

  const from = useMemo(() => format(addDays(new Date(), page * WINDOW), "yyyy-MM-dd"), [page]);
  const to = useMemo(() => format(addDays(new Date(), page * WINDOW + WINDOW - 1), "yyyy-MM-dd"), [page]);
  const days = useMemo(
    () => Array.from({ length: WINDOW }, (_, i) => format(addDays(new Date(from + "T00:00:00"), i), "yyyy-MM-dd")),
    [from],
  );

  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["venue-calendar", businessId, from, to],
    queryFn: () => (businessId ? venueOsApi.getCalendar(businessId, from, to) : Promise.resolve(null)),
    enabled: !!businessId,
  });

  // Vendor-blocked dates (leaves / dead months) — overlaid on the grid so a
  // block reflects instantly regardless of which block table backs it.
  // Pass businessId EXPLICITLY. The query is already keyed by it, but the calls
  // were not scoped: the GET relied on the axios interceptor's active-business
  // guess (which can differ from the venue this grid is actually rendering), and
  // the POST below carried no scope at all, so blocking one day here blocked it
  // on every venue the vendor owns. Verified live on a two-venue account: a
  // single block wrote rows against both 3361 and 3362.
  const { data: blocked } = useQuery({
    queryKey: ["blocked-dates", businessId],
    queryFn: () => BlockedDatesAPI.getAll(undefined, businessId),
    enabled: !!businessId,
  });
  const blockedSet = useMemo(() => new Set((blocked ?? []).map((b) => b.blockedDate)), [blocked]);

  const blockDate = async (date: Date) => {
    const ymd = format(date, "yyyy-MM-dd");
    try {
      await BlockedDatesAPI.block(ymd, "Islamic dead month / event", businessId);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["blocked-dates", businessId] }),
        qc.invalidateQueries({ queryKey: ["venue-calendar", businessId] }),
      ]);
      toast.success(`${format(date, "d MMM")} blocked`);
    } catch {
      toast.error("Could not block that date");
    }
  };

  if (!businessId) return null;

  // Rows: the venue's halls, then its time-slots. Depth indents a Hall → Floor
  // → Partition tree so the shape of the venue is readable.
  const rows: {
    key: string; kind: "hall" | "slot"; name: string; depth: number;
    cellFor: (day: string) => CellState;
    bookingsFor?: (day: string) => number[];
  }[] = [];
  if (data) {
    data.halls.forEach((h) =>
      rows.push({
        key: `h${h.subVenueId}`, kind: "hall", name: h.name, depth: h.depth || 0,
        cellFor: (day) => (data.days[day]?.halls.find((c) => c.subVenueId === h.subVenueId)?.state ?? "free"),
        bookingsFor: (day) => data.days[day]?.halls.find((c) => c.subVenueId === h.subVenueId)?.bookingIds ?? [],
      }),
    );
    data.slots.forEach((s) =>
      rows.push({
        key: `s${s.slotTemplateId}`, kind: "slot", name: `${s.label} (${s.startTime?.slice(0, 5)})`, depth: 0,
        cellFor: (day) => (data.days[day]?.slots.find((c) => c.slotTemplateId === s.slotTemplateId)?.state ?? "free"),
      }),
    );
  }

  // WWL-100 — bookings that carry no hall.
  //
  // These used to be spread across every row: any day with a booking had all
  // its free cells painted Booked, which is why five halls and two slots showed
  // seven identical columns and the vendor could not sell the four halls that
  // were still empty. They get their own row now — the booking is never hidden,
  // no sellable hall is ever walled, and tapping the cell records the hall.
  const unassignedFor = (day: string) => data?.days[day]?.unassignedBookingIds ?? [];
  const unassignedCount = (day: string) =>
    data?.days[day]?.unassignedCount ?? data?.days[day]?.unassignedBookingIds?.length ?? 0;
  const anyUnassigned = days.some((d) => unassignedCount(d) > 0);

  const fmtCol = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return { dow: format(dt, "EEEEE"), dom: format(dt, "d"), month: format(dt, "MMM") };
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-5 space-y-3">
        {/* Header + week nav */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <h3 className="font-semibold">Availability</h3>
            <span className="hidden sm:inline text-xs text-muted-foreground">tap a day to see its status</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="size-7" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous fortnight">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums px-1 min-w-[92px] text-center">
              {format(new Date(from + "T00:00:00"), "d MMM")} – {format(new Date(to + "T00:00:00"), "d MMM")}
            </span>
            <Button size="icon" variant="outline" className="size-7" onClick={() => setPage((p) => p + 1)} aria-label="Next fortnight">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {/* `partial` is now a real, reachable state — a hall with one of its
              sessions sold, or one of its partitions taken — so it belongs in
              the legend rather than being an unexplained colour. */}
          {(["free", "booked", "partial", "held", "blocked"] as CellState[]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={cn("size-3 rounded-sm", CELL[s].split(" ").slice(0, 2).join(" "))} />
              {LABEL[s]}
            </span>
          ))}
          {anyUnassigned && (
            <span className="flex items-center gap-1">
              <span className="size-3 rounded-sm bg-amber-100 dark:bg-amber-900/40" />
              No hall recorded
            </span>
          )}
        </div>

        {/* Dead-month + Islamic-event strip — 1-click block (writes a vendor block). */}
        <IslamicEventsStrip blockedDateSet={blockedSet} onBlock={blockDate} />

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="size-4 animate-spin" /> Loading calendar…
          </div>
        ) : !data || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No halls or time-slots set up yet. Add them in Settings → Availability and they’ll appear here.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="min-w-max">
              {/* Column header (days) */}
              <div className="flex">
                <div className="w-28 shrink-0" />
                {days.map((d) => {
                  const c = fmtCol(d);
                  const hj = gregorianToHijri(new Date(d + "T00:00:00"));
                  const blocked = data.days[d]?.isBlocked || blockedSet.has(d);
                  // Bookings with no hall recorded — badged so the column is
                  // visibly incomplete even before the row below is read.
                  const booked = unassignedCount(d);
                  return (
                    <div key={d} className={cn("w-9 shrink-0 text-center", blocked && "opacity-60")}>
                      <div className="text-[10px] text-muted-foreground uppercase">{c.dow}</div>
                      <div className="text-xs font-medium tabular-nums">{c.dom}</div>
                      {/* approximate Hijri day — Pakistani families think in both */}
                      <div className="text-[8px] text-muted-foreground tabular-nums leading-none">{hj.day}</div>
                      {/* plain-booking count (offline / quick-add / migrated) */}
                      {booked > 0 && (
                        <div className="text-[8px] font-semibold text-fuchsia-600 dark:text-fuchsia-400 leading-none mt-0.5">●{booked > 1 ? booked : ""}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Rows */}
              {rows.map((r) => (
                <div key={r.key} className="flex items-center py-0.5">
                  <div
                    className="w-40 shrink-0 pr-2 truncate text-xs font-medium"
                    style={{ paddingLeft: `${r.depth * 10}px` }}
                    title={r.name}
                  >
                    {r.name}
                  </div>
                  {days.map((d) => {
                    // The cell says what is true of THIS hall on THIS day. It
                    // used to be overwritten to Booked whenever the day held any
                    // booking at all, which is what made every row identical.
                    const st: CellState = blockedSet.has(d) || data.days[d]?.isBlocked ? "blocked" : r.cellFor(d);
                    const isSel = sel && sel.row === r.key && sel.day === d;
                    const ids = r.bookingsFor?.(d) ?? [];
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          setSel({ row: r.key, day: d, state: st });
                          if (st === "free") setQuickDate(d); // tap a free date → log a booking fast
                        }}
                        className={cn(
                          "w-9 h-9 shrink-0 mx-px rounded-md text-[10px] font-semibold flex items-center justify-center transition",
                          CELL[st],
                          isSel && "ring-2 ring-offset-1 ring-primary",
                        )}
                        title={ids.length ? `${r.name} · ${LABEL[st]} · booking${ids.length > 1 ? "s" : ""} #${ids.join(", #")}` : undefined}
                        aria-label={`${r.name} · ${d} · ${LABEL[st]}`}
                      >
                        {st === "booked" ? "•" : st === "blocked" ? "×" : st === "partial" ? "◐" : ""}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* WWL-100 — the unassigned row. Only appears when there is
                  something to resolve, and every cell is a one-tap fix. */}
              {anyUnassigned && (
                <div className="flex items-center py-0.5 mt-1 border-t pt-1.5">
                  <div className="w-40 shrink-0 pr-2 truncate text-xs font-medium text-amber-700 dark:text-amber-400" title="Bookings with no hall recorded">
                    No hall recorded
                  </div>
                  {days.map((d) => {
                    const n = unassignedCount(d);
                    const ids = unassignedFor(d);
                    if (n === 0) return <div key={d} className="w-9 h-9 shrink-0 mx-px" />;
                    return (
                      <button
                        key={d}
                        onClick={() => ids[0] && setAssignBookingId(ids[0])}
                        className="w-9 h-9 shrink-0 mx-px rounded-md text-[10px] font-semibold flex items-center justify-center transition bg-amber-100 text-amber-900 hover:ring-2 hover:ring-amber-400 dark:bg-amber-900/40 dark:text-amber-200"
                        title={`${n} booking${n > 1 ? "s" : ""} on this date with no hall recorded (#${ids.join(", #")}). Tap to record it.`}
                        aria-label={`${d} · ${n} booking${n > 1 ? "s" : ""} with no hall recorded · record it`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selection caption */}
        {sel && (
          <div className="rounded-md border px-3 py-2 text-sm flex items-center justify-between gap-2">
            <span>
              <span className="font-medium">{rows.find((r) => r.key === sel.row)?.name}</span>
              <span className="text-muted-foreground"> · {format(new Date(sel.day + "T00:00:00"), "EEE d MMM")}</span>
            </span>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", CELL[sel.state].split(" ").slice(0, 4).join(" "))}>
              {LABEL[sel.state]}
            </span>
          </div>
        )}

        {/* WWL-100 — record the hall for a booking that has none. */}
        <AssignSpaceDialog
          bookingId={assignBookingId}
          businessId={businessId}
          open={assignBookingId != null}
          onOpenChange={(o) => { if (!o) setAssignBookingId(null); }}
        />

        {/* Tap a free date → register-fast quick-add (T6.3). */}
        {quickDate && (
          <QuickBookingSheet
            open={!!quickDate}
            onOpenChange={(o) => { if (!o) setQuickDate(null); }}
            businessId={businessId}
            date={quickDate}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarSlotGridView;
