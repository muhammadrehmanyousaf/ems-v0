"use client"

/**
 * Business settings HUB. Tab rail over the business profile. Three core tabs
 * are wired to BusinessesAPI.update (Profile, Capacity & Pricing, Amenities &
 * Services) behind a shared dirty-tracked sticky save bar; the rest render
 * their own managers, which save themselves.
 *
 * Route /dashboard/settings, on whichever business `?biz=` names.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useRouter, useSearchParams } from "next/navigation"
import { CITIES } from "@/lib/seo/constants"
import { useBeforeUnloadGuard } from "@/lib/hooks/useBeforeUnloadGuard"
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
import { VENDOR_TYPES } from "@/lib/vendor-types"
import { PersonaPreference } from "@/components/dashboard/layout/persona-preference"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
// WWL-486 — TourLauncherCard was imported here and never rendered. page.tsx
// renders it deliberately, OUTSIDE this component, so the offer of help
// survives the hub's loading and failure states. The stray import made it look
// as though the card appeared twice; it appears exactly once.
import { FieldError, fieldAria, ERROR_INPUT_CLS } from "@/components/dashboard/primitives/field-error"
import { focusField } from "@/components/dashboard/primitives/focus-field"
import { invalidateBusinessData } from "@/lib/query/business-keys"

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v) || 0)

const labelCls = "text-xs font-medium text-muted-foreground"

// WW-PRICING-OVERHAUL — one-line explainer per pricing mode, shown under the picker.
const PRICING_MODE_HINT: Record<string, string> = {
  "": "We work it out from what you set up — a starting price, packages or menus. Pick a mode below to make it explicit.",
  flat: "One fixed price for the whole booking, whatever the guest count. Best for small halls or a simple set fee.",
  per_head: "Your menu price is multiplied by the guest count (with an optional minimum). The standard catering / big-venue model.",
  package: "Customers choose a named package/tier you've created. Best for photographers, planners and décor.",
  package_plus_menu: "Customers pick a package AND a menu together — the giant-venue hybrid (hall package + per-head food).",
  per_unit: "Price is multiplied by quantity (and days) — e.g. cars, cakes by the pound, cards. Set the unit under packages.",
  quote: "No self-serve price — customers send an enquiry and you reply with a quote. Best for bespoke or luxury work.",
}
/**
 * WW-SETTLEMENT — the terms that decide the FINAL bill.
 *
 * A Pakistani venue booking is not settled when the advance is paid: the bill is
 * max(guaranteed, actual) counted on the night, around a tolerance band, a
 * walk-in rate and child/staff rates. None of it could be expressed, so every
 * venue reconciled the real number on paper.
 *
 * Every field is optional and blank means "not configured", which the server
 * resolves to the conservative reading — no band, children as adults, no
 * deposit. That is exactly today's behaviour, so leaving them all empty changes
 * nothing. Bounds mirror the server's, so the two can't disagree.
 */
const SETTLEMENT_FIELDS: {
  key: keyof ApiBusiness
  label: string
  hint: string
  suffix?: string
  min: number
  max: number
}[] = [
  { key: "securityDepositPkr", label: "Security deposit", hint: "Refundable, held separately from the advance. Never part of the quoted total.", suffix: "Rs", min: 0, max: 10000000 },
  { key: "depositReturnDays", label: "Deposit returned within", hint: "After the post-event inspection.", suffix: "days", min: 0, max: 365 },
  { key: "balanceDueDays", label: "Balance due before event", hint: "", suffix: "days", min: 0, max: 365 },
  { key: "headcountLockDays", label: "Final guest count locks", hint: "After this, changes to the count or menu may cost extra.", suffix: "days before", min: 0, max: 365 },
  { key: "toleranceBandPct", label: "Extra guests at the same rate", hint: "Over the guaranteed number. Most venues allow 10–15%.", suffix: "%", min: 0, max: 100 },
  { key: "walkInRatePerHead", label: "Rate beyond that allowance", hint: "Per head, for guests the kitchen didn't plan for. Blank = charge your normal rate.", suffix: "Rs", min: 0, max: 1000000 },
  { key: "serviceChargePct", label: "Service charge", hint: "Applied before tax.", suffix: "%", min: 0, max: 100 },
  { key: "childUnder5Pct", label: "Children under 5 pay", hint: "0 = free. Blank = full adult rate.", suffix: "%", min: 0, max: 100 },
  { key: "child5to12Pct", label: "Children 5–12 pay", hint: "50 = half rate. Blank = full adult rate.", suffix: "%", min: 0, max: 100 },
  { key: "staffMealRatePkr", label: "Drivers & staff meals", hint: "Per head. Blank = they're billed as ordinary guests.", suffix: "Rs", min: 0, max: 1000000 },
  { key: "advanceTransferMonths", label: "Advance transferable for", hint: "Move a cancelled booking's advance to a new date instead of forfeiting it. Blank = not transferable.", suffix: "months", min: 0, max: 60 },
]

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

/**
 * The editable scalar/boolean fields we own (the rest are separate APIs).
 *
 * WWL-478 — this list was fixed for all 23 vendor types, so a **Wedding venue**
 * was asked *"Travel to client — we come to the venue/home"*, a question a venue
 * cannot meaningfully answer, in the same grid as ones it must. `appliesTo`
 * names the vendor types for which each amenity is a real question; `undefined`
 * means everyone.
 *
 * Two deliberate rules, because this is a live listing and hiding a control is
 * destructive:
 *   - an unknown vendor type sees EVERYTHING (we only hide what we're sure of);
 *   - an amenity the vendor has already answered is always shown, so no stored
 *     answer can become uneditable.
 */
const V = VENDOR_TYPES
const PREMISES = [V.WEDDING_VENUE, V.MARQUEE_RENTAL] as string[]
const FOOD = [V.CATERING, V.LIVE_COOKING_STALL, V.WEDDING_CAKES, V.MITHAI_SWEETS] as string[]

const BOOLS: { key: keyof ApiBusiness; label: string; hint: string; appliesTo?: string[] }[] = [
  { key: "catering", label: "Catering", hint: "We provide food service", appliesTo: [...PREMISES, ...FOOD] },
  { key: "parking", label: "Parking", hint: "On-site parking available", appliesTo: PREMISES },
  {
    key: "provideSoundSystem", label: "Sound system", hint: "PA / DJ setup included",
    appliesTo: [...PREMISES, V.SOUND_SYSTEM_RENTAL, V.DHOL_PLAYER, V.QAWWALI_NAAT, V.CHOREOGRAPHER, V.EVENT_HOST, V.LIVE_STREAMING],
  },
  {
    key: "provideSeatingArrangement", label: "Seating arrangement", hint: "Chairs & tables provided",
    appliesTo: [...PREMISES, V.CATERING, V.FURNITURE_RENTAL],
  },
  { key: "provideWaiter", label: "Waiters", hint: "Serving staff provided", appliesTo: [...PREMISES, V.CATERING, V.LIVE_COOKING_STALL] },
  { key: "providePlate", label: "Crockery & plates", hint: "Tableware provided", appliesTo: [...PREMISES, V.CATERING, V.LIVE_COOKING_STALL, V.FURNITURE_RENTAL] },
  { key: "provideDecorationItem", label: "Decoration", hint: "Decor items provided", appliesTo: [...PREMISES, V.DECORATOR, V.FLORIST] },
  { key: "provideFoodTesting", label: "Food tasting", hint: "Pre-event tasting offered", appliesTo: [...PREMISES, ...FOOD] },
  {
    key: "travelToClientHome", label: "Travel to client", hint: "We come to the venue/home",
    // Everyone who is not a fixed venue. A hall cannot travel to you.
    appliesTo: Object.values(V).filter((t) => t !== V.WEDDING_VENUE) as string[],
  },
  { key: "covidComplaint", label: "SOP compliant", hint: "Follows safety SOPs" },
]

/** Which amenities this vendor should be asked about. See the note above. */
function amenitiesFor(vendorType: string | null | undefined, form: Record<string, any>) {
  const known = vendorType && (Object.values(V) as string[]).includes(vendorType)
  if (!known) return BOOLS
  return BOOLS.filter((b) => !b.appliesTo || b.appliesTo.includes(vendorType!) || form[b.key] != null)
}

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

  /**
   * WWL-475 — `?tab=` and `?biz=` were both READ on mount and neither was ever
   * written back. The note on `?biz` says it "makes the choice linkable and
   * survives a reload", and it does — for whoever constructs the link by hand.
   * A vendor who clicked to Bank details on their second venue still had
   * `/dashboard/settings` in the address bar: nothing to bookmark, nothing to
   * send to support, and both choices lost on reload.
   */
  const router = useRouter()
  const syncUrl = React.useCallback(
    (next: { tab?: TabKey; biz?: number; field?: string | null }) => {
      const qs = new URLSearchParams(searchParams?.toString() ?? "")
      if (next.tab !== undefined) {
        if (next.tab === "profile") qs.delete("tab")
        else qs.set("tab", next.tab)
      }
      if (next.biz !== undefined) qs.set("biz", String(next.biz))
      if (next.field !== undefined) {
        if (next.field) qs.set("field", next.field)
        else qs.delete("field")
      }
      const s = qs.toString()
      router.replace(s ? `?${s}` : "?", { scroll: false })
    },
    [router, searchParams],
  )

  /**
   * Deep-link to a FIELD, not just a tab.
   *
   * The onboarding checklist and the Listing-health prompts below both said
   * "fix this" and then dropped the vendor at the top of the tab. Listing
   * content alone is thirty-odd inputs, so "add your WhatsApp number" meant
   * "start reading". Every link now carries `&field=<id>`; this resolves it
   * once the tab body has mounted (focus-field.ts polls, because the panel is
   * not in the DOM at click time).
   *
   * The param is stripped straight afterwards: it is an instruction for this
   * navigation, not a property of the page, and leaving it in the URL would
   * re-yank the vendor's cursor on every reload while they were mid-edit.
   */
  const goTab = React.useCallback(
    (key: TabKey, field?: string) => {
      setActive(key)
      syncUrl({ tab: key, field: null })
      if (field) focusField(field)
    },
    [syncUrl],
  )

  const fieldParam = searchParams?.get("field") ?? null
  const consumedField = React.useRef<string | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const loadedId = React.useRef<number | null>(null)
  const [form, setForm] = React.useState<Record<string, any>>({})
  // WWL-472 — what was loaded, so the save can send only what changed.
  const [baseline, setBaseline] = React.useState<Record<string, any>>({})

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
        /**
         * WWL-472 — this used to be `biz.downPaymentType ?? "Percentage"`, so
         * a venue with NO advance terms loaded as though it had chosen a
         * percentage advance, and any save wrote "Percentage" to the record.
         * The paired `downPayment` stays null, leaving "10% of nothing"-shaped
         * state on a live listing. An empty string keeps "not set" as "not set".
         */
        downPaymentType: biz.downPaymentType ?? "",
        downPayment: biz.downPayment ?? "",
        cancelationPolicy: biz.cancelationPolicy ?? "",
        // WW-PRICING-OVERHAUL — vendor-declared pricing mode ("" = not set = legacy).
        pricingMode: biz.pricingMode ?? "",
        // WW-RATECARD — the per_unit knobs live in pricingConfigJson. Flattened
        // into the form so they edit like any other field, and folded back on save.
        unitLabel: (biz.pricingConfigJson as any)?.unitLabel ?? "",
        unitPricePkr: (biz.pricingConfigJson as any)?.unitPricePkr ?? "",
        minUnitQty: (biz.pricingConfigJson as any)?.minUnitQty ?? "",
        // WW-BOOKING-MODE — do you accept a booking before payment? "" = legacy instant.
        bookingMode: biz.bookingMode ?? "",
        // WW-SETTLEMENT — terms that decide the FINAL bill. "" = not
        // configured, which every reader resolves to the conservative default.
        ...Object.fromEntries(SETTLEMENT_FIELDS.map((f) => [f.key, biz[f.key] ?? ""])),
        /**
         * `Boolean(null)` is `false`, so an amenity nobody has answered loaded
         * as an explicit "we do not provide this". Kept as null here, and the
         * save below only sends what actually changed — on a public listing
         * "not specified" and "we don't provide this" are different statements,
         * and this used to convert the first into the second invisibly.
         */
        ...Object.fromEntries(BOOLS.map((b) => [b.key, biz[b.key] ?? null])),
      })
      setBaseline({
        name: biz.name ?? "",
        description: biz.description ?? "",
        city: biz.city ?? "",
        subArea: biz.subArea ?? "",
        brandLogo: biz.brandLogo ?? "",
        minimumPrice: biz.minimumPrice ?? "",
        minCapacity: biz.minCapacity ?? "",
        maxCapacity: biz.maxCapacity ?? "",
        downPaymentType: biz.downPaymentType ?? "",
        downPayment: biz.downPayment ?? "",
        cancelationPolicy: biz.cancelationPolicy ?? "",
        pricingMode: biz.pricingMode ?? "",
        // WW-RATECARD — the per_unit knobs live in pricingConfigJson. Flattened
        // into the form so they edit like any other field, and folded back on save.
        unitLabel: (biz.pricingConfigJson as any)?.unitLabel ?? "",
        unitPricePkr: (biz.pricingConfigJson as any)?.unitPricePkr ?? "",
        minUnitQty: (biz.pricingConfigJson as any)?.minUnitQty ?? "",
        bookingMode: biz.bookingMode ?? "",
        // WW-SETTLEMENT — terms that decide the FINAL bill. "" = not
        // configured, which every reader resolves to the conservative default.
        ...Object.fromEntries(SETTLEMENT_FIELDS.map((f) => [f.key, biz[f.key] ?? ""])),
        ...Object.fromEntries(BOOLS.map((b) => [b.key, biz[b.key] ?? null])),
      })
      setDirty(false)
    }
  }, [biz])

  const set = (k: string, v: any) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true) }

  /*
   * Capacity & pricing had NO client-side validation at all. Verified live on
   * production: a starting price of -5000, min guests 900 with max guests 100,
   * and a 500% advance were all accepted by the form — Save stayed enabled, no
   * field showed an error, aria-invalid was null on every input, and the number
   * inputs carried no min/max so the browser's own spinner offered negatives.
   *
   * The API does reject all three, correctly and with good messages. But it
   * returns ONE message per round-trip, so a vendor who got two fields wrong
   * fixed one, pressed Save again, and got scolded about the next — with the
   * form blanking nothing and no indication of WHICH field was at fault. The
   * rules below mirror the server's exactly, so the vendor sees every problem
   * at once, against the right input, before any request is sent.
   */
  const numOf = (v: any) => (String(v ?? "").trim() === "" ? null : Number(v))
  const pricingErrs = (() => {
    const price = numOf(form.minimumPrice)
    const minC = numOf(form.minCapacity)
    const maxC = numOf(form.maxCapacity)
    const adv = numOf(form.downPayment)
    const isPct = (form.downPaymentType ?? "Percentage") !== "Fixed Amount"
    return {
      minimumPrice:
        price !== null && (!Number.isFinite(price) || price < 0)
          ? "Starting price can't be negative."
          : undefined,
      minCapacity:
        minC !== null && (!Number.isFinite(minC) || minC < 0)
          ? "Minimum guests can't be negative."
          : undefined,
      maxCapacity:
        maxC !== null && (!Number.isFinite(maxC) || maxC < 1)
          ? "Maximum guests must be at least 1."
          : maxC !== null && minC !== null && maxC < minC
            ? "Maximum guests can't be less than minimum guests."
            : undefined,
      downPayment:
        adv === null || !Number.isFinite(adv)
          ? undefined
          : adv < 0
            ? "Advance can't be negative."
            : isPct && adv > 100
              ? "A percentage advance can't be more than 100%."
              : undefined,
    }
  })()
  const hasPricingError = Object.values(pricingErrs).some(Boolean)

  /**
   * WWL-477 — Brand logo is a text field asking a venue owner to paste a URL,
   * one tab away from Images, which is a real uploader with size limits, type
   * checks and mapped errors. Two image-input paradigms in one hub, and the one
   * a vendor is least equipped to use guards their brand. Replacing it with an
   * uploader is a bigger change than this sweep should make; validating it is
   * not. `http://` is rejected outright — the site is https, so an insecure
   * image is a broken image.
   */
  const logoErr = (() => {
    const raw = String(form.brandLogo ?? "").trim()
    if (!raw) return undefined
    let u: URL
    try { u = new URL(raw) } catch { return "Paste a full web address, starting with https://" }
    if (u.protocol === "http:") return "Use an https:// address — an http image won't load on your listing."
    if (u.protocol !== "https:") return "Paste a full web address, starting with https://"
    return undefined
  })()

  /**
   * City is free text on a marketplace whose public URLs are
   * /{type}/{city}/{slug} and whose whole SEO programme is city pages. A typo
   * doesn't fail — it files the listing under a city that does not exist.
   *
   * Not blocking: Pakistan has more cities than CITIES lists, and refusing to
   * save would lock out a genuinely unlisted vendor. Saying what the cost is,
   * with the canonical list one keystroke away, is the honest middle.
   */
  const cityKnown = (() => {
    const raw = String(form.city ?? "").trim().toLowerCase()
    if (!raw) return true
    return CITIES.some((c) => c.name.toLowerCase() === raw || c.slug === raw.replace(/\s+/g, "-"))
  })()

  const hasBlockingError = hasPricingError || !!logoErr

  /**
   * WWL-483 — BankAccountsManager deliberately arms this guard while a field is
   * typed, and wrote down why: an IBAN is "24 characters typed off a chequebook,
   * gone" on an accidental refresh. The hub's own tabs had no guard at all and
   * no draft layer either, so a vendor who rewrote their description, their
   * pricing and their amenities and then hit reload lost all three silently.
   */
  const [listingDirty, setListingDirty] = React.useState(false)
  useBeforeUnloadGuard({ enabled: dirty || listingDirty })

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
    // Publish the whole strip this bar occupies measured up from the viewport
    // bottom, not just its own height — on mobile the bar now sits ABOVE the
    // bottom nav, so height alone would under-report and put the prompt back on
    // top of Save.
    const publish = () =>
      root.style.setProperty(
        "--ww-bottom-bar",
        `${Math.max(0, Math.round(window.innerHeight - el.getBoundingClientRect().top))}px`,
      )
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    window.addEventListener("resize", publish)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", publish)
      root.style.removeProperty("--ww-bottom-bar")
    }
  })

  /**
   * WWL-472 — the save used to send every owned field on every save, so
   * toggling one amenity switch on a venue with eight unanswered ones wrote
   * seven explicit `false`s and a `downPaymentType` the vendor never chose.
   * Verified live on 3359: one click on *Sound system* produced a PATCH that
   * answered eight questions. The same payload went from EVERY tab, so a
   * vendor correcting a typo in their venue's name silently declared they
   * provide no seating, no waiters, no plates, no decoration, no food testing,
   * no travel and no COVID compliance — and picked an advance type.
   *
   * This is what PATCH means: send the fields that changed. Everything else is
   * left exactly as the record has it, including "not answered".
   */
  const buildPatch = React.useCallback(() => {
    const next: Record<string, any> = {
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
      // WW-PRICING-OVERHAUL — "" (Auto) sends null, restoring legacy inferred pricing.
      pricingMode: form.pricingMode || null,
      /**
       * WW-RATECARD — fold the flattened per-unit knobs back into the JSON
       * column they live in.
       *
       * Only sent for `per_unit`. Under any other mode they mean nothing, and
       * writing them would leave a stale unit price behind a vendor who has
       * since switched to packages — the sort of leftover that reads as
       * configuration long after it stopped applying.
       *
       * `null` when the mode is anything else, which the server treats as
       * "clear it".
       */
      pricingConfigJson:
        form.pricingMode === "per_unit"
          ? {
              unitLabel: String(form.unitLabel ?? "").trim() || null,
              unitPricePkr: numOrNull(String(form.unitPricePkr ?? "")),
              minUnitQty: numOrNull(String(form.minUnitQty ?? "")),
            }
          : null,
      // WW-BOOKING-MODE — "" sends null, which reads as the legacy `instant`.
      bookingMode: form.bookingMode || null,
      // WW-SETTLEMENT — "" sends null, which clears a term back to "not
      // configured" rather than sticking at a value the vendor never meant.
      ...Object.fromEntries(
        SETTLEMENT_FIELDS.map((f) => [f.key, numOrNull(String(form[f.key] ?? ""))]),
      ),
      // A boolean the vendor has not touched stays null — unanswered — rather
      // than becoming an explicit "we don't provide this".
      ...Object.fromEntries(
        BOOLS.map((b) => [b.key, form[b.key] == null ? null : Boolean(form[b.key])]),
      ),
    }
    const prev: Record<string, any> = {
      ...baseline,
      minimumPrice: numOrNull(String(baseline.minimumPrice ?? "")),
      minCapacity: numOrNull(String(baseline.minCapacity ?? "")),
      maxCapacity: numOrNull(String(baseline.maxCapacity ?? "")),
      downPayment: numOrNull(String(baseline.downPayment ?? "")),
      description: baseline.description || null,
      city: baseline.city || null,
      subArea: baseline.subArea || null,
      brandLogo: baseline.brandLogo || null,
      downPaymentType: baseline.downPaymentType || null,
      cancelationPolicy: baseline.cancelationPolicy || null,
      pricingMode: baseline.pricingMode || null,
      // Built the same way as `next` above so the diff below compares like with
      // like. Without a counterpart here it would differ on every render.
      pricingConfigJson:
        (baseline.pricingMode || null) === "per_unit"
          ? {
              unitLabel: String(baseline.unitLabel ?? "").trim() || null,
              unitPricePkr: numOrNull(String(baseline.unitPricePkr ?? "")),
              minUnitQty: numOrNull(String(baseline.minUnitQty ?? "")),
            }
          : null,
      bookingMode: baseline.bookingMode || null,
      ...Object.fromEntries(
        SETTLEMENT_FIELDS.map((f) => [f.key, numOrNull(String(baseline[f.key] ?? ""))]),
      ),
    }
    const patch: Record<string, any> = {}
    for (const [k, v] of Object.entries(next)) {
      // Objects are compared by value. `!==` on two structurally identical
      // objects is always true, so `pricingConfigJson` would land in every
      // patch and the sticky save bar would never go away — the form would
      // read as permanently dirty on a screen nobody had touched.
      const changed =
        v !== null && typeof v === "object"
          ? JSON.stringify(v) !== JSON.stringify(prev[k] ?? null)
          : v !== prev[k]
      if (changed) patch[k] = v
    }
    // The name is the one field the API treats as required on this route.
    if (Object.keys(patch).length > 0 && patch.name === undefined) patch.name = form.name
    return patch
  }, [form, baseline])

  /** Which wired tab the unsaved edit is on — so the save bar can name it. */
  const dirtyTabLabel = React.useMemo(() => {
    if (!dirty) return null
    const patch = buildPatch()
    const changed = Object.keys(patch).filter((k) => k !== "name" || patch.name !== baseline.name)
    const inTab: Record<string, string[]> = {
      Profile: ["name", "description", "city", "subArea", "brandLogo"],
      // `pricingMode` was missing here, so a vendor who changed only how they
      // charge got a save bar that could not name the tab it belonged to.
      "Capacity & pricing": ["minimumPrice", "minCapacity", "maxCapacity", "downPaymentType", "downPayment", "cancelationPolicy", "bookingMode", "pricingMode", "pricingConfigJson", ...SETTLEMENT_FIELDS.map((f) => String(f.key))],
      "Amenities & services": BOOLS.map((b) => String(b.key)),
    }
    const hit = Object.entries(inTab).filter(([, keys]) => changed.some((c) => keys.includes(c)))
    if (hit.length === 1) return hit[0][0]
    return hit.length > 1 ? "this business" : null
  }, [dirty, buildPatch, baseline.name])

  /**
   * Resolve an incoming `?field=` deep link.
   *
   * Deliberately gated on `biz`. The first version fired on mount and hunted
   * for the element straight away — but the tab body does not exist until the
   * businesses query resolves, and the fields inside it mount after that.
   * Measured on the running app: `lc-owner-name` first appeared in the DOM
   * roughly five seconds after navigation, by which time a poll started at
   * hydration had already given up, so the vendor landed on the right tab at
   * scrollTop 0 with the cursor nowhere. Waiting for the data means the hunt
   * starts when the field can actually exist.
   *
   * The param survives until the field is genuinely reached (`focusField`'s
   * callback), so a slow load cannot silently swallow the instruction.
   */
  React.useEffect(() => {
    if (!fieldParam || !biz || consumedField.current === fieldParam) return
    consumedField.current = fieldParam
    focusField(fieldParam, () => syncUrl({ field: null }))
  }, [fieldParam, biz, syncUrl])

  /**
   * WW-RATECARD — the server's verdict on whether "How you charge" matches what
   * this business actually has set up.
   *
   * The mode was validated against an enum, saved, and published on the public
   * payload, and checked against nothing. A Lahore venue on production declares
   * per-head with no menus and a Rs 1,850 "starting price", so a 400-guest
   * wedding totals Rs 1,850 rather than Rs 740,000 — the platform took the
   * declaration and quietly did something else.
   *
   * The save is never blocked on it. Holding a vendor out of their own settings
   * because we disagree with their setup is worse than telling them plainly.
   */
  const [pricingCoherence, setPricingCoherence] = React.useState<{
    mode: string | null
    status: "ok" | "warning" | "error"
    findings: { severity: "error" | "warning"; code: string; message: string; fix: string }[]
  } | null>(null)

  const saveMut = useMutation({
    mutationFn: () => BusinessesAPI.update(biz!.id, buildPatch() as Partial<ApiBusiness>),
    /* One business record is cached under three query keys across the
       dashboard; invalidating only this screen's own is what left every other
       screen — and the checklist that sent the vendor here — showing the old
       value until a browser reload. See lib/query/business-keys.ts. */
    onSuccess: (res: any) => {
      showSuccessToast("Business profile saved")
      setDirty(false)
      invalidateBusinessData(qc)
      // The save has already committed; the verdict rides along with the reply.
      const c = res?.pricingCoherence ?? res?.data?.pricingCoherence ?? null
      setPricingCoherence(c && c.status !== "ok" ? c : null)
    },
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
        errorMessage(e, "Couldn't save your changes."),
        { duration: 8000 },
      ),
  })

  if (isLoading) return <div className="p-4 md:p-6"><DetailSkeleton /></div>
  if (isError || !biz) {
    return <div className="p-4 md:p-6"><EmptyState icon="Building2" title="No business found" description="Create your business profile first." /></div>
  }

  const tab = TABS.find((t) => t.key === active)!

  return (
    /**
     * The save bar is `fixed`, so it takes no space in the flow and the page
     * has to reserve it. `pb-24` was a guess at 96px — and the bar sits above
     * the mobile nav, so the strip it actually occupies is its own height PLUS
     * `--ww-mobile-nav`, which on a phone is another 64px. Measured on the
     * Profile tab, the last field's helper text cleared the bar by 4px: not
     * technically covered, but flush against it with nothing below, which reads
     * as cut off and leaves no room to scroll it clear.
     *
     * The bar already measures itself and publishes `--ww-bottom-bar` (it has
     * to, so the PWA prompt can get out of its way). Consuming that same value
     * means the reservation is the real height plus a comfortable gap, on every
     * tab and every viewport, instead of a number that happened to be nearly
     * right on one of them.
     */
    <div
      className="space-y-6 p-4 md:p-6"
      style={{ paddingBottom: "calc(var(--ww-bottom-bar, 6rem) + 2rem)" }}
    >
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
                    /* WWL-484 — the guard only knew about the hub's own `dirty`
                       flag, so unsaved edits in Listing content (which keeps its
                       own state and its own save button) were carried away
                       without a word. */
                    if ((dirty || listingDirty) &&
                        !window.confirm("You have unsaved changes on this business. Switch anyway and lose them?")) return
                    setDirty(false)
                    setListingDirty(false)
                    setPickedId(b.id)
                    syncUrl({ biz: b.id })
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
        {/* WWL-482 — eleven tabs in a horizontal scroller. Measured at 360×740:
            scrollWidth 1,516px against clientWidth 296px, so Availability sat
            over four screen-widths to the right of Profile with no shadow, no
            chevron and nothing to suggest eight more tabs existed. Wrapping
            costs a little vertical space and makes every section visible at
            once; the rail is unchanged from `lg` up. */}
        {/* Sticky from `lg` up.
            The rail scrolled away with the content, so a vendor eleven sections
            deep in Listing content had to scroll the whole form back to the top
            to reach Packages — on a screen whose entire purpose is moving
            between sections. `self-start` is the load-bearing part: a grid item
            stretches to the row height by default, which makes `sticky` a no-op
            because the element is already as tall as its container. The rail
            gets its own scrollbar too, since eleven items plus a short viewport
            is a real combination. */}
        <nav
          className="flex flex-wrap gap-1 lg:sticky lg:top-0 lg:z-10 lg:max-h-[calc(100dvh-2rem)] lg:flex-col lg:flex-nowrap lg:self-start lg:overflow-y-auto lg:overflow-x-clip lg:bg-background lg:pb-2"
          aria-label="Settings sections"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => goTab(t.key)}
              aria-current={active === t.key}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:w-full",
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
            <>
              <ListingHealth biz={biz} form={form} onGo={goTab} />
              {/* WWL-480 — Capacity & pricing was given proper field wiring when
                  its validation was added; the tabs beside it were not, so all
                  five Profile labels had htmlFor null and no input carried an
                  id. Two labelling conventions in one hub. */}
              <Section icon="Building2" title="Profile" desc="How your business appears to couples.">
                <Row id="biz-name" label="Business name">
                  <input id="biz-name" className={inputCls} value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </Row>
                <Row id="biz-desc" label="Description">
                  <textarea id="biz-desc" className={cn(inputCls, "h-28 resize-y py-2")} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Tell couples what makes you special…" />
                </Row>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Row id="biz-city" label="City">
                    <input
                      id="biz-city"
                      list="ww-cities"
                      className={inputCls}
                      value={form.city ?? ""}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Start typing…"
                    />
                    <datalist id="ww-cities">
                      {CITIES.map((c) => <option key={c.slug} value={c.name} />)}
                    </datalist>
                    {!cityKnown && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        We don&apos;t have a city page for &ldquo;{String(form.city).trim()}&rdquo;. Your listing still
                        works, but couples browsing by city won&apos;t find it there — pick from the list if one matches.
                      </p>
                    )}
                  </Row>
                  <Row id="biz-subarea" label="Area / locality">
                    <input id="biz-subarea" className={inputCls} value={form.subArea ?? ""} onChange={(e) => set("subArea", e.target.value)} />
                  </Row>
                </div>
                <Row id="biz-logo" label="Brand logo URL">
                  <input
                    id="biz-logo"
                    type="url"
                    inputMode="url"
                    className={cn(inputCls, logoErr && ERROR_INPUT_CLS)}
                    value={form.brandLogo ?? ""}
                    onChange={(e) => set("brandLogo", e.target.value)}
                    placeholder="https://…"
                    {...fieldAria("biz-logo", logoErr)}
                  />
                  <FieldError id="biz-logo" message={logoErr} />
                  <p className="text-xs text-muted-foreground">
                    A link to an image you already host. To upload one instead, use{" "}
                    <button type="button" className="underline underline-offset-2" onClick={() => goTab("images")}>
                      Images
                    </button>.
                  </p>
                </Row>
              </Section>
            </>
          )}

          {active === "pricing" && (
            <Section icon="DollarSign" title="Capacity & pricing" desc="Guest range, starting price and booking terms.">
              {/* WW-PRICING-OVERHAUL — vendor chooses how they are booked. "Auto"
                  ("" -> null) keeps the legacy inferred behaviour (byte-for-byte
                  unchanged), so nothing changes until the vendor picks a mode. */}
              <Row label="How you charge">
                <select
                  id="biz-pricingmode"
                  className={inputCls}
                  value={form.pricingMode ?? ""}
                  onChange={(e) => set("pricingMode", e.target.value)}
                >
                  <option value="">Auto (decide from packages &amp; menus)</option>
                  <option value="flat">Flat — one price, any guest count</option>
                  <option value="per_head">Per head — price × guests (menus)</option>
                  <option value="package">Packages — pick a tier</option>
                  <option value="package_plus_menu">Package + menu (venue hybrid)</option>
                  <option value="per_unit">Per unit — × quantity / days</option>
                  <option value="quote">Quote — request a price</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {PRICING_MODE_HINT[form.pricingMode || ""] ?? PRICING_MODE_HINT[""]}
                </p>

                {/* WW-RATECARD — what the server made of the last save.
                    Shown here rather than as a toast because it is a thing to
                    read and act on, not a thing to acknowledge and dismiss. */}
                {pricingCoherence && pricingCoherence.findings.length > 0 && (
                  <div
                    className={cn(
                      "mt-2 rounded-lg border p-3 text-sm",
                      pricingCoherence.status === "error"
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-amber-300 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20",
                    )}
                  >
                    <p className="font-medium">
                      {pricingCoherence.status === "error"
                        ? "This doesn't match how you're set up"
                        : "Worth knowing"}
                    </p>
                    <ul className="mt-1.5 space-y-2">
                      {pricingCoherence.findings.map((f) => (
                        <li key={f.code}>
                          <span
                            className={
                              f.severity === "error"
                                ? "text-destructive"
                                : "text-amber-800 dark:text-amber-300"
                            }
                          >
                            {f.message}
                          </span>
                          <span className="block text-xs text-muted-foreground">{f.fix}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Your changes are saved either way — this is a heads-up, not a block.
                    </p>
                  </div>
                )}

                {/* WW-RATECARD — the per-unit knobs.
                    `per_unit` was offered in the picker with nowhere to set the
                    unit or its price, so choosing it was a dead end: the mode
                    saved, and there was nothing for the engine to multiply.
                    Shown only for this mode — they mean nothing under any other. */}
                {form.pricingMode === "per_unit" && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className={labelCls} htmlFor="biz-unitlabel">What is one unit?</label>
                      <input
                        id="biz-unitlabel" className={inputCls} maxLength={40}
                        placeholder="car · kilo · card · hour"
                        value={form.unitLabel ?? ""}
                        onChange={(e) => set("unitLabel", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Named the way a customer would say it.</p>
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls} htmlFor="biz-unitprice">Price per unit (Rs)</label>
                      <input
                        id="biz-unitprice" type="number" min={0} step="1" inputMode="numeric"
                        className={cn(inputCls, "tabular-nums")}
                        value={form.unitPricePkr ?? ""}
                        onChange={(e) => set("unitPricePkr", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls} htmlFor="biz-minunits">Minimum units</label>
                      <input
                        id="biz-minunits" type="number" min={0} step="1" inputMode="numeric"
                        className={cn(inputCls, "tabular-nums")}
                        value={form.minUnitQty ?? ""}
                        onChange={(e) => set("minUnitQty", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Blank = no minimum.</p>
                    </div>
                  </div>
                )}
              </Row>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Row label="Starting price (Rs)">
                  <input
                    id="biz-minprice" type="number" min={0} step="1" inputMode="numeric"
                    className={cn(inputCls, "tabular-nums", pricingErrs.minimumPrice && ERROR_INPUT_CLS)}
                    value={form.minimumPrice ?? ""}
                    onChange={(e) => set("minimumPrice", e.target.value)}
                    {...fieldAria("biz-minprice", pricingErrs.minimumPrice)}
                  />
                  <FieldError id="biz-minprice" message={pricingErrs.minimumPrice} />
                </Row>
                <Row label="Min guests">
                  <input
                    id="biz-mincap" type="number" min={0} step="1" inputMode="numeric"
                    className={cn(inputCls, "tabular-nums", pricingErrs.minCapacity && ERROR_INPUT_CLS)}
                    value={form.minCapacity ?? ""}
                    onChange={(e) => set("minCapacity", e.target.value)}
                    {...fieldAria("biz-mincap", pricingErrs.minCapacity)}
                  />
                  <FieldError id="biz-mincap" message={pricingErrs.minCapacity} />
                </Row>
                <Row label="Max guests">
                  <input
                    id="biz-maxcap" type="number" min={1} step="1" inputMode="numeric"
                    className={cn(inputCls, "tabular-nums", pricingErrs.maxCapacity && ERROR_INPUT_CLS)}
                    value={form.maxCapacity ?? ""}
                    onChange={(e) => set("maxCapacity", e.target.value)}
                    {...fieldAria("biz-maxcap", pricingErrs.maxCapacity)}
                  />
                  <FieldError id="biz-maxcap" message={pricingErrs.maxCapacity} />
                </Row>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Row label="Advance type">
                  <select className={inputCls} value={form.downPaymentType ?? "Percentage"} onChange={(e) => set("downPaymentType", e.target.value)}>
                    <option value="Percentage">Percentage</option>
                    <option value="Fixed Amount">Fixed amount</option>
                  </select>
                </Row>
                <Row label={form.downPaymentType === "Fixed Amount" ? "Advance (Rs)" : "Advance (%)"}>
                  <input
                    id="biz-advance" type="number" min={0}
                    max={form.downPaymentType === "Fixed Amount" ? undefined : 100}
                    step="0.01" inputMode="decimal"
                    className={cn(inputCls, "tabular-nums", pricingErrs.downPayment && ERROR_INPUT_CLS)}
                    value={form.downPayment ?? ""}
                    onChange={(e) => set("downPayment", e.target.value)}
                    {...fieldAria("biz-advance", pricingErrs.downPayment)}
                  />
                  <FieldError id="biz-advance" message={pricingErrs.downPayment} />
                </Row>
              </div>
              <Row id="biz-cancellation" label="Cancellation policy"><textarea id="biz-cancellation" className={cn(inputCls, "h-24 resize-y py-2")} value={form.cancelationPolicy ?? ""} onChange={(e) => set("cancelationPolicy", e.target.value)} placeholder="e.g. Advance non-refundable within 30 days of event." /></Row>

              {/* WW-BOOKING-MODE — the flow has been instant-book: a customer
                  picks a date, pays, and the vendor finds out afterwards. No
                  Pakistani marquee sells a peak Saturday that way. This lets a
                  venue say it wants to see the request first.

                  "" = the legacy instant behaviour, so nobody's venue changes
                  on deploy — it is an opt-in, not a migration. Lives here
                  beside the advance and cancellation terms because these are
                  all "how you sell"; a dedicated Booking rules tab is the
                  eventual home once the other rules land. */}
              <Row id="biz-booking-mode" label="When a customer books">
                <select
                  id="biz-booking-mode"
                  className={inputCls}
                  value={form.bookingMode ?? ""}
                  onChange={(e) => set("bookingMode", e.target.value)}
                >
                  <option value="">Confirm as soon as they pay (default)</option>
                  <option value="request">I accept the request first, then they pay</option>
                  <option value="inquiry_only">Enquiries only — I&apos;ll contact them</option>
                </select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {form.bookingMode === "request"
                    ? "Requests appear on the booking, with Accept and Decline. We only ask for the advance once you've accepted — good for peak dates you want to control."
                    : form.bookingMode === "inquiry_only"
                      ? "Your listing takes enquiries instead of bookings. Nothing is held and nothing is charged."
                      : "Fastest for the customer, but a booking can be made without you seeing it first."}
                </p>
              </Row>

              {/* ── WW-SETTLEMENT — what the customer is finally billed ──────
                  Leave any of these blank and nothing changes: the booking
                  settles the way it does today. Filled in, they are quoted to
                  the customer BEFORE they pay and applied on the night, which
                  is the difference between an agreed number and an argument. */}
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground">Final bill &amp; settlement</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  All optional. Customers are billed for the greater of their guaranteed
                  count and who actually attends — these terms say what happens around that.
                </p>
              </div>
              {SETTLEMENT_FIELDS.map((f) => (
                <Row key={String(f.key)} id={`biz-${String(f.key)}`} label={f.label}>
                  <div className="flex items-center gap-2">
                    <input
                      id={`biz-${String(f.key)}`}
                      type="number"
                      min={f.min}
                      max={f.max}
                      step={1}
                      inputMode="numeric"
                      className={inputCls}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder="—"
                    />
                    {f.suffix && (
                      <span className="shrink-0 text-xs text-muted-foreground">{f.suffix}</span>
                    )}
                  </div>
                  {f.hint && <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>}
                </Row>
              ))}
            </Section>
          )}

          {active === "amenities" && (
            <Section icon="SlidersHorizontal" title="Amenities & services" desc="What's included with your service.">
              <div id="biz-amenities" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {amenitiesFor(biz.vendor?.vendorType, form).map((b) => (
                  <label key={String(b.key)} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5 hover:bg-accent/50">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{b.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {/* WWL-472 — an off switch and an unanswered question look
                            identical, and on a public listing they say different
                            things. Only the ones you have actually answered are
                            published as "we don't provide this". */}
                        {form[b.key] == null ? "Not answered yet" : b.hint}
                      </span>
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
              onSaved={() => invalidateBusinessData(qc)}
            />
          )}
          {active === "listing" && (
            /* Keyed on the business id: this manager seeds ~30 useState
               initialisers from the business prop, and those run once per
               mount — without the key, switching venue left venue A's listing
               content sitting in venue B's form. */
            <ProfileContentManager
              key={biz.id}
              business={biz}
              onDirtyChange={setListingDirty}
              onSaved={() => invalidateBusinessData(qc)}
            />
          )}
          {active === "bank" && <BankAccountsManager />}
          {active === "packages" && <PackagesManager businessId={biz.id} />}
          {active === "menus" && (
            <MenusManager
              businessId={biz.id}
              minCapacity={biz.minCapacity ?? null}
              maxCapacity={biz.maxCapacity ?? null}
            />
          )}
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

      {/* Sticky save bar.
          WWL-484 — this used to render on wired tabs only, so a vendor who
          edited Profile and then opened Images watched their save button
          disappear: the edit was still there, held in hub-level state, with
          nothing on screen to say so. Switching BUSINESS prompted, switching
          TAB was silent, and the two were indistinguishable. The bar now
          follows the unsaved work instead of the tab, and names where it is. */}
      {(tab.wired || dirty) && (
        <div
          ref={saveBarRef}
          style={{ bottom: "var(--ww-mobile-nav, 0px)" }}
          className="fixed inset-x-0 z-20 border-t border-border bg-background/95 backdrop-blur md:left-[var(--sidebar-width,0)]"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6">
            {/* A disabled Save must say WHY, or it reads as a broken button. */}
            <div className="text-sm text-muted-foreground">
              {hasBlockingError
                ? <span className="text-destructive">Fix the highlighted fields above to save.</span>
                : dirty
                  ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      Unsaved changes{!tab.wired && dirtyTabLabel ? ` on ${dirtyTabLabel}` : ""}
                    </span>
                  )
                  : "All changes saved"}
            </div>
            <Button disabled={!dirty || hasBlockingError || saveMut.isPending} onClick={() => saveMut.mutate()}>
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

function Row({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

/**
 * WWL-476 — read live from this account's three approved, publicly listed
 * venues: two had NO photographs at all and the third had one; all three had an
 * empty cancellation policy and no brand logo; two had no advance terms. All
 * three are live on a marketplace where couples choose by looking.
 *
 * That is the vendor's own data rather than a code defect — but this is the
 * screen it belongs to, and the screen said nothing. No completeness meter, no
 * "your listing is missing photos" prompt, nothing. Each gap links to the tab
 * that fixes it, because a prompt that doesn't hand you the tool is just a
 * complaint.
 */
function ListingHealth({
  biz, form, onGo,
}: { biz: ApiBusiness; form: Record<string, any>; onGo: (t: TabKey, field?: string) => void }) {
  const photos = biz.images?.length ?? 0
  /**
   * Each gap carries the FIELD that fixes it, not just the tab.
   *
   * "Fix it" switched the tab and stopped. For photographs that is fine — the
   * uploader is the whole tab. For "No advance terms set" it dropped the vendor
   * on Capacity & pricing, which has six inputs, and left them to work out
   * which two of them meant "advance". Same click, same intent, now the cursor
   * is already in the box.
   */
  const gaps: { label: string; tab: TabKey; field?: string; severe?: boolean }[] = []
  if (photos === 0) gaps.push({ label: "No photographs — couples choose by looking", tab: "images", severe: true })
  else if (photos < 5) gaps.push({ label: `Only ${photos} photograph${photos === 1 ? "" : "s"} — aim for at least 5`, tab: "images" })
  if (!String(form.description ?? "").trim()) gaps.push({ label: "No description", tab: "profile", field: "biz-desc", severe: true })
  if (!String(form.cancelationPolicy ?? "").trim()) gaps.push({ label: "No cancellation policy — couples ask before they book", tab: "pricing", field: "biz-cancellation" })
  if (!String(form.downPayment ?? "").trim()) gaps.push({ label: "No advance terms set", tab: "pricing", field: "biz-advance" })
  if (!String(form.brandLogo ?? "").trim()) gaps.push({ label: "No brand logo", tab: "profile", field: "biz-logo" })
  if (!String(form.minimumPrice ?? "").trim()) gaps.push({ label: "No starting price", tab: "pricing", field: "biz-minprice" })

  if (gaps.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <Icon name="CheckCircle2" size={16} className="text-emerald-600 dark:text-emerald-400" />
        Your listing has everything couples look for.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
      <div className="flex items-center gap-2">
        <Icon name="AlertTriangle" size={16} className="text-amber-600 dark:text-amber-400" />
        <h2 className="text-sm font-semibold">
          {gaps.length} thing{gaps.length === 1 ? "" : "s"} missing from this listing
        </h2>
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {gaps.map((g) => (
          <li key={g.label} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={cn(g.severe && "font-medium")}>{g.label}</span>
            <button
              type="button"
              className="underline underline-offset-2 text-muted-foreground hover:text-foreground"
              onClick={() => onGo(g.tab, g.field)}
            >
              Fix it
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BusinessSettingsHubView
