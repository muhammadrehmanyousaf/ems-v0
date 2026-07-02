// Custom Fields / Custom Modules — per-venue feature flags.
//
// OFF globally by default; ON for a venue when its per-business FeatureFlagOverride
// is set (surfaced via the venue-OS health runtime store the sidebar populates —
// same mechanism as the CFO tier). So the field-manager + custom-field inputs
// appear only for pilot venues, and stay invisible for everyone else.
import { runtimeFlagOn, useRuntimeFlag } from "@/lib/venue-os-runtime-flags";

export function isCustomFieldsOn(): boolean {
  return process.env.NEXT_PUBLIC_CUSTOM_FIELDS_ON === "true" || runtimeFlagOn("ENABLE_CUSTOM_FIELDS");
}

export function isCustomModulesOn(): boolean {
  return process.env.NEXT_PUBLIC_CUSTOM_MODULES_ON === "true" || runtimeFlagOn("ENABLE_CUSTOM_MODULES");
}

// Reactive variants — re-render the caller when the active venue's flags resolve.
// Prefer these in render paths (list columns, toolbar buttons, form sections) so
// the custom-fields UI appears as soon as the flag is known on a fresh page load.
export function useIsCustomFieldsOn(): boolean {
  const rt = useRuntimeFlag("ENABLE_CUSTOM_FIELDS");
  return process.env.NEXT_PUBLIC_CUSTOM_FIELDS_ON === "true" || rt;
}

export function useIsCustomModulesOn(): boolean {
  const rt = useRuntimeFlag("ENABLE_CUSTOM_MODULES");
  return process.env.NEXT_PUBLIC_CUSTOM_MODULES_ON === "true" || rt;
}
