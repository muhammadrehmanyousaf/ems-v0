"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Utensils, Users, Share2, Sparkles, HelpCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { CITIES } from "@/lib/seo/constants";

export function DeghCalculatorClient() {
  const [guests, setGuests] = useState<number>(300);
  const [eventType, setEventType] = useState<string>("Baraat One-Dish");
  const [meatType, setMeatType] = useState<"mutton" | "chicken">("chicken");
  const [selectedCity, setSelectedCity] = useState<string>("lahore");
  const [includeLiveStalls, setIncludeLiveStalls] = useState<boolean>(true);

  // Core Math
  const rawMeatKg = Math.round(meatType === "mutton" ? guests * 0.23 : guests * 0.21);
  const basmatiRiceKg = Math.round((guests / 100) * 12);
  const naanCount = Math.round(guests * 1.75);
  const sweetDishKg = Math.round((guests / 100) * 11);
  const deghCount = Math.ceil(guests / (eventType.includes("One-Dish") ? 85 : 100));

  // Costs
  const deghRate = meatType === "mutton" ? 75000 : 36000;
  const pakwanTotalCost = deghCount * deghRate;
  const perHeadFullRate = meatType === "mutton" ? 2850 : 1750;
  const fullServiceTotalCost = guests * perHeadFullRate + (includeLiveStalls ? 45000 : 0);

  const cityName = CITIES.find((c) => c.slug === selectedCity)?.name || "Pakistan";

  const shareText = `Pakistani Wedding Catering Math for ${guests} Guests (${eventType} in ${cityName}):
🍲 Deghs Needed: ${deghCount}
🥩 Raw ${meatType.toUpperCase()}: ${rawMeatKg} KG
🍚 Basmati Rice: ${basmatiRiceKg} KG
🫓 Naan/Taftan: ${naanCount}
🍮 Sweet Dish: ${sweetDishKg} KG
💰 Est. Pakwan Degh Cost: PKR ${pakwanTotalCost.toLocaleString()}
💰 Full Service Catering: PKR ${fullServiceTotalCost.toLocaleString()}

Calculated via WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/degh-catering-calculator-pakistan`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Degh & Catering Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-bridal-cream px-3 py-1 text-xs font-semibold text-bridal-gold-dark mb-3">
          <Sparkles className="h-4 w-4" /> 2026 Pakistani Wedding Food Math
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Shaadi Degh, Meat & Catering Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Calculate exact Degh counts, raw mutton/chicken in KG, naan quantities, and 2026 per-head catering costs for any wedding size in Pakistan.
        </p>
      </div>

      {/* Interactive Card */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Inputs */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal mb-6">
            <Utensils className="h-5 w-5 text-bridal-gold" /> Event Food Parameters
          </h2>

          {/* Guest Count */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-neutral-700">Total Wedding Guests</label>
              <span className="rounded-full bg-bridal-gold/10 px-3 py-0.5 text-sm font-bold text-bridal-gold-dark">
                {guests} Guests
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={2000}
              step={25}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-bridal-gold"
            />
            <div className="mt-2 flex justify-between text-xs text-neutral-400">
              <span>50 Guests</span>
              <span>500 Guests</span>
              <span>1,000 Guests</span>
              <span>2,000 Guests</span>
            </div>
          </div>

          {/* Meat Choice */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Main Meat Preference</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMeatType("chicken")}
                className={`rounded-2xl border p-3 text-center transition-all ${
                  meatType === "chicken"
                    ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                }`}
              >
                🍗 Chicken (Qorma / Karahi)
              </button>
              <button
                type="button"
                onClick={() => setMeatType("mutton")}
                className={`rounded-2xl border p-3 text-center transition-all ${
                  meatType === "mutton"
                    ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                }`}
              >
                🍖 Mutton (Kunna / Qorma)
              </button>
            </div>
          </div>

          {/* Event Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Event Function</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 p-3 text-sm focus:border-bridal-gold focus:outline-none"
            >
              <option value="Baraat One-Dish">Baraat Dinner (One-Dish Regulated)</option>
              <option value="Walima Dinner">Walima Reception Dinner</option>
              <option value="Home Dholki/Mayun">Home Dholki / Mehndi / Mayun</option>
              <option value="Nikkah Lunch">Nikkah Lunch / High-Tea</option>
            </select>
          </div>

          {/* City */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Event City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 p-3 text-sm focus:border-bridal-gold focus:outline-none"
            >
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Live Stalls Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/50 p-3">
            <div>
              <p className="text-sm font-medium text-neutral-800">Live Counters (Chaat & Kashmiri Chai)</p>
              <p className="text-xs text-neutral-500">Includes live tandoor, gol gappay & chai stall</p>
            </div>
            <input
              type="checkbox"
              checked={includeLiveStalls}
              onChange={(e) => setIncludeLiveStalls(e.target.checked)}
              className="h-5 w-5 rounded border-neutral-300 text-bridal-gold accent-bridal-gold"
            />
          </div>
        </div>

        {/* Right Output Results */}
        <div className="flex flex-col justify-between rounded-3xl border border-bridal-gold/30 bg-gradient-to-br from-bridal-cream/60 via-white to-bridal-blush/30 p-6 shadow-md lg:col-span-6 sm:p-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-lg font-bold text-bridal-charcoal">
                Food Quantities ({guests} Guests)
              </span>
              <span className="rounded-full bg-bridal-gold text-white px-3 py-0.5 text-xs font-semibold">
                {cityName} Mandi Rates
              </span>
            </div>

            {/* Quantities Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-6">
              <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80 shadow-xs text-center">
                <span className="text-xs text-neutral-500">Standard Deghs</span>
                <p className="font-display text-2xl font-bold text-bridal-gold-dark mt-1">{deghCount}</p>
                <span className="text-[11px] text-neutral-400">12kg meat deghs</span>
              </div>
              <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80 shadow-xs text-center">
                <span className="text-xs text-neutral-500">Raw {meatType === "mutton" ? "Mutton" : "Chicken"}</span>
                <p className="font-display text-2xl font-bold text-neutral-800 mt-1">{rawMeatKg} <span className="text-sm font-normal">KG</span></p>
                <span className="text-[11px] text-neutral-400">Fresh cut weight</span>
              </div>
              <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80 shadow-xs text-center">
                <span className="text-xs text-neutral-500">Basmati Rice</span>
                <p className="font-display text-2xl font-bold text-neutral-800 mt-1">{basmatiRiceKg} <span className="text-sm font-normal">KG</span></p>
                <span className="text-[11px] text-neutral-400">Super kernel rice</span>
              </div>
              <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80 shadow-xs text-center">
                <span className="text-xs text-neutral-500">Naan / Taftan</span>
                <p className="font-display text-2xl font-bold text-neutral-800 mt-1">{naanCount}</p>
                <span className="text-[11px] text-neutral-400">1.75 per guest</span>
              </div>
              <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80 shadow-xs text-center">
                <span className="text-xs text-neutral-500">Sweet Dish</span>
                <p className="font-display text-2xl font-bold text-neutral-800 mt-1">{sweetDishKg} <span className="text-sm font-normal">KG</span></p>
                <span className="text-[11px] text-neutral-400">Kheer / Zarda</span>
              </div>
              <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80 shadow-xs text-center">
                <span className="text-xs text-neutral-500">Raita & Salad</span>
                <p className="font-display text-2xl font-bold text-neutral-800 mt-1">{Math.round(guests * 0.1)} <span className="text-sm font-normal">KG</span></p>
                <span className="text-[11px] text-neutral-400">Mint curd + fresh mix</span>
              </div>
            </div>

            {/* Cost Comparison */}
            <div className="rounded-2xl border border-bridal-gold/40 bg-white p-4 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                Estimated 2026 Budget Comparison
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">Pakwan Center (Self-Degh Pickup)</p>
                    <p className="text-xs text-neutral-500">{deghCount} deghs @ PKR {deghRate.toLocaleString()}</p>
                  </div>
                  <span className="text-base font-bold text-neutral-900">PKR {pakwanTotalCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-bridal-gold-dark">Full Service Wedding Catering</p>
                    <p className="text-xs text-neutral-500">Uniformed waiters, bone-china crockery, live heaters</p>
                  </div>
                  <span className="text-base font-bold text-bridal-gold-dark">PKR {fullServiceTotalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
            >
              <Share2 className="h-4 w-4" /> Share Food Breakdown on WhatsApp
            </a>
            <Link
              href={`/caterers/${selectedCity}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-bridal-gold-dark"
            >
              Find Verified Caterers in {cityName} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Reference Table Below the Fold */}
      <section className="mt-14 sm:mt-20">
        <h2 className="font-display text-2xl font-bold text-bridal-charcoal mb-4">
          Pakistani Wedding Catering & Degh Quick Reference Table (2026)
        </h2>
        <div className="overflow-x-auto rounded-3xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm text-neutral-700">
            <thead className="bg-bridal-cream/50 text-xs font-bold uppercase tracking-wider text-neutral-600">
              <tr>
                <th className="p-4">Guest Count</th>
                <th className="p-4">Degh Count (12kg)</th>
                <th className="p-4">Chicken (KG)</th>
                <th className="p-4">Mutton (KG)</th>
                <th className="p-4">Naan Count</th>
                <th className="p-4">Estimated Pakwan Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr>
                <td className="p-4 font-semibold">100 Guests</td>
                <td className="p-4">1–2 Deghs</td>
                <td className="p-4">21 KG</td>
                <td className="p-4">23 KG</td>
                <td className="p-4">175 Naans</td>
                <td className="p-4">PKR 36,000 – 75,000</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">200 Guests</td>
                <td className="p-4">2–3 Deghs</td>
                <td className="p-4">42 KG</td>
                <td className="p-4">46 KG</td>
                <td className="p-4">350 Naans</td>
                <td className="p-4">PKR 72,000 – 150,000</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">300 Guests</td>
                <td className="p-4">3–4 Deghs</td>
                <td className="p-4">63 KG</td>
                <td className="p-4">69 KG</td>
                <td className="p-4">525 Naans</td>
                <td className="p-4">PKR 108,000 – 225,000</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">500 Guests</td>
                <td className="p-4">6 Deghs</td>
                <td className="p-4">105 KG</td>
                <td className="p-4">115 KG</td>
                <td className="p-4">875 Naans</td>
                <td className="p-4">PKR 216,000 – 450,000</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">800 Guests</td>
                <td className="p-4">9–10 Deghs</td>
                <td className="p-4">168 KG</td>
                <td className="p-4">184 KG</td>
                <td className="p-4">1,400 Naans</td>
                <td className="p-4">PKR 324,000 – 675,000</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold">1,000 Guests</td>
                <td className="p-4">12 Deghs</td>
                <td className="p-4">210 KG</td>
                <td className="p-4">230 KG</td>
                <td className="p-4">1,750 Naans</td>
                <td className="p-4">PKR 432,000 – 900,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Guide Content */}
      <section className="mt-12 sm:mt-16 rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10">
        <h2 className="font-display text-2xl font-bold text-bridal-charcoal mb-4">
          How to Calculate Wedding Food Quantities for Pakistani Shaadis
        </h2>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-neutral-600">
          <p>
            Food is the emotional centerpiece of any Pakistani wedding. Whether hosting a modest 80-guest home Nikkah in Lahore or an 800-guest grand Walima reception in Karachi, running short of food is considered a family catastrophe, while over-ordering leads to massive food wastage and thousands of wasted rupees.
          </p>
          <p>
            In Pakistan, food math revolves around the <strong>12kg Standard Degh</strong>. A traditional degh accommodates 12 kg of meat and 12 kg of aged Super Basmati Rice. Under Punjab and Islamabad <strong>One-Dish wedding legislation</strong>, caterers typically serve either Chicken Qorma or Mutton Kunna with Naans, followed by Biryani and a single traditional dessert like Zarda, Gajar Ka Halwa, or Kheer.
          </p>
          <h3 className="font-display text-lg font-bold text-neutral-800 pt-2">Key Tips for Avoiding Catering Surprises:</h3>
          <ul className="space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Account for Bone vs Boneless:</strong> Raw mutton shrinks by approximately 22% during braising. Always insist on a 70:30 mix of curry cut meat.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>The 10% Extra Buffer:</strong> Pakistani families frequently arrive with unexpected extra guests. Always order a 10% safety margin on naans and rice.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Live Tandoor vs Delivery:</strong> For marquees in winter, live tandoor naans cost an extra PKR 8,000–12,000 for labour but ensure crisp, hot bread compared to soggy delivered taftans.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
