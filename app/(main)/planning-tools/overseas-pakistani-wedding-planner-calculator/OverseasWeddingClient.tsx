"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Globe2, Sparkles, Share2, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";

export function OverseasWeddingClient() {
  const [currency, setCurrency] = useState<"GBP" | "USD" | "AED" | "CAD" | "SAR">("GBP");
  const [guestCount, setGuestCount] = useState<number>(300);
  const [eventDays, setEventDays] = useState<number>(3); // Mehndi, Baraat, Walima

  // 2026 Realistic Exchange Rates to PKR
  const ratesToPkr = {
    GBP: 355,
    USD: 280,
    AED: 76.2,
    CAD: 205,
    SAR: 74.6,
  };

  const currentRate = ratesToPkr[currency];
  const currencySymbols = {
    GBP: "£",
    USD: "$",
    AED: "AED ",
    CAD: "CA$",
    SAR: "SAR ",
  };

  // Realistic PKR Costs for a standard 3-day wedding
  const venueCateringPkr = guestCount * 2600 * (eventDays > 2 ? 2.5 : eventDays);
  const decorLightingPkr = 450000;
  const photographyCinemaPkr = 350000;
  const bridalOutfitsJewelryPkr = 1200000;
  const transportHotelPkr = 300000;

  const totalPkr = venueCateringPkr + decorLightingPkr + photographyCinemaPkr + bridalOutfitsJewelryPkr + transportHotelPkr;
  const totalForeign = Math.round(totalPkr / currentRate);

  const shareText = `Overseas Shaadi Budget Plan (${guestCount} Guests, ${eventDays} Days):
Currency: ${currency} (1 ${currency} = ${currentRate} PKR)
🏨 Venue & Catering: ${currencySymbols[currency]}${Math.round(venueCateringPkr / currentRate).toLocaleString()} (PKR ${venueCateringPkr.toLocaleString()})
💐 Decor & Stage: ${currencySymbols[currency]}${Math.round(decorLightingPkr / currentRate).toLocaleString()} (PKR ${decorLightingPkr.toLocaleString()})
📸 Cinematography: ${currencySymbols[currency]}${Math.round(photographyCinemaPkr / currentRate).toLocaleString()} (PKR ${photographyCinemaPkr.toLocaleString()})
👗 Outfits & Gold: ${currencySymbols[currency]}${Math.round(bridalOutfitsJewelryPkr / currentRate).toLocaleString()} (PKR ${bridalOutfitsJewelryPkr.toLocaleString()})
✈️ Total Estimated Cost: ${currencySymbols[currency]}${totalForeign.toLocaleString()} (PKR ${totalPkr.toLocaleString()})

Calculate your overseas Pakistan wedding budget on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/overseas-pakistani-wedding-planner-calculator`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Overseas Wedding Planner</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 mb-3">
          <Globe2 className="h-4 w-4 text-amber-700" /> Currency-Locked Diaspora Planner
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Overseas Pakistani Wedding Cost Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Living in the UK, USA, UAE, Canada or Saudi Arabia? Budget your Pakistani wedding in foreign currency with live PKR conversions &amp; a 14-day landing schedule.
        </p>

        {/* Currency Switcher */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {(["GBP", "USD", "AED", "CAD", "SAR"] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`rounded-full px-5 py-1.5 text-xs font-semibold transition-all ${
                currency === curr ? "bg-bridal-gold text-white shadow-xs" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {currencySymbols[curr]} {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Inputs */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-bridal-charcoal mb-6">
            Event Scale &amp; Diaspora Parameters
          </h2>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-neutral-700">Estimated Guest Count</label>
              <span className="font-bold text-bridal-gold-dark text-sm">{guestCount} Guests</span>
            </div>
            <input
              type="range"
              min={100}
              max={1000}
              step={50}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-bridal-gold"
            />
            <div className="mt-2 flex justify-between text-xs text-neutral-400">
              <span>100 Guests</span>
              <span>300 Guests</span>
              <span>500 Guests</span>
              <span>1,000 Guests</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Number of Functions</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { days: 2, label: "2 Days (Nikkah + Walima)" },
                { days: 3, label: "3 Days (Mehndi, Barat, Walima)" },
                { days: 4, label: "4+ Days (Full Desi Week)" },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setEventDays(opt.days)}
                  className={`rounded-xl border p-2.5 text-center text-xs transition-all ${
                    eventDays === opt.days ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark" : "border-neutral-200 text-neutral-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200 text-xs text-neutral-600">
            <p className="font-bold text-neutral-800 mb-1">Live Conversion Anchor</p>
            <p>1 {currency} = {currentRate} PKR. All amounts automatically update across both currencies.</p>
          </div>
        </div>

        {/* Right Output */}
        <div className="flex flex-col justify-between rounded-3xl border border-bridal-gold/30 bg-gradient-to-br from-bridal-cream/60 via-white to-amber-50/20 p-6 shadow-md lg:col-span-6 sm:p-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-bridal-gold-dark">
              Estimated Total Wedding Budget
            </span>
            <div className="flex items-baseline gap-3 mt-1 mb-2">
              <h3 className="font-display text-4xl font-extrabold text-bridal-charcoal">
                {currencySymbols[currency]}{totalForeign.toLocaleString()}
              </h3>
              <span className="text-base font-semibold text-neutral-500">
                (PKR {(totalPkr / 100000).toFixed(1)} Lakhs)
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-6">
              Complete budget for {guestCount} guests across {eventDays} wedding functions in Pakistan.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center rounded-2xl bg-white p-3 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Venues &amp; One-Dish Catering</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {currencySymbols[currency]}{Math.round(venueCateringPkr / currentRate).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Stage Decor &amp; Floral Setups</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {currencySymbols[currency]}{Math.round(decorLightingPkr / currentRate).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Photography, Cinema &amp; Drone</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {currencySymbols[currency]}{Math.round(photographyCinemaPkr / currentRate).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Bridal Wear &amp; Gold Jewellery</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {currencySymbols[currency]}{Math.round(bridalOutfitsJewelryPkr / currentRate).toLocaleString()}
                </span>
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
              <Share2 className="h-4 w-4" /> Share Overseas Budget on WhatsApp
            </a>
            <Link
              href="/wedding-planners/lahore"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm hover:bg-bridal-gold-dark text-sm"
            >
              Hire Full-Service Wedding Planners in Pakistan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 14-Day Sprint Schedule */}
      <section className="mt-14 sm:mt-20 rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10">
        <h2 className="font-display text-2xl font-bold text-bridal-charcoal mb-4 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-bridal-gold" /> The 14-Day Arrival Sprint Schedule
        </h2>
        <p className="text-xs text-neutral-500 mb-6">
          For diaspora families landing in Pakistan two weeks before the first event:
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200">
            <span className="font-bold text-bridal-gold-dark block mb-1">Days 1–3: Fitting &amp; Gold</span>
            <p className="text-neutral-600">Final darzi alterations on Baraat lehenga/sherwani + collecting Sarafa bridal jewelry.</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200">
            <span className="font-bold text-bridal-gold-dark block mb-1">Days 4–7: Venue Walkthrough</span>
            <p className="text-neutral-600">Meeting marquee manager for stage dimensions, food tasting &amp; confirming AC/curfew timings.</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200">
            <span className="font-bold text-bridal-gold-dark block mb-1">Days 8–10: Home Dholki</span>
            <p className="text-neutral-600">Kickoff family dholki practice with customized tappay and booking home henna artists.</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200">
            <span className="font-bold text-bridal-gold-dark block mb-1">Days 11–14: Main Events</span>
            <p className="text-neutral-600">Mehndi night, Baraat ceremony &amp; Walima reception with smooth coordination.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
