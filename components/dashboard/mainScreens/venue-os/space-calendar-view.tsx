"use client";

/**
 * Venue-OS venue-hierarchy — nested availability calendar (doc Step 12B). A month
 * grid with a row per space (indented Hall → Floor → Partition) and a cell per day,
 * colour-coded from the tree-aware engine: booked (solid), partly-available (a
 * descendant is booked so the whole node can't be sold), free (empty). Booking a
 * parent shows every space under it as unavailable that day — the nested-calendar
 * correctness the doc calls out. Gated on isVenueHierarchyOn().
 */
import * as React from "react";
import { venueSpacesApi, type AvailabilityGrid } from "@/lib/api/venueSpaces";
import { isVenueHierarchyOn } from "@/lib/venue-hierarchy-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CELL: Record<string, string> = { AVAILABLE: "bg-white", PARTIAL: "bg-amber-300", UNAVAILABLE: "bg-rose-500" };

function monthBounds(ym: string): { from: string; to: string } {
  const [y, m] = ym.split("-").map(Number);
  const from = `${ym}-01`;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from, to: `${ym}-${String(last).padStart(2, "0")}` };
}

export function SpaceCalendarView(): React.ReactElement | null {
  const enabled = isVenueHierarchyOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [month, setMonth] = React.useState<string>("");
  const [grid, setGrid] = React.useState<AvailabilityGrid | null>(null);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function load(): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      const { from, to } = monthBounds(month);
      setGrid(await venueSpacesApi.availabilityRange(Number(businessId), from, to));
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Not enabled for this account yet.");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Space calendar (per-space availability)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-end gap-2">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded border px-2 py-1" />
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={!businessId || !month || busy}>
            Show
          </Button>
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-rose-500" /> booked</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-amber-300" /> partial</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm border bg-white" /> free</span>
          </span>
        </div>

        {grid && (
          <div className="overflow-x-auto">
            <table className="border-collapse text-[10px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-background px-2 py-1 text-left">Space</th>
                  {grid.days.map((d) => (
                    <th key={d} className="w-4 px-0 py-1 text-center font-normal text-muted-foreground">{Number(d.slice(-2))}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((r) => (
                  <tr key={r.subVenueId}>
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-background px-2 py-0.5" style={{ paddingLeft: `${8 + r.depth * 12}px` }}>{r.name}</td>
                    {r.days.map((st, i) => (
                      <td key={i} className="p-0">
                        <div className={`mx-px h-4 w-3 rounded-sm border border-gray-100 ${CELL[st]}`} title={`${grid.days[i]}: ${st}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {err && <p className="text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default SpaceCalendarView;
