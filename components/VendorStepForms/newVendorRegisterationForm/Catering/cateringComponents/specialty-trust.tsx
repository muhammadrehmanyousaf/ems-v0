"use client";

/**
 * VR-050 — Caterer "Specialty & Trust" step.
 *
 * Server-side typeSpecificDetails whitelist (vendorType "Caterer"):
 *   perPlatePriceRange, menuCuisines, halalCertIssuer, halalCertNumber,
 *   sectSpecificKitchenSeparation, vegetarianCapable, jainVegetarianCapable,
 *   allergenHandling, minimumGuestCount, maximumDailyCapacity,
 *   liveCookingStation, chaatCounters, dessertStation, ownsCrockery,
 *   waitersPerHundredGuests, chefOnSiteAtEvent, tastingPolicy, leftoverPolicy
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
import { ChefHat } from "lucide-react";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
  useTypeSpecificDetails,
} from "../../shared/UniversalTrustSection";

const CUISINES = [
  "Pakistani",
  "Indian",
  "Chinese",
  "Italian",
  "Continental",
  "Mughlai",
  "BBQ",
  "Lebanese",
  "Thai",
] as const;

const CatererSpecialtyTrust = () => {
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

  const textInput = (key: string, label: string, placeholder: string, max = 200) => (
    <div className="space-y-2" key={key}>
      <Label>{label}</Label>
      <Input
        placeholder={placeholder}
        value={(tsd[key] as string) || ""}
        onChange={(e) => setTsd(key, e.target.value || null)}
        maxLength={max}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <TrustSignalsSection />

      <SectionCard title="Catering operations" icon={ChefHat}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {textInput("perPlatePriceRange", "Per-plate price range (PKR)", "e.g. 1500-3000")}
          {numberInput("minimumGuestCount", "Minimum guest count", "e.g. 100", { min: 1 })}
          {numberInput("maximumDailyCapacity", "Maximum daily capacity (guests)", "e.g. 1500", { min: 1 })}
          {numberInput("waitersPerHundredGuests", "Waiters per 100 guests", "e.g. 4", { min: 0, max: 30 })}
          {textInput("halalCertIssuer", "Halal cert issuer", "e.g. Halal Foundation Pakistan")}
          {textInput("halalCertNumber", "Halal cert number", "e.g. HFP-12345")}
          <div className="space-y-2">
            <Label>Tasting policy</Label>
            <Select
              value={(tsd.tastingPolicy as string) || ""}
              onValueChange={(v) => setTsd("tastingPolicy", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freeAlways">Free for confirmed clients</SelectItem>
                <SelectItem value="freeAboveBookingValue">Free above a booking value</SelectItem>
                <SelectItem value="paid">Paid tasting</SelectItem>
                <SelectItem value="notOffered">Not offered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Leftover policy</Label>
            <Select
              value={(tsd.leftoverPolicy as string) || ""}
              onValueChange={(v) => setTsd("leftoverPolicy", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="givenToClient">Given to client</SelectItem>
                <SelectItem value="donated">Donated to charity</SelectItem>
                <SelectItem value="discarded">Discarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 mt-5">
          <Label>Cuisines offered</Label>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => {
              const current = Array.isArray(tsd.menuCuisines) ? (tsd.menuCuisines as string[]) : [];
              const checked = current.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleInArray("menuCuisines", c)}
                  className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                    checked
                      ? "bg-bridal-gold/15 border-bridal-gold/55 text-bridal-charcoal"
                      : "bg-white border-neutral-200 text-neutral-500 hover:border-bridal-gold/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-5">
          {[
            { key: "sectSpecificKitchenSeparation", label: "Sect-specific kitchen separation" },
            { key: "vegetarianCapable", label: "Vegetarian menus offered" },
            { key: "jainVegetarianCapable", label: "Jain-vegetarian capable" },
            { key: "allergenHandling", label: "Allergen-safe handling" },
            { key: "liveCookingStation", label: "Live cooking station" },
            { key: "chaatCounters", label: "Chaat counters" },
            { key: "dessertStation", label: "Dessert station" },
            { key: "ownsCrockery", label: "Owns crockery & utensils" },
            { key: "chefOnSiteAtEvent", label: "Chef on-site at the event" },
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

export default CatererSpecialtyTrust;
