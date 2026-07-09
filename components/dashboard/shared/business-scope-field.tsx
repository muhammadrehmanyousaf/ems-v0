"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Venue-scope control for Venue-OS panels.
 *
 * Panels hold their businessId via `useBusinessIdField`, which pre-fills from the
 * venue selected in the dashboard header. When a specific venue IS active the raw
 * "Business #" number box is just noise — the header switcher is the real control
 * — so this renders nothing and the panel simply works, pre-scoped. It only shows
 * an input under "All venues" (value empty), so a cross-venue lookup is still
 * possible. Drop-in replacement for the `<label>Business #<input/></label>` boxes.
 */
export function BusinessScopeField({
  value,
  onChange,
  label = "Venue #",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  className?: string;
}): React.ReactElement | null {
  if (value) return null; // a venue is active → header switcher owns scope
  return (
    <label className="text-sm">
      <div className="mb-1 text-muted-foreground">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="pick a venue in the header"
        className={cn(
          "h-9 w-40 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2",
          className,
        )}
      />
    </label>
  );
}

export default BusinessScopeField;
