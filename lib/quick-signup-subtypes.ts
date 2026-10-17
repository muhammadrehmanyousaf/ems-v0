// WP36 - what /onboarding (the 90-second quick signup) sends as `subBusinessType`.
//
// The server refuses a registration with no business type ("At least one business type is required": an empty one
// leaves the booking page's event picker dead), and the quick-signup page never sent one, so every signup from it
// answered 400. The page has no step to ask, so it sends the wizard's own value for the chosen type:
//   - types whose registration wizard offers a fixed list (lib/vendor-type-config.ts) -> the wedding option of that list
//   - Catering -> "Wedding" (the wizard's first catering type)
//   - Car rental -> "Sedan" (the wizard's first vehicle type; the wizard derives the list from the fleet)
//   - the 14 newer categories -> the category's own name (the wizard's field there is free text)
// The vendor can change it from Settings afterwards, exactly as after the full wizard.
import { VENDOR_TYPES } from "@/lib/vendor-types";

const FROM_WIZARD_LISTS: Record<string, string> = {
  [VENDOR_TYPES.WEDDING_VENUE]: "Marquee",
  [VENDOR_TYPES.PHOTOGRAPHER]: "Wedding",
  [VENDOR_TYPES.DECORATOR]: "Wedding",
  [VENDOR_TYPES.HENNA_ARTIST]: "Traditional",
  [VENDOR_TYPES.MAKEUP_ARTIST]: "Bridal",
  [VENDOR_TYPES.BRIDAL_WEAR]: "Boutique",
  [VENDOR_TYPES.WEDDING_STATIONERY]: "Full-Service Wedding Stationery",
  [VENDOR_TYPES.CATERING]: "Wedding",
  [VENDOR_TYPES.CAR_RENTAL]: "Sedan",
};

export function quickSignupSubTypes(vendorType: string): string[] {
  const fixed = FROM_WIZARD_LISTS[vendorType];
  if (fixed) return [fixed];
  const name = String(vendorType || "").trim();
  return name ? [name] : [];
}

/** Test hook: the values that must be members of the wizard's own option lists. */
export const QUICK_SIGNUP_FIXED_VALUES = FROM_WIZARD_LISTS;
