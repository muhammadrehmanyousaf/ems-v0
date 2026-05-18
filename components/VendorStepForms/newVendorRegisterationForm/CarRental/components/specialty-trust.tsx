"use client";

/**
 * VR-050 — Car Rental "Specialty & Trust" step.
 *
 * Server-side typeSpecificDetails whitelist (vendorType "Car rental"):
 *   chauffeurIncluded, fuelAllowanceKm, extraKmCharge,
 *   decorationSetupForBaraat, doliCeremonyContinuation,
 *   multiDayRentalDiscount, hourlyCap, midnightSurcharge,
 *   vehicleInsuranceIncluded
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Car } from "lucide-react";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
  useTypeSpecificDetails,
} from "../../shared/UniversalTrustSection";

const CarRentalSpecialtyTrust = () => {
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

      <SectionCard title="Rental specialty" icon={Car}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {numberInput("fuelAllowanceKm", "Fuel allowance (km)", "e.g. 100", { min: 0, max: 5000 })}
          {numberInput("extraKmCharge", "Extra km charge (PKR/km)", "e.g. 50", { min: 0 })}
          {numberInput("hourlyCap", "Hours included per day", "e.g. 12", { min: 1, max: 24 })}
          {numberInput("midnightSurcharge", "Midnight surcharge (PKR)", "e.g. 5000", { min: 0 })}
          {numberInput("multiDayRentalDiscount", "Multi-day discount (%)", "e.g. 10", { min: 0, max: 100 })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-5">
          {[
            { key: "chauffeurIncluded", label: "Chauffeur included" },
            { key: "decorationSetupForBaraat", label: "Decoration setup for baraat" },
            { key: "doliCeremonyContinuation", label: "Doli ceremony continuation" },
            { key: "vehicleInsuranceIncluded", label: "Vehicle insurance included" },
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

export default CarRentalSpecialtyTrust;
