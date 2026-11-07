"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Palette, Sparkles, Share2, Flower2, ArrowRight, CheckCircle2 } from "lucide-react";
import { CITIES } from "@/lib/seo/constants";

export function StageDecorCalculatorClient() {
  const [setupType, setSetupType] = useState<"mayun" | "nikkah_partition" | "standard_stage" | "grand_stage">("standard_stage");
  const [flowerGrade, setFlowerGrade] = useState<"silk" | "hybrid" | "fresh">("hybrid");
  const [selectedCity, setSelectedCity] = useState("lahore");

  // Add-ons
  const [addTunnel, setAddTunnel] = useState(true);
  const [addSmdWall, setAddSmdWall] = useState(false);
  const [addNeonSign, setAddNeonSign] = useState(true);
  const [tableCount, setTableCount] = useState(20);

  // Base prices
  const basePrices = {
    mayun: 45000,
    nikkah_partition: 75000,
    standard_stage: 120000,
    grand_stage: 380000,
  };

  const flowerMultipliers = {
    silk: 1.0,
    hybrid: 1.35,
    fresh: 1.9,
  };

  const baseCalculated = Math.round(basePrices[setupType] * flowerMultipliers[flowerGrade]);
  const tunnelCost = addTunnel ? 55000 : 0;
  const smdCost = addSmdWall ? 65000 : 0;
  const neonCost = addNeonSign ? 12000 : 0;
  const tableDecorCost = tableCount * 1800;

  const totalDecorCost = baseCalculated + tunnelCost + smdCost + neonCost + tableDecorCost;

  const cityName = CITIES.find((c) => c.slug === selectedCity)?.name || "Pakistan";

  const shareText = `Pakistani Wedding Decor Estimate for ${cityName}:
Setup: ${setupType.replace("_", " ").toUpperCase()}
Flower Grade: ${flowerGrade.toUpperCase()}
Base Stage Cost: PKR ${baseCalculated.toLocaleString()}
Add-ons (Tunnel, Neon, ${tableCount} Tables): PKR ${(tunnelCost + smdCost + neonCost + tableDecorCost).toLocaleString()}
💐 Total Decor Estimate: PKR ${totalDecorCost.toLocaleString()}

Calculate fair decorator rates on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/wedding-stage-decor-cost-calculator-pakistan`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Stage Decor Cost Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-800 mb-3">
          <Sparkles className="h-4 w-4 text-rose-600" /> 2026 Pakistani Floral &amp; Stage Decor Math
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Wedding Stage &amp; Nikkah Decor Cost Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          How much should you pay an event designer in Pakistan? Calculate fair prices for Home Mayun, fresh floral Nikkah partitions, and Baraat stages.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Inputs */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal mb-6">
            <Palette className="h-5 w-5 text-bridal-gold" /> Stage &amp; Floral Options
          </h2>

          {/* Setup Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Stage &amp; Event Scale</label>
            <div className="grid grid-cols-1 gap-2.5">
              <label
                onClick={() => setSetupType("standard_stage")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-xs ${
                  setupType === "standard_stage" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark shadow-xs" : "border-neutral-200"
                }`}
              >
                <span>Standard Marquee Stage (24–30ft + Lighting)</span>
                <span>Base ~PKR 120k</span>
              </label>

              <label
                onClick={() => setSetupType("grand_stage")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-xs ${
                  setupType === "grand_stage" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark shadow-xs" : "border-neutral-200"
                }`}
              >
                <span>Grand Thematic Stage (40–60ft + Walkway + Truss)</span>
                <span>Base ~PKR 380k</span>
              </label>

              <label
                onClick={() => setSetupType("nikkah_partition")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-xs ${
                  setupType === "nikkah_partition" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark shadow-xs" : "border-neutral-200"
                }`}
              >
                <span>Nikkah Floral Partition (Segregated Motia / Rose Wall)</span>
                <span>Base ~PKR 75k</span>
              </label>

              <label
                onClick={() => setSetupType("mayun")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-xs ${
                  setupType === "mayun" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark shadow-xs" : "border-neutral-200"
                }`}
              >
                <span>Home Mayun / Dholki (Floral Jhoola + Genda Backdrop)</span>
                <span>Base ~PKR 45k</span>
              </label>
            </div>
          </div>

          {/* Flower Grade */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Flower Grade</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFlowerGrade("silk")}
                className={`rounded-xl border p-2 text-center text-xs transition-all ${
                  flowerGrade === "silk" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark" : "border-neutral-200 text-neutral-600"
                }`}
              >
                🌸 100% Silk
              </button>
              <button
                type="button"
                onClick={() => setFlowerGrade("hybrid")}
                className={`rounded-xl border p-2 text-center text-xs transition-all ${
                  flowerGrade === "hybrid" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark" : "border-neutral-200 text-neutral-600"
                }`}
              >
                🌿 Hybrid 70/30
              </button>
              <button
                type="button"
                onClick={() => setFlowerGrade("fresh")}
                className={`rounded-xl border p-2 text-center text-xs transition-all ${
                  flowerGrade === "fresh" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark" : "border-neutral-200 text-neutral-600"
                }`}
              >
                🌹 100% Fresh
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Hybrid (Silk base + fresh roses) offers the best balance of luxury and budget.</p>
          </div>

          {/* Add-ons */}
          <div className="space-y-2 border-t border-neutral-100 pt-4">
            <span className="text-xs font-bold uppercase text-neutral-500 block mb-1">Optional Add-ons</span>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs cursor-pointer">
              <span>Entrance Floral Tunnel (30ft)</span>
              <input
                type="checkbox"
                checked={addTunnel}
                onChange={(e) => setAddTunnel(e.target.checked)}
                className="h-4 w-4 rounded text-bridal-gold accent-bridal-gold"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs cursor-pointer">
              <span>SMD Digital Video Backdrop</span>
              <input
                type="checkbox"
                checked={addSmdWall}
                onChange={(e) => setAddSmdWall(e.target.checked)}
                className="h-4 w-4 rounded text-bridal-gold accent-bridal-gold"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs cursor-pointer">
              <span>Neon Name Sign for Stage</span>
              <input
                type="checkbox"
                checked={addNeonSign}
                onChange={(e) => setAddNeonSign(e.target.checked)}
                className="h-4 w-4 rounded text-bridal-gold accent-bridal-gold"
              />
            </label>
          </div>
        </div>

        {/* Right Output */}
        <div className="flex flex-col justify-between rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50/50 via-white to-neutral-50 p-6 shadow-md lg:col-span-6 sm:p-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Estimated Decorator Cost
            </span>
            <h3 className="font-display text-4xl font-extrabold text-bridal-charcoal mt-1 mb-6">
              PKR {totalDecorCost.toLocaleString()}
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Base Stage Structure &amp; Flowers</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {baseCalculated.toLocaleString()}</span>
              </div>
              {addTunnel && (
                <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <span className="text-xs text-neutral-600">Entrance Floral Walkway</span>
                  <span className="text-sm font-semibold text-neutral-900">PKR {tunnelCost.toLocaleString()}</span>
                </div>
              )}
              {addSmdWall && (
                <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <span className="text-xs text-neutral-600">SMD Screen Rental</span>
                  <span className="text-sm font-semibold text-neutral-900">PKR {smdCost.toLocaleString()}</span>
                </div>
              )}
              {addNeonSign && (
                <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <span className="text-xs text-neutral-600">Custom Acrylic Neon Sign</span>
                  <span className="text-sm font-semibold text-neutral-900">PKR {neonCost.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700 text-sm"
            >
              <Share2 className="h-4 w-4" /> Share Decor Estimate on WhatsApp
            </a>
            <Link
              href={`/wedding-decorators/${selectedCity}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm hover:bg-bridal-gold-dark text-sm"
            >
              Compare Top Decorators in {cityName} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
