"use client";

/**
 * Venue-OS — the vendor's space manager.
 *
 * A "space" is any part of a venue that can be booked on its own: a hall, a
 * lawn, a basement, a partitioned section of a bigger hall. Spaces are the
 * spine of the whole booking system — slots hang off them, packages and menus
 * are sold in them, the availability grid is drawn per space, and the booking
 * engine refuses a guest count against one.
 *
 * ── Why this screen was rewritten ────────────────────────────────────────
 *
 * The previous version put every space on ONE wrapping flex row: a kind badge,
 * the name, a run of grey 11px text carrying two different capacities and a
 * price, two unlabelled dropdowns, and two buttons. At laptop width it wrapped
 * into a paragraph. Vendors could not read it, and the specific things they
 * could not do were not cosmetic:
 *
 *   • No edit. Add and delete were the entire vocabulary, so fixing a typo in
 *     a hall's name — or its price — meant deleting the hall and adding it
 *     back. Which leads directly to:
 *
 *   • Delete was one click, with no confirmation, and it CASCADES. The server
 *     soft-deletes the node's whole subtree (`subtreeIds` in
 *     venueHierarchyService), so "delete" on a hall silently took every floor
 *     and partition under it. The screen never said so.
 *
 *   • `SubVenue.active` exists precisely so a vendor can retire a hall —
 *     renovation, no longer let — without destroying its booking history, and
 *     the public tree filters inactive spaces out. No control on this screen
 *     could set it. So the safe action was unreachable and the destructive one
 *     was a single unguarded click.
 *
 *   • Raw database values were shown to vendors: kinds as `MARQUEE`, and the
 *     add form headed "Add under #4137" — a primary key, as a heading.
 *
 *   • The two capacities differ in the only way that matters — one refuses a
 *     booking, one does not — and that was explained solely in a `title=`
 *     tooltip. Nobody hovers a tooltip. Of 3,324 spaces on production, 11 have
 *     the enforced maximum set; the other 3,313 accept any guest count at all.
 *
 *   • Nothing connected a space to what is sold in it, even though packages
 *     and menus now both carry `subVenueId`. A vendor could not see that a
 *     hall had nothing to sell until a customer met an empty booking step.
 *
 *   • "Merge packages" collided head-on with the pricing Packages the vendor
 *     configures in Business Settings. It is not those. It means: sell two
 *     areas together as one bookable unit.
 */
import * as React from "react";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueSpacesApi, type SubVenueNode, type MergeGroup, type CapacityWarning } from "@/lib/api/venueSpaces";
import { PackagesAPI, MenusAPI, type ApiPackage, type ApiMenu } from "@/lib/api/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/primitives/empty-state";
import { BusinessScopeField } from "@/components/dashboard/shared/business-scope-field";

/**
 * The kinds, in the vendor's words rather than the column's.
 *
 * The values are `SubVenue.kind` exactly — the server stores what it is given
 * and `OPEN_AIR_KINDS` matches on it — so only the label may change here.
 */
const KINDS: { value: string; label: string }[] = [
  { value: "HALL", label: "Hall" },
  { value: "LAWN", label: "Lawn / garden" },
  { value: "MARQUEE", label: "Marquee / shamiana" },
  { value: "ROOFTOP", label: "Rooftop" },
  { value: "BASEMENT", label: "Basement hall" },
  { value: "FLOOR", label: "Floor" },
  { value: "SECTION", label: "Section / partition" },
  { value: "OTHER", label: "Other" },
];
const kindLabel = (k: string | null | undefined): string =>
  KINDS.find((x) => x.value === String(k || "").toUpperCase())?.label || String(k || "Space");

/**
 * 10.13 — mirrors `SubVenue.genderMode`, in the venue's own words rather than
 * the column's. SEGREGABLE is the normal Pakistani answer — a hall with a
 * partition — and a venue that picks it can host any of the others.
 */
const GENDER_MODES = [
  { value: "MIXED", label: "Everyone together" },
  { value: "SEGREGABLE", label: "Can be partitioned" },
  { value: "ZENANA", label: "Ladies only (zenana)" },
  { value: "MARDANA", label: "Men only (mardana)" },
];

/** 10.16 — the kinds the weather can reach. Mirrors the server's OPEN_AIR_KINDS. */
const OPEN_AIR = new Set(["LAWN", "ROOFTOP"]);

const PKR = (n: number | string | null | undefined): string =>
  n == null || n === "" ? "—" : "Rs " + Math.round(Number(n)).toLocaleString("en-PK");

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

/** Shared shape of the add form and the edit form — they collect the same facts. */
type Draft = { name: string; kind: string; comfort: string; max: string; price: string; wholeDay: boolean };
const EMPTY_DRAFT: Draft = { name: "", kind: "HALL", comfort: "", max: "", price: "", wholeDay: false };

const INPUT =
  "rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <label className={`flex flex-col gap-0.5 ${className || ""}`}>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[10.5px] leading-snug text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** The add/edit field set, rendered once and used by both forms. */
function DraftFields({
  draft,
  onChange,
  disabled,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <Field label="Name" className="w-44">
        <input
          type="text"
          placeholder="e.g. Main Hall"
          value={draft.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          className={INPUT}
        />
      </Field>
      <Field label="What is it?" className="w-44">
        <select
          value={draft.kind}
          disabled={disabled}
          onChange={(e) => onChange({ ...draft, kind: e.target.value })}
          className={INPUT}
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>
      {/*
        WW-SPACECAP — the two capacities, each said in full.

        `comfortCapacity` is advisory: the booking form shows it, and refusing a
        booking over a comfort preference would be wrong. `fireRatedCapacity` is
        the one `bookingCreateService` enforces, and it skips any space without
        one — so a blank here is not "unknown", it is "no limit at all". The old
        form said "Comfort" and "Max (enforced)" with the difference hidden in a
        `title=` tooltip, and a vendor who typed 200 into the first box watched
        the hall stay bookable for 2,000.
      */}
      <Field label="Comfortable seating" hint="Shown to couples. Does not block a booking." className="w-40">
        <input
          min={0}
          type="number"
          placeholder="e.g. 500"
          value={draft.comfort}
          disabled={disabled}
          onChange={(e) => onChange({ ...draft, comfort: e.target.value })}
          className={INPUT}
        />
      </Field>
      <Field label="Maximum guests" hint="A booking above this is refused. Blank = no limit." className="w-40">
        <input
          min={0}
          type="number"
          placeholder="e.g. 600"
          value={draft.max}
          disabled={disabled}
          onChange={(e) => onChange({ ...draft, max: e.target.value })}
          className={INPUT}
        />
      </Field>
      <Field label="Base price" hint="Rent for this space alone." className="w-36">
        <input
          min={0}
          type="number"
          placeholder="Rs"
          value={draft.price}
          disabled={disabled}
          onChange={(e) => onChange({ ...draft, price: e.target.value })}
          className={INPUT}
        />
      </Field>
      <Field label="How is it let?" className="w-48">
        <select
          value={draft.wholeDay ? "WHOLE_DAY" : "SESSION"}
          disabled={disabled}
          onChange={(e) => onChange({ ...draft, wholeDay: e.target.value === "WHOLE_DAY" })}
          className={INPUT}
        >
          <option value="SESSION">By session (lunch / dinner)</option>
          <option value="WHOLE_DAY">Whole day only</option>
        </select>
      </Field>
    </div>
  );
}

/** One labelled fact in a space's summary line. */
function Fact({ label, value, warn }: { label: string; value: string; warn?: boolean }): React.ReactElement {
  return (
    <div className="flex flex-col">
      <dt className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={warn ? "text-amber-700" : "text-foreground"}>{value}</dd>
    </div>
  );
}

export function VenueSpacesManagerView(): React.ReactElement | null {
  const [businessId, setBusinessId] = useBusinessIdField();
  const [tree, setTree] = React.useState<SubVenueNode[]>([]);
  const [warnings, setWarnings] = React.useState<CapacityWarning[]>([]);
  const [groups, setGroups] = React.useState<MergeGroup[]>([]);
  const [packages, setPackages] = React.useState<ApiPackage[]>([]);
  const [menus, setMenus] = React.useState<ApiMenu[]>([]);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);

  // add form
  const [adding, setAdding] = React.useState<boolean>(false);
  const [parentId, setParentId] = React.useState<number | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);

  // edit form
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editDraft, setEditDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [moveTo, setMoveTo] = React.useState<string>("");

  /**
   * Delete is confirmed INLINE rather than in a dialog. The shared
   * `DialogContent` sets no max-height, so a confirmation carrying a list of
   * affected spaces becomes unreachable at 360px — a documented trap in this
   * repo. An expanding panel inside the row scrolls with the page.
   */
  const [confirmId, setConfirmId] = React.useState<number | null>(null);

  // combined-spaces form
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
      setErr(readErr(e, "Something went wrong. Nothing was changed — please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function reload(): Promise<void> {
    /**
     * Packages and menus are fetched alongside the tree so each space can say
     * what is actually sold in it. Both are `.catch`-ed to an empty list on
     * purpose: they are supporting detail on this screen, and a packages
     * endpoint having a bad day must not take the space tree — the thing the
     * vendor came here for — down with it.
     */
    const [t, w, g, p, m] = await Promise.all([
      venueSpacesApi.getTree(bid),
      venueSpacesApi.capacityWarnings(bid),
      venueSpacesApi.listMergeGroups(bid),
      PackagesAPI.getAll(bid).catch(() => [] as ApiPackage[]),
      MenusAPI.getAll(bid).catch(() => [] as ApiMenu[]),
    ]);
    setTree(t.tree);
    setWarnings(w.warnings);
    setGroups(g.groups);
    setPackages(p);
    setMenus(m);
    setLoaded(true);
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
  const byId = React.useMemo(() => new Map(flat.map((n) => [n.id, n])), [flat]);

  /**
   * What is sold in each space, mirroring exactly what the booking flow does:
   * a package or menu with `subVenueId = NULL` is venue-wide and offered
   * everywhere; one naming a space is offered only there.
   */
  const venueWide =
    packages.filter((p) => p.subVenueId == null).length + menus.filter((m) => m.subVenueId == null).length;
  const sellCount = (id: number): { label: string; empty: boolean } => {
    const own =
      packages.filter((p) => Number(p.subVenueId) === id).length +
      menus.filter((m) => Number(m.subVenueId) === id).length;
    if (own > 0) return { label: `${own} of its own${venueWide ? ` + ${venueWide} venue-wide` : ""}`, empty: false };
    if (venueWide > 0) return { label: `${venueWide} venue-wide`, empty: false };
    return { label: "nothing to sell yet", empty: true };
  };

  /** Every space that would go if this one were deleted — the server cascades. */
  const subtreeOf = (n: SubVenueNode): SubVenueNode[] =>
    flat.filter((c) => String(c.path || "").startsWith(String(n.path || " ")));

  function startEdit(n: SubVenueNode): void {
    setEditDraft({
      name: n.name ?? "",
      kind: String(n.kind || "HALL").toUpperCase(),
      comfort: n.comfortCapacity != null ? String(n.comfortCapacity) : "",
      max: n.fireRatedCapacity != null ? String(n.fireRatedCapacity) : "",
      price: n.basePricePkr != null ? String(n.basePricePkr) : "",
      wholeDay: n.bookingMode === "WHOLE_DAY",
    });
    setMoveTo(n.parentSubVenueId != null ? String(n.parentSubVenueId) : "");
    setEditingId(n.id);
    setConfirmId(null);
    setAdding(false);
  }

  /**
   * Always sent, including the nulls. A PATCH that omits a key leaves the
   * stored value alone, so clearing a maximum a vendor set by mistake would be
   * impossible — and a wrong hard limit refuses real bookings.
   */
  const draftPatch = (d: Draft) => ({
    name: d.name.trim(),
    kind: d.kind,
    comfortCapacity: d.comfort.trim() ? Number(d.comfort) : null,
    fireRatedCapacity: d.max.trim() ? Number(d.max) : null,
    basePricePkr: d.price.trim() ? Number(d.price) : null,
    bookingMode: d.wholeDay ? ("WHOLE_DAY" as const) : ("SESSION" as const),
  });

  const openAddUnder = (n: SubVenueNode | null): void => {
    setParentId(n ? n.id : null);
    setDraft({ ...EMPTY_DRAFT, kind: n ? (n.depth === 0 ? "FLOOR" : "SECTION") : "HALL" });
    setAdding(true);
    setEditingId(null);
    setConfirmId(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Your spaces</CardTitle>
        <p className="text-sm text-muted-foreground">
          A <strong className="font-medium text-foreground">space</strong> is any part of your venue a couple can book on
          its own — a hall, a lawn, the basement. Add one for each, then price your packages and menus against them.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <BusinessScopeField value={businessId} onChange={setBusinessId} />
          <Button size="sm" variant="outline" onClick={() => void guard(reload)} disabled={!businessId || busy}>
            Refresh
          </Button>
        </div>

        {/* Capacity warnings, as a sentence rather than three raw numbers. */}
        {warnings.length > 0 && (
          <div className="space-y-1 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            {warnings.map((w) => (
              <p key={w.subVenueId}>
                The spaces inside <span className="font-medium">{w.name}</span> add up to {w.childrenCapacitySum} guests,
                but {w.name} itself is set to {w.parentCapacity} — {w.overBy} over. Raise {w.name}&apos;s seating, or
                lower the spaces inside it.
              </p>
            ))}
          </div>
        )}

        {!loaded && businessId ? (
          <p className="py-2 text-xs text-muted-foreground" role="status">
            Loading your spaces&hellip;
          </p>
        ) : flat.length === 0 ? (
          <EmptyState
            title="No spaces yet"
            description="Add the halls, lawns and marquees you let out. Couples pick one of these when they book, and your packages and menus are priced against them."
            action={
              <Button size="sm" onClick={() => openAddUnder(null)} disabled={!businessId || busy}>
                Add your first space
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {flat.map((n) => {
              const sold = sellCount(n.id);
              const openAir = OPEN_AIR.has(String(n.kind || "").toUpperCase());
              const doomed = subtreeOf(n);
              const backupName = n.backupSubVenueId != null ? byId.get(n.backupSubVenueId)?.name : null;

              return (
                <div
                  key={n.id}
                  style={{ marginLeft: n.depth * 20 }}
                  className={n.depth > 0 ? "border-l-2 border-muted pl-3" : undefined}
                >
                  <div className={`rounded-md border p-3 ${n.active === false ? "bg-muted/40" : "bg-background"}`}>
                    {/* headline */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-normal">
                        {kindLabel(n.kind)}
                      </Badge>
                      <span className="font-medium">{n.name}</span>
                      {n.active === false && (
                        <Badge variant="outline" className="border-slate-400 text-[11px] font-normal text-slate-600">
                          Hidden from couples
                        </Badge>
                      )}
                      {/*
                        The single most consequential gap on the platform, said
                        out loud instead of buried in a grey text run: without
                        `fireRatedCapacity` the booking engine `continue`s past
                        this space and accepts any guest count for it.
                      */}
                      {n.fireRatedCapacity == null && (
                        <Badge variant="outline" className="border-amber-400 text-[11px] font-normal text-amber-700">
                          No guest limit set
                        </Badge>
                      )}
                      {sold.empty && (
                        <Badge variant="outline" className="border-amber-400 text-[11px] font-normal text-amber-700">
                          Nothing to sell here
                        </Badge>
                      )}

                      <div className="ml-auto flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => (editingId === n.id ? setEditingId(null) : startEdit(n))}
                          disabled={busy}
                        >
                          {editingId === n.id ? "Close" : "Edit"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openAddUnder(n)} disabled={busy}>
                          + Space inside
                        </Button>
                        {/*
                          Retire, not destroy. `SubVenue.active` is exactly this
                          — the public tree filters inactive spaces out — and it
                          keeps the booking history the delete path throws away.
                          Offered BEFORE delete so it reads as the normal move.
                        */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void guard(async () => {
                              await venueSpacesApi.updateSubVenue(n.id, { active: n.active === false });
                              await reload();
                            })
                          }
                          disabled={busy}
                        >
                          {n.active === false ? "Show again" : "Hide"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            setConfirmId(confirmId === n.id ? null : n.id);
                            setEditingId(null);
                          }}
                          disabled={busy}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* the facts, each labelled */}
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                      <Fact
                        label="Comfortable seating"
                        value={n.comfortCapacity != null ? `${n.comfortCapacity} guests` : "not set"}
                      />
                      <Fact
                        label="Maximum guests"
                        value={
                          n.fireRatedCapacity != null
                            ? `${n.fireRatedCapacity} guests`
                            : "no limit — any booking accepted"
                        }
                        warn={n.fireRatedCapacity == null}
                      />
                      <Fact label="Base price" value={PKR(n.basePricePkr)} />
                      <Fact label="Let as" value={n.bookingMode === "WHOLE_DAY" ? "whole day" : "by session"} />
                      <Fact label="Packages &amp; menus" value={sold.label} warn={sold.empty} />
                    </dl>

                    {/* the two customer-facing answers only the venue can give */}
                    <div className="mt-2 flex flex-wrap items-end gap-3">
                      {/* 10.13 — what this space can host. The column has existed
                          since the hierarchy work and no screen ever showed it,
                          so every hall on the platform sat at its MIXED default
                          and a customer asking for a zenana function was told
                          "mixed" by a venue that may well have a partition. */}
                      <Field label="Who can it host?" className="w-52">
                        <select
                          value={n.genderMode || "MIXED"}
                          onChange={(e) =>
                            void guard(async () => {
                              await venueSpacesApi.updateSubVenue(n.id, { genderMode: e.target.value });
                              await reload();
                            })
                          }
                          disabled={busy}
                          aria-label={`Who ${n.name} can host`}
                          className={INPUT}
                        >
                          {GENDER_MODES.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {/* 10.16 — the wet-weather plan, for open-air spaces only.
                          `backupSubVenueId` sat on the row with no route that
                          could set it, so the customer-facing rule could only
                          reach its "no wet-weather plan is recorded" branch —
                          including at venues that have had a plan for twenty
                          years. Only indoor spaces are offered: another lawn is
                          not a wet-weather plan, and the server refuses one. */}
                      {openAir && (
                        <Field label="If it rains, move to" className="w-52">
                          <select
                            value={n.backupSubVenueId ?? ""}
                            onChange={(e) =>
                              void guard(async () => {
                                await venueSpacesApi.updateSubVenue(n.id, {
                                  backupSubVenueId: e.target.value ? Number(e.target.value) : null,
                                });
                                await reload();
                              })
                            }
                            disabled={busy}
                            aria-label={`Wet-weather backup for ${n.name}`}
                            className={INPUT}
                          >
                            <option value="">No plan — couples are told so</option>
                            {flat
                              .filter((c) => c.id !== n.id && !OPEN_AIR.has(String(c.kind || "").toUpperCase()))
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </Field>
                      )}
                      {openAir && !backupName && (
                        <p className="pb-1 text-[11px] text-amber-700">
                          Couples booking an open-air space are shown whether you have a wet-weather plan.
                        </p>
                      )}
                    </div>

                    {/* edit */}
                    {editingId === n.id && (
                      <div className="mt-3 space-y-3 rounded-md border bg-muted/30 p-3">
                        <DraftFields draft={editDraft} onChange={setEditDraft} disabled={busy} />
                        <div className="flex flex-wrap items-end gap-3">
                          {/* Moving beats delete-and-re-add: the id survives,
                              and bookings, slots, packages and menus all
                              reference it. The server rejects a cycle; the list
                              below also hides this space's own subtree so the
                              vendor is never offered one. */}
                          <Field label="Sits inside" className="w-52">
                            <select
                              value={moveTo}
                              onChange={(e) => setMoveTo(e.target.value)}
                              disabled={busy}
                              className={INPUT}
                            >
                              <option value="">Nothing &mdash; it&apos;s a top-level space</option>
                              {flat
                                .filter((c) => !String(c.path || "").startsWith(String(n.path || " ")))
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                            </select>
                          </Field>
                          <Button
                            size="sm"
                            disabled={busy || !editDraft.name.trim()}
                            onClick={() =>
                              void guard(async () => {
                                await venueSpacesApi.updateSubVenue(n.id, draftPatch(editDraft));
                                const nextParent = moveTo ? Number(moveTo) : null;
                                if (nextParent !== (n.parentSubVenueId ?? null)) {
                                  await venueSpacesApi.moveSubVenue(n.id, nextParent);
                                }
                                setEditingId(null);
                                await reload();
                              })
                            }
                          >
                            Save changes
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={busy}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* delete — with the real blast radius stated */}
                    {confirmId === n.id && (
                      <div className="mt-3 space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
                        <p className="font-medium text-destructive">
                          {doomed.length > 1
                            ? `Delete ${n.name} and the ${doomed.length - 1} space${
                                doomed.length - 1 === 1 ? "" : "s"
                              } inside it?`
                            : `Delete ${n.name}?`}
                        </p>
                        {doomed.length > 1 && (
                          <p className="text-muted-foreground">
                            This also removes{" "}
                            {doomed
                              .filter((d) => d.id !== n.id)
                              .map((d) => d.name)
                              .join(", ")}
                            .
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          Its slots and availability go with it. If you only want to stop taking bookings for it,{" "}
                          <strong className="font-medium">Hide</strong> it instead — that keeps everything, and you can
                          turn it back on.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busy}
                            onClick={() =>
                              void guard(async () => {
                                await venueSpacesApi.deleteSubVenue(n.id);
                                setConfirmId(null);
                                await reload();
                              })
                            }
                          >
                            Yes, delete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void guard(async () => {
                                await venueSpacesApi.updateSubVenue(n.id, { active: false });
                                setConfirmId(null);
                                await reload();
                              })
                            }
                          >
                            Hide it instead
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)} disabled={busy}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* add */}
        {adding ? (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {parentId ? `New space inside ${byId.get(parentId)?.name ?? "this space"}` : "New top-level space"}
              </span>
              {parentId && (
                <Button size="sm" variant="ghost" onClick={() => setParentId(null)}>
                  Make it top-level instead
                </Button>
              )}
            </div>
            <DraftFields draft={draft} onChange={setDraft} disabled={busy} />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={!businessId || !draft.name.trim() || busy}
                onClick={() =>
                  void guard(async () => {
                    const p = draftPatch(draft);
                    await venueSpacesApi.createSubVenue(bid, {
                      name: p.name,
                      kind: p.kind,
                      parentSubVenueId: parentId,
                      comfortCapacity: p.comfortCapacity ?? undefined,
                      fireRatedCapacity: p.fireRatedCapacity ?? undefined,
                      basePricePkr: p.basePricePkr ?? undefined,
                      bookingMode: p.bookingMode,
                    });
                    setDraft(EMPTY_DRAFT);
                    setAdding(false);
                    setParentId(null);
                    await reload();
                  })
                }
              >
                Add space
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setParentId(null);
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          flat.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => openAddUnder(null)} disabled={!businessId || busy}>
              + Add a hall or area
            </Button>
          )
        )}

        {/*
          Combined spaces — previously "Merge packages".

          That name collided head-on with the pricing Packages a vendor builds
          in Business Settings, so the section read as "merge my Gold and Silver
          packages" and was left alone. It is a different idea entirely: two
          areas sold together as ONE bookable unit at one price. Say that, and
          say what it is not.
        */}
        <div className="space-y-2 rounded-md border p-3">
          <div>
            <span className="text-sm font-medium">Combined spaces</span>
            <p className="text-xs text-muted-foreground">
              Let couples book two or more of your spaces together as one — Main Hall + Terrace Lawn for a single price.
              These are not the Gold/Silver packages you price in Business Settings.
            </p>
          </div>

          {groups.length === 0 && flat.length < 2 && (
            <p className="text-xs text-muted-foreground">Add at least two spaces above and you can combine them here.</p>
          )}

          {groups.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-2 border-t pt-2 text-xs">
              <Badge variant="secondary" className="font-normal">
                {g.name}
              </Badge>
              <span className="text-muted-foreground">
                {(g.members || [])
                  .map((m) => byId.get(m.subVenueId)?.name)
                  .filter(Boolean)
                  .join(" + ") || `${(g.members || []).length} spaces`}{" "}
                · {PKR(g.combinedPricePkr)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-destructive"
                onClick={() =>
                  void guard(async () => {
                    await venueSpacesApi.deleteMergeGroup(g.id);
                    await reload();
                  })
                }
                disabled={busy}
              >
                Remove
              </Button>
            </div>
          ))}

          {flat.length >= 2 && (
            <div className="space-y-2 border-t pt-2">
              <Field label="Which spaces go together?">
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {flat.map((n) => (
                    <Button
                      key={n.id}
                      size="sm"
                      variant={mgPicks.includes(n.id) ? "default" : "outline"}
                      onClick={() => setMgPicks((p) => (p.includes(n.id) ? p.filter((x) => x !== n.id) : [...p, n.id]))}
                    >
                      {n.name}
                    </Button>
                  ))}
                </div>
              </Field>
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Call it" className="w-52">
                  <input
                    type="text"
                    placeholder="e.g. Hall + Lawn"
                    value={mgName}
                    onChange={(e) => setMgName(e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Price for the pair" hint="What the two together cost." className="w-40">
                  <input
                    min={0}
                    type="number"
                    placeholder="Rs"
                    value={mgPrice}
                    onChange={(e) => setMgPrice(e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Button
                  size="sm"
                  onClick={() =>
                    void guard(async () => {
                      await venueSpacesApi.createMergeGroup(bid, {
                        name: mgName,
                        subVenueIds: mgPicks,
                        combinedPricePkr: mgPrice ? Number(mgPrice) : undefined,
                      });
                      setMgName("");
                      setMgPrice("");
                      setMgPicks([]);
                      await reload();
                    })
                  }
                  disabled={!mgName || mgPicks.length < 2 || busy}
                >
                  Save combination
                </Button>
              </div>
              {mgPicks.length === 1 && (
                <p className="text-[11px] text-muted-foreground">
                  Pick one more space — a combination needs at least two.
                </p>
              )}
            </div>
          )}
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}
      </CardContent>
    </Card>
  );
}

export default VenueSpacesManagerView;
