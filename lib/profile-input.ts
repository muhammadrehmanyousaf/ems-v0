/**
 * WP33 / SETUP-056 - what the Profile save checks before it sends (the server judges the same: backend src/utils/profileInput.js).
 * Only fields in the patch are judged; clearing an optional field is always allowed.
 */
import { phoneIssue } from "@/lib/booking-input"

export function profileIssue(patch: Record<string, string>): { field: string; message: string } | null {
  if ("fullName" in patch) {
    const n = (patch.fullName || "").trim()
    if (n.length < 2) return { field: "fullName", message: "Poora naam likhein (kam az kam 2 harf)" }
    if (n.length > 120) return { field: "fullName", message: "Naam bohat lamba hai (120 se kam)" }
    if (/[<>]/.test(n)) return { field: "fullName", message: "Naam mein < ya > nahi ho sakta" }
  }
  for (const [f, label] of [["primaryContactNumber", "Primary number"], ["secondaryContactNumber", "Secondary number"]] as const) {
    if (f in patch && (patch[f] || "").trim() && phoneIssue(patch[f])) return { field: f, message: `${label} sahi likhein (e.g. 0300 1234567)` }
  }
  if ("website" in patch && (patch.website || "").trim()) {
    const w = patch.website.trim()
    if (!/^https?:\/\/[^\s<>"']+$/i.test(w) || w.length > 500) return { field: "website", message: "Website http:// ya https:// se shuru hone wala link ho" }
  }
  return null
}

/** The server's own sentence when it refused the save (it names the field), else the generic line. */
export function serverMessageOf(err: unknown, fallback: string): string {
  const m = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof m === "string" && m.trim() && m.length < 200 ? m : fallback
}
