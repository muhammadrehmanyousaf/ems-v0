/**
 * WP39 / PUBLIC-026: the one word a 0-5 rating wears on the public vendor card and the vendor page.
 *
 * Two copies of this ladder disagreed with each other (3.0-3.4 read "Very Good" on the page and "Good" on the card) and both ended
 * in "Good" for everything below, so a 2.0 read "Good". One five-step scale now:
 *   4.5+ Exceptional, 4.0+ Excellent, 3.5+ Very Good, 3.0+ Good, 2.0+ Fair, below that Poor.
 */
export function ratingLabel(rating: number): string {
  const r = Number(rating)
  if (!Number.isFinite(r)) return "Good"
  if (r >= 4.5) return "Exceptional"
  if (r >= 4) return "Excellent"
  if (r >= 3.5) return "Very Good"
  if (r >= 3) return "Good"
  if (r >= 2) return "Fair"
  return "Poor"
}
