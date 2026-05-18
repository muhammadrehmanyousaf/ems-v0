"use client";

/**
 * VR-050 — Wedding Stationery "Specialty & Trust" step.
 *
 * Server-side typeSpecificDetails whitelist
 * (vendorType "Wedding Invitations and Stationery"):
 *   invitationStyles, minimumOrderQuantity, designRevisionsIncluded,
 *   proofApprovalRounds, printingTurnaroundWeeks, bilingualCapability,
 *   digitalInviteIncluded, saveTheDateOffered, thankYouCardsOffered,
 *   mehndiStationeryLine
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail } from "lucide-react";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
  useTypeSpecificDetails,
} from "../../shared/UniversalTrustSection";

const INVITATION_STYLES = [
  "Traditional",
  "Modern Minimal",
  "Mughal-inspired",
  "Floral",
  "Calligraphy",
  "Foiled / metallic",
  "Bilingual (Urdu + English)",
] as const;

const StationerySpecialtyTrust = () => {
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

      <SectionCard title="Stationery specialty" icon={Mail}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {numberInput("minimumOrderQuantity", "Minimum order quantity", "e.g. 100", { min: 1 })}
          {numberInput("designRevisionsIncluded", "Design revisions included", "e.g. 3", { min: 0, max: 20 })}
          {numberInput("proofApprovalRounds", "Proof approval rounds", "e.g. 2", { min: 0, max: 10 })}
          {numberInput("printingTurnaroundWeeks", "Printing turnaround (weeks)", "e.g. 2", { min: 1, max: 26 })}
        </div>

        <div className="space-y-2 mt-5">
          <Label>Invitation styles offered</Label>
          <div className="flex flex-wrap gap-2">
            {INVITATION_STYLES.map((s) => {
              const current = Array.isArray(tsd.invitationStyles) ? (tsd.invitationStyles as string[]) : [];
              const checked = current.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleInArray("invitationStyles", s)}
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
            { key: "bilingualCapability", label: "Bilingual (Urdu + English) capability" },
            { key: "digitalInviteIncluded", label: "Digital invite (PDF/PNG) included" },
            { key: "saveTheDateOffered", label: "Save-the-date cards offered" },
            { key: "thankYouCardsOffered", label: "Thank-you cards offered" },
            { key: "mehndiStationeryLine", label: "Mehndi-day stationery line" },
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

export default StationerySpecialtyTrust;
