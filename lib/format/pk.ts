// Pakistani CNIC + phone input masks (live display formatting).
// These format AS THE USER TYPES; the backend still normalises on save, so
// these are purely a UX nicety (and prevent ragged, un-hyphenated entry).

/** Format CNIC digits to `XXXXX-XXXXXXX-X` (max 13 digits). */
export function formatCnic(value: string): string {
  const d = (value || "").replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/**
 * Format a Pakistani phone as the user types.
 * - `+…` international → keep the `+` and the digits.
 * - local mobile (`03XX…`) → `03XX-XXXXXXX`.
 * - anything else (landlines, partials) → keep digits, don't mangle.
 */
export function formatPkPhone(value: string): string {
  const raw = value || "";
  const hasPlus = raw.trimStart().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (hasPlus) return "+" + digits.slice(0, 15);
  if (digits.startsWith("03")) {
    const d = digits.slice(0, 11);
    return d.length <= 4 ? d : `${d.slice(0, 4)}-${d.slice(4)}`;
  }
  return digits.slice(0, 15);
}
