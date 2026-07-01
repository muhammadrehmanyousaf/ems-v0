"use client";

/**
 * Customer-facing space selector (doc Step 11). For a chosen date it shows the
 * venue's spaces as a mobile-first vertical card stack, colour-coded AVAILABLE /
 * PARTIALLY-AVAILABLE / UNAVAILABLE (from the tree-aware availability engine), and
 * lets the customer tap to pick one space, several (ad-hoc merge), or a whole hall.
 * A live summary totals capacity + indicative price. Purely a browse/select
 * experience — the reservation itself happens in the booking flow. Self-gates on
 * isVenueHierarchyOn() so it renders nothing until the venue enables it; uses the
 * PUBLIC read endpoint (no login needed). Plain Tailwind so it drops onto the
 * public vendor page without the dashboard UI kit.
 */
import * as React from "react";
import { venueSpacesApi, type DateAvailability } from "@/lib/api/venueSpaces";
import { isVenueHierarchyOn } from "@/lib/venue-hierarchy-flag";

const PKR = (n: number | string | null | undefined): string => (n == null || n === "" ? "" : "PKR " + Math.round(Number(n)).toLocaleString("en-PK"));

const CARD: Record<string, string> = {
  AVAILABLE: "border-emerald-500/60 bg-emerald-50",
  PARTIAL: "border-amber-400/60 bg-amber-50",
  UNAVAILABLE: "border-gray-200 bg-gray-50 opacity-60",
};
const DOT: Record<string, string> = { AVAILABLE: "bg-emerald-500", PARTIAL: "bg-amber-400", UNAVAILABLE: "bg-gray-400" };
const LABEL: Record<string, string> = { AVAILABLE: "Available", PARTIAL: "Partly available", UNAVAILABLE: "Booked" };

export function VenueSpaceSelector({ businessId }: { businessId: number }): React.ReactElement | null {
  const enabled = isVenueHierarchyOn();
  const [date, setDate] = React.useState<string>("");
  const [avail, setAvail] = React.useState<DateAvailability | null>(null);
  const [picked, setPicked] = React.useState<number[]>([]);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [loaded, setLoaded] = React.useState<boolean>(false);
  // Only surface for venues that actually built a multi-space tree — otherwise a
  // single-hall venue would show a pointless one-item "Choose your space" section.
  const [multiSpace, setMultiSpace] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    venueSpacesApi
      .publicTree(businessId)
      .then((t) => {
        if (cancelled) return;
        let count = 0;
        const walk = (ns: typeof t.tree) => ns.forEach((n) => { count += 1; if (n.children) walk(n.children); });
        walk(t.tree || []);
        setMultiSpace(count > 1);
      })
      .catch(() => !cancelled && setMultiSpace(false));
    return () => {
      cancelled = true;
    };
  }, [enabled, businessId]);

  React.useEffect(() => {
    if (!enabled || !date) return;
    let cancelled = false;
    setBusy(true);
    venueSpacesApi
      .publicAvailability(businessId, date)
      .then((a) => {
        if (cancelled) return;
        setAvail(a);
        setPicked([]);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setAvail(null);
      })
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [enabled, businessId, date]);

  if (!enabled || multiSpace !== true) return null; // hidden until the venue has >1 space

  const spaces = avail?.spaces || [];
  const byId = new Map(spaces.map((s) => [s.subVenueId, s]));
  const pickedSpaces = picked.map((id) => byId.get(id)).filter(Boolean) as typeof spaces;
  const totalCap = pickedSpaces.reduce((s, n) => s + 0, 0); // capacity not in the public payload; price only
  const totalPrice = pickedSpaces.reduce((s, n) => s + Number(n.basePricePkr || 0), 0);

  return (
    <section className="rounded-2xl border border-gray-200 p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Choose your space</h3>
        <label className="text-sm">
          <span className="mr-2 text-gray-500">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border px-3 py-1.5" />
        </label>
      </div>

      {!date && <p className="text-sm text-gray-500">Pick a date to see which halls, floors and partitions are free.</p>}
      {busy && <p className="text-sm text-gray-500">Checking availability…</p>}

      {loaded && date && (
        <div className="space-y-2">
          {spaces.map((s) => {
            const selectable = s.status === "AVAILABLE";
            const on = picked.includes(s.subVenueId);
            return (
              <button
                key={s.subVenueId}
                type="button"
                disabled={!selectable}
                onClick={() => setPicked((p) => (p.includes(s.subVenueId) ? p.filter((x) => x !== s.subVenueId) : [...p, s.subVenueId]))}
                style={{ marginLeft: `${s.depth * 14}px` }}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${CARD[s.status]} ${on ? "ring-2 ring-emerald-600" : ""} ${selectable ? "cursor-pointer hover:shadow-sm" : "cursor-not-allowed"}`}
              >
                <span className={`h-2.5 w-2.5 flex-none rounded-full ${DOT[s.status]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="block text-xs text-gray-500">
                    {s.kind}
                    {s.basePricePkr ? ` · ${PKR(s.basePricePkr)}` : ""} · {LABEL[s.status]}
                    {s.bookingMode === "WHOLE_DAY" ? " · whole-day" : ""}
                  </span>
                </span>
                {on && <span className="flex-none text-sm font-semibold text-emerald-700">✓</span>}
              </button>
            );
          })}
          {spaces.length === 0 && <p className="text-sm text-gray-500">This venue hasn’t published its spaces yet.</p>}
        </div>
      )}

      {pickedSpaces.length > 0 && (
        <div className="mt-4 rounded-xl bg-gray-900 p-4 text-white">
          <p className="text-sm text-gray-300">You are booking</p>
          <p className="font-medium">{pickedSpaces.map((n) => n.name).join(" + ")}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-gray-300">
            <span>{pickedSpaces.length} space{pickedSpaces.length === 1 ? "" : "s"}</span>
            {totalPrice > 0 && <span className="font-semibold text-white">{PKR(totalPrice)}</span>}
            {date && <span>{date}</span>}
          </div>
        </div>
      )}
    </section>
  );
}

export default VenueSpaceSelector;
