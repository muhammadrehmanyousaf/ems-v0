/**
 * Phase 5 — hardening the boundary between model output and our data.
 *
 * Everything here turns *untrusted, model-generated* JSON into values our forms
 * and money paths can safely hold. The AI endpoints already JSON.parse the
 * model's reply, but parsing says nothing about SHAPE: `{"qty": "two"}`,
 * `{"unitPrice": -500}`, a category we don't have, or `"2026-02-31"` all parse
 * fine and would go on to poison a sheet total with NaN, silently mis-file a
 * cost, or produce an invalid <input type=date>.
 *
 * The rule throughout: validate each field independently and DROP what doesn't
 * check out. A partially-filled form is a fine outcome; a corrupted one is not.
 *
 * Deliberately dependency-free so it can be unit-tested without React.
 */

/* ── WhatsApp ─────────────────────────────────────────────────────────────── */

/**
 * Pakistani phone → bare wa.me international digits.
 *   "0300-1122334" → 923001122334 ; "+92 300 1122334" → 923001122334
 * Returns null when there's nothing dialable, so callers hide the WhatsApp
 * action rather than opening a broken chat.
 */
export function toWaNumber(phone?: string | null): string | null {
  if (!phone) return null
  let d = String(phone).replace(/\D/g, "")
  if (!d) return null
  if (d.startsWith("00")) d = d.slice(2)
  if (d.startsWith("0")) d = `92${d.slice(1)}`                  // local 03xx… → 923xx…
  else if (!d.startsWith("92") && d.length <= 10) d = `92${d}`  // bare 3xx…
  return d.length >= 11 ? d : null                              // 92 + 10 digits
}

/* ── Money / quantity sanity caps ─────────────────────────────────────────── */

/**
 * A single OCR'd receipt amount or a single BEO unit price above this (in PKR)
 * is a model hallucination, not a real number. It ALSO matters for storage:
 * the expense `amount` and function-sheet `subtotal/grandTotal` columns are
 * `DECIMAL(12,2)` (max ≈ 9,999,999,999.99). A model that returns `1e15` would
 * pass a bare `isFinite && > 0` check, land in the form, and then either throw
 * a Postgres "numeric field overflow" 500 on save or silently poison the
 * "Today money" / P&L totals. Cap at 1 billion PKR (= 100 crore) — absurdly
 * generous for one receipt or one line, and a safe 10× below the column max.
 */
export const MONEY_MAX = 1_000_000_000
/** A single BEO row quantity above this is noise (a 500,000-unit line is a typo,
 *  and huge qty × price is another route to a DECIMAL overflow). */
export const QTY_MAX = 100_000
/** No wedding-vendor expense receipt predates this; an earlier date is OCR
 *  garbage (e.g. a mis-read "2026" as "0206"), not a real spend date. */
const DATE_FLOOR_MS = Date.UTC(2000, 0, 1)

/* ── Receipt OCR ──────────────────────────────────────────────────────────── */

/** Vision-capable types. A PK vendor's iPhone shoots HEIC by default, which is
 *  NOT one of them — reject it here with a fixable message instead of letting
 *  the model call fail as an opaque 502. */
export const OCR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const
/** Server caps base64 at 8 MB (~6 MB raw) and rejects anything under 200 chars. */
export const OCR_MAX_BYTES = 6 * 1024 * 1024

/** Returns a user-facing error message, or null when the file is scannable. */
export function validateReceiptFile(file: { type: string; size: number }): string | null {
  if (!(OCR_TYPES as readonly string[]).includes(file.type)) {
    return file.type === "image/heic" || file.type === "image/heif"
      ? "iPhone HEIC photos can't be scanned. In Settings → Camera → Formats, pick “Most Compatible”, or share the photo as JPEG."
      : "Scan a JPEG, PNG or WebP photo of the receipt."
  }
  if (file.size > OCR_MAX_BYTES) return "That photo is over 6 MB. Retake it at a smaller size."
  if (file.size < 1024) return "That image looks empty."
  return null
}

export interface ReceiptPatch {
  amount?: string
  category?: string
  vendorName?: string
  spentDate?: string
}

/**
 * Coerce a parsed receipt into form values.
 * @param allowedCategories the form's own category enum — a model-invented
 *        category must never reach the <select> or the API.
 * @param now injectable clock so "no future receipts" is testable.
 */
export function coerceReceipt(
  data: any,
  allowedCategories: readonly string[],
  now: number = Date.now(),
): ReceiptPatch {
  const out: ReceiptPatch = {}

  // Money path: a stored expense total must never be poisoned by an unbounded
  // model number. Require finite, strictly positive, and within a sane cap.
  const amt = Number(data?.amount)
  if (Number.isFinite(amt) && amt > 0 && amt <= MONEY_MAX) out.amount = String(amt)

  const cat = String(data?.category ?? "")
  if (allowedCategories.includes(cat)) out.category = cat

  const vendor = typeof data?.vendor === "string" ? data.vendor.trim() : ""
  if (vendor) out.vendorName = vendor.slice(0, 120)

  const d = String(data?.date ?? "")
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const parsed = new Date(`${d}T00:00:00Z`)
    // Reject impossible dates ("2026-02-31" rolls over to Mar 3), future receipts
    // (allow +1 day for TZ skew), and absurdly old dates from a mis-read year.
    const roundTrips = !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === d
    const t = parsed.getTime()
    if (roundTrips && t <= now + 864e5 && t >= DATE_FLOOR_MS) out.spentDate = d
  }
  return out
}

/* ── BEO line items ───────────────────────────────────────────────────────── */

export interface BeoRow { label: string; qty: number; unitPrice: number; notes: string }

/** Max rows we'll import in one suggestion — a BEO with 50 AI rows is a mistake. */
export const BEO_MAX_ROWS = 20

/**
 * Coerce suggested BEO items into editor rows. These feed `subtotal` and the
 * saved `lineItemsJson`, so a non-finite qty/price would render the sheet total
 * as NaN. Drop bad rows rather than importing them.
 */
export function coerceBeoItems(raw: unknown): BeoRow[] {
  if (!Array.isArray(raw)) return []
  const out: BeoRow[] = []
  for (const r of raw as any[]) {
    const label = typeof r?.label === "string" ? r.label.trim() : ""
    if (!label) continue // a row with no description is noise
    const qty = Number(r?.qty)
    const unitPrice = Number(r?.unitPrice)
    if (!Number.isFinite(qty) || qty <= 0 || qty > QTY_MAX) continue
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > MONEY_MAX) continue
    // Even in-range qty × price can overflow the sheet's DECIMAL(12,2) total.
    // Drop any single line whose value is beyond sane — never import a bomb.
    if (qty * unitPrice > MONEY_MAX) continue
    out.push({
      label: label.slice(0, 200),
      qty,
      unitPrice,
      notes: typeof r?.notes === "string" && r.notes.trim() ? r.notes.trim().slice(0, 300) : "",
    })
    if (out.length >= BEO_MAX_ROWS) break
  }
  return out
}
