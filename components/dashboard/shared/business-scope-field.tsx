"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useActiveBusinessId } from "@/lib/store/active-business-store";
import { useMyBusinesses } from "@/hooks/use-my-businesses";

/**
 * Venue-scope control for Venue-OS panels.
 *
 * Panels hold their businessId via `useBusinessIdField`, which resolves to the
 * header's venue, or — under "All venues" — the vendor's first venue.
 *
 * What this renders depends on whether there is a real choice to make:
 *   • a venue is active in the header  → nothing. The header switcher is the
 *     control; repeating it in 36 panels is noise.
 *   • "All venues" + one venue         → nothing. There is nothing to choose.
 *   • "All venues" + several venues    → a named dropdown, so an owner of three
 *     halls can see WHICH hall's spaces / galla / recipes they are looking at,
 *     and switch without leaving the panel.
 *
 * It used to render a `<input type="number">` labelled "Venue #" whenever no
 * venue was active. That asked the vendor for a primary key. Nobody typed one,
 * so nothing ever loaded — which is why the Spaces, Cash & Cheques and Kitchen
 * tabs looked like a heading and four empty boxes.
 */
export function BusinessScopeField({
  value,
  onChange,
  label = "Venue",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  className?: string;
}): React.ReactElement | null {
  const activeBusinessId = useActiveBusinessId();
  const { data: businesses } = useMyBusinesses();

  if (activeBusinessId != null) return null;

  const list = businesses ?? [];
  if (list.length <= 1) return null;

  return (
    <label className="text-sm">
      <div className="mb-1 text-muted-foreground">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 max-w-[16rem] rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2",
          className,
        )}
      >
        {list.map((b) => (
          <option key={b.id} value={String(b.id)}>
            {b.name}
            {b.city ? ` · ${b.city}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export default BusinessScopeField;
