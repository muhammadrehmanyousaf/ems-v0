"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Share2, Heart, Users, ArrowRight, CheckCircle2, UserCheck } from "lucide-react";
import { CITIES } from "@/lib/seo/constants";

export function MakeupSalonCalculatorClient() {
  const [salonTier, setSalonTier] = useState<"celebrity" | "studio" | "freelance">("studio");
  const [hasNikkah, setHasNikkah] = useState(true);
  const [hasMehndi, setHasMehndi] = useState(true);
  const [hasBaraat, setHasBaraat] = useState(true);
  const [hasWalima, setHasWalima] = useState(true);
  const [partyMakeups, setPartyMakeups] = useState(4); // Mother, sisters
  const [femaleGuestsForHenna, setFemaleGuestsForHenna] = useState(60);
  const [selectedCity, setSelectedCity] = useState("lahore");

  // Tier pricing per bridal look
  const tierRates = {
    celebrity: { bridalLook: 110000, partyLook: 12000 },
    studio: { bridalLook: 55000, partyLook: 7500 },
    freelance: { bridalLook: 30000, partyLook: 5000 },
  };

  const selectedTier = tierRates[salonTier];

  const totalBridalEvents = [hasNikkah, hasMehndi, hasBaraat, hasWalima].filter(Boolean).length;
  const bridalTotalCost = totalBridalEvents * selectedTier.bridalLook;
  const partyTotalCost = partyMakeups * selectedTier.partyLook;

  // Henna artists math: 1 artist per 22 guests for a 3-hour event
  const hennaArtistsNeeded = Math.max(1, Math.ceil(femaleGuestsForHenna / 22));
  const hennaCost = hennaArtistsNeeded * 12000; // ~PKR 12k per artist for Dholki evening

  const totalBeautyBill = bridalTotalCost + partyTotalCost + hennaCost;

  const cityName = CITIES.find((c) => c.slug === selectedCity)?.name || "Pakistan";

  const shareText = `Bridal & Family Beauty Budget for ${cityName}:
Tier: ${salonTier.toUpperCase()}
👰 Bride Looks: ${totalBridalEvents} Events (PKR ${bridalTotalCost.toLocaleString()})
💄 Family Party Makeups: ${partyMakeups} Persons (PKR ${partyTotalCost.toLocaleString()})
🌿 Dholki Henna Artists Needed: ${hennaArtistsNeeded} Artists (PKR ${hennaCost.toLocaleString()})
✨ Total Salon & Makeup Budget: PKR ${totalBeautyBill.toLocaleString()}

Calculate your bridal salon estimate on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/bridal-makeup-salon-cost-calculator-pakistan`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Bridal Makeup &amp; Henna Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-800 mb-3">
          <Sparkles className="h-4 w-4 text-rose-600" /> 2026 Pakistani Bridal Salon Math
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Bridal &amp; Party Makeup Cost Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Calculate your total salon bill for Bride + Mother + Sisters across Nikkah, Mehndi, Baraat &amp; Walima, plus Dholki henna artist staffing.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Inputs */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal mb-6">
            <Heart className="h-5 w-5 text-rose-500" /> Stylist &amp; Event Scope
          </h2>

          {/* Tier Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Makeup Artist Tier</label>
            <div className="grid grid-cols-1 gap-2.5">
              <label
                onClick={() => setSalonTier("studio")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-xs ${
                  salonTier === "studio" ? "border-rose-400 bg-rose-50/40 font-semibold text-rose-900 shadow-xs" : "border-neutral-200"
                }`}
              >
                <div>
                  <p className="font-bold">Senior Studio Stylist (Most Popular)</p>
                  <p className="text-[11px] text-neutral-500">Established brand studios (PKR ~55k/look)</p>
                </div>
                <input type="radio" checked={salonTier === "studio"} onChange={() => {}} className="accent-rose-600" />
              </label>

              <label
                onClick={() => setSalonTier("celebrity")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-xs ${
                  salonTier === "celebrity" ? "border-rose-400 bg-rose-50/40 font-semibold text-rose-900 shadow-xs" : "border-neutral-200"
                }`}
              >
                <div>
                  <p className="font-bold">Celebrity Signature Salon</p>
                  <p className="text-[11px] text-neutral-500">Top master artists &amp; TV stylists (PKR ~110k/look)</p>
                </div>
                <input type="radio" checked={salonTier === "celebrity"} onChange={() => {}} className="accent-rose-600" />
              </label>

              <label
                onClick={() => setSalonTier("freelance")}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-xs ${
                  salonTier === "freelance" ? "border-rose-400 bg-rose-50/40 font-semibold text-rose-900 shadow-xs" : "border-neutral-200"
                }`}
              >
                <div>
                  <p className="font-bold">Home-Service Bridal Freelancer</p>
                  <p className="text-[11px] text-neutral-500">Travels to your venue / room (PKR ~30k/look)</p>
                </div>
                <input type="radio" checked={salonTier === "freelance"} onChange={() => {}} className="accent-rose-600" />
              </label>
            </div>
          </div>

          {/* Bridal Events Checkboxes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Bride Makeup Looks</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 cursor-pointer">
                <input type="checkbox" checked={hasBaraat} onChange={(e) => setHasBaraat(e.target.checked)} className="accent-rose-600" />
                <span>Baraat (Red Signature)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 cursor-pointer">
                <input type="checkbox" checked={hasWalima} onChange={(e) => setHasWalima(e.target.checked)} className="accent-rose-600" />
                <span>Walima (Pastel Glow)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 cursor-pointer">
                <input type="checkbox" checked={hasNikkah} onChange={(e) => setHasNikkah(e.target.checked)} className="accent-rose-600" />
                <span>Nikkah (Soft Glam)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 cursor-pointer">
                <input type="checkbox" checked={hasMehndi} onChange={(e) => setHasMehndi(e.target.checked)} className="accent-rose-600" />
                <span>Mehndi / Mayun Look</span>
              </label>
            </div>
          </div>

          {/* Party Makeups + Henna */}
          <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Family Party Makeups</label>
              <input
                type="number"
                min={0}
                max={25}
                value={partyMakeups}
                onChange={(e) => setPartyMakeups(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              />
              <span className="text-[10px] text-neutral-400">Mother, sisters &amp; cousins</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Dholki Female Guests</label>
              <input
                type="number"
                min={10}
                max={200}
                step={5}
                value={femaleGuestsForHenna}
                onChange={(e) => setFemaleGuestsForHenna(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              />
              <span className="text-[10px] text-neutral-400">For henna queue staffing</span>
            </div>
          </div>
        </div>

        {/* Right Output */}
        <div className="flex flex-col justify-between rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50/50 via-white to-neutral-50 p-6 shadow-md lg:col-span-6 sm:p-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Total Salon &amp; Beauty Invoice
            </span>
            <h3 className="font-display text-4xl font-extrabold text-bridal-charcoal mt-1 mb-6">
              PKR {totalBeautyBill.toLocaleString()}
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Bride Makeup ({totalBridalEvents} Looks)</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {bridalTotalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Family Party Makeups ({partyMakeups} Persons)</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {partyTotalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <div>
                  <p className="text-xs font-semibold text-neutral-800">Dholki Henna Artists Needed</p>
                  <p className="text-[10px] text-neutral-500">1 artist per 22 guests for 3-hour event</p>
                </div>
                <span className="text-sm font-bold text-emerald-700">{hennaArtistsNeeded} Artists</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Total Henna Staffing Cost</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {hennaCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700 text-sm"
            >
              <Share2 className="h-4 w-4" /> Share Makeup Budget on WhatsApp
            </a>
            <Link
              href={`/bridal-makeup-artists/${selectedCity}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm hover:bg-bridal-gold-dark text-sm"
            >
              Browse Verified Makeup Artists in {cityName} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
