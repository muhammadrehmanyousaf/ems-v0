"use client";

/**
 * VR-050 — Makeup Artist "Specialty & Trust" step.
 *
 * Server-side typeSpecificDetails whitelist (vendorType "Makeup artist"):
 *   artistSoloOrStudio, hdAirbrushCapability, brideOnlyOrFamilyIncluded,
 *   trialPolicy, trialToWeddingWeeks, travelsToBridalHome, staysForTouchups,
 *   productBrandsUsed, hairStylingIncluded, dupattaSettingIncluded,
 *   mahramOnlyAvailable, backToBackCapacityPerDay, previousBridalEventsCount
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
import { Brush } from "lucide-react";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
  useTypeSpecificDetails,
} from "../../shared/UniversalTrustSection";

const PRODUCT_BRANDS = [
  "MAC",
  "NARS",
  "Huda Beauty",
  "Charlotte Tilbury",
  "Bobbi Brown",
  "Anastasia Beverly Hills",
  "Fenty Beauty",
  "Maybelline",
  "L'Oréal",
] as const;

const MakeupArtistSpecialtyTrust = () => {
  const { tsd, setTsd, toggleInArray } = useTypeSpecificDetails();

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

      <SectionCard title="Makeup specialty" icon={Brush}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Solo artist or studio</Label>
            <Select
              value={(tsd.artistSoloOrStudio as string) || ""}
              onValueChange={(v) => setTsd("artistSoloOrStudio", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Solo artist</SelectItem>
                <SelectItem value="studio">Studio team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bride only, or family included?</Label>
            <Select
              value={(tsd.brideOnlyOrFamilyIncluded as string) || ""}
              onValueChange={(v) => setTsd("brideOnlyOrFamilyIncluded", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brideOnly">Bride only</SelectItem>
                <SelectItem value="brideAndFamily">Bride + family (paid)</SelectItem>
                <SelectItem value="brideAndFamilyIncluded">Bride + family (included)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Trial policy</Label>
            <Select
              value={(tsd.trialPolicy as string) || ""}
              onValueChange={(v) => setTsd("trialPolicy", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="includedFree">Included free</SelectItem>
                <SelectItem value="paid">Paid trial</SelectItem>
                <SelectItem value="onRequest">On request only</SelectItem>
                <SelectItem value="notOffered">Not offered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {numberInput("trialToWeddingWeeks", "Trial-to-wedding gap (weeks)", "e.g. 3", { min: 0, max: 26 })}
          {numberInput("backToBackCapacityPerDay", "Back-to-back bookings per day", "e.g. 2", { min: 0, max: 10 })}
          {numberInput("previousBridalEventsCount", "Previous bridal events", "e.g. 60", { min: 0 })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-5">
          {[
            { key: "hdAirbrushCapability", label: "HD airbrush capability" },
            { key: "travelsToBridalHome", label: "Travels to bridal home" },
            { key: "staysForTouchups", label: "Stays for touch-ups during event" },
            { key: "hairStylingIncluded", label: "Hair styling included" },
            { key: "dupattaSettingIncluded", label: "Dupatta setting included" },
            { key: "mahramOnlyAvailable", label: "Mahram-only environment available" },
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

        <div className="space-y-2 mt-5">
          <Label>Product brands used</Label>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_BRANDS.map((b) => {
              const current = Array.isArray(tsd.productBrandsUsed) ? (tsd.productBrandsUsed as string[]) : [];
              const checked = current.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleInArray("productBrandsUsed", b)}
                  className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                    checked
                      ? "bg-bridal-gold/15 border-bridal-gold/55 text-bridal-charcoal"
                      : "bg-white border-neutral-200 text-neutral-500 hover:border-bridal-gold/40"
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <VerificationSection />
    </div>
  );
};

export default MakeupArtistSpecialtyTrust;
