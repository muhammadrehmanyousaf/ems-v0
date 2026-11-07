"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Sparkles, Share2, AlertCircle, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { CITIES } from "@/lib/seo/constants";

export function MarqueeHiddenCostClient() {
  const [quotedRate, setQuotedRate] = useState<number>(2200);
  const [guests, setGuests] = useState<number>(300);
  const [bufferPercent, setBufferPercent] = useState<number>(10);
  const [taxRegime, setTaxRegime] = useState<"punjab" | "sindh" | "ict" | "kp">("punjab");
  const [selectedCity, setSelectedCity] = useState<string>("lahore");

  // Toggles for hidden extras
  const [acHours, setAcHours] = useState<number>(4);
  const [includeAcFee, setIncludeAcFee] = useState<boolean>(true);
  const [includeGeneratorFuel, setIncludeGeneratorFuel] = useState<boolean>(true);
  const [stageUpgradeCost, setStageUpgradeCost] = useState<number>(95000);
  const [soundDjCost, setSoundDjCost] = useState<number>(35000);
  const [includeSegregation, setIncludeSegregation] = useState<boolean>(false);
  const [waiterTips, setWaiterTips] = useState<number>(25000);

  // Calculations
  const taxRates = { punjab: 0.05, sindh: 0.13, ict: 0.15, kp: 0.05 };
  const currentTaxRate = taxRates[taxRegime];

  const totalBilledGuests = Math.round(guests * (1 + bufferPercent / 100));
  const rawMenuBill = totalBilledGuests * quotedRate;
  const taxAmount = Math.round(rawMenuBill * currentTaxRate);

  const acCost = includeAcFee ? acHours * 30000 : 0;
  const generatorCost = includeGeneratorFuel ? 25000 : 0;
  const segregationCost = includeSegregation ? 20000 : 0;

  const totalHiddenExtras =
    taxAmount + acCost + generatorCost + stageUpgradeCost + soundDjCost + segregationCost + waiterTips;

  const trueTotalBill = rawMenuBill + totalHiddenExtras;
  const truePerHeadRate = Math.round(trueTotalBill / totalBilledGuests);
  const perHeadIncrease = truePerHeadRate - quotedRate;

  const cityName = CITIES.find((c) => c.slug === selectedCity)?.name || "Pakistan";

  const shareText = `Pakistani Marquee True Cost Calculation (${totalBilledGuests} Guests in ${cityName}):
Quoted Per-Head Rate: PKR ${quotedRate.toLocaleString()}/head
⚡ TRUE Final Rate: PKR ${truePerHeadRate.toLocaleString()}/head (+PKR ${perHeadIncrease.toLocaleString()}/head Hidden Fees!)
Quoted Menu Bill: PKR ${rawMenuBill.toLocaleString()}
Hidden Fees (AC, Fuel, Decor, Tax, Tips): PKR ${totalHiddenExtras.toLocaleString()}
🧾 Final True Invoice: PKR ${trueTotalBill.toLocaleString()}

Check your marquee contract on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/marquee-hidden-cost-calculator-pakistan`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Marquee Hidden-Cost Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-bridal-cream px-3 py-1 text-xs font-semibold text-bridal-gold-dark mb-3">
          <Sparkles className="h-4 w-4" /> 2026 Pakistan Venue Contract Protection
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Marquee &quot;True Final Bill&quot; Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Quoted PKR 2,000/head? Uncover hidden AC hours, generator fuel surcharges, provincial taxes, and stage fees before paying your marquee token.
        </p>
      </div>

      {/* Interactive Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Inputs */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal mb-6">
            <Building2 className="h-5 w-5 text-bridal-gold" /> Marquee Quote Inputs
          </h2>

          {/* Quoted Per-Head */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-neutral-700">Quoted Per-Head Menu Rate</label>
              <span className="font-bold text-bridal-gold-dark text-sm">PKR {quotedRate.toLocaleString()}/head</span>
            </div>
            <input
              type="number"
              step={100}
              value={quotedRate}
              onChange={(e) => setQuotedRate(Number(e.target.value))}
              className="w-full rounded-2xl border border-neutral-300 p-3 text-sm focus:border-bridal-gold focus:outline-none"
            />
          </div>

          {/* Guests + Buffer */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Guaranteed Guests</label>
              <input
                type="number"
                step={25}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Expected Extra Buffer %</label>
              <input
                type="number"
                step={5}
                value={bufferPercent}
                onChange={(e) => setBufferPercent(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Province / City */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Provincial Tax</label>
              <select
                value={taxRegime}
                onChange={(e) => setTaxRegime(e.target.value as any)}
                className="w-full rounded-xl border border-neutral-300 p-2 text-xs focus:border-bridal-gold focus:outline-none"
              >
                <option value="punjab">Punjab (PRA 5%)</option>
                <option value="sindh">Sindh (SRB 13%)</option>
                <option value="ict">Islamabad (ICT 15%)</option>
                <option value="kp">KP (5%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-2 text-xs focus:border-bridal-gold focus:outline-none"
              >
                {CITIES.slice(0, 15).map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hidden Add-on Checkboxes */}
          <div className="border-t border-neutral-100 pt-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Common Hidden Surcharges
            </h3>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <p className="text-xs font-semibold text-neutral-800">Chiller AC / Winter Heaters ({acHours} Hours)</p>
                <p className="text-[11px] text-neutral-500">PKR 30,000 / hour runtime</p>
              </div>
              <input
                type="checkbox"
                checked={includeAcFee}
                onChange={(e) => setIncludeAcFee(e.target.checked)}
                className="h-4 w-4 rounded text-bridal-gold accent-bridal-gold"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <p className="text-xs font-semibold text-neutral-800">Generator Fuel Backup</p>
                <p className="text-[11px] text-neutral-500">Standard PKR 25,000 fuel deposit</p>
              </div>
              <input
                type="checkbox"
                checked={includeGeneratorFuel}
                onChange={(e) => setIncludeGeneratorFuel(e.target.checked)}
                className="h-4 w-4 rounded text-bridal-gold accent-bridal-gold"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <p className="text-xs font-semibold text-neutral-800">Soundproof Segregation Curtains</p>
                <p className="text-[11px] text-neutral-500">Pardah partition for Gents/Ladies</p>
              </div>
              <input
                type="checkbox"
                checked={includeSegregation}
                onChange={(e) => setIncludeSegregation(e.target.checked)}
                className="h-4 w-4 rounded text-bridal-gold accent-bridal-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-neutral-600 block mb-1">Stage Floral Decor (PKR)</label>
                <input
                  type="number"
                  step={5000}
                  value={stageUpgradeCost}
                  onChange={(e) => setStageUpgradeCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-neutral-300 p-2 text-xs focus:border-bridal-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 block mb-1">Waiter Tips & Valet (PKR)</label>
                <input
                  type="number"
                  step={5000}
                  value={waiterTips}
                  onChange={(e) => setWaiterTips(Number(e.target.value))}
                  className="w-full rounded-xl border border-neutral-300 p-2 text-xs focus:border-bridal-gold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Results */}
        <div className="flex flex-col justify-between rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50/50 via-white to-bridal-cream/40 p-6 shadow-md lg:col-span-6 sm:p-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> True Per-Head Cost Reality
              </span>
              <span className="rounded-full bg-rose-100 text-rose-700 px-3 py-0.5 text-xs font-bold">
                +PKR {perHeadIncrease.toLocaleString()} / head hidden!
              </span>
            </div>

            <h3 className="font-display text-4xl font-extrabold text-bridal-charcoal mt-1">
              PKR {truePerHeadRate.toLocaleString()} <span className="text-sm font-normal text-neutral-500">/ head true cost</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-6">
              You were quoted <strong>PKR {quotedRate.toLocaleString()}</strong>, but your true bill with {totalBilledGuests} guests is <strong>PKR {trueTotalBill.toLocaleString()}</strong>.
            </p>

            {/* Breakdown List */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Base Food Bill ({totalBilledGuests} guests)</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {rawMenuBill.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Government Tax ({taxRegime.toUpperCase()} {(currentTaxRate * 100).toFixed(0)}%)</span>
                <span className="text-sm font-semibold text-rose-600">+PKR {taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">AC Runtime ({includeAcFee ? `${acHours} hours` : "Excluded"})</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {acCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Stage Decor & Lighting</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {stageUpgradeCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Waiter Tips & Generator Backup</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {(generatorCost + waiterTips).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
            >
              <Share2 className="h-4 w-4" /> Share True Bill Breakdown on WhatsApp
            </a>
            <Link
              href={`/wedding-venues/${selectedCity}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-bridal-gold-dark"
            >
              Compare Transparent Venues in {cityName} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Guide Content */}
      <section className="mt-14 sm:mt-20 rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10">
        <h2 className="font-display text-2xl font-bold text-bridal-charcoal mb-4">
          3 Things to Write on Your Marquee Token Receipt Before Paying
        </h2>
        <div className="grid gap-6 md:grid-cols-3 text-sm text-neutral-600">
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
            <h3 className="font-bold text-neutral-800 mb-1">1. &quot;All Taxes & AC Hours Included&quot;</h3>
            <p>Ensure the receipt explicitly mentions that AC runtime from 7:30 PM to 10:00 PM is covered in the per-head rate.</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
            <h3 className="font-bold text-neutral-800 mb-1">2. Outside Decorator Permission</h3>
            <p>If bringing your own florist or stage designer, ensure zero &quot;in-house royalty&quot; fines are applied.</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
            <h3 className="font-bold text-neutral-800 mb-1">3. Guaranteed Headcount Buffer</h3>
            <p>Clarify whether surplus plates above the guaranteed count are billed at the regular rate or subject to penalty rates.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
