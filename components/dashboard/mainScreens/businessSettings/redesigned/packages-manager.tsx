"use client"

/**
 * Packages manager (redesigned, Track C — interactive). Self-contained CRUD for
 * a business's pricing packages (PackagesAPI getAll/create/delete). Used inside
 * the business-settings hub's Packages tab. Features stored as string[] (one per
 * line). Own mutations (not the hub's BusinessesAPI save bar).
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PackagesAPI, type ApiPackage } from "@/lib/api/dashboard"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
const asFeatures = (f: ApiPackage["features"]): string[] =>
  Array.isArray(f) ? (f as string[]) : f && typeof f === "object" ? Object.values(f as Record<string, unknown>).map(String) : []

export function PackagesManager({ businessId }: { businessId: number }) {
  const qc = useQueryClient()
  const { data: packages, isLoading } = useQuery<ApiPackage[]>({ queryKey: ["pkgs", businessId], queryFn: () => PackagesAPI.getAll(businessId) })
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [form, setForm] = React.useState({ name: "", price: "", description: "", features: "" })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const reset = () => { setForm({ name: "", price: "", description: "", features: "" }); setAdding(false); setEditingId(null) }
  const startEdit = (p: ApiPackage) => {
    setForm({ name: p.name ?? "", price: String(p.price ?? ""), description: p.description ?? "", features: asFeatures(p.features).join("\n") })
    setEditingId(p.id); setAdding(true)
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
      }
      return editingId ? PackagesAPI.update(editingId, body) : PackagesAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(editingId ? "Package updated" : "Package added"); reset(); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save package"),
  })
  const removeMut = useMutation({
    mutationFn: (id: number) => PackagesAPI.delete(id),
    onSuccess: () => { showSuccessToast("Package removed"); invalidate() },
    onError: (e: any) => toast.error(e?.message || "Couldn't remove package"),
  })

  const canSave = form.name.trim() && Number(form.price) > 0

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
              <div className="space-y-1.5"><label className={labelCls}>Package name</label><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Silver Wedding Package" /></div>
              <div className="space-y-1.5"><label className={labelCls}>Price (Rs)</label><input type="number" className={inputCls} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="150000" /></div>
            </div>
            <div className="space-y-1.5"><label className={labelCls}>Description</label><input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short summary" /></div>
            <div className="space-y-1.5"><label className={labelCls}>Features (one per line)</label><textarea className={inputCls + " h-24 resize-y py-2"} value={form.features} onChange={(e) => set("features", e.target.value)} placeholder={"8 hours coverage\n2 photographers\nEdited album (40 pages)"} /></div>
            <div className="flex gap-2">
              <Button size="sm" disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={14} className="mr-1.5" /> {editingId ? "Update package" : "Save package"}</>}</Button>
              <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
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
                  <Button size="sm" variant="ghost" disabled={removeMut.isPending} onClick={() => removeMut.mutate(p.id)}><Icon name="Trash2" size={14} className="mr-1 text-muted-foreground hover:text-destructive" /> Remove</Button>
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
