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
// Contact-field rules live in lib/validation/pk-fields — pure, no JSX, so
// Node can load them directly for the property checks in
// scripts/field-validation-check.mjs. Re-exported here because every
// existing call site imports them from this module.
export { validatePkPhone, validateEmail, normalizePkPhone, normalizeEmail } from "@/lib/validation/pk-fields"

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
 *
 * WWL-126 — every money column in this product is NUMERIC(12,2) (verified on
 * the live database: Bookings.totalAmount, PaymentReceipts.amount,
 * VendorExpenses.amount, PostDatedCheques.amount). The validator did not know
 * that, so three inputs got through and the stored value silently disagreed
 * with what the vendor typed:
 *
 *   0.001    → passes "> 0", stores as 0.00 — a receipt for Rs 0, which is the
 *              exact hole this function exists to close
 *   100.999  → stores as 101.00 — the ledger holds a number nobody entered
 *   1e5      → Number() reads 100000 with no hint that is what happened
 *
 * Rounding money without saying so is the failure mode; refusing to guess is
 * the fix. A vendor who genuinely means 101 can type 101.
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

  // A plain decimal literal, optionally signed. Anything else — `1e5`, `0x10`,
  // `Infinity`, `1,000` — is rejected by name rather than quietly coerced.
  if (!/^[+-]?\d*\.?\d+$/.test(raw)) {
    return /[eE]/.test(raw)
      ? `${label} must be a plain number — write 100000, not ${raw}.`
      : `${label} must be a number, digits only (no commas or symbols).`
  }

  const n = Number(raw)
  if (!Number.isFinite(n)) return `${label} must be a number.`
  if (n < 0) return `${label} cannot be negative.`

  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0
  if (decimals > 2) {
    return `${label} can have at most 2 decimal places — paisa, not fractions of a paisa.`
  }

  if (!allowZero && n === 0) return `${label} must be more than Rs 0.`
  if (n > max) return `${label} looks too large. Please check the amount.`
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
 * Pakistani CNIC — 13 digits, written 12345-1234567-1.
 *
 * Separators are stripped before checking, because people type it all three
 * ways they see it printed: with dashes, with spaces, or as one run of digits.
 *
 * This is not cosmetic. On a staff record the CNIC is the identity the vendor
 * uses to file the person with a security agency, put them on a venue gate
 * pass, or prove who was on shift when something goes wrong. A 12-digit CNIC
 * is not a slightly-wrong CNIC, it is a CNIC that matches nobody — and it will
 * be discovered at the exact moment it is needed. The field previously
 * accepted the literal string "not-a-cnic".
 *
 * Deliberately NOT validated: the last digit's odd/even gender convention.
 * It is a real convention, but rejecting on it would turn a data-entry helper
 * into a gatekeeper for something the vendor cannot fix from this screen.
 */
export function validatePkCnic(
  value: string,
  { label = "CNIC", required = false }: { label?: string; required?: boolean } = {},
): string | undefined {
  const raw = (value ?? "").trim()
  if (!raw) return required ? `${label} is required.` : undefined
  const d = raw.replace(/[\s-]/g, "")
  if (!/^\d+$/.test(d)) return `${label} should contain digits only, e.g. 12345-1234567-1.`
  if (d.length !== 13) return `A CNIC has 13 digits — this one has ${d.length}.`
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

/**
 * A date that cannot be in the future — money received, money spent, a cheque
 * banked. These fields were bare `<input type="date">` with no bounds at all, so
 * a receipt could be dated next year and silently land in the ledger, throwing
 * off every total and aging report that reads it.
 *
 * `maxYearsBack` catches the other common slip: a mistyped year (2016 for 2026)
 * that would otherwise sit in the books unnoticed.
 */
export function validateNotFutureDate(
  value: string,
  {
    label = "Date",
    required = true,
    maxYearsBack = 10,
  }: { label?: string; required?: boolean; maxYearsBack?: number } = {},
): string | undefined {
  const raw = (value ?? "").trim()
  if (!raw) return required ? `${label} is required.` : undefined
  const d = new Date(raw)
  if (Number.isNaN(d.valueOf())) return `${label} isn't a valid date.`
  // Compare date-only; a receipt logged at 11pm today must not read as "future".
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (d > today) return `${label} can't be in the future.`
  const floor = new Date()
  floor.setFullYear(floor.getFullYear() - maxYearsBack)
  if (d < floor) return `${label} looks wrong — please check the year.`
  return undefined
}

/**
 * Digital payment methods carry a transaction id, and without it a payment can't
 * be reconciled against a bank statement later. Mirrors the NEEDS_TXN_REF set
 * already used by the booking record-payment dialog so the two agree.
 */
const METHODS_NEEDING_REF = new Set([
  "jazzcash",
  "easypaisa",
  "raast",
  "ibft",
  "bank_transfer",
  "online",
])

/**
 * The rail's own display name, as shown in the dropdown the vendor just used.
 * Falls back to a de-underscored key so a new rail never renders blank.
 */
function railLabel(m: string): string {
  const LABELS: Record<string, string> = {
    ibft: "Bank IBFT",
    bank_transfer: "Bank transfer",
    jazzcash: "JazzCash",
    easypaisa: "Easypaisa",
    raast: "Raast",
    cheque: "Cheque",
    card: "Card",
  }
  return LABELS[m] ?? m.replace(/_/g, " ")
}

export function validateTransactionRef(
  value: string,
  method: string,
  { label = "Transaction ref" }: { label?: string } = {},
): string | undefined {
  const v = (value ?? "").trim()
  const m = String(method || "").trim().toLowerCase()
  if (!METHODS_NEEDING_REF.has(m)) return undefined
  // WWL-125 — this named the internal key, so a vendor who had just picked
  // "Bank IBFT" from the dropdown was told a ref is "required for ibft", and
  // one who picked "Bank transfer" got "for bank transfer" in lower case. Use
  // the label they actually chose.
  if (!v) return `${label} is required for ${railLabel(m)} — you'll need it to match this against your bank statement.`
  if (v.length < 4) return `${label} looks too short.`
  return undefined
}

/**
 * Cheque number — digits only, 4–20.
 *
 * Pakistani cheque leaf numbers are typically 6–8 digits, but the length varies
 * by bank and by cheque book series, so this bounds rather than prescribes.
 */
export function validateChequeNumber(
  value: string,
  { label = "Cheque number", required = true }: { label?: string; required?: boolean } = {},
): string | undefined {
  const v = (value ?? "").trim()
  if (!v) return required ? `${label} is required.` : undefined
  if (!/^\d+$/.test(v)) return `${label} should contain digits only.`
  if (v.length < 4) return `${label} looks too short — cheque numbers are at least 4 digits.`
  if (v.length > 20) return `${label} looks too long.`
  return undefined
}

/**
 * Cheque date — deliberately NOT the same rule as a receipt date.
 *
 * A PDC is a POST-dated cheque: a future date is the whole point, so
 * validateNotFutureDate would be wrong here. Two real bounds apply instead:
 *
 *  - A cheque in Pakistan goes STALE six months after its date; banks refuse it
 *    after that. A vendor holding a cheque already older than six months is
 *    holding paper they cannot bank, and should be told now rather than at the
 *    counter. Flagged, since it may be entered deliberately for the record.
 *  - A date years out is a mistyped year, not a real arrangement.
 */
export function validateChequeDate(
  value: string,
  { label = "Cheque date", maxMonthsAhead = 24 }: { label?: string; maxMonthsAhead?: number } = {},
): string | undefined {
  const raw = (value ?? "").trim()
  if (!raw) return `${label} is required.`
  const d = new Date(raw)
  if (Number.isNaN(d.valueOf())) return `${label} isn't a valid date.`
  const ceiling = new Date()
  ceiling.setMonth(ceiling.getMonth() + maxMonthsAhead)
  if (d > ceiling) return `${label} is more than ${maxMonthsAhead} months away — please check the year.`
  const stale = new Date()
  stale.setMonth(stale.getMonth() - 6)
  if (d < stale) return `This cheque is over 6 months old, so a bank will refuse it as stale.`
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
