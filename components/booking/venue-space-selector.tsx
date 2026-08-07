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

const PKR = (n: number | string | null | undefined): string => (n == null || n === "" ? "" : "PKR " + Math.round(Number(n)).toLocaleString("en-PK"));

const CARD: Record<string, string> = {
  AVAILABLE: "border-emerald-500/60 bg-emerald-50",
  PARTIAL: "border-amber-400/60 bg-amber-50",
  UNAVAILABLE: "border-gray-200 bg-gray-50 opacity-60",
};
const DOT: Record<string, string> = { AVAILABLE: "bg-emerald-500", PARTIAL: "bg-amber-400", UNAVAILABLE: "bg-gray-400" };
// WWL-569 — "Partly available" now also covers "the venue has an event that day
// that isn't pinned to one space", so the wording has to be a prompt to check
// rather than a soft yes.
const LABEL: Record<string, string> = { AVAILABLE: "Available", PARTIAL: "Check with venue", UNAVAILABLE: "Booked" };

export function VenueSpaceSelector({ businessId, hasMultiSpace }: { businessId: number; hasMultiSpace?: boolean }): React.ReactElement | null {
  const [date, setDate] = React.useState<string>("");
  const [avail, setAvail] = React.useState<DateAvailability | null>(null);
  const [picked, setPicked] = React.useState<number[]>([]);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [failed, setFailed] = React.useState<boolean>(false);
  // Only surface for venues that actually built a multi-space tree — otherwise a
  // single-hall venue would show a pointless one-item "Choose your space" section.
  // The parent (server component) normally passes `hasMultiSpace` (decided once,
  // ISR-cached) so we make NO per-visitor call; the client fetch is only a fallback
  // for standalone usage where the prop wasn't provided.
  const [multiSpace, setMultiSpace] = React.useState<boolean | null>(hasMultiSpace ?? null);

  React.useEffect(() => {
    if (hasMultiSpace !== undefined) return; // server already decided → skip the call
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
  }, [businessId, hasMultiSpace]);

  React.useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setBusy(true);
    setFailed(false);
    venueSpacesApi
      .publicAvailability(businessId, date)
      .then((a) => {
        if (cancelled) return;
        setAvail(a);
        setPicked([]);
        setLoaded(true);
      })
      .catch(() => {
        // WWL-019 family — a failed check used to render as nothing at all,
        // which on this screen reads as "no answer" rather than "we couldn't
        // check". Never let a failure look like a clean result.
        if (!cancelled) {
          setAvail(null);
          setFailed(true);
        }
      })
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [businessId, date]);

  if (multiSpace !== true) return null; // hidden until the venue has >1 space

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
      {failed && !busy && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          We couldn’t check this date just now. Please try again, or message the venue to confirm.
        </p>
      )}

      {/* WWL-569 — the venue holds committed events on this date that aren't
          tied to one space. Saying nothing here is how a couple ended up
          enquiring for a hall with a wedding already in it. */}
      {loaded && date && (avail?.unmappedBookings ?? 0) > 0 && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This venue already has {avail?.unmappedBookings === 1 ? "an event" : `${avail?.unmappedBookings} events`} booked on{" "}
          {date}. Some spaces may not be free — please confirm with the venue before you plan around this date.
        </p>
      )}

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
