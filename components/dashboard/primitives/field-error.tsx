"use client"

/**
 * Field-level validation messaging.
 *
 * WHY THIS EXISTS
 * ---------------
 * Dashboard forms were validating correctly and saying nothing. The packages
 * form is the clearest case: `canSave = form.name.trim() && Number(form.price) > 0`
 * is right, but the ONLY thing it drives is `disabled` on the Save button.
 * Measured on the live site with a negative price:
 *
 *     saveDisabled: true
 *     error message shown: none
 *     aria-invalid: null
 *     aria-describedby: null
 *     red border: no
 *
 * So a vendor types a price, the button greys out, and nothing on screen tells
 * them why. They reasonably conclude the button is broken — which is exactly the
 * "not a single patch is going / the CRUDs don't work" report. It is also an
 * accessibility failure: with no aria-invalid and no aria-describedby, a screen
 * reader user gets no signal at all.
 *
 * A disabled button is not feedback. Any control that refuses to act must say
 * what it is waiting for.
 *
 * USAGE
 *   const err = touched.price ? validatePrice(form.price) : undefined
 *   <input {...fieldAria("pkg-price", err)} className={cn(inputCls, err && ERROR_INPUT_CLS)} />
 *   <FieldError id="pkg-price" message={err} />
 */

import * as React from "react"
import { cn } from "@/lib/utils"

/** Border/ring treatment for an invalid control. Pair with <FieldError />. */
export const ERROR_INPUT_CLS =
  "border-destructive focus-visible:ring-destructive/40"

/**
 * Wires a control to its message for assistive tech. `aria-describedby` is only
 * set when there IS a message — pointing at an absent node is worse than nothing.
 */
export function fieldAria(id: string, message?: string) {
  return {
    "aria-invalid": message ? true : undefined,
    "aria-describedby": message ? `${id}-error` : undefined,
  } as const
}

/**
 * Renders nothing when valid, so it never reserves space or shifts the layout —
 * this dashboard already had a 15px shift problem and must not gain another.
 *
 * role="alert" so the message is announced the moment it appears.
 */
export function FieldError({
  id,
  message,
  className,
}: {
  id: string
  message?: string
  className?: string
}) {
  if (!message) return null
  return (
    <p
      id={`${id}-error`}
      role="alert"
      className={cn("text-xs font-medium text-destructive", className)}
    >
      {message}
    </p>
  )
}

/**
 * Explains a disabled submit button. A vendor should never face a dead control
 * with no reason given; this is the catch-all for "the form as a whole isn't
 * ready yet" when no single field is at fault.
 */
export function FormBlockedHint({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="status" className="text-xs text-muted-foreground">
      {message}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Shared validators. Messages are written for a Pakistani venue owner: say what
// to do, not what the code expects. Bounds mirror the server so the two can
// never disagree and produce a "the form let me but the server refused" loop.
// ---------------------------------------------------------------------------

/** Required free text, e.g. a package or menu name. */
export function validateName(
  value: string,
  { label = "Name", min = 2, max = 150 }: { label?: string; min?: number; max?: number } = {},
): string | undefined {
  const v = (value ?? "").trim()
  if (!v) return `${label} is required.`
  if (v.length < min) return `${label} must be at least ${min} characters.`
  if (v.length > max) return `${label} must be ${max} characters or fewer — currently ${v.length}.`
  return undefined
}

/**
 * Rupee amount. Rejects negatives and zero by default because a Rs 0 listing is
 * the "3,268 businesses bookable at Rs 0" hole, not a real free service.
 */
export function validatePkr(
  value: string | number,
  {
    label = "Price",
    allowZero = false,
    max = 100_000_000, // Rs 10 crore — far above any real venue package
  }: { label?: string; allowZero?: boolean; max?: number } = {},
): string | undefined {
  const raw = String(value ?? "").trim()
  if (!raw) return `${label} is required.`
  const n = Number(raw)
  if (!Number.isFinite(n)) return `${label} must be a number.`
  if (n < 0) return `${label} cannot be negative.`
  if (!allowZero && n === 0) return `${label} must be more than Rs 0.`
  if (n > max) return `${label} looks too large. Please check the amount.`
  return undefined
}

/**
 * Pakistani mobile number.
 *
 * Accepts the three forms people actually type — 03001234567, +923001234567,
 * 923001234567 — plus any spacing, dashes or brackets, which are stripped
 * before checking. A PK mobile is always 3 followed by 9 more digits after the
 * country/trunk prefix (03xx-xxxxxxx = 11 digits total).
 *
 * This matters more than a generic "not empty": customers are deduped and
 * routed on phone, so a junk number silently creates a duplicate customer that
 * can never be contacted. The field previously accepted literally "abc".
 *
 * Landlines are deliberately allowed too (e.g. 042-35XXXXXX) — plenty of older
 * venues and caterers still list one.
 */
export function validatePkPhone(
  value: string,
  { label = "Phone number", required = true }: { label?: string; required?: boolean } = {},
): string | undefined {
  const raw = (value ?? "").trim()
  if (!raw) return required ? `${label} is required.` : undefined
  const d = raw.replace(/[\s\-()./]/g, "")
  // Mobile: 03XXXXXXXXX | +923XXXXXXXXX | 923XXXXXXXXX
  const mobile = /^(?:\+92|92|0)3\d{9}$/
  // Landline: 0 + 2-5 digit area code + 6-8 digit number
  const landline = /^(?:\+92|92|0)\d{9,11}$/
  if (mobile.test(d) || landline.test(d)) return undefined
  return `Enter a valid Pakistani number, e.g. 0300 1234567.`
}

/**
 * Email. Intentionally permissive on the local part (real addresses are
 * stranger than most regexes allow) but insists on a dot-separated domain, so
 * "notanemail" and "a@b" are caught while "x+tag@sub.domain.pk" is not.
 */
export function validateEmail(
  value: string,
  { label = "Email", required = false }: { label?: string; required?: boolean } = {},
): string | undefined {
  const v = (value ?? "").trim()
  if (!v) return required ? `${label} is required.` : undefined
  if (/\s/.test(v)) return `${label} cannot contain spaces.`
  if (!/^[^@]+@[^@.]+(\.[^@.]+)+$/.test(v)) return `Enter a valid email address, e.g. name@example.com.`
  if (v.length > 254) return `${label} is too long.`
  return undefined
}

/**
 * Pakistani IBAN, checked properly — length, shape AND the ISO 13616 mod-97
 * checksum.
 *
 * This field had no validation whatsoever (just `.trim()`), and it is the field
 * the vendor's MONEY is paid into. A mistyped IBAN either bounces or, worse,
 * routes a payout to a real stranger's account. The checksum exists precisely to
 * catch single-character typos and transposed digits, which is the realistic
 * failure when someone copies 24 characters off a chequebook — so validating
 * length alone would miss the actual risk.
 *
 * PK IBAN = "PK" + 2 check digits + 4-letter bank code + 16 alphanumeric = 24.
 * Spaces are stripped: people type them in groups of four, as printed.
 */
export function validatePkIban(
  value: string,
  { label = "IBAN", required = false }: { label?: string; required?: boolean } = {},
): string | undefined {
  const raw = (value ?? "").replace(/\s+/g, "").toUpperCase()
  if (!raw) return required ? `${label} is required.` : undefined
  if (!raw.startsWith("PK")) return "A Pakistani IBAN starts with PK."
  if (raw.length !== 24) return `A Pakistani IBAN is 24 characters — this one has ${raw.length}.`
  if (!/^PK\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(raw))
    return "Check the IBAN — it should read PK, 2 digits, a 4-letter bank code, then 16 characters."

  // ISO 13616 mod-97: move the first 4 chars to the end, map letters to numbers
  // (A=10..Z=35), then the whole value mod 97 must equal 1.
  const rearranged = raw.slice(4) + raw.slice(0, 4)
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55))
  // Chunked remainder — the number is far past Number.MAX_SAFE_INTEGER.
  let remainder = 0
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97
  if (remainder !== 1) return "That IBAN doesn't look right — please check it digit by digit."
  return undefined
}

/**
 * Bank account number. Pakistani account numbers vary by bank (roughly 8–24
 * digits), so this checks shape rather than pretending to know each bank's
 * format: digits only once separators are stripped, and a sane length.
 */
export function validateAccountNumber(
  value: string,
  { label = "Account number", required = false }: { label?: string; required?: boolean } = {},
): string | undefined {
  const raw = (value ?? "").trim()
  if (!raw) return required ? `${label} is required.` : undefined
  const d = raw.replace(/[\s-]/g, "")
  if (!/^\d+$/.test(d)) return "An account number should contain digits only."
  if (d.length < 8) return `That account number looks too short — ${d.length} digits.`
  if (d.length > 24) return `That account number looks too long — ${d.length} digits.`
  return undefined
}

/** Optional free text with a ceiling, e.g. a description. */
export function validateOptionalText(
  value: string,
  { label = "This field", max = 500 }: { label?: string; max?: number } = {},
): string | undefined {
  const v = (value ?? "").trim()
  if (v.length > max) return `${label} must be ${max} characters or fewer — currently ${v.length}.`
  return undefined
}
