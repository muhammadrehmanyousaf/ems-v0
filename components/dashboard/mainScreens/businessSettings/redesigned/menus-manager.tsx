"use client"

/**
 * Menus manager (redesigned, Track C — interactive). Self-contained CRUD for a
 * business's catering menus (MenusAPI getAll/create/delete). Used inside the
 * business-settings hub's Menus tab. Own mutations (not the hub's save bar).
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MenusAPI, type ApiMenu } from "@/lib/api/dashboard"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
// WW-ONE-DISH — Punjab / ICT allow one main dish and one sweet dish at a
// marriage function, and the duty falls on the VENUE and the CATERER as much as
// the host. Checked here, while the vendor builds, when fixing it is free.
import {
  checkOneDish,
  flattenMenuItems,
  COUNTS_AS,
  COUNTS_AS_LABELS,
  describeViolation,
  type CountsAs,
} from "@/lib/compliance/one-dish"
import {
  FormBlockedHint,
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validateName,
  validatePkr,
} from "@/components/dashboard/primitives/field-error"

/**
 * A dish row in the form. `inferred` is UI-only and never persisted: it marks a
 * classification WE placed (from the section a legacy menu filed it under, or
 * the "other" fallback on a bulk paste) rather than one the vendor declared, so
 * the row can flag itself for confirmation instead of the guess being saved
 * back as though they had chosen it.
 */
interface FormDish { name: string; countsAs: CountsAs; inferred: boolean }

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

export function MenusManager({
  businessId, minCapacity, maxCapacity,
}: {
  businessId: number
  /**
   * WWL-479 — the venue's own guest range, so a menu's minimum guarantee can be
   * checked against the bookings this business actually takes. Optional: a
   * caterer with no capacity set simply gets no check.
   */
  minCapacity?: number | null
  maxCapacity?: number | null
}) {
  const qc = useQueryClient()
  const { data: menus, isLoading } = useQuery<ApiMenu[]>({ queryKey: ["menus", businessId], queryFn: () => MenusAPI.getAll(businessId) })
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  // WW-PRICING-OVERHAUL — pricingUnit is now an EXPLICIT vendor choice, not
  // inferred from whether a guarantee was typed. "per_head" bills price × guests;
  // "per_event" is a flat price. New menus default to per_head (the Pakistani
  // catering norm and how this whole editor is framed); existing menus reflect
  // their saved value (a NULL saved unit is legacy flat = per_event).
  const [form, setForm] = React.useState<{
    title: string; price: string; dishes: FormDish[]; minGuarantee: string;
    pricingUnit: "per_head" | "per_event";
  }>({ title: "", price: "", dishes: [], minGuarantee: "", pricingUnit: "per_head" })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const isPerHead = form.pricingUnit === "per_head"
  // Errors show only after a field is touched, so a blank new form doesn't open
  // covered in red.
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))
  const reset = () => { setForm({ title: "", price: "", dishes: [], minGuarantee: "", pricingUnit: "per_head" }); setTouched({}); setAdding(false); setEditingId(null) }

  // ── WW-ONE-DISH — dish rows ────────────────────────────────────────────
  const setDish = (i: number, patch: Partial<FormDish>) =>
    setForm((f) => ({
      ...f,
      // Touching a row means the vendor has looked at it, so it is no longer
      // our inference — it is their declaration, and the badge says so.
      dishes: f.dishes.map((d, j) => (j === i ? { ...d, ...patch, inferred: false } : d)),
    }))
  const addDish = () =>
    setForm((f) => ({ ...f, dishes: [...f.dishes, { name: "", countsAs: "salan", inferred: false }] }))
  const removeDish = (i: number) =>
    setForm((f) => ({ ...f, dishes: f.dishes.filter((_, j) => j !== i) }))

  /**
   * Bulk paste — vendors have their menu written down and type it in one go.
   * Each new line becomes a row defaulted to "other", which is what leaves the
   * verdict `unknown` until they classify: an unread menu must never show green.
   */
  const addDishesFromText = (text: string) => {
    const names = text.split("\n").map((s) => s.trim()).filter(Boolean)
    if (names.length === 0) return
    setForm((f) => ({
      ...f,
      dishes: [...f.dishes, ...names.map((name) => ({ name, countsAs: "other" as CountsAs, inferred: true }))],
    }))
  }

  // Live verdict, recomputed as they type — the whole point of checking here
  // rather than after a save round-trip.
  const oneDish = React.useMemo(
    () => checkOneDish({ items: form.dishes.filter((d) => d.name.trim()) }),
    [form.dishes],
  )
  const invalidate = () => qc.invalidateQueries({ queryKey: ["menus", businessId] })

  /**
   * WW-ONE-DISH — dishes are read through the shared flattener, so a menu saved
   * in ANY of this column's historic shapes opens correctly: a flat string list
   * from this form, a classified object list, or the sectioned
   * `{ mainCourse: { items } }` shape the booking flow reads.
   *
   * A dish the vendor never classified comes back `inferred`, and the row's
   * select shows what we guessed so they can correct it — rather than the
   * guess being silently saved back as though they had declared it.
   */
  const dishesOf = (m: ApiMenu): FormDish[] =>
    flattenMenuItems(m.data).map((d) => ({
      name: d.name,
      countsAs: d.countsAs,
      inferred: d.inferred,
    }))

  const startEdit = (m: ApiMenu) => {
    setForm({
      title: m.title ?? "",
      price: String(m.price ?? ""),
      dishes: dishesOf(m),
      minGuarantee: m.minGuaranteeCount != null ? String(m.minGuaranteeCount) : "",
      // A NULL saved pricingUnit is a legacy flat menu (per_event).
      pricingUnit: String(m.pricingUnit || "").toLowerCase() === "per_head" ? "per_head" : "per_event",
    })
    setEditingId(m.id); setAdding(true)
  }

  const saveMut = useMutation({
    mutationFn: () => {
      // WW-ONE-DISH — dishes save as objects carrying their classification, so
      // the rule reads a declaration rather than guessing from the name. Blank
      // rows are dropped; `inferred` is a UI concern and is not persisted.
      const items = form.dishes
        .map((d) => ({ name: d.name.trim(), countsAs: d.countsAs }))
        .filter((d) => d.name)
      const guarantee = form.minGuarantee.trim()
      const perHead = form.pricingUnit === "per_head"
      const body = {
        title: form.title.trim(),
        price: Number(form.price) || 0,
        businessId,
        data: items.length ? { items } : {},
        // WW-PRICING-OVERHAUL — pricingUnit now always reflects the explicit
        // toggle. A minimum guarantee only applies to a per-head menu; a flat
        // menu clears it (a flat menu ignores heads anyway on the server).
        pricingUnit: perHead ? ("per_head" as const) : ("per_event" as const),
        minGuaranteeCount: perHead && guarantee ? Number(guarantee) : null,
      }
      return editingId ? MenusAPI.update(editingId, body) : MenusAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(editingId ? "Menu updated" : "Menu added"); reset(); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save menu")),
  })
  const removeMut = useMutation({
    mutationFn: (id: number) => MenusAPI.delete(id),
    onSuccess: () => { showSuccessToast("Menu removed"); invalidate() },
    onError: (e: any) => toast.error(
        errorMessage(e, "Couldn't remove menu"),
        { duration: 8000 },
      ),
  })
  // Per-head pricing is the whole basis of a Pakistani catering quote, so a Rs 0
  // menu is the "bookable at Rs 0" hole rather than a real free service.
  const errs = {
    title: validateName(form.title, { label: "Menu title", max: 150 }),
    price: validatePkr(form.price, { label: "Price per head" }),
  }
  const shown = {
    title: touched.title ? errs.title : undefined,
    price: touched.price ? errs.price : undefined,
  }
  const canSave = !errs.title && !errs.price

  /**
   * WWL-479 — read live from Rehman Grand Marquee, whose own capacity range is
   * 250–900: its three menus carry minimum guarantees of 128, 198 and 148. Every
   * one sits BELOW the smallest booking the venue will accept, so the guarantee
   * can never bind — it is a floor no booking can fall through. Nothing in the
   * editor related a menu to the venue it belongs to, which is unsurprising
   * given the field was not in the editor at all.
   *
   * A note, not a block: an unusual guarantee may be deliberate, and refusing
   * the save would be this screen overruling the vendor about their own pricing.
   */
  const guaranteeNote = (() => {
    const g = Number(form.minGuarantee)
    if (!form.minGuarantee.trim() || !Number.isFinite(g) || g <= 0) return undefined
    if (minCapacity != null && g < minCapacity) {
      return `Your smallest booking is ${minCapacity} guests, so a guarantee of ${g} never applies — every booking already clears it.`
    }
    if (maxCapacity != null && g > maxCapacity) {
      return `Your venue holds ${maxCapacity} guests, so a guarantee of ${g} can never be met — no booking here could reach it.`
    }
    return undefined
  })()

  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason =
    !canSave && !shown.title && !shown.price
      ? "Add a title and a price above Rs 0 to save."
      : undefined

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="ClipboardList" size={16} /></span>
        <div className="mr-auto"><h2 className="text-sm font-semibold">Menus</h2><p className="text-xs text-muted-foreground">Catering menus with per-head pricing.</p></div>
        {!adding && <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Icon name="Plus" size={14} className="mr-1" /> Add menu</Button>}
      </div>

      <div className="space-y-3 p-4">
        {adding && (
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs font-semibold text-primary">{editingId ? "Edit menu" : "New menu"}</div>
            {/* WW-PRICING-OVERHAUL — explicit pricing basis. Per head = price ×
                guest count (with an optional minimum); Flat = one price for the
                whole event regardless of guests. */}
            <div className="space-y-1.5">
              <span className={labelCls}>How is this menu priced?</span>
              <div className="inline-flex rounded-lg border border-input p-0.5">
                {([
                  { key: "per_head", label: "Per head (× guests)" },
                  { key: "per_event", label: "Flat (whole event)" },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => set("pricingUnit", opt.key)}
                    aria-pressed={form.pricingUnit === opt.key}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      form.pricingUnit === opt.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {isPerHead
                  ? "The customer's guest count multiplies this price (the standard catering model)."
                  : "A single price for the event, whatever the guest count."}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="menu-title">Menu title</label>
                <input id="menu-title" className={cn(inputCls, shown.title && ERROR_INPUT_CLS)} value={form.title}
                  onChange={(e) => { set("title", e.target.value); touch("title") }} onBlur={() => touch("title")}
                  maxLength={150} placeholder="e.g. Standard Buffet (per head)" {...fieldAria("menu-title", shown.title)} />
                <FieldError id="menu-title" message={shown.title} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="menu-price">{isPerHead ? "Price / head (Rs)" : "Price (whole event, Rs)"}</label>
                <input id="menu-price" type="number" min={0} step={1} inputMode="numeric"
                  className={cn(inputCls, shown.price && ERROR_INPUT_CLS)} value={form.price}
                  onChange={(e) => { set("price", e.target.value); touch("price") }} onBlur={() => touch("price")}
                  placeholder="2200" {...fieldAria("menu-price", shown.price)} />
                <FieldError id="menu-price" message={shown.price} />
              </div>
            </div>
            {isPerHead && (
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="menu-guarantee">Minimum guarantee (guests)</label>
                <input
                  id="menu-guarantee" type="number" min={1} step={1} inputMode="numeric"
                  className={cn(inputCls, "sm:max-w-[180px]")} value={form.minGuarantee}
                  onChange={(e) => set("minGuarantee", e.target.value)}
                  placeholder="e.g. 300"
                />
                <p className="text-xs text-muted-foreground">
                  The smallest guest count you&apos;ll bill for on this menu, even if fewer turn up. Leave
                  blank if you don&apos;t hold one.
                </p>
                {guaranteeNote && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">{guaranteeNote}</p>
                )}
              </div>
            )}
            {/* ── WW-ONE-DISH — dishes, each with what it counts as ────────
                This was a plain textarea, which is fine for typing and useless
                for the law: Punjab allows ONE main dish and ONE sweet dish at a
                marriage function (Marriage Functions Act 2016 s.4), and s.5
                puts the same duty on the VENUE and the CATERER, with s.8
                penalties up to a month's imprisonment and Rs 20 lakh.

                It cannot be inferred from the dish name — the documented
                workaround is listing a second salan as a "special salad" — so
                the vendor declares it and the declaration is what we count. */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Dishes</label>
                <Button size="sm" variant="ghost" onClick={addDish}>
                  <Icon name="Plus" size={14} className="mr-1" /> Add dish
                </Button>
              </div>

              {form.dishes.length === 0 && (
                <textarea
                  className={inputCls + " h-24 resize-y py-2"}
                  placeholder={"Paste your menu here, one dish per line —\nChicken Biryani\nMutton Karahi\nSeekh Kebab\nZarda"}
                  onBlur={(e) => { addDishesFromText(e.target.value); e.target.value = "" }}
                />
              )}

              {form.dishes.map((d, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    className={cn(inputCls, "flex-1 min-w-[10rem]")}
                    value={d.name}
                    onChange={(e) => setDish(i, { name: e.target.value })}
                    placeholder="Dish name"
                    maxLength={120}
                  />
                  <select
                    className={cn(inputCls, "w-[15rem]", d.inferred && "border-amber-400")}
                    value={d.countsAs}
                    onChange={(e) => setDish(i, { countsAs: e.target.value as CountsAs })}
                    title={d.inferred ? "We guessed this — please confirm" : undefined}
                  >
                    {COUNTS_AS.map((c) => (
                      <option key={c} value={c}>{COUNTS_AS_LABELS[c]}</option>
                    ))}
                  </select>
                  <Button size="sm" variant="ghost" onClick={() => removeDish(i)} aria-label={`Remove ${d.name || "dish"}`}>
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              ))}

              {/* The verdict. Three states, deliberately — a menu we cannot
                  read is `unknown`, never green. Telling a vendor their menu is
                  legal on the strength of a guess is how they end up relying on
                  it in front of an inspector. */}
              {form.dishes.some((d) => d.name.trim()) && (
                <div
                  className={cn(
                    "rounded-lg border p-3 text-sm",
                    oneDish.status === "violation"
                      ? "border-destructive/40 bg-destructive/5"
                      : oneDish.status === "unknown"
                        ? "border-amber-300 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
                        : "border-emerald-300 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20",
                  )}
                >
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-muted-foreground">
                    <span>Main dishes <b className="text-foreground">{oneDish.counts.salan}</b> / 1</span>
                    <span>Sweet dishes <b className="text-foreground">{oneDish.counts.sweet}</b> / 1</span>
                    <span>Rice {oneDish.counts.rice}</span>
                    <span>Salad {oneDish.counts.salad}</span>
                  </div>

                  {oneDish.status === "violation" && (
                    <p className="mt-2 text-destructive">
                      {oneDish.violations.map((v) => describeViolation(v)).join(" ")}{" "}
                      Serving this at a wedding in Punjab or Islamabad puts the venue and the
                      caterer at risk, not just the customer.
                    </p>
                  )}
                  {oneDish.status === "unknown" && (
                    <p className="mt-2 text-amber-800 dark:text-amber-300">
                      Set what each dish counts as — {oneDish.unclassified.length} still to
                      go. We can&apos;t tell you whether this menu is within the one-dish rule
                      until you do.
                    </p>
                  )}
                  {oneDish.status === "compliant" && (
                    <p className="mt-2 text-emerald-800 dark:text-emerald-300">
                      Within the one-dish rule.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <FormBlockedHint message={blockedReason} />
              <Button size="sm" disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={14} className="mr-1.5" /> {editingId ? "Update menu" : "Save menu"}</>}</Button>
              <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Spinner size={16} /> Loading menus…</div>
        ) : !menus?.length && !adding ? (
          <EmptyState icon="ClipboardList" title="No menus yet" description="Add a catering menu with its per-head price." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {menus?.map((m) => (
              <div key={m.id} className="flex flex-col rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate text-sm font-semibold">{m.title}</div>
                  <div className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatPkr(m.price)}{String(m.pricingUnit || "").toLowerCase() === "per_head" && <span className="text-xs font-normal text-muted-foreground">/head</span>}</div>
                </div>
                {m.minGuaranteeCount != null && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Minimum {m.minGuaranteeCount} guests
                    {minCapacity != null && m.minGuaranteeCount < minCapacity && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {" "}· below your {minCapacity}-guest minimum, so it never applies
                      </span>
                    )}
                  </div>
                )}
                {/* WW-ONE-DISH — the saved-menu chips now read through the same
                    flattener as the editor, so a menu in ANY of this column's
                    historic shapes lists its dishes here. The old `itemsOf`
                    only understood the flat string list, so a sectioned menu
                    showed nothing at all. */}
                {(() => {
                  const dishes = flattenMenuItems(m.data)
                  if (dishes.length === 0) return null
                  return (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dishes.slice(0, 8).map((d, i) => (
                        <span
                          key={`${m.id}-${i}-${d.name}`}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {d.name}
                        </span>
                      ))}
                    </div>
                  )
                })()}
                <div className="mt-3 flex justify-end gap-1 border-t border-border/60 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(m)}><Icon name="Pencil" size={14} className="mr-1" /> Edit</Button>
                  <Button size="sm" variant="ghost" disabled={removeMut.isPending} onClick={() => removeMut.mutate(m.id)}><Icon name="Trash2" size={14} className="mr-1 text-muted-foreground hover:text-destructive" /> Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MenusManager
