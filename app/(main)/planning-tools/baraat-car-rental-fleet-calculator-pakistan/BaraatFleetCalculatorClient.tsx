"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Car, Sparkles, Share2, Fuel, Users, ArrowRight, CheckCircle2 } from "lucide-react";

export function BaraatFleetCalculatorClient() {
  const [totalBaraatis, setTotalBaraatis] = useState(120);
  const [ownCars, setOwnCars] = useState(4); // 4 people per car
  const [routeKm, setRouteKm] = useState(40); // local vs out of city
  const [groomCar, setGroomCar] = useState<"audi" | "v8" | "prado" | "vintage" | "civic">("audi");
  const [includeFloralDecor, setIncludeFloralDecor] = useState(true);

  // Calculations
  const peopleInOwnCars = ownCars * 4;
  const remainingPeople = Math.max(0, totalBaraatis - peopleInOwnCars);
  // 1 coaster = 26 seated comfortably
  const coastersNeeded = Math.ceil(remainingPeople / 26);

  const groomCarRates = {
    audi: 32000,
    v8: 50000,
    prado: 32000,
    vintage: 45000,
    civic: 14000,
  };

  const coasterRate = routeKm > 100 ? 38000 : 22000;
  const totalCoasterRent = coastersNeeded * coasterRate;
  const groomCarRent = groomCarRates[groomCar];
  const floralDecorCost = includeFloralDecor ? 6500 : 0;

  // Approx fuel: Coasters (4 km/L diesel @ 280/L) + Groom Car (8 km/L petrol @ 280/L)
  const dieselPerKmCoasters = (280 / 4) * coastersNeeded;
  const petrolPerKmCar = 280 / 8;
  const estimatedFuelCost = Math.round(routeKm * (dieselPerKmCoasters + petrolPerKmCar));

  const totalTransportCost = totalCoasterRent + groomCarRent + floralDecorCost + estimatedFuelCost;

  const shareText = `Baraat Transport Fleet Calculation (${totalBaraatis} Baraatis, ${routeKm} KM):
🚌 28-Seater AC Coasters: ${coastersNeeded} (${totalCoasterRent.toLocaleString()} PKR)
🚗 Groom Car: ${groomCar.toUpperCase()} (${groomCarRent.toLocaleString()} PKR)
💐 Fresh Bonnet Floral Decor: PKR ${floralDecorCost.toLocaleString()}
⛽ Estimated Fuel Cost: PKR ${estimatedFuelCost.toLocaleString()}
💰 Total Fleet Budget: PKR ${totalTransportCost.toLocaleString()}

Calculate your wedding convoy on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/baraat-car-rental-fleet-calculator-pakistan`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Baraat Car &amp; Fleet Calculator</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-bridal-cream px-3 py-1 text-xs font-semibold text-bridal-gold-dark mb-3">
          <Sparkles className="h-4 w-4" /> 2026 Wedding Convoy &amp; Rent-a-Car Math
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Baraat Car Rental, Coaster &amp; Fuel Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Calculate how many 28-seater Toyota Coasters you need for your Baraat, groom luxury car rental rates, fresh flower decor, and motorway fuel in PKR.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Inputs */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal mb-6">
            <Car className="h-5 w-5 text-bridal-gold" /> Convoy Logistics
          </h2>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-neutral-700">Total Baraatis Traveling</label>
              <span className="font-bold text-bridal-gold-dark text-sm">{totalBaraatis} People</span>
            </div>
            <input
              type="range"
              min={20}
              max={350}
              step={10}
              value={totalBaraatis}
              onChange={(e) => setTotalBaraatis(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-bridal-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Own Family Cars</label>
              <input
                type="number"
                min={0}
                max={20}
                value={ownCars}
                onChange={(e) => setOwnCars(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              />
              <span className="text-[10px] text-neutral-400">Accommodates {peopleInOwnCars} people</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Roundtrip Distance (KM)</label>
              <input
                type="number"
                min={5}
                max={600}
                value={routeKm}
                onChange={(e) => setRouteKm(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              />
              <span className="text-[10px] text-neutral-400">{routeKm > 100 ? "Motorway / Inter-city" : "Local City"}</span>
            </div>
          </div>

          {/* Groom Car Selection */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">Groom Entry Vehicle</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setGroomCar("audi")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  groomCar === "audi" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark" : "border-neutral-200 text-neutral-600"
                }`}
              >
                Audi A6 / Mercedes E
              </button>
              <button
                type="button"
                onClick={() => setGroomCar("v8")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  groomCar === "v8" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark" : "border-neutral-200 text-neutral-600"
                }`}
              >
                Land Cruiser V8 ZX
              </button>
              <button
                type="button"
                onClick={() => setGroomCar("prado")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  groomCar === "prado" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark" : "border-neutral-200 text-neutral-600"
                }`}
              >
                Prado TXL
              </button>
              <button
                type="button"
                onClick={() => setGroomCar("vintage")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  groomCar === "vintage" ? "border-bridal-gold bg-bridal-gold/5 font-semibold text-bridal-gold-dark" : "border-neutral-200 text-neutral-600"
                }`}
              >
                Vintage Classic Car
              </button>
            </div>
          </div>

          {/* Floral Decor Toggle */}
          <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs cursor-pointer">
            <div>
              <p className="font-semibold text-neutral-800">Fresh Flower Bonnet &amp; Ribbon Decor</p>
              <p className="text-[10px] text-neutral-500">Fresh red roses, gypsophila &amp; satin ribbon design</p>
            </div>
            <input
              type="checkbox"
              checked={includeFloralDecor}
              onChange={(e) => setIncludeFloralDecor(e.target.checked)}
              className="h-4 w-4 rounded text-bridal-gold accent-bridal-gold"
            />
          </label>
        </div>

        {/* Right Output */}
        <div className="flex flex-col justify-between rounded-3xl border border-bridal-gold/30 bg-gradient-to-br from-bridal-cream/60 via-white to-neutral-50 p-6 shadow-md lg:col-span-6 sm:p-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-bridal-gold-dark">
              Total Transport Fleet Budget
            </span>
            <h3 className="font-display text-4xl font-extrabold text-bridal-charcoal mt-1 mb-6">
              PKR {totalTransportCost.toLocaleString()}
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">28-Seater AC Toyota Coasters Needed</span>
                <span className="text-sm font-bold text-neutral-900">{coastersNeeded} Buses</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Coaster Rental (12 Hours)</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {totalCoasterRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Groom Luxury Car Rental</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {groomCarRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Car Flower Decoration</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {floralDecorCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <span className="text-xs text-neutral-600">Estimated Fuel &amp; Motorway Tolls</span>
                <span className="text-sm font-semibold text-neutral-900">PKR {estimatedFuelCost.toLocaleString()}</span>
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
              <Share2 className="h-4 w-4" /> Share Baraat Fleet Plan on WhatsApp
            </a>
            <Link
              href="/wedding-cars/lahore"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm hover:bg-bridal-gold-dark text-sm"
            >
              Rent Groom Luxury Cars &amp; Coasters <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
