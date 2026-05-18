"use client";

/**
 * BK-100.55 Layer 2 — Generic Specialty & Trust step for the 14 new
 * Pakistani vendor categories.
 *
 * Reuses the shared `TrustSignalsSection` + `VerificationSection`
 * (universal across all 9 existing vendor types since VR-050.9) so the
 * 14 new categories get the same trust-tier coverage as established
 * categories. The category-specific specialty block is intentionally
 * minimal in Layer 2: a free-text "what makes your service special"
 * textarea. Layer 3 will polish per-category specialty UI (e.g.
 * Nikahkhwan's masjid affiliation chips, Florist's fresh-vs-artificial
 * toggle) by reading the backend's TYPE_SPECIFIC_WHITELIST and
 * rendering category-appropriate inputs.
 *
 * Why ship the lean version now? The backend already accepts a free-
 * form `typeSpecificDetails` JSONB blob; vendors who want to fill in
 * specific keys can request them via support. Once Layer 2 proves out
 * vendor acquisition in these 14 categories, Layer 3 invests in per-
 * category UX.
 */

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useFormContext } from "@/lib/context/form-context";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
} from "../shared/UniversalTrustSection";

const GenericSpecialtyTrust = () => {
  const { formData, setFormData } = useFormContext();
  const tsd = (formData.typeSpecificDetails || {}) as Record<string, unknown>;
  const specialNote =
    typeof tsd.specialNote === "string" ? (tsd.specialNote as string) : "";

  const updateSpecialNote = (next: string) => {
    setFormData((prev) => ({
      ...prev,
      typeSpecificDetails: {
        ...(prev.typeSpecificDetails || {}),
        specialNote: next.slice(0, 2000),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <TrustSignalsSection />

      <SectionCard title="What makes your service special" icon={Sparkles}>
        <p className="text-xs text-muted-foreground mb-3">
          Free-text. Tell couples what only you can do — specialty pricing,
          your equipment, your team size, signature offerings. We&apos;ll
          add structured questions for your specific category in a future
          release; for now, fill in what matters.
        </p>
        <div className="space-y-2">
          <Label className="text-xs">
            Service highlights{" "}
            <span className="text-neutral-400">(optional)</span>
          </Label>
          <Textarea
            className="text-sm resize-none"
            rows={5}
            placeholder='e.g. "I have 5 dholis trained in traditional Punjabi rhythms; can cover Mehndi + Baraat + Doli back-to-back; available in Karachi + Lahore."'
            value={specialNote}
            onChange={(e) => updateSpecialNote(e.target.value)}
            maxLength={2000}
          />
          <p className="text-[11px] text-neutral-400 text-right">
            {specialNote.length} / 2000
          </p>
        </div>
      </SectionCard>

      <VerificationSection />
    </div>
  );
};

export default GenericSpecialtyTrust;
