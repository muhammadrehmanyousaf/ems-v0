"use client"

/**
 * Packages manager (redesigned, Track C — interactive). Self-contained CRUD for
 * a business's pricing packages (PackagesAPI getAll/create/delete). Used inside
 * the business-settings hub's Packages tab. Features stored as string[] (one per
 * line). Own mutations (not the hub's BusinessesAPI save bar).
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PackagesAPI, type ApiPackage } from "@/lib/api/dashboard"
import { venueSpacesApi, type SubVenueNode } from "@/lib/api/venueSpaces"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast, showUndoToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import {
  FieldError,
  FormBlockedHint,
  fieldAria,
  ERROR_INPUT_CLS,
  validateName,
  validatePkr,
  validateOptionalText,
} from "@/components/dashboard/primitives/field-error"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
const asFeatures = (f: ApiPackage["features"]): string[] =>
  Array.isArray(f) ? (f as string[]) : f && typeof f === "object" ? Object.values(f as Record<string, unknown>).map(String) : []

export function PackagesManager({ businessId }: { businessId: number }) {
  const qc = useQueryClient()
  const { data: packages, isLoading } = useQuery<ApiPackage[]>({ queryKey: ["pkgs", businessId], queryFn: () => PackagesAPI.getAll(businessId) })
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [form, setForm] = React.useState({ name: "", price: "", description: "", features: "", subVenueId: "" })

  /**
   * The venue's spaces, so a package can say WHERE it is sold.
   *
   * Slot templates have carried `subVenueId` since BK-100 and the booking line
   * since WWL-050; packages were the one side of space → slots → packages with
   * no answer, so every package was offered in every hall. Venues that do not
   * model spaces get no picker at all and nothing changes for them.
   */
  const { data: spaceTree } = useQuery({
    queryKey: ["venue-spaces-flat", businessId],
    queryFn: () => venueSpacesApi.publicTree(businessId),
    staleTime: 60_000,
  })
  const spaces = React.useMemo(() => {
    const flat: { id: number; name: string; depth: number }[] = []
    const walk = (ns: SubVenueNode[], depth: number) =>
      (ns || []).forEach((n) => { flat.push({ id: n.id, name: n.name, depth }); if (n.children) walk(n.children, depth + 1) })
    walk(spaceTree?.tree || [], 0)
    return flat
  }, [spaceTree])
  // Errors show only once a field has been touched, so a freshly-opened blank
  // form doesn't greet the vendor with red text before they've typed anything.
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))
  const reset = () => { setForm({ name: "", price: "", description: "", features: "", subVenueId: "" }); setTouched({}); setAdding(false); setEditingId(null) }
  const startEdit = (p: ApiPackage) => {
    setForm({ name: p.name ?? "", price: String(p.price ?? ""), description: p.description ?? "", features: asFeatures(p.features).join("\n"), subVenueId: p.subVenueId != null ? String(p.subVenueId) : "" })
    setTouched({}); setEditingId(p.id); setAdding(true)
  }
  const invalidate = () => qc.invalidateQueries({ queryKey: ["pkgs", businessId] })

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        description: form.description.trim() || undefined,
        features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
        businessId,
        // Always sent, including as null, so a vendor can move a package back to
        // venue-wide. Omitting it would make "no space" mean "leave it alone".
        subVenueId: form.subVenueId ? Number(form.subVenueId) : null,
      }
      return editingId ? PackagesAPI.update(editingId, body) : PackagesAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(editingId ? "Package updated" : "Package added"); reset(); invalidate() },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save package")),
  })
  // Remove had no confirmation and no way back — one stray click destroyed a
  // priced package. Recreating it from the same values is a faithful undo.
  const removeMut = useMutation({
    mutationFn: (p: ApiPackage) => PackagesAPI.delete(p.id).then(() => p),
    onSuccess: (p) => {
      showUndoToast({
        message: `"${p.name}" removed`,
        onUndo: async () => {
          try {
            await PackagesAPI.create({
              name: p.name,
              price: Number(p.price) || 0,
              description: p.description ?? undefined,
              features: asFeatures(p.features),
              businessId,
            })
            invalidate()
          } catch {
            toast.error("Couldn't restore that package.")
          }
        },
      })
      invalidate()
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't remove package")),
  })

  // Validation now produces MESSAGES, not just a boolean. Previously this was a
  // lone `canSave` driving `disabled`, so an invalid price greyed the button out
  // and said nothing — the vendor saw a dead button and concluded the system was
  // broken. Bounds mirror the server so the two can't disagree.
  const errs = {
    name: validateName(form.name, { label: "Package name", max: 150 }),
    price: validatePkr(form.price, { label: "Price" }),
    description: validateOptionalText(form.description, { label: "Description", max: 500 }),
  }
  const shown = {
    name: touched.name ? errs.name : undefined,
    price: touched.price ? errs.price : undefined,
    description: touched.description ? errs.description : undefined,
  }
  const canSave = !errs.name && !errs.price && !errs.description
  // If the button is disabled and no field is showing a reason (nothing touched
  // yet), say so explicitly rather than leaving a dead control unexplained.
  const blockedHint =
    !canSave && !shown.name && !shown.price && !shown.description
      ? "Add a package name and a price above Rs 0 to save."
      : undefined

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="Package" size={16} /></span>
        <div className="mr-auto"><h2 className="text-sm font-semibold">Packages</h2><p className="text-xs text-muted-foreground">Pricing packages couples can choose from.</p></div>
        {!adding && <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Icon name="Plus" size={14} className="mr-1" /> Add package</Button>}
      </div>

      <div className="space-y-3 p-4">
        {adding && (
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs font-semibold text-primary">{editingId ? "Edit package" : "New package"}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="pkg-name">Package name</label>
                <input
                  id="pkg-name"
                  className={cn(inputCls, shown.name && ERROR_INPUT_CLS)}
                  value={form.name}
                  onChange={(e) => { set("name", e.target.value); touch("name") }}
                  onBlur={() => touch("name")}
                  maxLength={150}
                  placeholder="e.g. Silver Wedding Package"
                  {...fieldAria("pkg-name", shown.name)}
                />
                <FieldError id="pkg-name" message={shown.name} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="pkg-price">Price (Rs)</label>
                <input
                  id="pkg-price"
                  type="number"
                  /* min/step are a real guard, not decoration: the field had no
                     min at all, so the browser's own spinner offered negatives. */
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className={cn(inputCls, shown.price && ERROR_INPUT_CLS)}
                  value={form.price}
                  onChange={(e) => { set("price", e.target.value); touch("price") }}
                  onBlur={() => touch("price")}
                  placeholder="150000"
                  {...fieldAria("pkg-price", shown.price)}
                />
                <FieldError id="pkg-price" message={shown.price} />
              </div>
            </div>
            {/* Which hall this package is sold in.
                Rendered only when the venue actually models spaces — a
                single-space vendor gets no extra question. Defaults to
                venue-wide, which is what every existing package means. */}
            {spaces.length > 1 && (
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="pkg-space">Sold in</label>
                <select
                  id="pkg-space"
                  className={inputCls}
                  value={form.subVenueId}
                  onChange={(e) => set("subVenueId", e.target.value)}
                >
                  <option value="">Every space in this venue</option>
                  {spaces.map((sp) => (
                    <option key={sp.id} value={String(sp.id)}>
                      {" ".repeat(sp.depth * 3)}{sp.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Pick a space and this package is only offered to couples booking that space.
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="pkg-desc">Description</label>
              <input
                id="pkg-desc"
                className={cn(inputCls, shown.description && ERROR_INPUT_CLS)}
                value={form.description}
                onChange={(e) => { set("description", e.target.value); touch("description") }}
                onBlur={() => touch("description")}
                maxLength={500}
                placeholder="Short summary"
                {...fieldAria("pkg-desc", shown.description)}
              />
              <FieldError id="pkg-desc" message={shown.description} />
            </div>
            <div className="space-y-1.5"><label className={labelCls}>Features (one per line)</label><textarea className={inputCls + " h-24 resize-y py-2"} value={form.features} onChange={(e) => set("features", e.target.value)} placeholder={"8 hours coverage\n2 photographers\nEdited album (40 pages)"} /></div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                disabled={!canSave || saveMut.isPending}
                // Surface every reason at once if they hit a disabled button
                // without having touched the offending field.
                onClick={() => { setTouched({ name: true, price: true, description: true }); saveMut.mutate() }}
              >
                {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={14} className="mr-1.5" /> {editingId ? "Update package" : "Save package"}</>}
              </Button>
              <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
              <FormBlockedHint message={blockedHint} />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Spinner size={16} /> Loading packages…</div>
        ) : !packages?.length && !adding ? (
          <EmptyState icon="Package" title="No packages yet" description="Add your first package so couples can book it." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {packages?.map((p) => (
              <div key={p.id} className="flex flex-col rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="truncate text-sm font-semibold">{p.name}</div>{p.description && <div className="truncate text-xs text-muted-foreground">{p.description}</div>}</div>
                  <div className="text-right text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatPkr(p.price)}</div>
                </div>
                {asFeatures(p.features).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {asFeatures(p.features).slice(0, 5).map((f, i) => (
                      <li key={`${p.id}-${i}-${f}`} className="flex items-start gap-1.5 text-xs text-muted-foreground"><Icon name="Check" size={12} className="mt-0.5 shrink-0 text-emerald-500" /> {f}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex justify-end gap-1 border-t border-border/60 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(p)}><Icon name="Pencil" size={14} className="mr-1" /> Edit</Button>
                  <Button size="sm" variant="ghost" disabled={removeMut.isPending} onClick={() => removeMut.mutate(p)}><Icon name="Trash2" size={14} className="mr-1 text-muted-foreground hover:text-destructive" /> Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PackagesManager
