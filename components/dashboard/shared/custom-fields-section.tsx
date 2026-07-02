"use client";

/**
 * <CustomFieldsSection> — renders a host record's vendor-defined custom fields as
 * form inputs, grouped by section, typed per definition. Controlled via a values
 * map + onChange. Renders NOTHING when the feature is off, the venue has no defs,
 * or businessId is missing — so it drops into any host form as one safe line.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CustomFieldsAPI, type CustomFieldDef, type CustomFieldValues } from "@/lib/api/customFields";
import { useIsCustomFieldsOn } from "@/lib/custom-fields-flag";
import { cn } from "@/lib/utils";

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2";
const labelCls = "text-xs font-medium text-muted-foreground";

export function useCustomFieldDefs(entityType: string, businessId: number | null | undefined) {
  const enabled = useIsCustomFieldsOn();
  return useQuery({
    // includeInactive=false in the key so this active-only read never collides with
    // the field-manager's include-inactive read (same prefix → shared invalidation).
    queryKey: ["customFieldDefs", entityType, businessId, false],
    queryFn: () => CustomFieldsAPI.list(entityType, businessId as number),
    enabled: enabled && businessId != null,
    staleTime: 5 * 60_000,
  });
}

export function CustomFieldsSection({
  entityType, businessId, values, onChange, className, heading = "Custom fields",
}: {
  entityType: string;
  businessId: number | null | undefined;
  values: CustomFieldValues;
  onChange: (v: CustomFieldValues) => void;
  className?: string;
  heading?: string | null;
}): React.ReactElement | null {
  const on = useIsCustomFieldsOn();
  const q = useCustomFieldDefs(entityType, businessId);
  const defs = (q.data ?? []).filter((d) => d.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  if (!on || businessId == null || defs.length === 0) return null;

  const set = (key: string, v: unknown) => onChange({ ...values, [key]: v });

  const groups = new Map<string, CustomFieldDef[]>();
  for (const d of defs) {
    const s = d.section || "";
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s)!.push(d);
  }

  return (
    <div className={cn("space-y-4 rounded-lg border border-dashed border-primary/30 bg-primary/[0.02] p-4", className)}>
      {heading && (
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary/80">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70" /> {heading}
        </div>
      )}
      {[...groups.entries()].map(([section, fields]) => (
        <div key={section || "_default"} className="space-y-3">
          {section && <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{section}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((d) => (
              <FieldInput key={d.id} def={d} value={values[d.fieldKey]} onChange={(v) => set(d.fieldKey, v)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldInput({ def, value, onChange }: { def: CustomFieldDef; value: unknown; onChange: (v: unknown) => void }): React.ReactElement {
  const wrap = (child: React.ReactNode, full = false) => (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <label className={labelCls}>{def.label}{def.required && <span className="text-destructive"> *</span>}</label>
      {child}
      {def.helpText && <p className="text-[11px] text-muted-foreground">{def.helpText}</p>}
    </div>
  );
  const s = value == null ? "" : String(value);

  switch (def.fieldType) {
    case "textarea":
      return wrap(<textarea className={cn(inputCls, "h-20 resize-y py-2")} value={s} onChange={(e) => onChange(e.target.value)} />, true);
    case "boolean":
      return wrap(
        <label className="flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-input" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-muted-foreground">{def.helpText || "Yes"}</span>
        </label>,
      );
    case "number":
    case "money":
      return wrap(
        <div className="relative">
          {def.fieldType === "money" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rs</span>}
          <input type="number" className={cn(inputCls, "tabular-nums", def.fieldType === "money" && "pl-8")} value={s} onChange={(e) => onChange(e.target.value)} />
        </div>,
      );
    case "date":
      return wrap(<input type="date" className={inputCls} value={s.slice(0, 10)} onChange={(e) => onChange(e.target.value)} />);
    case "datetime":
      return wrap(<input type="datetime-local" className={inputCls} value={s} onChange={(e) => onChange(e.target.value)} />);
    case "dropdown":
      return wrap(
        <select className={inputCls} value={s} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(def.optionsJson || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>,
      );
    case "multiselect": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return wrap(
        <div className="flex flex-wrap gap-1.5">
          {(def.optionsJson || []).map((o) => {
            const on = arr.includes(o.value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => onChange(on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
                className={cn("rounded-full border px-2.5 py-1 text-xs transition", on ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:border-primary/40")}
              >
                {o.label}
              </button>
            );
          })}
        </div>,
        true,
      );
    }
    default: {
      const type = def.fieldType === "email" ? "email" : def.fieldType === "url" ? "url" : def.fieldType === "phone" ? "tel" : "text";
      return wrap(<input type={type} className={inputCls} value={s} onChange={(e) => onChange(e.target.value)} />);
    }
  }
}

export default CustomFieldsSection;
