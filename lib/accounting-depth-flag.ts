// Accounting depth (auto Annex-B + §21 add-back + month-end close + §165) —
// feature flag (OFF by default). Venue-OS P2 · WS5. Gates the CA-reconciliation
// layer over the GL. While unset, no accounting-depth UI renders and the backend
// endpoints 404, so the live dashboard is unchanged.
//
//   NEXT_PUBLIC_ACCOUNTING_DEPTH_ON=true   → render the reconciliation surface
//   (unset / anything else)                → OFF (default)

const ON = process.env.NEXT_PUBLIC_ACCOUNTING_DEPTH_ON === "true"

/** Whether the accounting-depth surface should render. OFF by default. */
export function isAccountingDepthOn(_businessId?: number | string | null): boolean {
  return ON
}

export const ACCOUNTING_DEPTH_ON = isAccountingDepthOn()
