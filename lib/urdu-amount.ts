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

/**
 * @returns rupee integer, or null if the input can't be parsed.
 */
export function parseUrduAmount(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input) : null;
  const s = String(input).toLowerCase().trim();
  if (!s) return null;

  // Plain number with thousands/lakh separators or spaces: "50000", "1,50,000".
  const cleaned = s.replace(/[,\s_]/g, "");
  if (/^\d+(\.\d+)?$/.test(cleaned)) return Math.round(Number(cleaned));
  if (/^(rs|pkr|rupees?|روپے)\.?\s*/i.test(s)) {
    const rest = s.replace(/^(rs|pkr|rupees?|روپے)\.?\s*/i, "");
    const n = parseUrduAmount(rest);
    if (n != null) return n;
  }

  // "<number> <unit>" groups, possibly several ("2 lakh 50 hazaar").
  let total = 0;
  let matched = false;
  const consumed: [number, number][] = [];
  const re = /(\d+(?:\.\d+)?)\s*([a-z؀-ۿ]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const mult = UNIT[m[2]];
    if (mult) {
      total += Number(m[1]) * mult;
      matched = true;
      consumed.push([m.index, m.index + m[0].length]);
    }
  }

  // Bare trailing number not attached to a unit ("2 lakh 50000").
  if (matched) {
    const bareRe = /(?<![\d.])(\d[\d,]*(?:\.\d+)?)(?![a-z؀-ۿ\d])/g;
    let b: RegExpExecArray | null;
    while ((b = bareRe.exec(s)) !== null) {
      const inConsumed = consumed.some(([a, z]) => b!.index >= a && b!.index < z);
      if (!inConsumed) total += Number(b[1].replace(/,/g, ""));
    }
    return Math.round(total);
  }

  return null;
}
