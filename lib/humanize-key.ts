/**
 * A stored key shown to a person: "SeatingArrangement" -> "Seating Arrangement",
 * "non_refundable" -> "Non refundable". Text that already reads as words ("Main Hall", "Hall") is returned
 * unchanged apart from its first letter. Used where a package/spec key is printed as a row label (the
 * vendor registration review step printed `SeatingArrangement` and `SoundLighting` as stored).
 *
 * The venue package options whose label is not just their key split into words are listed, so the review
 * step says what the package form said ("Sound & Lighting", "Hall / Venue").
 */
const KNOWN: Record<string, string> = {
  hall: "Hall / Venue",
  soundLighting: "Sound & Lighting",
}

export function humanizeKey(key: unknown): string {
  if (typeof key !== "string") return ""
  const known = KNOWN[key.trim()]
  if (known) return known
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : ""
}
