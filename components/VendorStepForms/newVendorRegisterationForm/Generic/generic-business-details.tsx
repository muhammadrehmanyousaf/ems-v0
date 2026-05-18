"use client";

/**
 * BK-100.55 Layer 2 — Generic business-details step for the 14 new
 * Pakistani vendor categories (Nikahkhwan / Choreographer / Dhol player
 * / Event host / Live streaming / Generator rental / Marquee rental /
 * Furniture rental / Florist / Wedding cakes / Mithai and sweets /
 * Live cooking stall / Sound system rental / Qawwali and Naat).
 *
 * Captures only the universal fields every vendor type needs:
 *   - description
 *   - staff (gender preference; matters for Pakistani family bookings)
 *   - cancellation policy (legacy free-text; structured tier presets
 *     live separately in BK-100.5 vendor settings)
 *   - down-payment type + amount
 *   - free-text "what kind of <category>" sub-type
 *
 * Per-category specialty fields (e.g. Nikahkhwan's masjid affiliation,
 * Florist's fresh-vs-artificial flag) live in the dedicated specialty
 * step (`generic-specialty.tsx`) so this step stays category-agnostic
 * and easy to maintain.
 *
 * Design rationale — why not reuse PhotographerBusinessDetails? The
 * photographer form hard-codes photography styles + expertise + amenities
 * that don't generalise. Forcing a Nikahkhwan to pick "Wedding Photography"
 * from a dropdown looks broken. A category-agnostic generic form is
 * cleaner than 14 near-identical clones; per-category polish ships in
 * Layer 3.
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RadioButton from "@/components/VendorStepForms/components/radio-button";
import MultipleSelect from "@/components/VendorStepForms/components/multiple-select";
import { useFormContext } from "@/lib/context/form-context";
import { BiFemale } from "react-icons/bi";
import { FaFemale, FaMale } from "react-icons/fa";

interface Errors {
  [key: string]: string | undefined;
}

interface GenericBusinessDetailsProps {
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

// Module-scope SectionCard — must NOT live inside the component or every
// keystroke unmounts the inputs (see the same comment in photographer's
// business-details.tsx).
const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bridal-card p-5 sm:p-6">
    <h3 className="font-display italic text-[18px] sm:text-[20px] text-bridal-charcoal mb-4">
      {title}
    </h3>
    {children}
  </div>
);

const STAFF_OPTIONS = [
  { value: "Male", icon: <FaMale /> },
  { value: "Female", icon: <FaFemale /> },
  { value: "Transgender", icon: <BiFemale /> },
];

const CANCELLATION_POLICIES = [
  { id: "Refundable", label: "Refundable" },
  { id: "Partially Refundable", label: "Partially Refundable" },
  { id: "Non-refundable", label: "Non-refundable" },
];

const DOWN_PAYMENT_TYPES = [
  { id: "Percentage", label: "Percentage" },
  { id: "Fixed Amount", label: "Fixed Amount" },
];

const GenericBusinessDetails = ({
  errors,
  setErrors,
}: GenericBusinessDetailsProps) => {
  const { formData, setFormData } = useFormContext();

  const handleChange = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => ({ ...prev, [key as string]: "" }));
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="About your service">
        <div className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-[0.18em]">
              Sub-type <span className="text-neutral-400">(optional)</span>
            </Label>
            <Input
              className="h-10 text-sm"
              placeholder='e.g. "Traditional dhol players" / "Imported fresh florist" / "Mughlai mithai specialist"'
              value={
                Array.isArray(formData.subBusinessType)
                  ? formData.subBusinessType.join(", ")
                  : (formData.subBusinessType as string) || ""
              }
              onChange={(e) => {
                const val = e.target.value.slice(0, 200);
                handleChange(
                  "subBusinessType",
                  val
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                );
              }}
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Free-text. Helps couples find you in search.
            </p>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-[0.18em]">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              className="text-sm resize-none"
              rows={4}
              placeholder="Tell couples about your service — what makes you different, who you typically work with, how long you've been doing this."
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value.slice(0, 5000))}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Team">
        <Label className="text-xs uppercase tracking-[0.18em] mb-2 block">
          Staff (gender) <span className="text-red-500">*</span>
        </Label>
        <p className="text-[11px] text-neutral-500 mb-3">
          Pakistani families often filter for female-only or mahram-only crews. Pick all that apply.
        </p>
        <MultipleSelect
          options={STAFF_OPTIONS}
          selectedValues={formData.staff || []}
          onChange={(values: string[]) => handleChange("staff", values)}
        />
        {errors.staff && (
          <p className="text-xs text-red-500 mt-2">{errors.staff}</p>
        )}
      </SectionCard>

      <SectionCard title="Pricing & policies">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs uppercase tracking-[0.18em]">
              Down-payment type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.downPaymentType || ""}
              onValueChange={(v) => handleChange("downPaymentType", v)}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                {DOWN_PAYMENT_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.downPaymentType && (
              <p className="text-xs text-red-500 mt-1">{errors.downPaymentType}</p>
            )}
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.18em]">
              Down-payment amount <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              className="h-10 text-sm"
              placeholder={
                formData.downPaymentType === "Percentage"
                  ? "e.g. 30 (for 30%)"
                  : "e.g. 50000"
              }
              value={
                formData.downPayment === undefined || formData.downPayment === null
                  ? ""
                  : String(formData.downPayment)
              }
              onChange={(e) => {
                const n = Number(e.target.value);
                handleChange("downPayment", Number.isFinite(n) ? n : 0);
              }}
            />
            {errors.downPayment && (
              <p className="text-xs text-red-500 mt-1">{errors.downPayment}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-xs uppercase tracking-[0.18em]">
            Cancellation policy <span className="text-red-500">*</span>
          </Label>
          <p className="text-[11px] text-neutral-500 mb-2">
            You can switch to one of our structured presets later (Flexible / Standard / Strict) from your business settings.
          </p>
          <RadioButton
            options={CANCELLATION_POLICIES}
            selectedValue={formData.cancelationPolicy || ""}
            onChange={(value: string) => handleChange("cancelationPolicy", value)}
          />
          {errors.cancelationPolicy && (
            <p className="text-xs text-red-500 mt-1">{errors.cancelationPolicy}</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default GenericBusinessDetails;
