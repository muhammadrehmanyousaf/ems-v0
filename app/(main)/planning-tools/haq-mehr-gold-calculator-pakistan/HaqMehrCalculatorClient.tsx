"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Coins, Sparkles, Share2, Scale, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export function HaqMehrCalculatorClient() {
  const [activeTab, setActiveTab] = useState<"mehr" | "gold">("mehr");

  // Tab 1: Haq Mehr State
  const [silverRatePerTola, setSilverRatePerTola] = useState<number>(3350);
  const [gold24kRate, setGold24kRate] = useState<number>(285000);
  const [gold22kRate, setGold22kRate] = useState<number>(261250);
  const [selectedBenchmark, setSelectedBenchmark] = useState<"fatimi" | "hanafi" | "custom">("fatimi");
  const [customCashAmount, setCustomCashAmount] = useState<number>(500000);

  // Tab 2: Bridal Gold Set State
  const [goldTolas, setGoldTolas] = useState<number>(3.5);
  const [wastageRattis, setWastageRattis] = useState<number>(6); // 6 rattis per tola
  const [makingChargesPerTola, setMakingChargesPerTola] = useState<number>(12000);

  // Math: Haq Mehr
  // Mehr-e-Fatimi: 131.25 tolas silver
  const fatimiSilverTolas = 131.25;
  const fatimiPkrValue = Math.round(fatimiSilverTolas * silverRatePerTola);

  // Hanafi Minimum: 2.625 tolas silver (30.618 grams)
  const hanafiSilverTolas = 2.625;
  const hanafiPkrValue = Math.round(hanafiSilverTolas * silverRatePerTola);

  // Custom cash to gold conversion
  const customGoldTolas = Number((customCashAmount / gold22kRate).toFixed(2));
  const customSilverTolas = Number((customCashAmount / silverRatePerTola).toFixed(1));

  // Math: Bridal Gold Set
  // 1 tola = 96 rattis
  const effectiveTolasWithWastage = goldTolas * (1 + wastageRattis / 96);
  const rawGoldCost = Math.round(effectiveTolasWithWastage * gold22kRate);
  const totalMakingCost = Math.round(goldTolas * makingChargesPerTola);
  const totalBridalSetCost = rawGoldCost + totalMakingCost;

  const currentMehrPkr =
    selectedBenchmark === "fatimi"
      ? fatimiPkrValue
      : selectedBenchmark === "hanafi"
      ? hanafiPkrValue
      : customCashAmount;

  const shareText = activeTab === "mehr"
    ? `Shariah Haq Mehr Calculation (2026 Pakistan Rates):
Mehr-e-Fatimi (131.25 Tolas Silver): PKR ${fatimiSilverTolas * silverRatePerTola}
Today's Silver Rate: PKR ${silverRatePerTola}/Tola
Today's 24K Gold Rate: PKR ${gold24kRate.toLocaleString()}/Tola

Calculate yours on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/haq-mehr-gold-calculator-pakistan`
    : `Bridal Gold Set Estimate (${goldTolas} Tolas @ 22K):
Total Weight with ${wastageRattis} Ratti Wastage: ${effectiveTolasWithWastage.toFixed(2)} Tolas
Raw Gold Bill: PKR ${rawGoldCost.toLocaleString()}
Jeweler Making Charges: PKR ${totalMakingCost.toLocaleString()}
Total Estimated Jeweler Bill: PKR ${totalBridalSetCost.toLocaleString()}

Calculated on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/haq-mehr-gold-calculator-pakistan`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Haq Mehr & Gold Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-bridal-cream px-3 py-1 text-xs font-semibold text-bridal-gold-dark mb-3">
          <Sparkles className="h-4 w-4" /> 2026 Pakistan Shariah & Sarafa Market Math
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Haq Mehr & Bridal Gold Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Calculate today&apos;s Mehr-e-Fatimi value in Pakistani Rupees, convert cash dower into gold tolas, and calculate exact bridal gold set bills with jeweler wastage and making charges.
        </p>

        {/* Tab Switcher */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1">
            <button
              onClick={() => setActiveTab("mehr")}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                activeTab === "mehr"
                  ? "bg-white text-bridal-charcoal shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              📜 Haq Mehr Calculator (Shariah)
            </button>
            <button
              onClick={() => setActiveTab("gold")}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                activeTab === "gold"
                  ? "bg-white text-bridal-charcoal shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              💍 Bridal Gold Set & Wastage
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: HAQ MEHR */}
      {activeTab === "mehr" && (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal mb-6">
              <Scale className="h-5 w-5 text-bridal-gold" /> Shariah Mehr Benchmarks
            </h2>

            {/* Benchmark Selector */}
            <div className="space-y-3 mb-6">
              <label
                onClick={() => setSelectedBenchmark("fatimi")}
                className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4 transition-all ${
                  selectedBenchmark === "fatimi"
                    ? "border-bridal-gold bg-bridal-gold/5 shadow-xs"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div>
                  <p className="font-semibold text-neutral-800">Mehr-e-Fatimi (Sunnah Benchmark)</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    500 Silver Dirhams = 131.25 Tolas (1,530.9 grams) of Pure Silver
                  </p>
                </div>
                <input
                  type="radio"
                  name="benchmark"
                  checked={selectedBenchmark === "fatimi"}
                  onChange={() => setSelectedBenchmark("fatimi")}
                  className="mt-1 text-bridal-gold accent-bridal-gold"
                />
              </label>

              <label
                onClick={() => setSelectedBenchmark("hanafi")}
                className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4 transition-all ${
                  selectedBenchmark === "hanafi"
                    ? "border-bridal-gold bg-bridal-gold/5 shadow-xs"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div>
                  <p className="font-semibold text-neutral-800">Minimum Hanafi Dower</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    10 Silver Dirhams = 2.625 Tolas (30.618 grams) of Pure Silver
                  </p>
                </div>
                <input
                  type="radio"
                  name="benchmark"
                  checked={selectedBenchmark === "hanafi"}
                  onChange={() => setSelectedBenchmark("hanafi")}
                  className="mt-1 text-bridal-gold accent-bridal-gold"
                />
              </label>

              <label
                onClick={() => setSelectedBenchmark("custom")}
                className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4 transition-all ${
                  selectedBenchmark === "custom"
                    ? "border-bridal-gold bg-bridal-gold/5 shadow-xs"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div>
                  <p className="font-semibold text-neutral-800">Custom Cash Dower</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Enter cash in PKR to convert into Gold Tolas & Silver
                  </p>
                </div>
                <input
                  type="radio"
                  name="benchmark"
                  checked={selectedBenchmark === "custom"}
                  onChange={() => setSelectedBenchmark("custom")}
                  className="mt-1 text-bridal-gold accent-bridal-gold"
                />
              </label>
            </div>

            {selectedBenchmark === "custom" && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Agreed Haq Mehr in PKR
                </label>
                <input
                  type="number"
                  step={25000}
                  value={customCashAmount}
                  onChange={(e) => setCustomCashAmount(Number(e.target.value))}
                  className="w-full rounded-2xl border border-neutral-300 p-3 text-sm focus:border-bridal-gold focus:outline-none"
                />
              </div>
            )}

            {/* Editable Sarafa Rates */}
            <div className="border-t border-neutral-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                Live Sarafa Rates (Adjustable)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-600 block mb-1">Silver / Tola (PKR)</label>
                  <input
                    type="number"
                    value={silverRatePerTola}
                    onChange={(e) => setSilverRatePerTola(Number(e.target.value))}
                    className="w-full rounded-xl border border-neutral-300 p-2 text-xs focus:border-bridal-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600 block mb-1">22K Gold / Tola (PKR)</label>
                  <input
                    type="number"
                    value={gold22kRate}
                    onChange={(e) => setGold22kRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-neutral-300 p-2 text-xs focus:border-bridal-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Results */}
          <div className="flex flex-col justify-between rounded-3xl border border-bridal-gold/30 bg-gradient-to-br from-bridal-cream/60 via-white to-bridal-blush/30 p-6 shadow-md lg:col-span-6 sm:p-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-bridal-gold-dark">
                Shariah Haq Mehr Valuation
              </span>
              <h3 className="font-display text-3xl font-bold text-bridal-charcoal mt-1 mb-6">
                PKR {currentMehrPkr.toLocaleString()}
              </h3>

              <div className="space-y-4 mb-8">
                <div className="rounded-2xl bg-white p-4 border border-neutral-200/80">
                  <span className="text-xs text-neutral-500">Silver Equivalent</span>
                  <p className="font-display text-xl font-bold text-neutral-800 mt-1">
                    {selectedBenchmark === "fatimi" ? "131.25 Tolas" : selectedBenchmark === "hanafi" ? "2.625 Tolas" : `${customSilverTolas} Tolas`}
                  </p>
                  <span className="text-[11px] text-neutral-400">Based on pure chandi rate (PKR {silverRatePerTola}/tola)</span>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-neutral-200/80">
                  <span className="text-xs text-neutral-500">Gold Equivalent (22K)</span>
                  <p className="font-display text-xl font-bold text-neutral-800 mt-1">
                    {(currentMehrPkr / gold22kRate).toFixed(2)} Tolas Gold
                  </p>
                  <span className="text-[11px] text-neutral-400">Equivalent buying power in bridal gold</span>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-neutral-200/80">
                  <span className="text-xs text-neutral-500">Legal Nikkah Protection</span>
                  <p className="text-xs text-neutral-600 mt-1">
                    In Pakistani family law, specifying both a cash value and gold tola weight in <strong>Column 13 & 14</strong> protects the bride against rupee inflation over time.
                  </p>
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
                <Share2 className="h-4 w-4" /> Share Haq Mehr Calculation on WhatsApp
              </a>
              <Link
                href="/nikah-khwan/lahore"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-bridal-gold-dark"
              >
                Find Licensed Nikkah Khwan in Your City <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRIDAL GOLD SET */}
      {activeTab === "gold" && (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal mb-6">
              <Coins className="h-5 w-5 text-bridal-gold" /> Gold Set Weight & Jeweler Rates
            </h2>

            {/* Tolas Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-neutral-700">Bridal Set Gold Weight</label>
                <span className="rounded-full bg-bridal-gold/10 px-3 py-0.5 text-sm font-bold text-bridal-gold-dark">
                  {goldTolas} Tolas ({(goldTolas * 11.664).toFixed(1)} grams)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={0.25}
                value={goldTolas}
                onChange={(e) => setGoldTolas(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-bridal-gold"
              />
              <div className="mt-2 flex justify-between text-xs text-neutral-400">
                <span>1 Tola (Light)</span>
                <span>3.5 Tolas (Standard)</span>
                <span>7 Tolas (Heavy)</span>
                <span>15 Tolas (Royal)</span>
              </div>
            </div>

            {/* Wastage (Ratti) Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-neutral-700">Jeweler Wastage (Ratti per Tola)</label>
                <span className="rounded-full bg-amber-500/10 px-3 py-0.5 text-sm font-bold text-amber-700">
                  {wastageRattis} Rattis / Tola
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={wastageRattis}
                onChange={(e) => setWastageRattis(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-amber-600"
              />
              <div className="mt-2 flex justify-between text-xs text-neutral-400">
                <span>0 (Machine Cast)</span>
                <span>4 Ratti (Simple)</span>
                <span>8 Ratti (Kundan/Filigree)</span>
                <span>12 Ratti (Antique)</span>
              </div>
            </div>

            {/* Making Charges */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Jeweler Making Charges (Mazdoori per Tola in PKR)
              </label>
              <input
                type="number"
                step={1000}
                value={makingChargesPerTola}
                onChange={(e) => setMakingChargesPerTola(Number(e.target.value))}
                className="w-full rounded-2xl border border-neutral-300 p-3 text-sm focus:border-bridal-gold focus:outline-none"
              />
              <p className="text-xs text-neutral-400 mt-1">Average Sarafa Bazaar rate: PKR 8,000 to PKR 18,000/tola</p>
            </div>
          </div>

          {/* Right Results */}
          <div className="flex flex-col justify-between rounded-3xl border border-bridal-gold/30 bg-gradient-to-br from-bridal-cream/60 via-white to-bridal-blush/30 p-6 shadow-md lg:col-span-6 sm:p-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-bridal-gold-dark">
                Estimated Final Jeweler Bill
              </span>
              <h3 className="font-display text-3xl font-bold text-bridal-charcoal mt-1 mb-6">
                PKR {totalBridalSetCost.toLocaleString()}
              </h3>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <span className="text-xs text-neutral-600">Net Gold Weight</span>
                  <span className="text-sm font-bold text-neutral-900">{goldTolas} Tolas</span>
                </div>
                <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <span className="text-xs text-neutral-600">Wastage Added ({wastageRattis} Ratti/Tola)</span>
                  <span className="text-sm font-bold text-amber-700">+{(goldTolas * (wastageRattis / 96)).toFixed(3)} Tolas</span>
                </div>
                <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <span className="text-xs text-neutral-600">Billed Gold Weight</span>
                  <span className="text-sm font-bold text-neutral-900">{effectiveTolasWithWastage.toFixed(3)} Tolas</span>
                </div>
                <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <span className="text-xs text-neutral-600">Raw Gold Value (22K)</span>
                  <span className="text-sm font-bold text-neutral-900">PKR {rawGoldCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <span className="text-xs text-neutral-600">Total Making Charges</span>
                  <span className="text-sm font-bold text-neutral-900">PKR {totalMakingCost.toLocaleString()}</span>
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
                <Share2 className="h-4 w-4" /> Share Gold Estimate on WhatsApp
              </a>
              <Link
                href="/bridal-wear/lahore"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-bridal-gold-dark"
              >
                Browse Bridal Jewellery & Outfits <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Guide Content */}
      <section className="mt-14 sm:mt-20 rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10">
        <h2 className="font-display text-2xl font-bold text-bridal-charcoal mb-4">
          Pakistani Gold Units & Sarafa Bazaar Guide
        </h2>
        <div className="grid gap-6 md:grid-cols-3 text-sm text-neutral-600">
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
            <h3 className="font-bold text-neutral-800 mb-1">1 Tola = 11.664 Grams</h3>
            <p>1 Tola is the standard unit used across Pakistan, divided into 12 Mashas or 96 Rattis.</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
            <h3 className="font-bold text-neutral-800 mb-1">22K vs 24K Bridal Gold</h3>
            <p>24K (99.9% pure) is too soft for jewellery. 22K (91.6% pure) is standard for sturdy Pakistani bridal necklaces and bangles.</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
            <h3 className="font-bold text-neutral-800 mb-1">Ratti & Pali Surcharge</h3>
            <p>Always ask the jeweler for a breakdown of Net Weight vs Gross Weight so you aren't paying gold rates for pearls and beads.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
