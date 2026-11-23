"use client"

// One vendor, everything about them in one place. After a call, Team A corrects the details, packages and menus right here, and puts the vendor on the site.
// Every change is recorded with the person's name (see "What changed"). What stays closed: the login email, certificate claims, and anything about bank
// or wallet accounts, which the portal never handles.
import Link from "next/link"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Pencil, Phone, Plus, Trash2 } from "lucide-react"

import { SOURCE_WORDS, money } from "@/components/ops/vendor-finder"
import { SheetFields } from "@/components/ops/sheet-form"
import { Btn, Card, Empty, ErrorState, Field, Input, Modal, Notice, PageHead, Select, SkelRows, Status, Textarea, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { useOps } from "@/components/ops/ops-shell"
import { opsErrorMessage } from "@/lib/api/ops"
import { opsErrorData, type FieldError, type SheetData } from "@/lib/api/ops-onboarding"
import { directoryApi, type HistoryRow, type MenuView, type PackageView, type PricingUnit } from "@/lib/api/ops-vendors"
import { toWaNumber } from "@/lib/ops/whatsapp"

const GAP_WORDS: Record<string, string> = {
  name: "a name", vendorType: "a category", city: "a city", area: "an area", phone: "a phone number", ownerName: "the owner's name", subBusinessType: "the kind of business",
  image: "at least one photo", capacity: "the guest capacity", priceOrMenu: "a price, package or menu", whatsapp: "a WhatsApp number", logo: "a logo",
}
const unitWord = (u: PricingUnit) => (u === "per_head" ? "per head" : "per event")
const key = (id: number) => ["ops", "vendor", id] as const

/** One line a person can read for each audit entry. */
function historyLine(h: HistoryRow): string {
  const after = (h.after ?? {}) as Record<string, unknown>
  const before = (h.before ?? {}) as Record<string, unknown>
  switch (h.action) {
    case "ops.listing.edited_on_behalf": return `Details edited: ${Object.keys(after).join(", ") || "—"}`
    case "ops.package.saved": return `${h.before ? "Package changed" : "Package added"}: ${String(after.name ?? "")}`
    case "ops.package.deleted": return `Package removed: ${String(before.name ?? "")}`
    case "ops.menu.saved": return `${h.before ? "Menu changed" : "Menu added"}: ${String(after.title ?? "")}`
    case "ops.menu.deleted": return `Menu removed: ${String(before.title ?? "")}`
    case "ops.vendor.live": return "Put live on the site"
    case "ops.vendor.off": return "Taken off the site"
    case "ops.onboard.go_live": return "Went live (onboarding)"
    case "ops.onboard.created": return "Listing created by onboarding"
    case "ops.onboard.takeover": return "Taken over by the portal"
    default: return h.action.replace(/^ops\./, "").replace(/[._]/g, " ")
  }
}

/* ----------------------------------------- packages ----------------------------------------- */

function PackageModal({ id, pkg, open, onClose }: { id: number; pkg: PackageView | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const blank = { name: "", price: "", unit: "per_event" as "per_event" | "per_head", min: "", description: "", features: "" }
  const [f, setF] = useState(blank)
  const [err, setErr] = useState<{ field?: string; message: string } | null>(null)
  useEffect(() => {
    if (!open) return
    setErr(null)
    setF(pkg ? { name: pkg.name, price: pkg.price == null ? "" : String(pkg.price), unit: pkg.pricingUnit === "per_head" ? "per_head" : "per_event", min: pkg.minGuaranteeCount ? String(pkg.minGuaranteeCount) : "", description: pkg.description, features: pkg.features.join("\n") } : blank)
  }, [open, pkg]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setF((s) => ({ ...s, [k]: e.target.value })); setErr(null) }
  const save = useMutation({
    mutationFn: () => directoryApi.savePackage(id, { name: f.name, price: f.price, description: f.description, features: f.features, pricingUnit: f.unit, minGuaranteeCount: f.unit === "per_head" && f.min ? f.min : null }, pkg?.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key(id) }); toast({ title: pkg ? "Package saved" : "Package added", body: "Recorded with your name." }); onClose() },
    onError: (e) => { const d = opsErrorData<{ field?: string }>(e); setErr({ field: d?.field, message: opsErrorMessage(e) }) },
  })
  return (
    <Modal open={open} onClose={onClose} title={pkg ? `Edit ${pkg.name}` : "Add a package"} description="What the vendor tells you on the phone. The same rules as the vendor's own screen apply."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={save.isPending} disabled={!f.name.trim() || !f.price.trim()} onClick={() => save.mutate()}>Save package</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {err && !err.field ? <Notice tone="bad">{err.message}</Notice> : null}
        <Field label="Package name" htmlFor="pk-name" required error={err?.field === "name" ? err.message : null}><Input id="pk-name" value={f.name} onChange={set("name")} maxLength={120} autoFocus /></Field>
        <div className="grid2">
          <Field label="Price (PKR)" htmlFor="pk-price" required error={err?.field === "price" ? err.message : null}><Input id="pk-price" inputMode="numeric" value={f.price} onChange={set("price")} placeholder="1,500,000" /></Field>
          <Field label="The price is" htmlFor="pk-unit" error={err?.field === "pricingUnit" ? err.message : null}><Select id="pk-unit" value={f.unit} onChange={set("unit")}><option value="per_event">For the whole event</option><option value="per_head">Per head</option></Select></Field>
        </div>
        {f.unit === "per_head" && <Field label="Minimum guests" htmlFor="pk-min" hint="The least number of guests they will charge for." error={err?.field === "minGuaranteeCount" ? err.message : null}><Input id="pk-min" inputMode="numeric" value={f.min} onChange={set("min")} placeholder="100" /></Field>}
        <Field label="What is included" htmlFor="pk-feat" hint="One item per line." error={err?.field === "features" ? err.message : null}><Textarea id="pk-feat" rows={4} value={f.features} onChange={set("features")} placeholder={"Stage decoration\nParking for 100 cars"} /></Field>
        <Field label="Description (optional)" htmlFor="pk-desc"><Textarea id="pk-desc" rows={2} maxLength={2000} value={f.description} onChange={set("description")} /></Field>
      </div>
    </Modal>
  )
}

function PackagesCard({ id, packages }: { id: number; packages: PackageView[] }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [editing, setEditing] = useState<PackageView | null | "new">(null)
  const [removing, setRemoving] = useState<PackageView | null>(null)
  const del = useMutation({
    mutationFn: (pkgId: number) => directoryApi.deletePackage(id, pkgId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key(id) }); setRemoving(null); toast({ title: "Package removed" }) },
    onError: (e) => toast({ title: "Couldn't remove it", body: opsErrorMessage(e), tone: "bad" }),
  })
  return (
    <Card title="Packages" sub="What the vendor sells as a package, with prices." actions={<Btn size="sm" icon={<Plus aria-hidden />} onClick={() => setEditing("new")}>Add a package</Btn>}>
      {packages.length === 0 ? <p className="small muted" style={{ margin: 0 }}>No packages yet. Ask what they offer and add it.</p> : packages.map((p) => (
        <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <div className="td-name">{p.name}</div>
              <div className="td-sub">{money(p.price) ?? "No price"} {unitWord(p.pricingUnit)}{p.pricingUnit === "per_head" && p.minGuaranteeCount ? ` · minimum ${p.minGuaranteeCount} guests` : ""}</div>
              {p.features.length > 0 && <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>{p.features.slice(0, 8).map((f) => <Status key={f} tone="mut">{f}</Status>)}{p.features.length > 8 ? <span className="small muted">+{p.features.length - 8} more</span> : null}</div>}
            </div>
            <div className="row nw" style={{ gap: 6 }}>
              <Btn size="sm" icon={<Pencil aria-hidden />} onClick={() => setEditing(p)}>Edit</Btn>
              <Btn size="sm" variant="danger" icon={<Trash2 aria-hidden />} aria-label={`Remove ${p.name}`} onClick={() => setRemoving(p)} />
            </div>
          </div>
        </div>
      ))}
      <PackageModal id={id} pkg={editing === "new" ? null : editing} open={editing !== null} onClose={() => setEditing(null)} />
      <Modal open={!!removing} onClose={() => setRemoving(null)} title={removing ? `Remove ${removing.name}?` : "Remove package"} description="It disappears from the vendor's page. Bookings that already used it keep their record."
        footer={<><Btn onClick={() => setRemoving(null)}>Keep it</Btn><Btn variant="danger" loading={del.isPending} onClick={() => removing && del.mutate(removing.id)}>Remove it</Btn></>} />
    </Card>
  )
}

/* ------------------------------------------ menus ------------------------------------------ */

function MenuModal({ id, menu, open, onClose }: { id: number; menu: MenuView | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const blank = { title: "", price: "", unit: "per_head" as "per_event" | "per_head", min: "", items: "" }
  const [f, setF] = useState(blank)
  const [err, setErr] = useState<{ field?: string; message: string } | null>(null)
  useEffect(() => {
    if (!open) return
    setErr(null)
    setF(menu ? { title: menu.title, price: menu.price == null ? "" : String(menu.price), unit: menu.pricingUnit === "per_event" ? "per_event" : "per_head", min: menu.minGuaranteeCount ? String(menu.minGuaranteeCount) : "", items: menu.items.join("\n") } : blank)
  }, [open, menu]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setF((s) => ({ ...s, [k]: e.target.value })); setErr(null) }
  const save = useMutation({
    mutationFn: () => directoryApi.saveMenu(id, { title: f.title, price: f.price, pricingUnit: f.unit, minGuaranteeCount: f.unit === "per_head" && f.min ? f.min : null, items: f.items.split("\n").map((s) => s.trim()).filter(Boolean) }, menu?.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key(id) }); toast({ title: menu ? "Menu saved" : "Menu added", body: "Recorded with your name." }); onClose() },
    onError: (e) => { const d = opsErrorData<{ field?: string }>(e); setErr({ field: d?.field, message: opsErrorMessage(e) }) },
  })
  return (
    <Modal open={open} onClose={onClose} title={menu ? `Edit ${menu.title}` : "Add a menu"} description="The dishes and the price per head, as the vendor tells you."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={save.isPending} disabled={!f.title.trim() || !f.price.trim()} onClick={() => save.mutate()}>Save menu</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {err && !err.field ? <Notice tone="bad">{err.message}</Notice> : null}
        <Field label="Menu name" htmlFor="mn-title" required error={err?.field === "title" ? err.message : null}><Input id="mn-title" value={f.title} onChange={set("title")} maxLength={120} autoFocus /></Field>
        <div className="grid2">
          <Field label="Price (PKR)" htmlFor="mn-price" required error={err?.field === "price" ? err.message : null}><Input id="mn-price" inputMode="numeric" value={f.price} onChange={set("price")} placeholder="1,800" /></Field>
          <Field label="The price is" htmlFor="mn-unit" error={err?.field === "pricingUnit" ? err.message : null}><Select id="mn-unit" value={f.unit} onChange={set("unit")}><option value="per_head">Per head</option><option value="per_event">For the whole event</option></Select></Field>
        </div>
        {f.unit === "per_head" && <Field label="Minimum guests" htmlFor="mn-min" error={err?.field === "minGuaranteeCount" ? err.message : null}><Input id="mn-min" inputMode="numeric" value={f.min} onChange={set("min")} placeholder="100" /></Field>}
        <Field label="Dishes" htmlFor="mn-items" hint="One dish per line." error={err?.field === "items" ? err.message : null}><Textarea id="mn-items" rows={7} value={f.items} onChange={set("items")} placeholder={"Mutton Qorma\nChicken Biryani\nKheer"} /></Field>
      </div>
    </Modal>
  )
}

function MenusCard({ id, menus }: { id: number; menus: MenuView[] }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [editing, setEditing] = useState<MenuView | null | "new">(null)
  const [removing, setRemoving] = useState<MenuView | null>(null)
  const del = useMutation({
    mutationFn: (menuId: number) => directoryApi.deleteMenu(id, menuId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key(id) }); setRemoving(null); toast({ title: "Menu removed" }) },
    onError: (e) => toast({ title: "Couldn't remove it", body: opsErrorMessage(e), tone: "bad" }),
  })
  return (
    <Card title="Menus" sub="Food menus with a price per head." actions={<Btn size="sm" icon={<Plus aria-hidden />} onClick={() => setEditing("new")}>Add a menu</Btn>}>
      {menus.length === 0 ? <p className="small muted" style={{ margin: 0 }}>No menus yet. Not every vendor has one (a photographer has packages only).</p> : menus.map((m) => (
        <div key={m.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <div className="td-name">{m.title}</div>
              <div className="td-sub">{money(m.price) ?? "No price"} {unitWord(m.pricingUnit)}{m.pricingUnit === "per_head" && m.minGuaranteeCount ? ` · minimum ${m.minGuaranteeCount} guests` : ""}</div>
              {m.items.length > 0 && <p className="small muted" style={{ margin: "6px 0 0" }}>{m.items.slice(0, 12).join(" · ")}{m.items.length > 12 ? ` · +${m.items.length - 12} more` : ""}</p>}
            </div>
            <div className="row nw" style={{ gap: 6 }}>
              <Btn size="sm" icon={<Pencil aria-hidden />} onClick={() => setEditing(m)}>Edit</Btn>
              <Btn size="sm" variant="danger" icon={<Trash2 aria-hidden />} aria-label={`Remove ${m.title}`} onClick={() => setRemoving(m)} />
            </div>
          </div>
        </div>
      ))}
      <MenuModal id={id} menu={editing === "new" ? null : editing} open={editing !== null} onClose={() => setEditing(null)} />
      <Modal open={!!removing} onClose={() => setRemoving(null)} title={removing ? `Remove ${removing.title}?` : "Remove menu"} description="It disappears from the vendor's page. Bookings that already used it keep their record."
        footer={<><Btn onClick={() => setRemoving(null)}>Keep it</Btn><Btn variant="danger" loading={del.isPending} onClick={() => removing && del.mutate(removing.id)}>Remove it</Btn></>} />
    </Card>
  )
}

/* ------------------------------------------ details ------------------------------------------ */

function DetailsCard({ id }: { id: number }) {
  const toast = useOpsToast()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: [...key(id), "details"], queryFn: () => directoryApi.details(id), staleTime: 0, refetchOnWindowFocus: false })
  const [vals, setVals] = useState<SheetData | null>(null)
  const [changed, setChanged] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<FieldError[]>([])
  const data = vals ?? q.data?.values ?? {}
  const save = useMutation({
    mutationFn: () => directoryApi.edit(id, Object.fromEntries([...changed].map((k) => [k, data[k] ?? ""]))),
    onSuccess: (r) => {
      setChanged(new Set()); setErrors([]); setVals(null)
      qc.invalidateQueries({ queryKey: key(id) })
      toast({ title: r.changed.length ? "Saved" : "Nothing changed", body: r.changed.length ? "Every change is recorded with your name." : undefined })
    },
    onError: (e) => {
      const d = opsErrorData<{ errors?: FieldError[] }>(e)
      if (d?.code === "VALIDATION" && d.errors) setErrors(d.errors)
      toast({ title: "Could not save", body: d?.code === "REQUIRED_FIELD" ? "These fields cannot be left empty." : opsErrorMessage(e), tone: "bad" })
    },
  })
  if (q.isLoading) return <Card title="Details"><SkelRows rows={5} /></Card>
  if (q.isError || !q.data) {
    const d = opsErrorData(q.error)
    return <Card title="Details"><Notice tone="info">{d?.code === "SHEET_NOT_AVAILABLE" ? "Editing this type of vendor's details from here is not available yet. Packages and menus above still work." : opsErrorMessage(q.error)}</Notice></Card>
  }
  return (
    <Card title="Details" sub="Name, contact, location, capacity, prices, facilities and policies. The login email is changed only by the owner.">
      <SheetFields fields={q.data.fields} data={data} errors={errors}
        onChange={(k, v) => { setVals({ ...data, [k]: v }); setChanged((s) => new Set(s).add(k)); setErrors((es) => es.filter((x) => x.field !== k)) }} />
      <div style={{ marginTop: 20, display: "flex", gap: 8, alignItems: "center" }}>
        <Btn variant="primary" loading={save.isPending} disabled={!changed.size} onClick={() => save.mutate()}>Save changes</Btn>
        {changed.size ? <Btn onClick={() => { setVals(null); setChanged(new Set()); setErrors([]) }}>Discard</Btn> : null}
        {changed.size ? <span className="small muted">{changed.size} change{changed.size === 1 ? "" : "s"} not saved yet</span> : null}
      </div>
    </Card>
  )
}

/* -------------------------------------------- page -------------------------------------------- */

export function VendorWorkspaceView({ id }: { id: number }) {
  const { can } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const q = useQuery({ queryKey: key(id), queryFn: () => directoryApi.get(id), staleTime: 0, refetchOnWindowFocus: false })
  const [confirmOff, setConfirmOff] = useState(false)
  const setLive = useMutation({
    mutationFn: (live: boolean) => directoryApi.setLive(id, live),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: key(id) }); qc.invalidateQueries({ queryKey: ["ops", "directory"] }); setConfirmOff(false); toast({ title: r.live ? "The vendor is live" : "Taken off the site", body: "Recorded with your name." }) },
    onError: (e) => { const d = opsErrorData<{ gaps?: string[] }>(e); toast({ title: "Couldn't change it", body: d?.gaps ? `Still needed: ${d.gaps.map((g) => GAP_WORDS[g] ?? g).join(", ")}.` : opsErrorMessage(e), tone: "bad" }) },
  })

  if (q.isLoading) return <><PageHead title="Vendor" /><Card flush><SkelRows rows={8} /></Card></>
  if (q.isError || !q.data) {
    const d = opsErrorData(q.error)
    return <ErrorState message={d?.code === "VENDOR_NOT_FOUND" ? "This vendor was not found." : opsErrorMessage(q.error)} onRetry={() => q.refetch()} />
  }
  const d = q.data
  const v = d.vendor
  const wa = toWaNumber(v.phone)
  const canLive = can("ops_onboard_direct")

  return (
    <>
      <div style={{ marginBottom: 10 }}><Link href="/ops/find" className="btn btn-link" style={{ paddingLeft: 0 }}><ArrowLeft aria-hidden />Vendors</Link></div>
      <PageHead
        title={v.name}
        sub={<span className="row" style={{ gap: 8, flexWrap: "wrap" }}><Status tone={v.live ? "ok" : "warn"}>{v.live ? "Live on the site" : "Not on the site"}</Status><Status tone="mut">{SOURCE_WORDS[v.source]}</Status><span>{[v.vendorType, v.subArea, v.city].filter(Boolean).join(" · ")}</span></span>}
        actions={canLive ? (v.live
          ? <Btn variant="danger" onClick={() => setConfirmOff(true)}>Take off the site</Btn>
          : <Btn variant="primary" loading={setLive.isPending} disabled={!d.live.canTakeLive} title={d.live.canTakeLive ? undefined : "Fill in what is missing first"} onClick={() => setLive.mutate(true)}>Put live on the site</Btn>) : undefined}
      />

      {!v.live && d.live.gaps.length > 0 && <div style={{ marginBottom: 14 }}><Notice tone="warn">Before this vendor can go live they still need: {d.live.gaps.map((g) => GAP_WORDS[g] ?? g).join(", ")}.{d.live.gaps.includes("image") ? " Photos are added from the call sheet or by the vendor." : ""}</Notice></div>}
      {!v.live && d.live.gaps.length === 0 && d.live.status !== "approved" && <div style={{ marginBottom: 14 }}><Notice tone="ok">Everything needed is filled in. You can put this vendor live.</Notice></div>}

      <div className="cols-main">
        <div className="stack">
          <PackagesCard id={id} packages={d.packages} />
          <MenusCard id={id} menus={d.menus} />
          <DetailsCard id={id} />
        </div>
        <div className="stack">
          <Card title="Contact">
            <dl className="kv">
              <dt>Owner</dt><dd>{v.ownerName ?? "—"}</dd>
              <dt>Phone</dt><dd>{v.phone ?? "—"}</dd>
              {v.email ? <><dt>Email</dt><dd style={{ wordBreak: "break-all" }}>{v.email}</dd></> : <><dt>Email</dt><dd className="muted">{v.claimed ? "—" : "Not claimed yet"}</dd></>}
              <dt>Price from</dt><dd>{money(v.minimumPrice) ?? "—"}</dd>
              <dt>Capacity</dt><dd>{v.maxCapacity && v.maxCapacity > 1 ? `${v.maxCapacity} guests` : "—"}</dd>
              <dt>Photos</dt><dd>{v.images}</dd>
              <dt>Complete</dt><dd>{v.completenessScore != null ? `${v.completenessScore}%` : "—"}</dd>
            </dl>
            <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              {v.phone && <a className="btn btn-primary sm" href={`tel:${v.phone.replace(/[^\d+]/g, "")}`}><Phone size={14} aria-hidden />Call</a>}
              {wa && <a className="btn btn-ghost sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}`}>WhatsApp</a>}
            </div>
            <p className="small muted" style={{ margin: "12px 0 0" }}>Call from your own phone, then record what they tell you here.</p>
          </Card>
          <Card title="What changed" sub="Every edit, with who made it.">
            {d.history.length === 0 ? <Empty title="No changes yet">Edits made from the portal appear here.</Empty> : d.history.map((h) => (
              <div key={String(h.id)} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12.5 }}>{historyLine(h)}</div>
                <div className="small muted">{h.actorName ?? "System"} · {fmtWhen(h.at)}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <Modal open={confirmOff} onClose={() => setConfirmOff(false)} title={`Take ${v.name} off the site?`} description="Couples will no longer find or book this vendor. You can put them back live at any time."
        footer={<><Btn onClick={() => setConfirmOff(false)}>Keep them live</Btn><Btn variant="danger" loading={setLive.isPending} onClick={() => setLive.mutate(false)}>Take them off</Btn></>} />
    </>
  )
}
