"use client"

/**
 * WW-ADDBIZ — a vendor adds another business from inside the portal.
 *
 * Posts to `/api/v1/businesses/mine`, which lands the row in `pending_review`:
 * hidden from the public catalog and unbookable until an admin approves it. That
 * distinction matters and is stated plainly on the page — a vendor who thinks
 * their new hall is live and waits for inquiries that never come is a support
 * ticket and a lost month.
 *
 * Deliberately short. Everything else (packages, images, amenities, slots) is
 * edited in Business Settings once the listing exists, so we don't gate a vendor
 * behind the 8-step signup wizard just to register a second venue.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BusinessesAPI, type NewBusinessInput } from "@/lib/api/dashboard"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"
import { useUser } from "@/context/UserContext"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { cn } from "@/lib/utils"
import { FormBlockedHint } from "@/components/dashboard/primitives/field-error"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
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
export function toPayload(f: Form): NewBusinessInput {
  const num = (s: string) => {
    const n = Number(s)
    return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined
  }
  const out: NewBusinessInput = { name: f.name.trim(), city: f.city.trim() }
  if (f.subArea.trim()) out.subArea = f.subArea.trim()
  if (f.description.trim()) out.description = f.description.trim()
  // WW-PRICE0 — required, and an explicit 0 must survive (`num` keeps it; a plain
  // truthiness check would drop it and make a free vendor look unpriced).
  const min = num(f.minimumPrice); if (min !== undefined) out.minimumPrice = min
  const lo = num(f.minCapacity); if (lo !== undefined) out.minCapacity = lo
  const hi = num(f.maxCapacity); if (hi !== undefined) out.maxCapacity = hi
  return out
}

export function AddBusinessView() {
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useUser()
  const setActiveBusinessId = useActiveBusinessStore((s) => s.setActiveBusinessId)
  const [form, setForm] = React.useState<Form>(BLANK)

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const capacityInverted =
    form.minCapacity.trim() !== "" && form.maxCapacity.trim() !== "" &&
    Number(form.minCapacity) > Number(form.maxCapacity)

  // WW-PRICE0 — a listing with no starting price is "unpriced": the server refuses
  // to price a booking against it, so approving it would just create another dead
  // vendor. An explicit 0 is fine — that is a real, typed "this is free".
  const priceValue = form.minimumPrice.trim() === "" ? NaN : Number(form.minimumPrice)
  const priceOk = Number.isFinite(priceValue) && priceValue >= 0

  const canSave =
    form.name.trim().length > 1 && form.city.trim().length > 1 && priceOk && !capacityInverted


  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason = canSave ? undefined : "Add a name and a city to save."

  const save = useMutation({
    mutationFn: () => BusinessesAPI.addMyBusiness(toPayload(form)),
    onSuccess: (biz) => {
      // Make the new business the active one so the vendor lands in its context,
      // and refetch the switcher so it appears immediately (with its pending chip).
      qc.invalidateQueries()
      if (biz?.id) setActiveBusinessId(biz.id)
      toast.success("Sent for review — we'll email you once it's approved")
      router.push("/dashboard")
    },
    // The backend writes these messages for humans (duplicate name, rate limit,
    // vendor-only, business cap). Show them verbatim rather than a generic error.
    onError: (e: any) =>
      toast.error(errorMessage(e, "Couldn't add the business")),
  })

  // A customer account would be 403'd by the API; don't show them a form that fails.
  if (user && !user.isVendor && !user.isSuperAdmin) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
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

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <PageHeader
        eyebrow="Business"
        title="Add a business"
        description="Register another venue or service under the same account."
      />

      {/* Set the expectation before they type, not after they submit. */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <Icon name="Clock" size={15} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Every new business is reviewed before it goes live.</p>
          <p className="mt-0.5 opacity-90">
            It won&apos;t appear in search or take bookings until our team approves it. You can
            add photos, packages and amenities in Business Settings while you wait.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <Field label="Business name" hint="Must be unique across Wedding Wala.">
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Al-Noor Marquee"
            autoFocus
            maxLength={120}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="City">
            <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Lahore" />
          </Field>
          <Field label="Area (optional)">
            <input className={inputCls} value={form.subArea} onChange={(e) => set("subArea", e.target.value)} placeholder="Gulberg" />
          </Field>
        </div>

        <Field
          label="Starting price (Rs)"
          hint="Customers can't book a business with no price. Enter 0 if this service is free."
        >
          <input
            className={cn(inputCls, "tabular-nums")}
            type="number"
            min={0}
            value={form.minimumPrice}
            onChange={(e) => set("minimumPrice", e.target.value)}
            placeholder="220000"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Min guests (optional)">
            <input className={cn(inputCls, "tabular-nums")} type="number" min={0} value={form.minCapacity} onChange={(e) => set("minCapacity", e.target.value)} placeholder="100" />
          </Field>
          <Field label="Max guests (optional)">
            <input className={cn(inputCls, "tabular-nums")} type="number" min={0} value={form.maxCapacity} onChange={(e) => set("maxCapacity", e.target.value)} placeholder="1000" />
          </Field>
        </div>
        {capacityInverted && (
          <p className="text-[11px] text-destructive">Max guests must be greater than min guests.</p>
        )}

        <Field label="Description (optional)">
          <textarea
            className={cn(inputCls, "h-24 resize-y py-2")}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What makes this venue worth booking?"
            maxLength={2000}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()} disabled={save.isPending}>Cancel</Button>
        <FormBlockedHint message={blockedReason} />
        <Button disabled={!canSave || save.isPending} onClick={() => save.mutate()}>
          {save.isPending
            ? <><Spinner size={14} className="mr-1.5" /> Sending…</>
            : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Send for review</>}
        </Button>
      </div>
    </div>
  )
}

export default AddBusinessView
