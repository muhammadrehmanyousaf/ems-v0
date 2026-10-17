"use client";

/**
 * WP36 / VENDORTYPES-003 - "Maximum guests you can serve" for the food categories (Catering, Wedding cakes, Mithai and
 * sweets, Live cooking stall). The wizard never asked and silently sent 1, so every cart above one guest was refused
 * for these vendors. Optional: left empty it is sent as "not set" and no guest limit applies.
 */
import * as React from "react";
import { FieldLabel } from "@/components/ui/field-help";
import { Input } from "@/components/ui/input";
import { useFormContext } from "@/lib/context/form-context";

export const MAX_GUEST_TYPES = ["Catering", "Wedding cakes", "Mithai and sweets", "Live cooking stall"];

export default function MaxGuestsField() {
  const { formData, setFormData } = useFormContext();
  return (
    <div>
      <FieldLabel help="maxCapacity" htmlFor="maxCapacity" className="text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
        Maximum guests you can serve <span className="text-neutral-400">(optional)</span>
      </FieldLabel>
      <Input
        id="maxCapacity"
        type="number"
        min="0"
        inputMode="numeric"
        placeholder="e.g. 500"
        value={formData.maxCapacity || ""}
        onChange={(e) => setFormData((prev) => ({ ...prev, maxCapacity: e.target.value ? String(Math.abs(parseInt(e.target.value, 10) || 0)) : "" }))}
        className="mt-1.5 h-11 border-bridal-beige focus:border-bridal-gold"
      />
    </div>
  );
}
