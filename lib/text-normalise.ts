/**
 * WP39 / ACCESS-020: the spelling-insensitive fold used by every client-side list filter.
 *
 * The SAME fold as the server's `normaliseText` (backend src/utils/textNormalise.js): Arabic yeh / alef maksura -> Farsi yeh, Arabic kaf ->
 * keheh, Arabic heh / heh doachashmee -> heh goal, harakat / tatweel / zero-width / bidi marks removed, Arabic-Indic and Persian digits ->
 * ASCII, lower-cased. A name typed on another Urdu keyboard then finds the same person in the list the user is looking at.
 * Latin text is only lower-cased and trimmed, so existing filters keep matching exactly what they matched.
 */

const IGNORABLE_RE = /[ً-ٰٟـ​-‏‪-‮⁦-⁩﻿­]/g

// FROM -> TO, same index
const FROM = "يىكهھ٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹"
const TO = "ییکہہ" + "01234567890123456789"
const MAP = new Map<string, string>(Array.from(FROM).map((ch, i) => [ch, Array.from(TO)[i]]))

export function foldText(value: unknown): string {
  if (value == null) return ""
  let s = String(value)
  try { s = s.normalize("NFKC") } catch { /* keep as is */ }
  s = s.replace(IGNORABLE_RE, "")
  let out = ""
  for (const ch of s) out += MAP.get(ch) || ch
  return out.toLowerCase().trim()
}
