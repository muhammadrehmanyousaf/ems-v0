// Custom Fields / Custom Modules — per-venue feature flags.
//
// OFF globally by default; ON for a venue when its per-business FeatureFlagOverride
// is set (surfaced via the venue-OS health runtime store the sidebar populates —
// same mechanism as the CFO tier). So the field-manager + custom-field inputs
// appear only for pilot venues, and stay invisible for everyone else.
import { runtimeFlagOn } from "@/lib/venue-os-runtime-flags";

export function isCustomFieldsOn(): boolean {
  return process.env.NEXT_PUBLIC_CUSTOM_FIELDS_ON === "true" || runtimeFlagOn("ENABLE_CUSTOM_FIELDS");
}

export function isCustomModulesOn(): boolean {
  return process.env.NEXT_PUBLIC_CUSTOM_MODULES_ON === "true" || runtimeFlagOn("ENABLE_CUSTOM_MODULES");
}
