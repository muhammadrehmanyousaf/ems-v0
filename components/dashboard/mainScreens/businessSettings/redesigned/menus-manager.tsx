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
import {
  FormBlockedHint,
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validateName,
  validatePkr,
} from "@/components/dashboard/primitives/field-error"

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
    title: string; price: string; items: string; minGuarantee: string;
    pricingUnit: "per_head" | "per_event";
  }>({ title: "", price: "", items: "", minGuarantee: "", pricingUnit: "per_head" })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const isPerHead = form.pricingUnit === "per_head"
  // Errors show only after a field is touched, so a blank new form doesn't open
  // covered in red.
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))
  const reset = () => { setForm({ title: "", price: "", items: "", minGuarantee: "", pricingUnit: "per_head" }); setTouched({}); setAdding(false); setEditingId(null) }
  const invalidate = () => qc.invalidateQueries({ queryKey: ["menus", businessId] })

  const itemsOf = (m: ApiMenu): string[] => {
    const it = (m.data as any)?.items
    return Array.isArray(it) ? it.map(String) : []
  }
  const startEdit = (m: ApiMenu) => {
    setForm({
      title: m.title ?? "",
      price: String(m.price ?? ""),
      items: itemsOf(m).join("\n"),
      minGuarantee: m.minGuaranteeCount != null ? String(m.minGuaranteeCount) : "",
      // A NULL saved pricingUnit is a legacy flat menu (per_event).
      pricingUnit: String(m.pricingUnit || "").toLowerCase() === "per_head" ? "per_head" : "per_event",
    })
    setEditingId(m.id); setAdding(true)
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const items = form.items.split("\n").map((s) => s.trim()).filter(Boolean)
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
            <div className="space-y-1.5"><label className={labelCls} htmlFor="menu-items">Dishes (one per line)</label><textarea id="menu-items" className={inputCls + " h-24 resize-y py-2"} value={form.items} onChange={(e) => set("items", e.target.value)} placeholder={"Chicken Biryani\nMutton Karahi\nSeekh Kebab\nZarda"} /></div>
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
                {itemsOf(m).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {itemsOf(m).slice(0, 8).map((d, i) => <span key={`${m.id}-${i}-${d}`} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{d}</span>)}
                  </div>
                )}
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
