"use client"

/**
 * Business settings HUB (redesigned, Track C — interactive editor).
 * ClickUp-style tab rail over the business profile. Three core tabs are fully
 * wired to BusinessesAPI.update (Profile, Capacity & Pricing, Amenities &
 * Services) with a shared dirty-tracked sticky save bar. The dialog/separate-API
 * tabs (Images, Packages, Menus, Bank, Team, Availability) link to the existing
 * functional screens rather than duplicate their dialogs. Route
 * /dashboard/business-settings-new. Loads the vendor's first business.
 * Original businessSettings screens untouched.
 */

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { DetailSkeleton } from "@/components/dashboard/primitives/skeletons"
import { Icon, Spinner, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { BankAccountsManager } from "@/components/dashboard/mainScreens/businessSettings/redesigned/bank-accounts-manager"
import { PackagesManager } from "@/components/dashboard/mainScreens/businessSettings/redesigned/packages-manager"
import { MenusManager } from "@/components/dashboard/mainScreens/businessSettings/redesigned/menus-manager"
import { AvailabilityManager } from "@/components/dashboard/mainScreens/businessSettings/redesigned/availability-manager"
import { ImagesManager } from "@/components/dashboard/mainScreens/businessSettings/redesigned/images-manager"
import { TypeSpecificManager } from "@/components/dashboard/mainScreens/businessSettings/redesigned/type-specific-manager"
import { ProfileContentManager } from "@/components/dashboard/mainScreens/businessSettings/redesigned/profile-content-manager"
import { getVendorTypeConfig } from "@/lib/vendor-type-config"
import { PersonaPreference } from "@/components/dashboard/layout/persona-preference"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { TourLauncherCard } from "@/components/dashboard/tour/tour-launcher"

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v) || 0)

const labelCls = "text-xs font-medium text-muted-foreground"
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"

type TabKey = "profile" | "pricing" | "amenities" | "listing" | "type-specific" | "images" | "packages" | "menus" | "bank" | "team" | "availability"
interface TabDef { key: TabKey; label: string; icon: IconName; wired: boolean; href?: string; hint?: string }
const TABS: TabDef[] = [
  { key: "profile", label: "Profile", icon: "Building2", wired: true },
  { key: "pricing", label: "Capacity & pricing", icon: "DollarSign", wired: true },
  { key: "amenities", label: "Amenities & services", icon: "SlidersHorizontal", wired: true },
  // Self-contained save (its own button) — NOT hub-wired, and no href, so the
  // hub renders it directly without the sticky save bar or the "dedicated screen" card.
  { key: "listing", label: "Listing content", icon: "ShieldCheck", wired: false },
  { key: "type-specific", label: "Type-specific", icon: "Settings2", wired: false, hint: "Settings unique to your vendor category." },
  { key: "images", label: "Images", icon: "Image", wired: false, hint: "Upload & reorder gallery photos." },
  { key: "packages", label: "Packages", icon: "Package", wired: false, hint: "Pricing packages & bundles." },
  { key: "menus", label: "Menus", icon: "ClipboardList", wired: false, hint: "Catering menus & per-head pricing." },
  { key: "bank", label: "Bank details", icon: "CreditCard", wired: false, hint: "Payout accounts for receivables." },
  { key: "team", label: "Team members", icon: "Users2", wired: false, href: "/dashboard/staff", hint: "Staff & roles." },
  { key: "availability", label: "Availability", icon: "CalendarCheck", wired: false, hint: "Blocked dates & lead time." },
]

// The sidebar sub-items link to /dashboard/settings?tab=<id> using the vendor
// config's settingsTabs ids (overview, basic, images, fleet, packages, menus,
// type-specific). Map each — plus the hub's own tab keys — to the tab this hub
// should open, so deep-links land on the right section instead of Profile.
const PARAM_TO_TAB: Record<string, TabKey> = {
  overview: "profile",
  basic: "profile",
  images: "images",
  fleet: "type-specific",
  packages: "packages",
  menus: "menus",
  "type-specific": "type-specific",
  // hub-native keys (so ?tab=pricing etc. also work directly)
  profile: "profile",
  pricing: "pricing",
  amenities: "amenities",
  listing: "listing",
  bank: "bank",
  team: "team",
  availability: "availability",
}

// The editable scalar/boolean fields we own (the rest are separate APIs/dialogs).
const BOOLS: { key: keyof ApiBusiness; label: string; hint: string }[] = [
  { key: "catering", label: "Catering", hint: "We provide food service" },
  { key: "parking", label: "Parking", hint: "On-site parking available" },
  { key: "provideSoundSystem", label: "Sound system", hint: "PA / DJ setup included" },
  { key: "provideSeatingArrangement", label: "Seating arrangement", hint: "Chairs & tables provided" },
  { key: "provideWaiter", label: "Waiters", hint: "Serving staff provided" },
  { key: "providePlate", label: "Crockery & plates", hint: "Tableware provided" },
  { key: "provideDecorationItem", label: "Decoration", hint: "Decor items provided" },
  { key: "provideFoodTesting", label: "Food tasting", hint: "Pre-event tasting offered" },
  { key: "travelToClientHome", label: "Travel to client", hint: "We come to the venue/home" },
  { key: "covidComplaint", label: "SOP compliant", hint: "Follows safety SOPs" },
]

export function BusinessSettingsHubView() {
  const qc = useQueryClient()
  const { data: businesses, isLoading, isError } = useQuery<ApiBusiness[]>({
    queryKey: ["biz-settings-hub"],
    queryFn: () => BusinessesAPI.getUserBusinesses(),
  })
  // Deep-link: sidebar sub-items navigate to /dashboard/settings?tab=<id>.
  // Resolve that id → the matching hub tab so each link opens its own section
  // (previously the param was ignored and everything opened on Profile).
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get("tab") ?? null

  /* Which business this hub is editing.
     Previously this was hard-coded to `businesses?.[0]`, with no switcher
     anywhere in the UI. For a vendor with more than one venue that meant every
     business after the first was UNREACHABLE — they could not add photos,
     packages, amenities, availability or bank details to it, ever. Worse, the
     "Add a business" screen tells them: "You can add photos, packages and
     amenities in Business Settings while you wait" — which was impossible.
     Verified live on a fresh account owning 3361 (Lahore) + 3362 (Karachi):
     Settings rendered 3361 only and offered no way to reach 3362.

     `?biz=<id>` makes the choice linkable and survives a reload; it falls back
     to the first business, so single-venue vendors see no change at all. */
  const bizParam = Number(searchParams?.get("biz")) || null
  const [pickedId, setPickedId] = React.useState<number | null>(bizParam)
  React.useEffect(() => { if (bizParam) setPickedId(bizParam) }, [bizParam])
  const biz =
    (pickedId ? businesses?.find((b) => b.id === pickedId) : undefined) ??
    businesses?.[0]
  const [active, setActive] = React.useState<TabKey>(() => (tabParam && PARAM_TO_TAB[tabParam]) || "profile")
  React.useEffect(() => {
    const mapped = tabParam ? PARAM_TO_TAB[tabParam] : undefined
    if (mapped) setActive(mapped)
  }, [tabParam])
  const [dirty, setDirty] = React.useState(false)
  const loadedId = React.useRef<number | null>(null)
  const [form, setForm] = React.useState<Record<string, any>>({})

  React.useEffect(() => {
    if (biz && loadedId.current !== biz.id) {
      loadedId.current = biz.id
      setForm({
        name: biz.name ?? "",
        description: biz.description ?? "",
        city: biz.city ?? "",
        subArea: biz.subArea ?? "",
        brandLogo: biz.brandLogo ?? "",
        minimumPrice: biz.minimumPrice ?? "",
        minCapacity: biz.minCapacity ?? "",
        maxCapacity: biz.maxCapacity ?? "",
        downPaymentType: biz.downPaymentType ?? "Percentage",
        downPayment: biz.downPayment ?? "",
        cancelationPolicy: biz.cancelationPolicy ?? "",
        ...Object.fromEntries(BOOLS.map((b) => [b.key, Boolean(biz[b.key])])),
      })
      setDirty(false)
    }
  }, [biz])

  const set = (k: string, v: any) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true) }

  // Publish this bar's height as --ww-bottom-bar so nothing else can sit on top
  // of it. The PWA install prompt is `fixed bottom` at z-50 while this bar is
  // z-20, so it physically covered "Save changes" — verified on production with
  // elementFromPoint, at both 360px and 1440px. Anything anchored to the bottom
  // now offsets by this value instead of overlapping the primary action.
  const saveBarRef = React.useRef<HTMLDivElement | null>(null)
  React.useLayoutEffect(() => {
    const el = saveBarRef.current
    const root = document.documentElement
    if (!el) { root.style.removeProperty("--ww-bottom-bar"); return }
    const publish = () => root.style.setProperty("--ww-bottom-bar", `${Math.round(el.getBoundingClientRect().height)}px`)
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => { ro.disconnect(); root.style.removeProperty("--ww-bottom-bar") }
  })

  const saveMut = useMutation({
    mutationFn: () =>
      BusinessesAPI.update(biz!.id, {
        name: form.name,
        description: form.description || null,
        city: form.city || null,
        subArea: form.subArea || null,
        brandLogo: form.brandLogo || null,
        minimumPrice: numOrNull(String(form.minimumPrice)),
        minCapacity: numOrNull(String(form.minCapacity)),
        maxCapacity: numOrNull(String(form.maxCapacity)),
        downPaymentType: form.downPaymentType || null,
        downPayment: numOrNull(String(form.downPayment)),
        cancelationPolicy: form.cancelationPolicy || null,
        ...Object.fromEntries(BOOLS.map((b) => [b.key, Boolean(form[b.key])])),
      } as Partial<ApiBusiness>),
    onSuccess: () => { showSuccessToast("Business profile saved"); setDirty(false); qc.invalidateQueries({ queryKey: ["biz-settings-hub"] }) },
    // Surface the SERVER's reason, not axios's generic wrapper.
    //
    // This read `e?.message`, which for an axios error is the useless string
    // "Request failed with status code 400". The actual reason lives on
    // e.response.data.message. Live on production this save was rejected with
    // "Minimum price must be a positive number" and the vendor was never shown
    // it — they saw a Save button that did nothing, which is exactly the
    // "not a single patch is going" complaint. A rejected save must always say
    // why, and the toast is held longer because a validation message is
    // something the vendor has to read and act on.
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.message || e?.message || "Couldn't save your changes.",
        { duration: 8000 },
      ),
  })

  if (isLoading) return <div className="p-4 md:p-6"><DetailSkeleton /></div>
  if (isError || !biz) {
    return <div className="p-4 md:p-6"><EmptyState icon="Building2" title="No business found" description="Create your business profile first." /></div>
  }

  const tab = TABS.find((t) => t.key === active)!

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24">
      <PageHeader
        eyebrow="Settings · Business"
        title={biz.name || "Business settings"}
        description="Your public profile, pricing and services."
        actions={biz.vendor?.vendorType ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{biz.vendor.vendorType}</span> : undefined}
      />

      {/* Business switcher — only rendered when there is something to switch
          between, so nothing changes for single-venue vendors. Without this,
          every business after the first was unreachable (see the `biz`
          resolution above). Guarded on `dirty` so a vendor cannot lose an
          in-progress edit by switching away from it — the old behaviour would
          have silently carried venue A's unsaved fields onto venue B. */}
      {(businesses?.length ?? 0) > 1 && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Icon name="Building2" size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Editing {businesses!.length} businesses — choose one
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {businesses!.map((b) => {
              const isActive = b.id === biz.id
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => {
                    if (b.id === biz.id) return
                    if (dirty && !window.confirm("You have unsaved changes on this business. Switch anyway and lose them?")) return
                    setDirty(false)
                    setPickedId(b.id)
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-left text-xs transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  <span className="block max-w-[220px] truncate">{b.name || `Business #${b.id}`}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {[b.city, b.status].filter(Boolean).join(" · ")}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Label-style switch (Aasaan Roman-Urdu ⇄ Professional English). Sits at
          the top so a vendor who wants plainer words can find it immediately. */}
      <PersonaPreference />


      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Tab rail */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              aria-current={active === t.key}
              className={cn(
                "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon name={t.icon} size={16} />
              <span>{t.label}</span>
              {!t.wired && t.href && <Icon name="ExternalLink" size={12} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="min-w-0 space-y-6">
          {active === "profile" && (
            <Section icon="Building2" title="Profile" desc="How your business appears to couples.">
              <Row label="Business name"><input className={inputCls} value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></Row>
              <Row label="Description"><textarea className={cn(inputCls, "h-28 resize-y py-2")} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Tell couples what makes you special…" /></Row>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Row label="City"><input className={inputCls} value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Row>
                <Row label="Area / locality"><input className={inputCls} value={form.subArea ?? ""} onChange={(e) => set("subArea", e.target.value)} /></Row>
              </div>
              <Row label="Brand logo URL"><input className={inputCls} value={form.brandLogo ?? ""} onChange={(e) => set("brandLogo", e.target.value)} placeholder="https://…" /></Row>
            </Section>
          )}

          {active === "pricing" && (
            <Section icon="DollarSign" title="Capacity & pricing" desc="Guest range, starting price and booking terms.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Row label="Starting price (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.minimumPrice ?? ""} onChange={(e) => set("minimumPrice", e.target.value)} /></Row>
                <Row label="Min guests"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.minCapacity ?? ""} onChange={(e) => set("minCapacity", e.target.value)} /></Row>
                <Row label="Max guests"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.maxCapacity ?? ""} onChange={(e) => set("maxCapacity", e.target.value)} /></Row>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Row label="Advance type">
                  <select className={inputCls} value={form.downPaymentType ?? "Percentage"} onChange={(e) => set("downPaymentType", e.target.value)}>
                    <option value="Percentage">Percentage</option>
                    <option value="Fixed Amount">Fixed amount</option>
                  </select>
                </Row>
                <Row label={form.downPaymentType === "Fixed Amount" ? "Advance (Rs)" : "Advance (%)"}><input type="number" className={cn(inputCls, "tabular-nums")} value={form.downPayment ?? ""} onChange={(e) => set("downPayment", e.target.value)} /></Row>
              </div>
              <Row label="Cancellation policy"><textarea className={cn(inputCls, "h-24 resize-y py-2")} value={form.cancelationPolicy ?? ""} onChange={(e) => set("cancelationPolicy", e.target.value)} placeholder="e.g. Advance non-refundable within 30 days of event." /></Row>
            </Section>
          )}

          {active === "amenities" && (
            <Section icon="SlidersHorizontal" title="Amenities & services" desc="What's included with your service.">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {BOOLS.map((b) => (
                  <label key={String(b.key)} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5 hover:bg-accent/50">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{b.label}</span>
                      <span className="block text-xs text-muted-foreground">{b.hint}</span>
                    </span>
                    <Switch checked={Boolean(form[b.key])} onCheckedChange={(v) => set(String(b.key), v)} aria-label={b.label} />
                  </label>
                ))}
              </div>
            </Section>
          )}

          {active === "type-specific" && (
            <TypeSpecificManager
              business={biz}
              config={getVendorTypeConfig(biz.vendor?.vendorType) ?? { displayName: biz.vendor?.vendorType || "This", typeSpecificFields: [] }}
              onSaved={() => qc.invalidateQueries({ queryKey: ["biz-settings-hub"] })}
            />
          )}
          {active === "listing" && (
            <ProfileContentManager business={biz} onSaved={() => qc.invalidateQueries({ queryKey: ["biz-settings-hub"] })} />
          )}
          {active === "bank" && <BankAccountsManager />}
          {active === "packages" && <PackagesManager businessId={biz.id} />}
          {active === "menus" && <MenusManager businessId={biz.id} />}
          {active === "availability" && <AvailabilityManager businessId={biz.id} />}
          {active === "images" && <ImagesManager businessId={biz.id} images={biz.images || []} />}

          {!tab.wired && tab.href && (
            <Section icon={tab.icon} title={tab.label} desc={tab.hint || ""}>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-4">
                <p className="text-sm text-muted-foreground">This section has a dedicated redesigned screen.</p>
                <a href={tab.href}><Button variant="outline" size="sm"><Icon name="ExternalLink" size={14} className="mr-1.5" /> Open {tab.label.toLowerCase()}</Button></a>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Sticky save bar — only meaningful on wired tabs */}
      {tab.wired && (
        <div
          ref={saveBarRef}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur md:left-[var(--sidebar-width,0)]"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="text-sm text-muted-foreground">{dirty ? <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span> : "All changes saved"}</div>
            <Button disabled={!dirty || saveMut.isPending} onClick={() => saveMut.mutate()}>
              {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Save changes</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ icon, title, desc, children }: { icon: IconName; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name={icon} size={16} /></span>
        <div><h2 className="text-sm font-semibold">{title}</h2>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className={labelCls}>{label}</label>{children}</div>
}

export default BusinessSettingsHubView
