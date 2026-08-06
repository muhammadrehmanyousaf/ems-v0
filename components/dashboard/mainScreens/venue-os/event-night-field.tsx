"use client";

/**
 * "Which night?" for the console and the guest list.
 *
 * When the gauge has opened tonight's night the id is already known, so this
 * states which function is on screen instead of asking for a primary key. When
 * it hasn't, it says so — and still takes a typed id, so nothing that worked
 * before stops working.
 */
import * as React from "react";
import { useEventNightScope } from "./event-night-context";

export function EventNightField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}): React.ReactElement {
  const scope = useEventNightScope();

  // Adopt the night the gauge opened, unless the operator has typed their own.
  const touched = React.useRef(false);
  React.useEffect(() => {
    if (scope.nightId != null && !touched.current) onChange(String(scope.nightId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.nightId]);

  if (scope.nightId != null && value === String(scope.nightId)) {
    return (
      <div className="text-sm">
        <div className="mb-1 text-muted-foreground">Tonight&apos;s function</div>
        <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/40 px-2">
          <span className="font-medium">{scope.label || `Night #${scope.nightId}`}</span>
          <span className="text-xs text-muted-foreground">night #{scope.nightId}</span>
          <button
            type="button"
            onClick={() => {
              touched.current = true;
              onChange("");
            }}
            className="ml-1 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            change
          </button>
        </div>
      </div>
    );
  }

  return (
    <label className="text-sm">
      <div className="mb-1 text-muted-foreground">Event night #</div>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          touched.current = true;
          onChange(e.target.value);
        }}
        placeholder="open the gauge above"
        className="h-9 w-44 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

export default EventNightField;
