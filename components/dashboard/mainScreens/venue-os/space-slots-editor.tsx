"use client";

/**
 * Venue-OS — booking slot editor.
 *
 * ── What was wrong with the previous version ─────────────────────────────
 *
 * It could only ever write PER-SPACE slots: every create hardcoded
 * `subVenueId: spaceId`. So the venue-wide slots — the ones every space
 * inherits when it has none of its own, and the ones this screen labels
 * "using business slots" — could not be created, edited or deleted anywhere in
 * the portal. A vendor could see that Main Hall was inheriting "Lunch event
 * 12:00–16:00" and had no way to touch it. Those rows only ever arrived by
 * seed or import.
 *
 * Existing slots could not be edited at all either — add, remove and the live
 * toggle were the whole vocabulary. Fixing a typo in a label, or an end time,
 * meant deleting the slot and losing its id, which is what bookings reference.
 *
 * ── The model this screen now makes visible ──────────────────────────────
 *
 *   Whole venue   subVenueId: null   the shared set
 *   A space       subVenueId: <id>   its own set, which REPLACES the shared
 *                                    one for that space (not merges)
 *
 * That inheritance is the thing vendors get wrong, so the header states which
 * set is in effect rather than leaving it to be inferred.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueSpacesApi, type SubVenueNode, type SlotTemplate } from "@/lib/api/venueSpaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/dashboard/primitives/empty-state";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

/**
 * The presets, and the closing time they all respect.
 *
 * Kept identical to CANONICAL_SLOTS in the backend's venueSlotService, which is
 * also what assertSlotShape validates against — a preset the vendor is offered
 * but cannot save would be the same class of bug as the 18:00–23:00 "Evening"
 * this platform shipped as its own worked example and vendors copied.
 */
const CLOSING_TIME = "22:00";
const PRESETS: { label: string; startTime: string; endTime: string }[] = [
  { label: "Whole day", startTime: "10:00", endTime: "22:00" },
  { label: "Day", startTime: "09:00", endTime: "12:00" },
  { label: "Midday", startTime: "12:00", endTime: "16:00" },
  { label: "Evening", startTime: "18:00", endTime: "22:00" },
];

/** Venue-wide is a real scope, not the absence of one. */
const WHOLE_VENUE = "venue" as const;
type Scope = typeof WHOLE_VENUE | number;

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
const hhmm = (t: string | null | undefined): string => String(t || "").slice(0, 5);

type Draft = { label: string; startTime: string; endTime: string; capacity: string; unitGuestCapacity: string };
const emptyDraft: Draft = { label: "", startTime: "", endTime: "", capacity: "1", unitGuestCapacity: "" };

export function SpaceSlotsEditor(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [nodes, setNodes] = React.useState<SubVenueNode[]>([]);
  const [scope, setScope] = React.useState<Scope>(WHOLE_VENUE);
  const [slots, setSlots] = React.useState<SlotTemplate[]>([]);
  const [inherited, setInherited] = React.useState<boolean>(false);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editDraft, setEditDraft] = React.useState<Draft>(emptyDraft);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const bid = Number(businessId);

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: unknown) {
      // The backend refuses illegal slots with a sentence a vendor can act on
      // ("Wedding halls have to be closed by 10 PM…"). Surface it verbatim
      // rather than replacing it with a generic failure.
      setErr(readErr(e, "Couldn't save that slot."));
    } finally {
      setBusy(false);
    }
  }

  const load = React.useCallback(
    async (next: Scope): Promise<void> => {
      setScope(next);
      setEditingId(null);
      // includeInactive: this is the editor, so a hidden slot must stay visible
      // here — otherwise switching one off removes the control that turns it
      // back on.
      const r = await venueSpacesApi.listSlots(bid, next === WHOLE_VENUE ? undefined : next, true);
      const all = r.slots || [];
      if (next === WHOLE_VENUE) {
        // Venue-wide means exactly the shared rows. Filtering here rather than
        // trusting the endpoint's default, which returns every space's private
        // slots merged in — the same leak that made booking capacity wrong.
        setSlots(all.filter((s) => s.subVenueId == null));
        setInherited(false);
      } else {
        const own = all.filter((s) => Number(s.subVenueId) === Number(next));
        setInherited(own.length === 0);
        setSlots(own.length ? own : all.filter((s) => s.subVenueId == null));
      }
    },
    [bid],
  );

  React.useEffect(() => {
    if (!businessId) return;
    void guard(async () => {
      setNodes(flatten((await venueSpacesApi.getTree(Number(businessId))).tree));
      await load(WHOLE_VENUE);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  /** Every write targets the scope on screen — that is the whole fix. */
  const scopePayload = () => (scope === WHOLE_VENUE ? { subVenueId: null } : { subVenueId: scope });

  const addSlot = (d: Draft) =>
    guard(async () => {
      await venueSpacesApi.createSlot(bid, {
        ...scopePayload(),
        label: d.label.trim(),
        startTime: d.startTime,
        endTime: d.endTime,
        capacity: Number(d.capacity) || 1,
        ...(d.unitGuestCapacity.trim() ? { unitGuestCapacity: Number(d.unitGuestCapacity) } : {}),
      } as Partial<SlotTemplate>);
      setDraft(emptyDraft);
      await load(scope);
    });

  const scopeName = scope === WHOLE_VENUE ? "the whole venue" : nodes.find((n) => n.id === scope)?.name || "this space";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking slots</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-end gap-2">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void guard(async () => {
                setNodes(flatten((await venueSpacesApi.getTree(bid)).tree));
                await load(scope);
              })
            }
            disabled={!businessId || busy}
          >
            Reload
          </Button>
        </div>

        {/* Scope picker. "Whole venue" leads because it is the set everything
            else falls back to, and it was previously unreachable entirely. */}
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={scope === WHOLE_VENUE ? "default" : "outline"}
            onClick={() => void guard(() => load(WHOLE_VENUE))}
            disabled={busy}
          >
            Whole venue
          </Button>
          {nodes.map((n) => (
            <Button
              key={n.id}
              size="sm"
              variant={scope === n.id ? "default" : "outline"}
              onClick={() => void guard(() => load(n.id))}
              disabled={busy}
            >
              {n.name}
            </Button>
          ))}
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {scope === WHOLE_VENUE ? "Slots for the whole venue" : `Slots for ${scopeName}`}
            </span>
            {scope !== WHOLE_VENUE && (
              <Badge variant={inherited ? "outline" : "default"} className="text-[11px]">
                {inherited ? "inheriting the venue's slots" : "its own slots"}
              </Badge>
            )}
          </div>

          {scope !== WHOLE_VENUE && inherited && (
            <p className="text-xs text-muted-foreground">
              This space has no slots of its own, so it uses the venue's. Adding one here gives it its
              own set, which <strong>replaces</strong> the venue's for this space rather than adding to it.
            </p>
          )}

          {slots.length === 0 ? (
            <EmptyState
              size="inline"
              title="No slots yet."
              description={`Add one below, or start from a preset. Nothing can be booked for ${scopeName} until at least one slot exists.`}
            />
          ) : (
            <div className="space-y-1">
              {slots.map((s) =>
                editingId === s.id ? (
                  <div key={s.id} className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-2">
                    <Field label="Label">
                      <input
                        className="w-32 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={editDraft.label}
                        onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                      />
                    </Field>
                    <Field label="Start">
                      <input
                        type="time"
                        className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={editDraft.startTime}
                        onChange={(e) => setEditDraft({ ...editDraft, startTime: e.target.value })}
                      />
                    </Field>
                    <Field label={`End (by ${CLOSING_TIME})`}>
                      <input
                        type="time"
                        max={CLOSING_TIME}
                        className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={editDraft.endTime}
                        onChange={(e) => setEditDraft({ ...editDraft, endTime: e.target.value })}
                      />
                    </Field>
                    <Field label="Bookings at once">
                      <input
                        type="number"
                        min={1}
                        className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={editDraft.capacity}
                        onChange={(e) => setEditDraft({ ...editDraft, capacity: e.target.value })}
                      />
                    </Field>
                    <Field label="Guests per booking">
                      <input
                        type="number"
                        min={1}
                        placeholder="optional"
                        className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={editDraft.unitGuestCapacity}
                        onChange={(e) => setEditDraft({ ...editDraft, unitGuestCapacity: e.target.value })}
                      />
                    </Field>
                    <Button
                      size="sm"
                      disabled={busy || !editDraft.label || !editDraft.startTime || !editDraft.endTime}
                      onClick={() =>
                        void guard(async () => {
                          await venueSpacesApi.updateSlot(s.id, {
                            label: editDraft.label.trim(),
                            startTime: editDraft.startTime,
                            endTime: editDraft.endTime,
                            capacity: Number(editDraft.capacity) || 1,
                            unitGuestCapacity: editDraft.unitGuestCapacity.trim()
                              ? Number(editDraft.unitGuestCapacity)
                              : null,
                          } as Partial<SlotTemplate>);
                          setEditingId(null);
                          await load(scope);
                        })
                      }
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={busy}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div key={s.id} className="flex flex-wrap items-center gap-2 border-t py-1.5 first:border-t-0">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">
                      {hhmm(s.startTime)}–{hhmm(s.endTime)} · {s.capacity} booking{s.capacity === 1 ? "" : "s"} at once
                      {s.unitGuestCapacity ? ` · ${s.unitGuestCapacity} guests each` : ""}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <Switch
                        checked={s.isActive !== false}
                        disabled={busy || inherited}
                        onCheckedChange={(v) =>
                          void guard(async () => {
                            await venueSpacesApi.updateSlot(s.id, { isActive: v } as Partial<SlotTemplate>);
                            await load(scope);
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">{s.isActive !== false ? "Live" : "Hidden"}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy || inherited}
                        onClick={() => {
                          setEditingId(s.id);
                          setEditDraft({
                            label: s.label,
                            startTime: hhmm(s.startTime),
                            endTime: hhmm(s.endTime),
                            capacity: String(s.capacity ?? 1),
                            unitGuestCapacity: s.unitGuestCapacity ? String(s.unitGuestCapacity) : "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={busy || inherited}
                        onClick={() =>
                          void guard(async () => {
                            await venueSpacesApi.deleteSlot(s.id);
                            await load(scope);
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          {/* Presets. The four a Pakistani venue actually sells, all ending by
              the 10 PM closure so every one of them is bookable. */}
          <div className="flex flex-wrap items-center gap-1.5 border-t pt-2">
            <span className="text-xs text-muted-foreground">Start from:</span>
            {PRESETS.map((p) => {
              const already = slots.some((s) => hhmm(s.startTime) === p.startTime && hhmm(s.endTime) === p.endTime);
              return (
                <Button
                  key={p.label}
                  size="sm"
                  variant="outline"
                  disabled={busy || already}
                  title={already ? "This slot already exists here" : `${p.startTime}–${p.endTime}`}
                  onClick={() => void addSlot({ ...emptyDraft, ...p })}
                >
                  {p.label}
                  <span className="ml-1.5 text-[11px] text-muted-foreground">
                    {p.startTime}–{p.endTime}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Manual add */}
          <div className="flex flex-wrap items-end gap-2 border-t pt-2">
            <Field label="Label (e.g. Mehndi)">
              <input
                className="w-36 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </Field>
            <Field label="Start">
              <input
                type="time"
                className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draft.startTime}
                onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
              />
            </Field>
            <Field label={`End (by ${CLOSING_TIME})`}>
              <input
                type="time"
                max={CLOSING_TIME}
                className="rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draft.endTime}
                onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
              />
            </Field>
            <Field label="Bookings at once">
              <input
                type="number"
                min={1}
                className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draft.capacity}
                onChange={(e) => setDraft({ ...draft, capacity: e.target.value })}
              />
            </Field>
            <Field label="Guests per booking">
              <input
                type="number"
                min={1}
                placeholder="optional"
                className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={draft.unitGuestCapacity}
                onChange={(e) => setDraft({ ...draft, unitGuestCapacity: e.target.value })}
              />
            </Field>
            <Button
              size="sm"
              onClick={() => void addSlot(draft)}
              disabled={busy || !draft.label || !draft.startTime || !draft.endTime}
            >
              Add slot
            </Button>
          </div>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

/** Labelled control. The old form relied on placeholders, which vanish on type. */
function Field({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <label className="flex flex-col gap-0.5 text-[11px] font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

export default SpaceSlotsEditor;
