"use client";

/**
 * Venue-OS venue-hierarchy — per-space slot editor (onboarding + portal). Pick a
 * space from the tree, see/define its bookable slots (label + start/end + capacity)
 * or fall back to the business-level slots. This is where a vendor sets "how many
 * slots this hall/partition has".
 * Renders unconditionally. The NEXT_PUBLIC_* gate was removed once the backend
 * feature was confirmed GA in production — a global FeatureFlagOverride row,
 * enabled, owner-authorized 2026-07-11.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueSpacesApi, type SubVenueNode, type SlotTemplate } from "@/lib/api/venueSpaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

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
  const [businessId, setBusinessId] = useBusinessIdField();
  const [nodes, setNodes] = React.useState<SubVenueNode[]>([]);
  const [spaceId, setSpaceId] = React.useState<number | null>(null);
  const [scope, setScope] = React.useState<string>("");
  const [slots, setSlots] = React.useState<SlotTemplate[]>([]);
  const [label, setLabel] = React.useState<string>("");
  const [start, setStart] = React.useState<string>("");
  const [end, setEnd] = React.useState<string>("");
  const [cap, setCap] = React.useState<string>("1");
  const [guestCap, setGuestCap] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const bid = Number(businessId);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      setErr(readErr(e, "Couldn't load hierarchical spaces."));
    } finally {
      setBusy(false);
    }
  }

  async function loadSlots(id: number): Promise<void> {
    setSpaceId(id);
    // includeInactive: this is the editor, so hidden slots must stay visible
    // here — otherwise switching one off would remove the control that turns
    // it back on.
    const r = await venueSpacesApi.listSlots(bid, id, true);
    setScope(r.scope);
    setSlots(r.slots);
  }

  // Load the space list on arrival — otherwise this panel shows a lone "Load
  // spaces" button with nothing to pick from.
  React.useEffect(() => {
    if (!businessId) return;
    void guard(async () => {
      setNodes(flatten((await venueSpacesApi.getTree(Number(businessId))).tree));
      setSpaceId(null);
      setSlots([]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking slots per space</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-end gap-2">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
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
            {/* `isActive` has been on the model since BK-008 and no screen ever
                exposed it, so a vendor's only way to stop selling a slot was to
                delete it — which used to be a hard destroy on a row their sold
                bookings point at. Off keeps the slot and its history and takes
                it out of every customer picker: availability, the bulk feed and
                listTemplates all filter on isActive. */}
            {slots.map((s) => (
              <div key={s.id} className={cn("flex items-center gap-2 border-t pt-1 text-xs", !s.isActive && "opacity-60")}>
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground">
                  {String(s.startTime).slice(0, 5)}–{String(s.endTime).slice(0, 5)}
                  {" · "}{s.capacity} booking{s.capacity === 1 ? "" : "s"} at once
                  {s.unitGuestCapacity ? ` · ${s.unitGuestCapacity} guests each` : ""}
                </span>
                {!s.isActive && (
                  <Badge variant="secondary" className="shrink-0">hidden</Badge>
                )}
                {scope === "SPACE" && (
                  <div className="ml-auto flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap">
                      <Switch
                        checked={s.isActive}
                        disabled={busy}
                        aria-label={`${s.isActive ? "Hide" : "Show"} ${s.label} to customers`}
                        onCheckedChange={(next) => void guard(async () => {
                          await venueSpacesApi.updateSlot(s.id, { isActive: next });
                          await loadSlots(spaceId);
                        })}
                      />
                      <span className="text-muted-foreground">{s.isActive ? "Live" : "Hidden"}</span>
                    </label>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void guard(async () => { await venueSpacesApi.deleteSlot(s.id); await loadSlots(spaceId); })} disabled={busy}>remove</Button>
                  </div>
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-2 border-t pt-2">
              <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">Label (e.g. Morning)<input type="text" placeholder="label (e.g. Morning)" value={label} onChange={(e) => setLabel(e.target.value)} className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              {/**
                * This was a bare number box labelled "Cap".
                *
                * `capacity` counts CONCURRENT BOOKINGS — the model says each
                * booking consumes 1 of it — and `unitGuestCapacity` is where a
                * headcount belongs. A three-letter label asked no question, so
                * a vendor typed their guest capacity into it and produced a
                * live slot with capacity 150: a hall advertising a hundred and
                * fifty simultaneous weddings, which the public booking page
                * rendered as "150 of 150 left".
                *
                * The field now asks the question it means, defaults to 1, and
                * gives the guest number its own home so there is somewhere
                * right to put it.
                */}
              <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">
                Bookings at once
                <input
                  min={1}
                  max={50}
                  type="number"
                  value={cap}
                  onChange={(e) => setCap(e.target.value)}
                  title="How many separate bookings can run in this slot at the same time. For one hall this is 1."
                  className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">
                Guests per booking
                <input
                  min={1}
                  type="number"
                  placeholder="optional"
                  value={guestCap}
                  onChange={(e) => setGuestCap(e.target.value)}
                  title="Optional. The headcount one booking can bring. Leave blank if you do not cap guests per booking."
                  className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <Button size="sm" onClick={() => void guard(async () => { await venueSpacesApi.createSlot(bid, { subVenueId: spaceId, label, startTime: start, endTime: end, capacity: Number(cap) || 1, ...(guestCap.trim() ? { unitGuestCapacity: Number(guestCap) } : {}) }); setLabel(""); setStart(""); setEnd(""); setCap("1"); setGuestCap(""); await loadSlots(spaceId); })} disabled={!label || !start || !end || busy}>
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
