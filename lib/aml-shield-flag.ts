// Venue-OS P3-F — DNFBP AML/CFT readiness card feature flag (OFF by default). The
// AML shield itself (deposit trail, turnover recon, structuring guard-rail) ships in
// WS4-B/C and its four invariants are non-toggleable; this flag gates only the DNFBP
// readiness card. The backend 404s until ENABLE_AML_SHIELD.
//
//   NEXT_PUBLIC_AML_SHIELD_ON=true → render the DNFBP card
//   (unset / anything else)        → OFF (default)

const ON = process.env.NEXT_PUBLIC_AML_SHIELD_ON === "true";

/** Whether the DNFBP readiness card should render. OFF by default. */
export function isAmlShieldOn(_businessId?: number | string | null): boolean {
  return ON;
}

export const AML_SHIELD_ON = isAmlShieldOn();
