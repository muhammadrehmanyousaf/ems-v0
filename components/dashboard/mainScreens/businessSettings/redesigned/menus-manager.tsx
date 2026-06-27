"use client"

/**
 * Menus manager (redesigned, Track C — interactive). Self-contained CRUD for a
 * business's catering menus (MenusAPI getAll/create/delete). Used inside the
 * business-settings hub's Menus tab. Own mutations (not the hub's save bar).
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MenusAPI, type ApiMenu } from "@/lib/api/dashboard"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

export function MenusManager({ businessId }: { businessId: number }) {
  const qc = useQueryClient()
  const { data: menus, isLoading } = useQuery<ApiMenu[]>({ queryKey: ["menus", businessId], queryFn: () => MenusAPI.getAll(businessId) })
  const [adding, setAdding] = React.useState(false)
  const [form, setForm] = React.useState({ title: "", price: "", items: "" })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const reset = () => { setForm({ title: "", price: "", items: "" }); setAdding(false) }
  const invalidate = () => qc.invalidateQueries({ queryKey: ["menus", businessId] })

  const createMut = useMutation({
    mutationFn: () => {
      const items = form.items.split("\n").map((s) => s.trim()).filter(Boolean)
      return MenusAPI.create({
        title: form.title.trim(),
        price: Number(form.price) || 0,
        businessId,
        data: items.length ? { items } : undefined,
      })
    },
    onSuccess: () => { showSuccessToast("Menu added"); reset(); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't add menu"),
  })
  const removeMut = useMutation({
    mutationFn: (id: number) => MenusAPI.delete(id),
    onSuccess: () => { showSuccessToast("Menu removed"); invalidate() },
    onError: (e: any) => toast.error(e?.message || "Couldn't remove menu"),
  })

  const itemsOf = (m: ApiMenu): string[] => {
    const it = (m.data as any)?.items
    return Array.isArray(it) ? it.map(String) : []
  }
  const canSave = form.title.trim() && Number(form.price) > 0

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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
              <div className="space-y-1.5"><label className={labelCls}>Menu title</label><input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Standard Buffet (per head)" /></div>
              <div className="space-y-1.5"><label className={labelCls}>Price / head (Rs)</label><input type="number" className={inputCls} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="2200" /></div>
            </div>
            <div className="space-y-1.5"><label className={labelCls}>Dishes (one per line)</label><textarea className={inputCls + " h-24 resize-y py-2"} value={form.items} onChange={(e) => set("items", e.target.value)} placeholder={"Chicken Biryani\nMutton Karahi\nSeekh Kebab\nZarda"} /></div>
            <div className="flex gap-2">
              <Button size="sm" disabled={!canSave || createMut.isPending} onClick={() => createMut.mutate()}>{createMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={14} className="mr-1.5" /> Save menu</>}</Button>
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
                  <div className="whitespace-nowrap text-right text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatPkr(m.price)}<span className="text-xs font-normal text-muted-foreground">/head</span></div>
                </div>
                {itemsOf(m).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {itemsOf(m).slice(0, 8).map((d, i) => <span key={`${m.id}-${i}-${d}`} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{d}</span>)}
                  </div>
                )}
                <div className="mt-3 flex justify-end border-t border-border/60 pt-2">
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
