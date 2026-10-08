"use client"

/**
 * WW-ADDBIZ — a vendor adds another business from inside the portal.
 *
 * Reached from the venue switcher ("Add a business", last row) and from Business
 * settings. It is a SHORT form on purpose, not the public sign-up wizard:
 *
 *   - The vendor is already signed in. The business attaches to THIS account, so
 *     there is no second email, phone number or password to enter.
 *   - Only what is new is asked: name, city, a starting price and a few key
 *     details. Photos, packages, menus and the rest are added in Business
 *     settings, where the vendor lands afterwards.
 *   - The business type is the account's (it lives on the user, not the
 *     business, so every business on an account shares it) and is shown, not asked.
 *
 * POST /api/v1/businesses/mine lands the row in `pending_review`: hidden from the
 * public catalog and unbookable until an admin approves it. The page says so
 * before the vendor types anything, because a vendor who believes a new hall is
 * live and waits for enquiries that never come is a support ticket and a lost
 * month.
 *
 * Plan limits are enforced by the SERVER. When the API publishes the limit this
 * page shows "N of M businesses"; when the server refuses with 403 LIMIT_REACHED
 * it shows the upgrade message instead of a toast that vanishes.
 *
 * (This replaced the older Roman-Urdu artifact screen that held the same route.
 * That one never marked the starting price as required, so every vendor who left
 * it empty got a server error after pressing the button.)
 */

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BusinessesAPI, type NewBusinessInput } from "@/lib/api/dashboard"
import { businessListKey, invalidateBusinessData } from "@/lib/query/business-keys"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"
import { useUser } from "@/context/UserContext"
import { CITIES } from "@/lib/seo/constants"
import { getVendorTypeConfig } from "@/lib/vendor-type-config"
import { errorMessage } from "@/lib/utils/api-error"
import { limitReachedFrom, useBusinessLimit, type LimitReached } from "@/lib/business-limits"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { cn } from "@/lib/utils"
import { FieldError, FormBlockedHint, ERROR_INPUT_CLS, fieldAria, validateName } from "@/components/dashboard/primitives/field-error"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

function Field({
  id, label, required, hint, error, children, className,
}: {
  id: string; label: string; required?: boolean; hint?: string; error?: string
  children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span aria-hidden className="ml-0.5 text-destructive">*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-[11px] text-muted-foreground">{hint}</p>}
      <FieldError id={id} message={error} />
    </div>
  )
}

interface Form {
  name: string
  city: string
  subArea: string
  description: string
  minimumPrice: string
  minCapacity: string
  maxCapacity: string
}

const BLANK: Form = { name: "", city: "", subArea: "", description: "", minimumPrice: "", minCapacity: "", maxCapacity: "" }

/** Only send what the vendor actually filled in — an empty string is not a value. */
export function toPayload(f: Form, subTypes: string[] = []): NewBusinessInput {
  const num = (s: string) => {
    const n = Number(s)
    return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined
  }
  const out: NewBusinessInput = { name: f.name.trim(), city: f.city.trim() }
  if (f.subArea.trim()) out.subArea = f.subArea.trim()
  if (f.description.trim()) out.description = f.description.trim()
  // The column is an array on the server; a bare string is rejected.
  if (subTypes.length) out.subBusinessType = subTypes
  // WW-PRICE0 — required, and an explicit 0 must survive (`num` keeps it; a plain
  // truthiness check would drop it and make a free vendor look unpriced).
  const min = num(f.minimumPrice); if (min !== undefined) out.minimumPrice = min
  const lo = num(f.minCapacity); if (lo !== undefined) out.minCapacity = lo
  const hi = num(f.maxCapacity); if (hi !== undefined) out.maxCapacity = hi
  return out
}

/** The plan-limit message: what the plan allows, what the vendor has, what to do. */
function LimitPanel({ max, used, upgradeTo, message }: { max: number | null; used: number | null; upgradeTo: string | null; message?: string }) {
  const title = max != null
    ? `Your plan allows ${max} ${max === 1 ? "business" : "businesses"}`
    : "You have reached your plan's business limit"
  return (
    <section
      role="alert"
      data-testid="business-limit-panel"
      className="space-y-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
    >
      <div className="flex items-start gap-2.5">
        <Icon name="Lock" size={16} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-[13px] opacity-90">
            {used != null ? `You already have ${used}. ` : ""}
            To add another business, upgrade your plan{upgradeTo ? ` to ${upgradeTo}` : ""}. Your existing businesses stay exactly as they are.
          </p>
          {/* The server's own words, unless they only repeat the title. */}
          {message && message.trim().replace(/\.$/, "").toLowerCase() !== title.toLowerCase() && (
            <p className="mt-1 text-[12px] opacity-75">{message}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm">
          <Link href="/dashboard/billing"><Icon name="ArrowUpRight" size={14} /> See plans and upgrade</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard/settings">Back to settings</Link>
        </Button>
      </div>
    </section>
  )
}

export function AddBusinessView() {
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useUser()
  const setActiveBusinessId = useActiveBusinessStore((s) => s.setActiveBusinessId)
  const { limit, atLimit } = useBusinessLimit()

  const [form, setForm] = React.useState<Form>(BLANK)
  const [subTypes, setSubTypes] = React.useState<string[]>([])
  const [touched, setTouched] = React.useState<Partial<Record<keyof Form, boolean>>>({})
  const [serverNameError, setServerNameError] = React.useState<string | undefined>()
  const [submitError, setSubmitError] = React.useState<string | undefined>()
  const [limitHit, setLimitHit] = React.useState<LimitReached | null>(null)

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (k === "name") setServerNameError(undefined)
    setSubmitError(undefined)
  }
  const touch = (k: keyof Form) => setTouched((t) => ({ ...t, [k]: true }))

  const u = user as { fullName?: string; email?: string; phoneNumber?: string; phoneE164?: string; vendorType?: string } | null
  const config = getVendorTypeConfig(u?.vendorType)
  const typeName = config?.displayName ?? u?.vendorType ?? ""
  const subField = config?.typeSpecificFields.find((f) => f.key === "subBusinessType")
  // Guest counts only mean something for a business that hosts guests.
  const asksGuests = !config || config.typeSpecificFields.some((f) => f.key === "maxCapacity")

  // Field rules mirror the server's (POST /businesses/mine), so "the form let me"
  // and "the server refused" cannot disagree.
  const nameError = validateName(form.name, { label: "Business name", min: 2, max: 120 }) ?? serverNameError
  const cityError = form.city.trim().length < 2 ? "Choose the city, or type it." : undefined
  // WW-PRICE0 — a listing with no starting price is "unpriced": the server refuses
  // to price a booking against it. An explicit 0 is fine (a real, typed "free").
  const priceValue = form.minimumPrice.trim() === "" ? NaN : Number(form.minimumPrice)
  const priceError = Number.isFinite(priceValue) && priceValue >= 0 ? undefined : "Enter a starting price. Enter 0 if this service is free."
  const capacityInverted =
    form.minCapacity.trim() !== "" && form.maxCapacity.trim() !== "" &&
    Number(form.minCapacity) > Number(form.maxCapacity)
  const capacityError = capacityInverted ? "Max guests must be greater than min guests." : undefined

  const canSave = !nameError && !cityError && !priceError && !capacityError
  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason = canSave ? undefined
    : nameError ? "Add the business name to continue."
    : cityError ? "Choose the city to continue."
    : priceError ? "Enter the starting price to continue."
    : "Fix the guest numbers to continue."

  const save = useMutation({
    mutationFn: () => BusinessesAPI.addMyBusiness(toPayload(form, subTypes)),
    onSuccess: async (biz) => {
      // Refetch the list BEFORE moving on, so the new business is already in the
      // switcher and Business settings can find it by id on arrival.
      invalidateBusinessData(qc)
      try { await qc.refetchQueries({ queryKey: businessListKey }) } catch { /* the list still refetches on arrival */ }
      if (biz?.id) setActiveBusinessId(biz.id)
      toast.success("Sent for review. We will tell you here and by email once it is approved.")
      router.push(biz?.id ? `/dashboard/settings?biz=${biz.id}` : "/dashboard/settings")
    },
    onError: (e: unknown) => {
      // The plan limit is a decision, not a glitch: explain it and offer the upgrade.
      const reached = limitReachedFrom(e)
      if (reached) { setLimitHit(reached); return }
      const status = (e as { response?: { status?: number } })?.response?.status
      const msg = errorMessage(e, "Couldn't add the business. Nothing was saved — please try again.")
      if (status === 409) { setServerNameError(msg); setTouched((t) => ({ ...t, name: true })) }
      else setSubmitError(msg)
    },
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, city: true, minimumPrice: true, minCapacity: true, maxCapacity: true })
    if (!canSave || save.isPending) return
    save.mutate()
  }

  // A customer account would be 403'd by the API; don't show them a form that fails.
  if (u && !(user as { isVendor?: boolean }).isVendor && !(user as { isSuperAdmin?: boolean }).isSuperAdmin) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <PageHeader eyebrow="Business" title="Add a business" />
        {/* `?continue=1` bypasses the middleware redirect that sends signed-in
            users here — without it, this link would bounce straight back and loop. */}
        <div className="mt-6 rounded-lg border p-6 text-center text-sm text-muted-foreground">
          This is a customer account, so it can&apos;t list a business.{" "}
          <a href="/business-registration?continue=1" className="text-primary underline">
            Register a vendor account
          </a>{" "}
          with a different email.
        </div>
      </div>
    )
  }

  // Known up front (the API published the limit and the vendor is at it), or learned
  // from the server's refusal. Either way the form would only fail, so don't show it.
  const blocked = limitHit ?? (atLimit && limit ? { message: "", max: limit.max, used: limit.used, upgradeTo: null } : null)

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-6">
      <PageHeader
        eyebrow="Business"
        title="Add a business"
        description="Another venue or service on your account. No new sign-up."
      />

      {limit && !blocked && (
        <p className="text-xs text-muted-foreground tabular-nums" data-testid="business-count">
          You have {limit.used} of {limit.max} businesses on your plan.
        </p>
      )}

      {blocked ? (
        <LimitPanel max={blocked.max} used={blocked.used} upgradeTo={blocked.upgradeTo} message={blocked.message} />
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {/* Same account: the vendor can see nothing new is asked about them. */}
          <section aria-labelledby="ab-account" className="rounded-xl border bg-card p-4">
            <h2 id="ab-account" className="text-sm font-semibold">Adding to your account</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {[u?.fullName, u?.email, u?.phoneNumber ?? u?.phoneE164].filter(Boolean).join(" · ") || "Your signed-in account"}
              . You stay signed in with the same login, phone number and email.
            </p>
            {typeName && (
              <p className="mt-2 text-[13px]">
                <span className="text-muted-foreground">Business type: </span>
                <span className="font-medium">{typeName}</span>
                <span className="text-muted-foreground"> (all businesses on one account share the same type)</span>
              </p>
            )}
          </section>

          {/* Set the expectation before they type, not after they submit. */}
          <section
            aria-labelledby="ab-next"
            className="rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
          >
            <h2 id="ab-next" className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="Clock" size={15} className="shrink-0" /> What happens after you send it
            </h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] opacity-90">
              <li><b>Submitted:</b> the business appears in your business list straight away, marked &ldquo;Under review&rdquo;.</li>
              <li><b>Our team reviews it.</b> Until it is approved it is hidden from search and cannot take bookings.</li>
              <li><b>We tell you</b> in the app and by email when it is approved, or if we need something changed.</li>
              <li>While you wait, add photos, packages and prices in Business settings. You will land there next.</li>
            </ol>
          </section>

          <section aria-labelledby="ab-details" className="space-y-4 rounded-xl border bg-card p-4">
            <h2 id="ab-details" className="text-sm font-semibold">About this business</h2>

            <Field id="ab-name" label="Business name" required hint="Must be unique across Wedding Wala." error={touched.name ? nameError : serverNameError}>
              <input
                id="ab-name"
                className={cn(inputCls, (touched.name ? nameError : serverNameError) && ERROR_INPUT_CLS)}
                {...fieldAria("ab-name", touched.name ? nameError : serverNameError)}
                aria-required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => touch("name")}
                placeholder="e.g. Al-Noor Marquee"
                autoComplete="off"
                autoFocus
                maxLength={120}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="ab-city" label="City" required error={touched.city ? cityError : undefined}>
                <input
                  id="ab-city"
                  list="ab-city-list"
                  className={cn(inputCls, touched.city && cityError && ERROR_INPUT_CLS)}
                  {...fieldAria("ab-city", touched.city ? cityError : undefined)}
                  aria-required
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  onBlur={() => touch("city")}
                  placeholder="Lahore"
                  autoComplete="off"
                />
                <datalist id="ab-city-list">
                  {CITIES.map((c) => <option key={c.slug} value={c.name} />)}
                </datalist>
              </Field>
              <Field id="ab-area" label="Area (optional)">
                <input id="ab-area" className={inputCls} value={form.subArea} onChange={(e) => set("subArea", e.target.value)} placeholder="Gulberg" autoComplete="off" />
              </Field>
            </div>

            {subField && (subField.options?.length ?? 0) > 0 && (
              subField.type === "multi-select" ? (
                <fieldset className="space-y-1.5">
                  <legend className={labelCls}>{subField.label} (optional)</legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {subField.options!.map((o) => (
                      <label key={o} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={subTypes.includes(o)}
                          onChange={(e) => setSubTypes((cur) => (e.target.checked ? [...cur, o] : cur.filter((x) => x !== o)))}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <Field id="ab-subtype" label={`${subField.label} (optional)`}>
                  <select
                    id="ab-subtype"
                    className={inputCls}
                    value={subTypes[0] ?? ""}
                    onChange={(e) => setSubTypes(e.target.value ? [e.target.value] : [])}
                  >
                    <option value="">Choose</option>
                    {subField.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              )
            )}

            <Field
              id="ab-price"
              label="Starting price (Rs)"
              required
              hint="Customers can't book a business with no price. Enter 0 if this service is free."
              error={touched.minimumPrice ? priceError : undefined}
            >
              <input
                id="ab-price"
                className={cn(inputCls, "tabular-nums", touched.minimumPrice && priceError && ERROR_INPUT_CLS)}
                {...fieldAria("ab-price", touched.minimumPrice ? priceError : undefined)}
                aria-required
                type="number"
                inputMode="numeric"
                min={0}
                value={form.minimumPrice}
                onChange={(e) => set("minimumPrice", e.target.value)}
                onBlur={() => touch("minimumPrice")}
                placeholder="220000"
              />
            </Field>

            {asksGuests && (
              <div className="grid grid-cols-2 gap-4">
                <Field id="ab-min" label="Min guests (optional)">
                  <input id="ab-min" className={cn(inputCls, "tabular-nums")} type="number" inputMode="numeric" min={0} value={form.minCapacity} onChange={(e) => set("minCapacity", e.target.value)} placeholder="100" />
                </Field>
                <Field id="ab-max" label="Max guests (optional)" error={capacityError}>
                  <input
                    id="ab-max"
                    className={cn(inputCls, "tabular-nums", capacityError && ERROR_INPUT_CLS)}
                    {...fieldAria("ab-max", capacityError)}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.maxCapacity}
                    onChange={(e) => set("maxCapacity", e.target.value)}
                    placeholder="1000"
                  />
                </Field>
              </div>
            )}

            <Field id="ab-desc" label="Description (optional)">
              <textarea
                id="ab-desc"
                className={cn(inputCls, "h-24 resize-y py-2")}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What makes this business worth booking?"
                maxLength={2000}
              />
            </Field>
          </section>

          {submitError && (
            <p role="alert" data-testid="add-business-error" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={save.isPending}>Cancel</Button>
            <FormBlockedHint message={blockedReason} />
            <Button type="submit" disabled={!canSave || save.isPending} data-testid="add-business-submit">
              {save.isPending
                ? <><Spinner size={14} className="mr-1.5" /> Sending…</>
                : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Send for review</>}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AddBusinessView
