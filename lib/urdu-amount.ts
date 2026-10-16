/**
 * Phase-1 EPIC 6 · T6.3 — Urdu/Roman-Urdu money parser.
 *
 * Pakistani vendors type amounts the way they say them: "50 hazaar", "2.5 lakh",
 * "1.5 crore", "50k", "2 lakh 50 hazaar". This turns any of those (plus plain
 * lakh-grouped numbers like "1,50,000") into a rupee integer, so the register-
 * fast quick-add and the migration sprint accept natural input. Pure + total —
 * returns null on anything it can't confidently read.
 */
const UNIT: Record<string, number> = {
  // thousand
  k: 1e3, hazaar: 1e3, hazar: 1e3, hzr: 1e3, hzar: 1e3, thousand: 1e3,
  "ہزار": 1e3, // ہزار
  // hundred-thousand
  l: 1e5, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, lak: 1e5,
  "لاکھ": 1e5, // لاکھ
  // ten-million
  cr: 1e7, crore: 1e7, crores: 1e7, karor: 1e7, karore: 1e7,
  "کروڑ": 1e7, // کروڑ
};

// PAY-CLOCK-018 (WP13 follow-up): the parser used to read "1,5 lakh" as 500,015, "1.500" as 2 and
// any Urdu / Persian digit string as "not a number" (the booking then saved with total Rs 0). It now
// reads a number only when its separators mean something, and answers null otherwise: never a guess.

/** Arabic-Indic and Persian digits to ASCII, and their separators to "," / ".". */
function asciiDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u066c\u060c]/g, ",")
    .replace(/\u066b/g, ".");
}

const WESTERN_GROUPS = /^\d{1,3}(,\d{3})+$/;       // 1,500   1,500,000
const LAKH_GROUPS = /^\d{1,2}(,\d{2})+,\d{3}$/;    // 1,50,000   12,50,000

/**
 * One number token: digits with optional lakh / western comma grouping and an optional decimal part.
 * null when a comma sits where no grouping puts one ("1,5"), or - for a plain number with no unit - when
 * there are three or more decimals ("1.500": thousands or a decimal, the typist's meaning cannot be told).
 */
function readNumber(token: string, hasUnit: boolean): number | null {
  const parts = token.split(".");
  if (parts.length > 2) return null;
  const [intPart, frac] = parts;
  if (!/^\d[\d,]*$/.test(intPart)) return null;
  if (intPart.includes(",") && !WESTERN_GROUPS.test(intPart) && !LAKH_GROUPS.test(intPart)) return null;
  if (frac !== undefined) {
    if (!/^\d+$/.test(frac)) return null;
    if (!hasUnit && frac.length > 2) return null;
  }
  const n = Number(intPart.replace(/,/g, "") + (frac !== undefined ? "." + frac : ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * @returns rupee integer, or null if the input can't be parsed (never 0, never a guess).
 */
export function parseUrduAmount(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) && input >= 0 ? Math.round(input) : null;
  let s = asciiDigits(String(input)).toLowerCase().trim();
  s = s.replace(/^(rs|pkr|rupees?|\u0631\u0648\u067e\u06d2)\.?\s*/i, "").trim();
  if (!s) return null;

  // Plain number, grouped with commas, spaces or underscores: "50000", "1,50,000", "50 000".
  if (/^[\d,_ .]+$/.test(s)) {
    const n = readNumber(s.replace(/[ _]/g, ","), false);
    return n == null ? null : Math.round(n);
  }

  // "<number> <unit>" terms, possibly several ("2 lakh 50 hazaar", "2 lakh 50000"). The whole
  // string must be consumed: an unknown word or a stray number makes it unreadable, not partial.
  const term = /\s*(\d[\d,]*(?:\.\d+)?)\s*([a-z\u0600-\u06ff]+)?/y;
  let total = 0;
  let units = 0;
  let pos = 0;
  while (pos < s.length) {
    term.lastIndex = pos;
    const m = term.exec(s);
    if (!m) return null;
    pos = term.lastIndex;
    const unit = m[2];
    if (unit !== undefined) {
      const mult = UNIT[unit];
      const n = mult ? readNumber(m[1], true) : null;
      if (!mult || n == null) return null;
      total += n * mult;
      units += 1;
    } else {
      // a bare number is only the tail of a unit expression ("2 lakh 50000"), and only the last term
      if (units === 0 || pos < s.length) return null;
      const n = readNumber(m[1], false);
      if (n == null) return null;
      total += n;
    }
  }
  return units > 0 ? Math.round(total) : null;
}
