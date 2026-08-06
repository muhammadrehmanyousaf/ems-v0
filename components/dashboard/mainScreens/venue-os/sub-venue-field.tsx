"use client";

/**
 * "Which space?" — by name.
 *
 * Panels asked for a bare `Sub-venue #`. The vendor who built the tree upstairs
 * named their spaces "Main Hall", "Mezzanine", "Lawn"; the id was never shown to
 * them anywhere, so the availability check could not be run at all. This loads
 * the active venue's tree and lists it, indented by depth.
 *
 * Falls back to the number box only when the venue has no tree yet, so a venue
 * that has not adopted hierarchical spaces is not left without a control.
 */
import * as React from "react";
import { venueSpacesApi, type SubVenueNode } from "@/lib/api/venueSpaces";
import { useBusinessIdField } from "@/lib/store/use-business-id-field";

function flatten(nodes: SubVenueNode[] | undefined, depth = 0, acc: { node: SubVenueNode; depth: number }[] = []) {
  for (const n of nodes || []) {
    acc.push({ node: n, depth });
    flatten(n.children, depth + 1, acc);
  }
  return acc;
}

export function SubVenueField({
  value,
  onChange,
  label = "Space",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}): React.ReactElement {
  const [businessId] = useBusinessIdField();
  const [items, setItems] = React.useState<{ node: SubVenueNode; depth: number }[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    if (!businessId) {
      setItems([]);
      return;
    }
    (async () => {
      try {
        const t = await venueSpacesApi.getTree(Number(businessId));
        if (!cancelled) setItems(flatten(t.tree));
      } catch {
        if (!cancelled) setItems([]); // no tree → the manual box below
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (items.length === 0) {
    return (
      <label className="text-sm">
        <div className="mb-1 text-muted-foreground">Sub-venue #</div>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="no spaces set up yet"
          className="h-9 w-44 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
    );
  }

  return (
    <label className="text-sm">
      <div className="mb-1 text-muted-foreground">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 max-w-[16rem] rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Pick a space…</option>
        {items.map(({ node, depth }) => (
          <option key={node.id} value={String(node.id)}>
            {"  ".repeat(depth)}
            {node.name}
            {node.kind ? ` · ${node.kind.toLowerCase()}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export default SubVenueField;
