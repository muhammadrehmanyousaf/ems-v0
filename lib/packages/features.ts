/**
 * WW-PKGFEAT-NULL — safe narrowing for `Package.features`.
 *
 * `features` is a free-form catalog column and arrives in THREE shapes:
 *   • `Record<string, string[]>` — the grouped map (`{ vehicleType: ["Sedan"] }`)
 *   • `string[]`                 — the legacy flat "what's included" list
 *   • `null`                     — **the default**. The backend writes
 *     `features ?? null` on create (packageController.js), so every package
 *     saved without features is null, not `{}`.
 *
 * Call sites used to narrow with:
 *
 *     const f = !Array.isArray(pkg.features) ? pkg.features : {}
 *     f.vehicleType?.[0]
 *
 * `Array.isArray(null)` is `false`, so that ternary handed `null` straight
 * through and the very next property read threw
 * `Cannot read properties of null (reading 'vehicleType')`. The `?.` guarded
 * the second hop, never the first. On the booking page that throw happened
 * during render, so React unwound to the root error boundary and the couple
 * saw a full-page "We hit an unexpected error" instead of the package step.
 *
 * `featureMap` collapses every non-grouped shape to `{}` so
 * `featureMap(pkg.features).vehicleType?.[0]` is always safe.
 */
export function featureMap(features: unknown): Record<string, string[]> {
  if (!features || Array.isArray(features) || typeof features !== "object") return {}
  return features as Record<string, string[]>
}
