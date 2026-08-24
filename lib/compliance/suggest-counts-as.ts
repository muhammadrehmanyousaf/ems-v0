/**
 * WW-ONE-DISH BACKFILL — propose what a dish counts as, from its name.
 *
 * ── Read this before changing anything here ───────────────────────────────
 *
 * `one-dish.ts` deliberately refuses to classify dishes by name, and its reason
 * is not squeamishness: the documented way around the Punjab one-dish rule is
 * to list a second salan as a "special salad". A name-reading checker would be
 * beaten by exactly that, and would then certify an illegal menu as legal —
 * worse than admitting we do not know.
 *
 * Nothing here contradicts that, because nothing here produces a verdict. This
 * is a DATA-ENTRY AID and only that. It exists because a venue carrying menus
 * from before the classifier shipped has every dish sitting at "other", and
 * clearing that by hand is roughly ninety dropdown selections across their
 * menus — friction that leaves real venues stuck on an amber badge forever.
 *
 * The contract, which the caller must honour:
 *
 *   1. A suggestion is never saved on its own. The vendor confirms it, and the
 *      confirmation is what gets written as `countsAs`.
 *   2. An unconfirmed suggestion must NOT count toward the verdict. A menu
 *      full of suggestions is still `unknown`, never green.
 *   3. Where the honest answer is "this could go either way", return null and
 *      let a human decide. A gap the vendor fills is a better outcome than a
 *      confident guess they rubber-stamp.
 *
 * Rule 3 is why daal, for instance, is deliberately absent below.
 */
import type { CountsAs } from "./one-dish";

/**
 * Ordered most-specific first: "chicken biryani" must match rice before
 * "chicken" can drag it anywhere else, and "seekh kabab" must be read as BBQ
 * rather than as a main.
 */
const PATTERNS: { re: RegExp; countsAs: CountsAs }[] = [
  // ── Rice ────────────────────────────────────────────────────────────────
  { re: /\b(biry?ani|pulao|pilaf|rice|chawal|zeera\s*rice|steam\s*rice)\b/i, countsAs: "rice" },

  // ── Bread ───────────────────────────────────────────────────────────────
  { re: /\b(naan|nan|roghni|roti|chapati|kulcha|paratha|sheermal|taftan|bread)\b/i, countsAs: "bread" },

  // ── Sweet ───────────────────────────────────────────────────────────────
  // Zarda is sweet rice — it must beat the rice pattern, so it sits here and
  // the rice pattern above deliberately does not claim it.
  { re: /\b(zarda|kheer|firni|phirni|gulab\s*jamun|jalebi|halwa|halva|barfi|rasmalai|ras\s*malai|kulfi|ice\s*cream|falooda|shahi\s*tukda|custard|trifle|mithai|dessert|sweet)\b/i, countsAs: "sweet" },

  // ── Salad ───────────────────────────────────────────────────────────────
  { re: /\b(salad|salaad|raita|chaat|chana\s*chaat|russian\s*salad|coleslaw|kachumar)\b/i, countsAs: "salad" },

  // ── Drink ───────────────────────────────────────────────────────────────
  { re: /\b(tea|chai|coffee|qahwa|kahwa|water|juice|soft\s*drink|cold\s*drink|drink|lassi|sharbat|lemonade|mint\s*margarita|soda)\b/i, countsAs: "drink" },

  /**
   * BBQ, grills and starters count as "other", matching the SECTION_DEFAULTS
   * the backend already uses for bbq / livebbq / livecounters / stations.
   *
   * This sits ABOVE the salan pattern on purpose. "Chicken Malai Boti" and
   * "Fish Fry" are grills, not the main curry, and reading them as a salan
   * would manufacture a violation on a menu that does not have one.
   */
  { re: /\b(tikka|kab(?:a|o)b|boti|bbq|barbecue|barbeque|seekh|malai\s*boti|grill|roast|fry|fried|broast|wings|drumsticks?|platter|starter|soup|live\s*counter)\b/i, countsAs: "other" },

  // ── Salan (the capped one) ──────────────────────────────────────────────
  // Only unmistakable curries. Anything arguable is left to the vendor.
  { re: /\b(karahi|karhai|kadhai|qorma|korma|nihari|haleem|handi|salan|saalan|curry|masala\s*gosht|bhuna|do\s*pyaza|paya|maghaz|kofta|shahi\s*chicken|butter\s*chicken|chicken\s*white|makhani)\b/i, countsAs: "salan" },
];

/**
 * Names we refuse to guess at, even when a pattern above would match, because
 * the answer is genuinely contested and the wrong call is legally material.
 *
 * Daal is the case that matters: many venues serve it alongside the main curry
 * and do not count it as the salan; others do. Only the venue knows, so the
 * dropdown is left for them rather than filled with a coin flip.
 */
const TOO_AMBIGUOUS = /\b(da+l|dhal|lentil|maash|channa|chana\s*masala|sabzi|vegetable|veg\b|mix\s*veg|aloo|paneer)\b/i;

export interface Suggestion {
  countsAs: CountsAs | null;
  /** Why we proposed it, shown to the vendor so the guess is inspectable. */
  note: string | null;
}

/**
 * Propose a classification for one dish name.
 *
 * Returns `{ countsAs: null }` whenever we are not confident — that is the
 * honest answer, and the caller must leave such a dish for the vendor.
 */
export function suggestCountsAs(rawName: string): Suggestion {
  const name = String(rawName || "").trim();
  if (!name) return { countsAs: null, note: null };

  if (TOO_AMBIGUOUS.test(name)) {
    return {
      countsAs: null,
      note: "Only you can say whether this counts as the main dish — we have not guessed.",
    };
  }

  for (const p of PATTERNS) {
    const m = p.re.exec(name);
    if (m) return { countsAs: p.countsAs, note: `Read from “${m[0]}”.` };
  }
  return { countsAs: null, note: null };
}

/** Suggest across a list, preserving order. */
export function suggestAll(names: string[]): Suggestion[] {
  return names.map((n) => suggestCountsAs(n));
}
