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
                <span className="text-xs text-muted-foreground">cap {n.comfortCapacity ?? n.fireRatedCapacity ?? "—"} · {PKR(n.basePricePkr)} · {n.bookingMode === "WHOLE_DAY" ? "whole-day" : "session"}</span>
                <div className="ml-auto flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setParentId(n.id); setKind(n.depth === 0 ? "FLOOR" : "SECTION"); }}>+ child</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void guard(async () => { await venueSpacesApi.deleteSubVenue(n.id); await reload(); })} disabled={busy}>delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* add node */}
        <div className="flex flex-wrap items-end gap-2 rounded-md border p-3 text-sm">
          <span className="font-medium">{parentId ? `Add under #${parentId}` : "Add hall/space"}</span>
          {parentId && <Button size="sm" variant="ghost" onClick={() => setParentId(null)}>↑ make root</Button>}
          <input type="text" placeholder="name" value={name} onChange={(e) => setName(e.target.value)} className="w-36 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <input type="number" placeholder="capacity" value={cap} onChange={(e) => setCap(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <input type="number" placeholder="price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={wholeDay} onChange={(e) => setWholeDay(e.target.checked)} /> whole-day</label>
          <Button
            size="sm"
            onClick={() => void guard(async () => {
              await venueSpacesApi.createSubVenue(bid, { name, kind, parentSubVenueId: parentId, comfortCapacity: cap ? Number(cap) : undefined, basePricePkr: price ? Number(price) : undefined, bookingMode: wholeDay ? "WHOLE_DAY" : "SESSION" });
              setName(""); setCap(""); setPrice(""); setWholeDay(false);
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
              <input type="text" placeholder="package name" value={mgName} onChange={(e) => setMgName(e.target.value)} className="w-40 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <input type="number" placeholder="combined price" value={mgPrice} onChange={(e) => setMgPrice(e.target.value)} className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
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
