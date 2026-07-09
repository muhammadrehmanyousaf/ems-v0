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
  const { data: blocked } = useQuery({
    queryKey: ["blocked-dates", businessId],
    queryFn: () => BlockedDatesAPI.getAll(),
    enabled: !!businessId,
  });
  const blockedSet = useMemo(() => new Set((blocked ?? []).map((b) => b.blockedDate)), [blocked]);

  const blockDate = async (date: Date) => {
    const ymd = format(date, "yyyy-MM-dd");
    try {
      await BlockedDatesAPI.block(ymd, "Islamic dead month / event");
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

  const rows: { key: string; kind: "hall" | "slot"; name: string; cellFor: (day: string) => CellState }[] = [];
  if (data) {
    data.halls.forEach((h) =>
      rows.push({
        key: `h${h.subVenueId}`, kind: "hall", name: h.name,
        cellFor: (day) => (data.days[day]?.halls.find((c) => c.subVenueId === h.subVenueId)?.state ?? "free"),
      }),
    );
    data.slots.forEach((s) =>
      rows.push({
        key: `s${s.slotTemplateId}`, kind: "slot", name: `${s.label} (${s.startTime?.slice(0, 5)})`,
        cellFor: (day) => (data.days[day]?.slots.find((c) => c.slotTemplateId === s.slotTemplateId)?.state ?? "free"),
      }),
    );
  }

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
          {(["free", "booked", "held", "blocked"] as CellState[]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={cn("size-3 rounded-sm", CELL[s].split(" ").slice(0, 2).join(" "))} />
              {LABEL[s]}
            </span>
          ))}
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
                  const booked = data.days[d]?.bookedCount ?? 0;
                  return (
                    <div key={d} className={cn("w-9 shrink-0 text-center", blocked && "opacity-60")}>
                      <div className="text-[10px] text-muted-foreground uppercase">{c.dow}</div>
                      <div className="text-xs font-medium tabular-nums">{c.dom}</div>
                      {/* approximate Hijri day — Pakistani families think in both */}
                      <div className="text-[8px] text-muted-foreground/70 tabular-nums leading-none">{hj.day}</div>
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
                  <div className="w-28 shrink-0 pr-2 truncate text-xs font-medium" title={r.name}>{r.name}</div>
                  {days.map((d) => {
                    const base: CellState = blockedSet.has(d) || data.days[d]?.isBlocked ? "blocked" : r.cellFor(d);
                    // A plain (offline/quick-add/migrated) booking isn't tied to a
                    // specific hall/slot, so it arrives only as a per-day count.
                    // Paint otherwise-free cells booked so a booked day is never
                    // shown as Free (never HIDE a booking).
                    const st: CellState = base === "free" && (data.days[d]?.bookedCount ?? 0) > 0 ? "booked" : base;
                    const isSel = sel && sel.row === r.key && sel.day === d;
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
                        aria-label={`${r.name} · ${d} · ${LABEL[st]}`}
                      >
                        {st === "booked" ? "•" : st === "blocked" ? "×" : ""}
                      </button>
                    );
                  })}
                </div>
              ))}
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
