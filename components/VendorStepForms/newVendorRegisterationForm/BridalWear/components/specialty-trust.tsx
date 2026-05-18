"use client";

/**
 * VR-050 — Bridal Wear "Specialty & Trust" step.
 *
 * Server-side typeSpecificDetails whitelist (vendorType "Bridal wearing"):
 *   stitchingTurnaroundWeeks, fittingsIncluded, embroideryType,
 *   matchingDupattaIncluded, accompanyingOutfitsIncluded, rentOrSale,
 *   alterationPolicy, depositRefundable
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shirt } from "lucide-react";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
  useTypeSpecificDetails,
} from "../../shared/UniversalTrustSection";

const BridalWearSpecialtyTrust = () => {
  const { tsd, setTsd } = useTypeSpecificDetails();

  const numberInput = (
    key: string,
    label: string,
    placeholder: string,
    opts?: { min?: number; max?: number },
  ) => (
    <div className="space-y-2" key={key}>
      <Label>{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        min={opts?.min ?? 0}
        max={opts?.max}
        placeholder={placeholder}
        value={tsd[key] != null ? String(tsd[key]) : ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return setTsd(key, null);
          let n = Number(raw);
          if (!Number.isFinite(n)) return;
          if (opts?.min != null) n = Math.max(opts.min, n);
          if (opts?.max != null) n = Math.min(opts.max, n);
          setTsd(key, n);
        }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <TrustSignalsSection />

      <SectionCard title="Bridal wear specialty" icon={Shirt}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rent or sale?</Label>
            <Select
              value={(tsd.rentOrSale as string) || ""}
              onValueChange={(v) => setTsd("rentOrSale", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saleOnly">Sale only</SelectItem>
                <SelectItem value="rentOnly">Rent only</SelectItem>
                <SelectItem value="bothOffered">Both offered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Embroidery type</Label>
            <Select
              value={(tsd.embroideryType as string) || ""}
              onValueChange={(v) => setTsd("embroideryType", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="handEmbroidery">Hand embroidery</SelectItem>
                <SelectItem value="machineEmbroidery">Machine embroidery</SelectItem>
                <SelectItem value="zardozi">Zardozi</SelectItem>
                <SelectItem value="resham">Resham</SelectItem>
                <SelectItem value="mixed">Mixed techniques</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {numberInput("stitchingTurnaroundWeeks", "Stitching turnaround (weeks)", "e.g. 6", { min: 1, max: 52 })}
          {numberInput("fittingsIncluded", "Fittings included", "e.g. 3", { min: 0, max: 20 })}
          <div className="space-y-2 sm:col-span-2">
            <Label>Alteration policy</Label>
            <Input
              placeholder="e.g. Free within 2 weeks of fitting, paid after"
              value={(tsd.alterationPolicy as string) || ""}
              onChange={(e) => setTsd("alterationPolicy", e.target.value || null)}
              maxLength={500}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-5">
          {[
            { key: "matchingDupattaIncluded", label: "Matching dupatta included" },
            { key: "accompanyingOutfitsIncluded", label: "Accompanying outfits (nikah, mehndi…) bundled" },
            { key: "depositRefundable", label: "Deposit refundable" },
          ].map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={!!tsd[f.key]}
                onCheckedChange={(c) => setTsd(f.key, !!c)}
              />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      <VerificationSection />
    </div>
  );
};

export default BridalWearSpecialtyTrust;
