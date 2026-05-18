"use client";

/**
 * VR-050 — Henna Artist "Specialty & Trust" step.
 *
 * Server-side typeSpecificDetails whitelist (vendorType "Henna artist"):
 *   hennaStyle, bridalSessionDurationHours, perPairHandsFeetPricing,
 *   guestHennaIncluded, glitterColoredHennaOffered, naturalOrChemicalPaste,
 *   guestsPerHourCapacity, travelsToBridalHome, teamSize
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
import { Flower2 } from "lucide-react";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
  useTypeSpecificDetails,
} from "../../shared/UniversalTrustSection";

const HennaArtistSpecialtyTrust = () => {
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

      <SectionCard title="Henna specialty" icon={Flower2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Henna style</Label>
            <Select
              value={(tsd.hennaStyle as string) || ""}
              onValueChange={(v) => setTsd("hennaStyle", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indianTraditional">Indian traditional</SelectItem>
                <SelectItem value="pakistaniTraditional">Pakistani traditional</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
                <SelectItem value="moroccan">Moroccan</SelectItem>
                <SelectItem value="contemporary">Contemporary / fusion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Paste type</Label>
            <Select
              value={(tsd.naturalOrChemicalPaste as string) || ""}
              onValueChange={(v) => setTsd("naturalOrChemicalPaste", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">100% natural</SelectItem>
                <SelectItem value="chemical">Chemical-based</SelectItem>
                <SelectItem value="mixed">Both available</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {numberInput("bridalSessionDurationHours", "Bridal session (hours)", "e.g. 5", { min: 1, max: 24 })}
          {numberInput("perPairHandsFeetPricing", "Per pair hands+feet (PKR)", "e.g. 8000", { min: 0 })}
          {numberInput("guestsPerHourCapacity", "Guests per hour capacity", "e.g. 6", { min: 0, max: 100 })}
          {numberInput("teamSize", "Team size", "e.g. 3", { min: 1, max: 50 })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-5">
          {[
            { key: "guestHennaIncluded", label: "Guest henna included" },
            { key: "glitterColoredHennaOffered", label: "Glitter / colored henna offered" },
            { key: "travelsToBridalHome", label: "Travels to bridal home" },
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

export default HennaArtistSpecialtyTrust;
