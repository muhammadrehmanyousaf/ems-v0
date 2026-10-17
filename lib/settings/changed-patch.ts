/**
 * Write-integrity helpers for the Settings screens (WP38, package P7).
 *
 * Three rules every Settings writer must follow, and the one place they are
 * written down so the screens stop re-inventing them:
 *
 *  1. UNANSWERED STAYS UNANSWERED.  A yes/no question nobody answered is `null`
 *     in the database, and on a public listing "not said" and "we do not do
 *     this" are different statements.  `Boolean(null)` is `false`, which is how
 *     a one-field save used to write "we do not accept cash" for the venue
 *     (SETUP-028).  Booleans are therefore kept tri-state (`true | false | null`)
 *     from load to save.
 *
 *  2. A PARTIAL SAVE SENDS ONLY WHAT CHANGED.  `changedPatch(next, loaded)`
 *     returns the keys whose value the vendor actually moved.  An untouched
 *     field is never sent, so it can neither be converted nor overwritten with a
 *     stale copy.
 *
 *  3. DIFF AGAINST WHAT IS SAVED, NOT WHAT THE PAGE LOADED WITH.  After a
 *     successful save the "loaded" copy must become what was just saved
 *     (SETUP-021).  Otherwise editing a field back to its page-load value
 *     diffs as "no change", the save sends nothing, and the toast still says
 *     "saved" while the server keeps the intermediate value.
 *
 * Pure functions, no React: scripts/settings-integrity-check.mts drives them.
 */

/** An empty answer: nothing typed, nothing ticked.  `false` and `0` are answers. */
export function isUnset(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === "string") return v.trim() === ""
  if (Array.isArray(v)) return v.length === 0
  return false
}

/**
 * Deep equality for form values.  An empty list, an empty string and null all
 * mean "nothing here" and compare equal to each other, but `false` is NOT equal
 * to `null`: an explicit No is not the same statement as an unanswered question.
 */
export function sameValue(a: unknown, b: unknown): boolean {
  if (isUnset(a) && isUnset(b)) return true
  if (typeof a === "boolean" || typeof b === "boolean") return a === b
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => sameValue(x, b[i]))
  }
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object)
    const kb = Object.keys(b as object)
    const all = new Set([...ka, ...kb])
    for (const k of all) {
      if (!sameValue((a as any)[k], (b as any)[k])) return false
    }
    return true
  }
  // "100" vs 100: a number input hands back strings.
  if ((typeof a === "number" && typeof b === "string") || (typeof a === "string" && typeof b === "number")) {
    return String(a) === String(b)
  }
  return a === b
}

/** The keys of `next` whose value differs from `loaded`; the PATCH body. */
export function changedPatch<T extends Record<string, unknown>>(
  next: T,
  loaded: Record<string, unknown>,
): Partial<T> {
  const out: Partial<T> = {}
  for (const k of Object.keys(next) as (keyof T & string)[]) {
    if (!sameValue(next[k], loaded[k])) out[k] = next[k]
  }
  return out
}

/** A yes/no answer as stored: `true`, `false` or `null` (never answered). */
export type TriState = boolean | null

/** Load a stored yes/no without inventing an answer: only a real boolean survives. */
export function triFrom(v: unknown): TriState {
  return typeof v === "boolean" ? v : null
}

/** What the read-side shows for a yes/no: "Yes", "No", or "Not answered". */
export function triLabel(v: unknown): "Yes" | "No" | "Not answered" {
  if (v === true) return "Yes"
  if (v === false) return "No"
  return "Not answered"
}
