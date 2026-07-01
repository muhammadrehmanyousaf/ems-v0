// Venue-OS P3-E — RecipeBOM + ProductionRun (degh-yield / food-cost variance)
// feature flag (OFF by default). The backend 404s until ENABLE_KITCHEN_BOM.
//
//   NEXT_PUBLIC_KITCHEN_BOM_ON=true → render the kitchen BOM panel
//   (unset / anything else)         → OFF (default)

const ON = process.env.NEXT_PUBLIC_KITCHEN_BOM_ON === "true";

/** Whether the kitchen BOM / yield-variance surface should render. OFF by default. */
export function isKitchenBomOn(_businessId?: number | string | null): boolean {
  return ON;
}

export const KITCHEN_BOM_ON = isKitchenBomOn();
