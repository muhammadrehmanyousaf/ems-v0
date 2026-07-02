// Double-entry General Ledger engine — feature flag (OFF by default).
//
// Part of the venue-OS foundations (P0 · WS-0B, decisions ETH-1/ACC-1/ACC-2/
// SCO-6). The honest double-entry GL (ChartOfAccount / JournalEntry /
// JournalLine + the `is_declared` management-vs-tax split) and its ledger
// screens stay dark until this is turned on. With it unset, nothing posts and
// no ledger UI routes — the existing P&L/revenue screens are unchanged.
//
//   NEXT_PUBLIC_GL_ENGINE_ON=true   → render ledger surfaces
//   (unset / anything else)         → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the per-business gate is the
// server-side FeatureFlagOverride table.)

import { runtimeFlagOn } from "@/lib/venue-os-runtime-flags"

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_GL_ENGINE_ON === "true"

/**
 * Whether the GL / ledger surfaces should render. OFF globally by default, but
 * ON when the active venue has a per-business override (runtime store).
 */
export function isGlEngineOn(_businessId?: number | string | null): boolean {
  return ON || runtimeFlagOn("GL_ENGINE_ON")
}

/** Convenience for non-conditional consumers. */
export const GL_ENGINE_ON = isGlEngineOn()
