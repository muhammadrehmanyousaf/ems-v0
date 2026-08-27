"use client";

/**
 * Venue-OS venue-hierarchy — vendor space tree-manager (Step-12A "Space management"
 * + the registration space-builder share this). Build a Hall → Floor → Partition
 * tree (add child under any node, edit, delete-with-guard), see live capacity
 * warnings, and define sellable merge packages.
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueSpacesApi, type SubVenueNode, type MergeGroup, type CapacityWarning } from "@/lib/api/venueSpaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

const KINDS = ["HALL", "FLOOR", "SECTION", "LAWN", "MARQUEE", "BASEMENT", "ROOFTOP", "OTHER"];

/**
 * 10.13 — mirrors `SubVenue.genderMode`, in the venue's own words rather than
 * the column's. SEGREGABLE is the normal Pakistani answer — a hall with a
 * partition — and a venue that picks it can host any of the others.
 */
const GENDER_MODES = [
  { value: "MIXED", label: "everyone together" },
  { value: "SEGREGABLE", label: "can be partitioned" },
  { value: "ZENANA", label: "ladies only (zenana)" },
  { value: "MARDANA", label: "men only (mardana)" },
];

/** 10.16 — the kinds the weather can reach. Mirrors the server's OPEN_AIR_KINDS. */
const OPEN_AIR = new Set(["LAWN", "ROOFTOP"]);
const PKR = (n: number | string | null | undefined): string => (n == null || n === "" ? "—" : "Rs " + Math.round(Number(n)).toLocaleString("en-PK"));
function readErr(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function flatten(nodes: SubVenueNode[] | undefined, acc: SubVenueNode[] = []): SubVenueNode[] {
  for (const n of nodes || []) {
    acc.push(n);
    flatten(n.children, acc);
  }
  return acc;
}

export function VenueSpacesManagerView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [tree, setTree] = React.useState<SubVenueNode[]>([]);
  const [warnings, setWarnings] = React.useState<CapacityWarning[]>([]);
  const [groups, setGroups] = React.useState<MergeGroup[]>([]);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  // add-node form
  const [parentId, setParentId] = React.useState<number | null>(null);
  const [name, setName] = React.useState<string>("");
  const [kind, setKind] = React.useState<string>("HALL");
  const [cap, setCap] = React.useState<string>("");
  /**
   * WW-SPACECAP — the capacity the booking engine actually enforces.
   *
   * This form had ONE capacity box, labelled "Capacity", and it wrote
   * `comfortCapacity`. But `bookingCreateService` enforces `fireRatedCapacity`
   * and explicitly skips a space that has none:
   *
   *     if (!space?.fireRatedCapacity) continue;
   *
   * comfortCapacity is advisory by design — the booking form shows it, and
   * refusing a booking on a comfort preference would be wrong. The problem was
   * that NO screen could set the hard limit, so the guard was unreachable:
   * 3,324 spaces on production, 53 with a comfort figure, and only 11 with the
   * fire-rated one the engine reads.
   *
   * A vendor therefore typed "Capacity: 200", watched it save, saw it echoed
   * back as "cap 200" in the tree, and the hall stayed bookable for 2,000. The
   * comment in bookingCreateService describes exactly this failure — a
   * 300-person side hall sold to 1,200 guests, "and the first anyone found out
   * was on the day".
   */
  const [maxCap, setMaxCap] = React.useState<string>("");
  const [price, setPrice] = React.useState<string>("");
  const [wholeDay, setWholeDay] = React.useState<boolean>(false);

  // merge-group form
  const [mgName, setMgName] = React.useState<string>("");
  const [mgPrice, setMgPrice] = React.useState<string>("");
  const [mgPicks, setMgPicks] = React.useState<number[]>([]);

  const bid = Number(businessId);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Hierarchical spaces are not enabled for this account yet."));
    } finally {
      setBusy(false);
    }
  }

  async function reload(): Promise<void> {
    const [t, w, g] = await Promise.all([venueSpacesApi.getTree(bid), venueSpacesApi.capacityWarnings(bid), venueSpacesApi.listMergeGroups(bid)]);
    setTree(t.tree);
    setWarnings(w.warnings);
    setGroups(g.groups);
  }

  // Load on arrival. Now that the venue resolves without being typed, waiting
  // behind a "Load spaces" click just meant the Spaces tab still opened as a
  // heading and four empty boxes.
  React.useEffect(() => {
    if (!businessId) return;
    void guard(reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const flat = flatten(tree);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Venue spaces (halls · floors · partitions)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <Button size="sm" variant="outline" onClick={() => void guard(reload)} disabled={!businessId || busy}>
            Load spaces
          </Button>
        </div>

        {warnings.length > 0 && (
          <div className="space-y-1 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs">
            {warnings.map((w) => (
              <p key={w.subVenueId}>
                ⚠ <span className="font-medium">{w.name}</span>: children total {w.childrenCapacitySum} &gt; capacity {w.parentCapacity} (over by {w.overBy})
              </p>
            ))}
          </div>
        )}

        {/* tree */}
        {flat.length > 0 && (
          <div className="space-y-1 rounded-md border p-2 text-sm">
            {flat.map((n) => (
              <div key={n.id} className="flex flex-wrap items-center gap-2 border-b py-1 last:border-0" style={{ paddingLeft: `${n.depth * 16}px` }}>
                <Badge variant="secondary">{n.kind}</Badge>
                <span className="font-medium">{n.name}</span>
                {/* The two capacities are shown separately because they mean
                    different things and only one of them refuses a booking.
                    This used to print `comfortCapacity ?? fireRatedCapacity`
                    under a single "cap" label, which told a vendor their
                    comfort figure was the limit — it is not, and a space with
                    no enforced max takes any guest count at all. Say so. */}
                <span className="text-xs text-muted-foreground">
                  {n.comfortCapacity != null ? `${n.comfortCapacity} seats` : "no seat count"}
                  {" · "}
                  {n.fireRatedCapacity != null
                    ? `max ${n.fireRatedCapacity}`
                    : <span className="text-amber-600">no max — any guest count accepted</span>}
                  {" · "}{PKR(n.basePricePkr)} · {n.bookingMode === "WHOLE_DAY" ? "whole-day" : "session"}
                </span>

                {/* 10.13 — what this space can host.

                   The column has existed on every space since the hierarchy
                   work and no screen ever showed it, so every hall on the
                   platform sat at its MIXED default. A customer asking for a
                   zenana function was then told "mixed" by a venue that may
                   well have a partition. This is the venue's own answer, and
                   it is the only place it can come from. */}
                <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  hosts
                  <select
                    value={n.genderMode || "MIXED"}
                    onChange={(e) => void guard(async () => { await venueSpacesApi.updateSubVenue(n.id, { genderMode: e.target.value }); await reload(); })}
                    disabled={busy}
                    aria-label={`What ${n.name} can host`}
                    className="rounded-md border border-input bg-background px-1.5 py-0.5 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {GENDER_MODES.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </label>

                {/* 10.16 — the wet-weather plan, for open-air spaces only.

                   `backupSubVenueId` has been on the row all along with no
                   route that could set it, so the customer-facing rule could
                   only ever reach its "no wet-weather plan is recorded"
                   branch — including at venues that have had a plan for
                   twenty years. Only indoor spaces are offered: another lawn
                   is not a wet-weather plan, and the server refuses one. */}
                {OPEN_AIR.has(String(n.kind || "").toUpperCase()) && (
                  <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    if it rains →
                    <select
                      value={n.backupSubVenueId ?? ""}
                      onChange={(e) => void guard(async () => { await venueSpacesApi.updateSubVenue(n.id, { backupSubVenueId: e.target.value ? Number(e.target.value) : null }); await reload(); })}
                      disabled={busy}
                      aria-label={`Wet-weather backup for ${n.name}`}
                      className="rounded-md border border-input bg-background px-1.5 py-0.5 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">no plan recorded</option>
                      {flat
                        .filter((c) => c.id !== n.id && !OPEN_AIR.has(String(c.kind || "").toUpperCase()))
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </label>
                )}

                <div className="ml-auto flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setParentId(n.id); setKind(n.depth === 0 ? "FLOOR" : "SECTION"); }}>+ child</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void guard(async () => { await venueSpacesApi.deleteSubVenue(n.id); await reload(); })} disabled={busy}>delete</Button>
                </div>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-foreground">
              What a space can host, and where an open-air one moves if the weather turns, are both
              shown to customers before they book.
            </p>
          </div>
        )}

        {/* add node */}
        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">{parentId ? `Add under #${parentId}` : "Add hall/space"}</span>
          {parentId && <Button size="sm" variant="ghost" onClick={() => setParentId(null)}>↑ make root</Button>}
          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Name<input type="text" placeholder="name" value={name} onChange={(e) => setName(e.target.value)} className="w-36 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <label title="Seated comfort figure. Shown to couples; does not refuse a booking." className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Comfort<input min={0} type="number" placeholder="seats" value={cap} onChange={(e) => setCap(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <label title="Hard limit. A booking above this number is refused. Leave blank for no limit." className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Max (enforced)<input min={0} type="number" placeholder="max" value={maxCap} onChange={(e) => setMaxCap(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Price<input min={0} type="number" placeholder="price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={wholeDay} onChange={(e) => setWholeDay(e.target.checked)} /> whole-day</label>
          <Button
            size="sm"
            onClick={() => void guard(async () => {
              await venueSpacesApi.createSubVenue(bid, { name, kind, parentSubVenueId: parentId, comfortCapacity: cap ? Number(cap) : undefined, fireRatedCapacity: maxCap ? Number(maxCap) : undefined, basePricePkr: price ? Number(price) : undefined, bookingMode: wholeDay ? "WHOLE_DAY" : "SESSION" });
              setName(""); setCap(""); setMaxCap(""); setPrice(""); setWholeDay(false);
              await reload();
            })}
            disabled={!businessId || !name || busy}
          >
            Add space
          </Button>
        </div>

        {/* merge groups */}
        <div className="space-y-2 rounded-md border p-3 text-sm">
          <span className="font-medium">Merge packages (sell combined spaces as one unit)</span>
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-2 border-t pt-1 text-xs">
              <Badge>{g.name}</Badge>
              <span className="text-muted-foreground">{(g.members || []).length} spaces · {PKR(g.combinedPricePkr)}</span>
              <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => void guard(async () => { await venueSpacesApi.deleteMergeGroup(g.id); await reload(); })} disabled={busy}>remove</Button>
            </div>
          ))}
          {flat.length >= 2 && (
            <div className="flex flex-wrap items-end gap-2 border-t pt-2">
              <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Package name<input type="text" placeholder="package name" value={mgName} onChange={(e) => setMgName(e.target.value)} className="w-40 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
              <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Combined price<input min={0} type="number" placeholder="combined price" value={mgPrice} onChange={(e) => setMgPrice(e.target.value)} className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
              <div className="flex flex-wrap gap-1">
                {flat.map((n) => (
                  <Button key={n.id} size="sm" variant={mgPicks.includes(n.id) ? "default" : "outline"} onClick={() => setMgPicks((p) => (p.includes(n.id) ? p.filter((x) => x !== n.id) : [...p, n.id]))}>
                    {n.name}
                  </Button>
                ))}
              </div>
              <Button size="sm" onClick={() => void guard(async () => { await venueSpacesApi.createMergeGroup(bid, { name: mgName, subVenueIds: mgPicks, combinedPricePkr: mgPrice ? Number(mgPrice) : undefined }); setMgName(""); setMgPrice(""); setMgPicks([]); await reload(); })} disabled={!mgName || mgPicks.length < 2 || busy}>
                Create package
              </Button>
            </div>
          )}
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default VenueSpacesManagerView;
