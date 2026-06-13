"use client";

/**
 * VR-050 — Shared "Trust signals" + "Verification" sections that every
 * vendor-type Specialty & Trust step reuses. Keeps the WhatsApp number,
 * languages spoken, owner name/bio, years in business, weddings completed,
 * and optional NTN field consistent across all 9 vendor types.
 *
 * Server-side validators in event-planner-api/src/utils/vendorRegistrationValidators.js:
 *   - validateWhatsappNumber  — Pakistan +92 / 03xxxxxxxxx normalized
 *   - validateLanguagesSpoken — whitelist of 11 PK languages
 *   - validateNtn             — 7-13 digits, optional dash
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFormContext } from "@/lib/context/form-context";
import { MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
// Issue #7 + #10 — shared Pakistani phone validation util.
import {
  isValidPakistaniPhone,
  PHONE_VALIDATION_MESSAGE,
} from "@/lib/utils/pakistani-phone";

const KNOWN_LANGUAGES = [
  "Urdu",
  "English",
  "Punjabi",
  "Pashto",
  "Sindhi",
  "Saraiki",
  "Balochi",
  "Hindko",
  "Kashmiri",
  "Brahui",
  "Arabic",
] as const;

export const SectionCard = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border bg-card p-5">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-bridal-gold" />
      <h3 className="font-medium text-bridal-charcoal">{title}</h3>
    </div>
    {children}
  </div>
);

export const TrustSignalsSection = () => {
  const { formData, setFormData } = useFormContext();

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => {
      const current = prev.languagesSpoken || [];
      const next = current.includes(lang)
        ? current.filter((l) => l !== lang)
        : [...current, lang];
      return { ...prev, languagesSpoken: next };
    });
  };

  return (
    <SectionCard title="Trust signals" icon={ShieldCheck}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Owner name <span className="text-neutral-400 text-xs">(optional)</span>
          </Label>
          <Input
            placeholder="e.g. Ali Hassan"
            value={formData.ownerName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, ownerName: e.target.value }))
            }
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <Label>Years in business</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={80}
            placeholder="e.g. 6"
            value={formData.yearsInBusiness === "" ? "" : String(formData.yearsInBusiness)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                yearsInBusiness:
                  e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Weddings completed</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="e.g. 120"
            value={formData.weddingsCompleted === "" ? "" : String(formData.weddingsCompleted)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                weddingsCompleted:
                  e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-bridal-gold" />
            WhatsApp number
          </Label>
          <div className="flex">
            <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-sm text-gray-500">
              +92
            </div>
            <Input
              inputMode="numeric"
              maxLength={10}
              placeholder="3001234567"
              className="rounded-l-none"
              value={formData.whatsappNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              aria-invalid={
                !!formData.whatsappNumber &&
                !isValidPakistaniPhone(formData.whatsappNumber)
              }
            />
          </div>
          {/* Issue #7 + #10 — inline validation via the shared util so
              both 10- and 11-digit Pakistani formats are accepted. */}
          {formData.whatsappNumber &&
            !isValidPakistaniPhone(formData.whatsappNumber) && (
              <p className="text-xs text-red-500">{PHONE_VALIDATION_MESSAGE}</p>
            )}
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <Label>
          Owner bio{" "}
          <span className="text-neutral-400 text-xs">
            (optional — shows on your public profile)
          </span>
        </Label>
        <Textarea
          placeholder="A short story of your craft, training, and what makes your work different…"
          value={formData.ownerBio}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, ownerBio: e.target.value }))
          }
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="space-y-2 mt-4">
        <Label>Languages spoken</Label>
        <div className="flex flex-wrap gap-2">
          {KNOWN_LANGUAGES.map((lang) => {
            const checked = (formData.languagesSpoken || []).includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                  checked
                    ? "bg-bridal-gold/15 border-bridal-gold/55 text-bridal-charcoal"
                    : "bg-white border-neutral-200 text-neutral-500 hover:border-bridal-gold/40"
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
};

export const VerificationSection = () => {
  const { formData, setFormData } = useFormContext();
  return (
    <SectionCard title="Verification (optional)" icon={Sparkles}>
      <p className="text-xs text-muted-foreground mb-3">
        Submitting your NTN unlocks the &quot;NTN verified&quot; badge after our team
        confirms with FBR. Verified vendors rank higher in search.
      </p>
      <div className="space-y-2">
        <Label>NTN number</Label>
        <Input
          placeholder="e.g. 1234567-8"
          value={formData.ntnNumber}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, ntnNumber: e.target.value }))
          }
          maxLength={40}
        />
      </div>
    </SectionCard>
  );
};

/**
 * Helper hook that returns get/set/toggle functions for the
 * `formData.typeSpecificDetails` JSONB blob — used by every vendor
 * type's specialty section. Server-side, the blob is clipped to the
 * vendor type's whitelist (TYPE_SPECIFIC_WHITELIST), so values for
 * keys outside the whitelist are silently dropped.
 */
export const useTypeSpecificDetails = () => {
  const { formData, setFormData } = useFormContext();
  const tsd = formData.typeSpecificDetails || {};

  const setTsd = (key: string, value: string | number | boolean | string[] | null) => {
    setFormData((prev) => ({
      ...prev,
      typeSpecificDetails: { ...(prev.typeSpecificDetails || {}), [key]: value },
    }));
  };

  const toggleInArray = (key: string, value: string) => {
    const current = Array.isArray(tsd[key]) ? (tsd[key] as string[]) : [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setTsd(key, next);
  };

  return { tsd, setTsd, toggleInArray };
};
