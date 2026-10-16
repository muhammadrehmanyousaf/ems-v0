"use client"

/**
 * "Partially Refundable" needs a number: how much does the couple get back?
 *
 * Shown under the Cancellation Policy control of every vendor registration form, and only when
 * Partially Refundable is the chosen policy. Same shape as the Down Payment Type / Down Payment pair
 * above it: a Fixed Amount | Percentage select, then the value. The rule (percentage 1-99, fixed
 * amount above 0 and not above the highest known price) is lib/cancellation-policy.ts, mirrored from
 * the server, which refuses a registration that breaks it.
 */

import * as React from "react"

import { FieldLabel } from "@/components/ui/field-help"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useFormContext } from "@/lib/context/form-context"
import {
  PARTIAL_PERCENT_MAX,
  PARTIAL_PERCENT_MIN,
  cancellationKey,
  fixedRefundCeiling,
  validatePartialRefund,
} from "@/lib/cancellation-policy"

interface Props {
  /** The currently chosen cancellation policy (key or label). Nothing renders unless it is Partially Refundable. */
  policy: string | null | undefined
  errors?: Record<string, unknown>
  setErrors?: React.Dispatch<React.SetStateAction<any>>
  /** The surrounding form's own look (the bridal forms use a different label / error style). */
  labelClassName?: string
  errorClassName?: string
  inputClassName?: string
  triggerClassName?: string
}

export default function PartialRefundFields({ policy, errors, setErrors, labelClassName, errorClassName, inputClassName, triggerClassName }: Props) {
  const { formData, setFormData } = useFormContext()
  if (cancellationKey(policy) !== "partially_refundable") return null

  const type = (formData.partialRefundType as string) || ""
  const value = formData.partialRefundValue === undefined || formData.partialRefundValue === null ? "" : String(formData.partialRefundValue)
  const ceiling = fixedRefundCeiling({ minimumPrice: formData.minimumPrice, packages: formData.packages })
  const typeError = errors?.partialRefundType as string | undefined
  const valueError = errors?.partialRefundValue as string | undefined
  const clear = (k: string) => setErrors?.((prev: Record<string, unknown>) => ({ ...prev, [k]: "" }))

  // live feedback once the vendor has typed something; the full check runs again on Continue
  const live = value !== "" && type ? validatePartialRefund(type, value, ceiling) : null
  const liveError = live && !live.ok ? live.message : null
  const shownValueError = valueError || liveError

  return (
    <div className="space-y-6" data-testid="partial-refund-fields">
      <section className="space-y-3">
        <FieldLabel help="partialRefundType" className={labelClassName}>Refund Type</FieldLabel>
        <Select
          value={type}
          onValueChange={(v) => {
            setFormData((prev) => ({ ...prev, partialRefundType: v as "fixed" | "percent" }))
            clear("partialRefundType")
            clear("partialRefundValue")
          }}
        >
          <SelectTrigger className={cn("w-full", triggerClassName)} aria-label="Refund type" aria-invalid={!!typeError}>
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
            <SelectItem value="percent">Percentage</SelectItem>
          </SelectContent>
        </Select>
        {typeError && <p className={cn("text-xs text-red-500", errorClassName)}>{typeError}</p>}
      </section>

      <section className="space-y-3">
        <FieldLabel help="partialRefundValue" className={labelClassName}>
          {type === "percent" ? "Refund Percentage" : type === "fixed" ? "Refund Amount (PKR)" : "Refund Value"}
        </FieldLabel>
        <Input
          type="number"
          inputMode="decimal"
          min={type === "percent" ? PARTIAL_PERCENT_MIN : 1}
          max={type === "percent" ? PARTIAL_PERCENT_MAX : undefined}
          step={type === "percent" ? "0.01" : "1"}
          className={inputClassName}
          placeholder={type === "percent" ? "Enter a percentage, 1 to 99" : type === "fixed" ? "Enter the amount refunded" : "Choose a refund type first"}
          value={value}
          disabled={!type}
          aria-label="Refund value"
          aria-invalid={!!shownValueError}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, partialRefundValue: e.target.value }))
            clear("partialRefundValue")
          }}
        />
        {shownValueError ? (
          <p className={cn("text-xs text-red-500", errorClassName)}>{shownValueError}</p>
        ) : (
          type && (
            <p className="text-xs text-muted-foreground">
              {type === "percent"
                ? "If a couple cancels, they get this share of what they paid back."
                : "If a couple cancels, they get this amount back (never more than they paid)."}
            </p>
          )
        )}
      </section>
    </div>
  )
}
