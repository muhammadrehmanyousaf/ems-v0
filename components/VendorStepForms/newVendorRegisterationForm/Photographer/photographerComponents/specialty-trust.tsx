"use client";

/**
 * VR-050 — Photographer "Specialty & Trust" step.
 *
 * Step 4 in the photographer flow. Captures three groups of optional
 * fields that feed the completenessScore + verification tier ladder:
 *
 *   1. Universal trust signals  — shared across all vendor types
 *   2. Photographer specialty   — 15 fields whitelisted server-side as
 *                                 typeSpecificDetails
 *   3. Optional NTN             — entered here, verified by ops later
 *
 * Server-side validators (vendorRegistrationValidators.js):
 *   - validateTypeSpecificDetails (clipped to whitelist for "Photographer")
 *
 * Every field is optional. Submitting with all of them blank still
 * succeeds; the vendor just has a lower completenessScore.
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
import { Camera } from "lucide-react";
import {
  SectionCard,
  TrustSignalsSection,
  VerificationSection,
  useTypeSpecificDetails,
} from "../../shared/UniversalTrustSection";

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

const PhotographerSpecialtyTrust = () => {
  const { tsd, setTsd, toggleInArray } = useTypeSpecificDetails();

  return (
    <div className="space-y-6">
      <TrustSignalsSection />

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
                  onClick={() => toggleInArray("equipmentBrands", b)}
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

export default PhotographerSpecialtyTrust;
