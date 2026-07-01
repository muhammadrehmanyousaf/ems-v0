"use client";

/**
 * Venue-OS venue-hierarchy — per-space slot editor (onboarding + portal). Pick a
 * space from the tree, see/define its bookable slots (label + start/end + capacity)
 * or fall back to the business-level slots. This is where a vendor sets "how many
 * slots this hall/partition has". Gated on isVenueHierarchyOn().
 */
import * as React from "react";
import { venueSpacesApi, type SubVenueNode, type SlotTemplate } from "@/lib/api/venueSpaces";
import { isVenueHierarchyOn } from "@/lib/venue-hierarchy-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export function SpaceSlotsEditor(): React.ReactElement | null {
  const enabled = isVenueHierarchyOn();
  const [businessId, setBusinessId] = React.useState<string>("");
  const [nodes, setNodes] = React.useState<SubVenueNode[]>([]);
  const [spaceId, setSpaceId] = React.useState<number | null>(null);
  const [scope, setScope] = React.useState<string>("");
  const [slots, setSlots] = React.useState<SlotTemplate[]>([]);
  const [label, setLabel] = React.useState<string>("");
  const [start, setStart] = React.useState<string>("");
  const [end, setEnd] = React.useState<string>("");
  const [cap, setCap] = React.useState<string>("1");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const bid = Number(businessId);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Hierarchical spaces are not enabled for your account yet."));
    } finally {
      setBusy(false);
    }
  }

  async function loadSlots(id: number): Promise<void> {
    setSpaceId(id);
    const r = await venueSpacesApi.listSlots(bid, id);
    setScope(r.scope);
    setSlots(r.slots);
  }

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking slots per space</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-end gap-2">
          <label>
            Business #
            <input type="number" value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="ml-2 w-24 rounded border px-2 py-1" />
          </label>
          <Button size="sm" variant="outline" onClick={() => void guard(async () => { setNodes(flatten((await venueSpacesApi.getTree(bid)).tree)); setSpaceId(null); setSlots([]); })} disabled={!businessId || busy}>
            Load spaces
          </Button>
        </div>

        {nodes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {nodes.map((n) => (
              <Button key={n.id} size="sm" variant={spaceId === n.id ? "default" : "outline"} onClick={() => void guard(async () => loadSlots(n.id))} disabled={busy}>
                {n.name}
              </Button>
            ))}
          </div>
        )}

        {spaceId != null && (
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Slots for this space</span>
              <Badge variant={scope === "SPACE" ? "default" : "secondary"}>{scope === "SPACE" ? "own slots" : "using business slots"}</Badge>
            </div>
            {slots.map((s) => (
              <div key={s.id} className="flex items-center gap-2 border-t pt-1 text-xs">
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground">{String(s.startTime).slice(0, 5)}–{String(s.endTime).slice(0, 5)} · cap {s.capacity}</span>
                {scope === "SPACE" && (
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => void guard(async () => { await venueSpacesApi.deleteSlot(s.id); await loadSlots(spaceId); })} disabled={busy}>remove</Button>
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-2 border-t pt-2">
              <input type="text" placeholder="label (e.g. Morning)" value={label} onChange={(e) => setLabel(e.target.value)} className="w-32 rounded border px-2 py-1" />
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border px-2 py-1" />
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border px-2 py-1" />
              <input type="number" placeholder="cap" value={cap} onChange={(e) => setCap(e.target.value)} className="w-16 rounded border px-2 py-1" />
              <Button size="sm" onClick={() => void guard(async () => { await venueSpacesApi.createSlot(bid, { subVenueId: spaceId, label, startTime: start, endTime: end, capacity: Number(cap) || 1 }); setLabel(""); setStart(""); setEnd(""); await loadSlots(spaceId); })} disabled={!label || !start || !end || busy}>
                Add slot
              </Button>
            </div>
          </div>
        )}

        {err && <p className="text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default SpaceSlotsEditor;
