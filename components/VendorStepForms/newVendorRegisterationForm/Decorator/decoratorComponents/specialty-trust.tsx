"use client";

/**
 * VR-050 — Decorator "Specialty & Trust" step.
 *
 * Server-side typeSpecificDetails whitelist (vendorType "Decorator"):
 *   decorStyles, stageOnlyOrFullVenue, flowersVsThemeDecorPriceRange,
 *   ownsInventory, setupHoursRequired, teardownHoursRequired,
 *   outdoorCapable, freshFlowersOrArtificial, lightInstallationCapable,
 *   fabricCustomizationCapable, carriesInventoryAcrossCities
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
import { Sparkles as Wand } from "lucide-react";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
  useTypeSpecificDetails,
} from "../../shared/UniversalTrustSection";

const DECOR_STYLES = [
  "Traditional Pakistani",
  "Indian Wedding",
  "Modern Minimal",
  "Floral Romantic",
  "Mughal-inspired",
  "Boho",
  "Contemporary",
] as const;

const DecoratorSpecialtyTrust = () => {
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

      <SectionCard title="Decoration specialty" icon={Wand}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Stage only or full venue?</Label>
            <Select
              value={(tsd.stageOnlyOrFullVenue as string) || ""}
              onValueChange={(v) => setTsd("stageOnlyOrFullVenue", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stageOnly">Stage only</SelectItem>
                <SelectItem value="fullVenue">Full venue</SelectItem>
                <SelectItem value="bothOffered">Both offered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fresh flowers or artificial?</Label>
            <Select
              value={(tsd.freshFlowersOrArtificial as string) || ""}
              onValueChange={(v) => setTsd("freshFlowersOrArtificial", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freshOnly">Fresh only</SelectItem>
                <SelectItem value="artificialOnly">Artificial only</SelectItem>
                <SelectItem value="bothOffered">Both offered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Price range — flowers vs themed decor (PKR)</Label>
            <Input
              placeholder="e.g. 150000-500000"
              value={(tsd.flowersVsThemeDecorPriceRange as string) || ""}
              onChange={(e) => setTsd("flowersVsThemeDecorPriceRange", e.target.value || null)}
              maxLength={200}
            />
          </div>
          {numberInput("setupHoursRequired", "Setup hours required", "e.g. 6", { min: 1, max: 48 })}
          {numberInput("teardownHoursRequired", "Teardown hours required", "e.g. 3", { min: 1, max: 48 })}
        </div>

        <div className="space-y-2 mt-5">
          <Label>Decor styles offered</Label>
          <div className="flex flex-wrap gap-2">
            {DECOR_STYLES.map((s) => {
              const current = Array.isArray(tsd.decorStyles) ? (tsd.decorStyles as string[]) : [];
              const checked = current.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleInArray("decorStyles", s)}
                  className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                    checked
                      ? "bg-bridal-gold/15 border-bridal-gold/55 text-bridal-charcoal"
                      : "bg-white border-neutral-200 text-neutral-500 hover:border-bridal-gold/40"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-5">
          {[
            { key: "ownsInventory", label: "Owns décor inventory" },
            { key: "outdoorCapable", label: "Outdoor décor capable" },
            { key: "lightInstallationCapable", label: "Light-installation capable" },
            { key: "fabricCustomizationCapable", label: "Fabric customization capable" },
            { key: "carriesInventoryAcrossCities", label: "Carries inventory across cities" },
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

export default DecoratorSpecialtyTrust;
