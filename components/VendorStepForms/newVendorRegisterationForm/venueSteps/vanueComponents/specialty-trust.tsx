"use client";

/**
 * VR-050 — Wedding Venue "Specialty & Trust" step.
 *
 * Step 4 in the venue flow. Captures venue-specific operational details
 * (rooms, curfews, what's permitted, generator capacity) that couples
 * routinely ask about — surfacing them here improves search match rate.
 *
 * Server-side validators allow these keys under typeSpecificDetails for
 * vendorType "Wedding venue":
 *   bridalRoomCount, groomRoomCount, separateMenWomenHalls,
 *   noiseCurfewTime, outsideFoodAllowed, outsideDecorAllowed,
 *   outsideDjAllowed, requiresSecurityClearance, multipleEventsPerDay,
 *   valetParkingIncluded, generatorKw, wifiAvailable
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2 } from "lucide-react";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
  useTypeSpecificDetails,
} from "../../shared/UniversalTrustSection";

const VenueSpecialtyTrust = () => {
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

      <SectionCard title="Venue operations" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {numberInput("bridalRoomCount", "Bridal rooms", "e.g. 1", { min: 0, max: 20 })}
          {numberInput("groomRoomCount", "Groom rooms", "e.g. 1", { min: 0, max: 20 })}
          {numberInput("generatorKw", "Generator capacity (kW)", "e.g. 200", { min: 0, max: 5000 })}
          <div className="space-y-2">
            <Label>Noise curfew time</Label>
            <Input
              type="time"
              value={(tsd.noiseCurfewTime as string) || ""}
              onChange={(e) => setTsd("noiseCurfewTime", e.target.value || null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-5">
          {[
            { key: "separateMenWomenHalls", label: "Separate halls for men & women" },
            { key: "outsideFoodAllowed", label: "Outside food allowed" },
            { key: "outsideDecorAllowed", label: "Outside decorator allowed" },
            { key: "outsideDjAllowed", label: "Outside DJ allowed" },
            { key: "requiresSecurityClearance", label: "Security clearance required" },
            { key: "multipleEventsPerDay", label: "Hosts multiple events per day" },
            { key: "valetParkingIncluded", label: "Valet parking included" },
            { key: "wifiAvailable", label: "Wi-Fi available for guests" },
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

export default VenueSpecialtyTrust;
