"use client";

/**
 * VR-050 — Photographer "Specialty & Trust" step.
 *
 * Inserted as step 4 in the photographer registration flow (between
 * Business Details and Packages). Captures three groups of optional
 * fields that feed into the new completenessScore and search ranking:
 *
 *   1. Universal trust signals  — WhatsApp, languages, owner name/bio,
 *                                 years in business, weddings completed
 *   2. Photographer specialty   — 15 fields whitelisted server-side as
 *                                 typeSpecificDetails (photographyStyle,
 *                                 secondShooterAvailable, droneFootageOffered,
 *                                 albumPrintingIncluded, ...)
 *   3. Optional NTN             — entered here, verified by ops later
 *
 * Server-side validators (vendorRegistrationValidators.js):
 *   - validateWhatsappNumber (Pakistan +92 / 03xxxxxxxxx normalized)
 *   - validateLanguagesSpoken (whitelist of 11 PK languages)
 *   - validateNtn (7-13 digits, optional dash)
 *   - validateTypeSpecificDetails (clipped to whitelist for vendorType)
 *
 * Every field is optional. Submitting with all of them blank still
 * succeeds; the vendor just has a lower completenessScore.
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "@/lib/context/form-context";
import { Camera, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

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

const PHOTOGRAPHY_STYLES = [
  "Traditional",
  "Candid",
  "Cinematic",
  "Photojournalistic",
  "Fashion",
  "Fine Art",
  "Documentary",
] as const;

const EQUIPMENT_BRANDS = [
  "Canon",
  "Nikon",
  "Sony",
  "Fujifilm",
  "Panasonic",
  "Leica",
  "DJI (drone)",
] as const;

const SectionCard = ({
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

const PhotographerSpecialtyTrust = () => {
  const { formData, setFormData } = useFormContext();
  const tsd = formData.typeSpecificDetails || {};

  const setTsd = (key: string, value: string | number | boolean | string[] | null) => {
    setFormData((prev) => ({
      ...prev,
      typeSpecificDetails: { ...(prev.typeSpecificDetails || {}), [key]: value },
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => {
      const current = prev.languagesSpoken || [];
      const next = current.includes(lang)
        ? current.filter((l) => l !== lang)
        : [...current, lang];
      return { ...prev, languagesSpoken: next };
    });
  };

  const toggleEquipmentBrand = (brand: string) => {
    const current = Array.isArray(tsd.equipmentBrands) ? (tsd.equipmentBrands as string[]) : [];
    const next = current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand];
    setTsd("equipmentBrands", next);
  };

  const onScalar =
    <K extends keyof typeof formData>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: v } as typeof prev));
    };

  return (
    <div className="space-y-6">
      {/* ─── Trust signals ─── */}
      <SectionCard title="Trust signals" icon={ShieldCheck}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Owner name <span className="text-neutral-400 text-xs">(optional)</span></Label>
            <Input
              placeholder="e.g. Ali Hassan"
              value={formData.ownerName}
              onChange={onScalar("ownerName")}
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
                  yearsInBusiness: e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0),
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
                  weddingsCompleted: e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0),
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
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label>Owner bio <span className="text-neutral-400 text-xs">(optional — shows on your public profile)</span></Label>
          <Textarea
            placeholder="A short story of your craft, training, and what makes your work different…"
            value={formData.ownerBio}
            onChange={onScalar("ownerBio")}
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

      {/* ─── Photographer specialty ─── */}
      <SectionCard title="Photography specialty" icon={Camera}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary style</Label>
            <Select
              value={(tsd.photographyStyle as string) || ""}
              onValueChange={(v) => setTsd("photographyStyle", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a style" />
              </SelectTrigger>
              <SelectContent>
                {PHOTOGRAPHY_STYLES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Delivery turnaround (weeks)</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={52}
              placeholder="e.g. 6"
              value={tsd.deliveryTurnaroundWeeks != null ? String(tsd.deliveryTurnaroundWeeks) : ""}
              onChange={(e) =>
                setTsd(
                  "deliveryTurnaroundWeeks",
                  e.target.value === "" ? null : Math.max(1, Math.min(52, Number(e.target.value) || 1)),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Edit revisions included</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              placeholder="e.g. 2"
              value={tsd.editRevisionsIncluded != null ? String(tsd.editRevisionsIncluded) : ""}
              onChange={(e) =>
                setTsd(
                  "editRevisionsIncluded",
                  e.target.value === "" ? null : Math.max(0, Math.min(20, Number(e.target.value) || 0)),
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Weddings completed as lead</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="e.g. 80"
              value={tsd.weddingsCompletedAsLead != null ? String(tsd.weddingsCompletedAsLead) : ""}
              onChange={(e) =>
                setTsd(
                  "weddingsCompletedAsLead",
                  e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0),
                )
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>RAW photo handover policy</Label>
            <Select
              value={(tsd.rawPhotoHandoverPolicy as string) || ""}
              onValueChange={(v) => setTsd("rawPhotoHandoverPolicy", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never share RAW files</SelectItem>
                <SelectItem value="onRequest">Share RAW on request</SelectItem>
                <SelectItem value="paidAddon">RAW available as paid add-on</SelectItem>
                <SelectItem value="alwaysIncluded">Always included</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mt-5">
          {[
            { key: "secondShooterAvailable", label: "Second shooter available" },
            { key: "droneFootageOffered", label: "Drone footage offered" },
            { key: "albumPrintingIncluded", label: "Album printing included" },
            { key: "engagementShootIncluded", label: "Engagement shoot included" },
            { key: "familyPortraitsIncluded", label: "Family portraits included" },
            { key: "highlightReelIncluded", label: "Highlight reel included" },
            { key: "femalePhotographerAvailable", label: "Female photographer available" },
            { key: "comfortWithNoMusicNikah", label: "Comfortable with no-music nikah" },
            { key: "ownsStudioForPortraits", label: "Owns a studio for portraits" },
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
          <Label>Equipment brands used</Label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_BRANDS.map((b) => {
              const current = Array.isArray(tsd.equipmentBrands) ? (tsd.equipmentBrands as string[]) : [];
              const checked = current.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleEquipmentBrand(b)}
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

      {/* ─── Optional verification ─── */}
      <SectionCard title="Verification (optional)" icon={Sparkles}>
        <p className="text-xs text-muted-foreground mb-3">
          Submitting your NTN unlocks the &quot;NTN verified&quot; badge after our team confirms with FBR.
          Verified vendors rank higher in search.
        </p>
        <div className="space-y-2">
          <Label>NTN number</Label>
          <Input
            placeholder="e.g. 1234567-8"
            value={formData.ntnNumber}
            onChange={onScalar("ntnNumber")}
            maxLength={40}
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default PhotographerSpecialtyTrust;
