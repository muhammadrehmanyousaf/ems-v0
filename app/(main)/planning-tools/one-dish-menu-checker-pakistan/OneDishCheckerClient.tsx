"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Utensils,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Scale,
  Plus,
  Trash2,
  Share2,
  Phone,
  Sparkles,
} from "lucide-react";

type Province = "punjab" | "ict" | "sindh" | "kpk";

interface DishItem {
  id: string;
  name: string;
  category: "salan" | "rice" | "sweet" | "bread" | "salad" | "drink" | "extra";
}

const DEFAULT_DISHES: DishItem[] = [
  { id: "1", name: "Chicken Qorma / Handi", category: "salan" },
  { id: "2", name: "Mutton Biryani", category: "rice" },
  { id: "3", name: "Gulab Jamun / Kheer", category: "sweet" },
  { id: "4", name: "Roghni Naan & Roti", category: "bread" },
  { id: "5", name: "Fresh Salad & Mint Raita", category: "salad" },
  { id: "6", name: "Cold Drinks & Mineral Water", category: "drink" },
];

export function OneDishCheckerClient() {
  const [province, setProvince] = useState<Province>("punjab");
  const [dishes, setDishes] = useState<DishItem[]>(DEFAULT_DISHES);
  const [newDishName, setNewDishName] = useState("");
  const [newDishCategory, setNewDishCategory] = useState<DishItem["category"]>("salan");
  const [copied, setCopied] = useState(false);

  // Arithmetic: count salan, sweet, and extra
  const counts = useMemo(() => {
    let salan = 0;
    let rice = 0;
    let sweet = 0;
    let extra = 0;

    for (const d of dishes) {
      if (d.category === "salan") salan++;
      else if (d.category === "rice") rice++;
      else if (d.category === "sweet") sweet++;
      else if (d.category === "extra") extra++;
    }
    return { salan, rice, sweet, extra };
  }, [dishes]);

  // Verdict calculation
  const verdict = useMemo(() => {
    if (province === "punjab" || province === "ict") {
      const isIllegalSalan = counts.salan > 1 || counts.extra > 0;
      const isIllegalSweet = counts.sweet > 1;

      if (isIllegalSalan || isIllegalSweet) {
        return {
          compliant: false,
          status: "VIOLATION DETECTED",
          color: "border-red-500 bg-red-50 text-red-900",
          badgeColor: "bg-red-600 text-white",
          message: `Your menu exceeds legal limits: ${counts.salan} main salan(s)${counts.extra > 0 ? ` + ${counts.extra} extra counter(s)` : ""} and ${counts.sweet} sweet dish(es). In ${province === "punjab" ? "Punjab" : "Islamabad ICT"}, maximum 1 meat dish and 1 sweet dish are allowed.`,
          risk: "High risk of AC Commissioner / Magistrate raid, venue sealing, and Rs. 50,000 to Rs. 2,000,000 fine under Section 8.",
        };
      }
      return {
        compliant: true,
        status: "100% LEGALLY COMPLIANT",
        color: "border-emerald-500 bg-emerald-50 text-emerald-950",
        badgeColor: "bg-emerald-700 text-white",
        message: `Your menu adheres perfectly to the Punjab Marriage Functions Act 2016 (1 Salan, 1 Rice, 1 Sweet, Bread, Salad & Beverage).`,
        risk: "Zero legal risk. Ensure dinner buffet opens by 8:30 PM to comply with the 10:00 PM lights-off curfew.",
      };
    } else if (province === "sindh") {
      return {
        compliant: true,
        status: "SINDH POLICY COMPLIANT",
        color: "border-emerald-500 bg-emerald-50 text-emerald-950",
        badgeColor: "bg-emerald-700 text-white",
        message: "In Sindh (Karachi/Hyderabad), multiple dishes are customarily permitted in registered marquees. The primary legal constraint is the strict 10:00 PM sound and light curfew.",
        risk: "Maintain compliance with local municipal curfew to avoid electrical disconnect penalties.",
      };
    } else {
      return {
        compliant: true,
        status: "KPK POLICY COMPLIANT",
        color: "border-emerald-500 bg-emerald-50 text-emerald-950",
        badgeColor: "bg-emerald-700 text-white",
        message: "KPK standard marriage guidelines permit customary hospitality. Ensure sound regulations and local district curfew limits are respected.",
        risk: "Verify banquet venue agreement on closing hours.",
      };
    }
  }, [province, counts]);

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;
    setDishes([
      ...dishes,
      {
        id: Date.now().toString(),
        name: newDishName.trim(),
        category: newDishCategory,
      },
    ]);
    setNewDishName("");
  };

  const handleRemoveDish = (id: string) => {
    setDishes(dishes.filter((d) => d.id !== id));
  };

  const handleShare = () => {
    const text = `Wedding Wala One-Dish Menu Verdict: ${verdict.status}\nMenu Items: ${dishes.map((d) => d.name).join(", ")}\nCheck your menu: https://weddingwala.pk/planning-tools/one-dish-menu-checker-pakistan`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-bridal-cream/30 py-10 sm:py-16">
      <div className="container-responsive max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-bridal-gold/40 bg-bridal-cream px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-bridal-gold-dark shadow-sm">
            <Scale className="h-3.5 w-3.5" />
            Pakistan Marriage Laws 2026
          </span>
          <h1 className="mt-3 font-display text-[32px] italic text-bridal-charcoal sm:text-[42px]">
            One-Dish Law &amp; Wedding Menu Checker
          </h1>
          <p className="mx-auto mt-3 max-w-2xl font-bridal text-[15px] leading-relaxed text-bridal-text">
            Avoid venue sealing, police raids, and up to Rs 2,000,000 in fines under the{" "}
            <strong>Punjab Marriage Functions Act 2016</strong>. Audit your Barat, Walima, or Mehndi menu in seconds.
          </p>
        </div>

        {/* Province Selection */}
        <div className="mb-6 rounded-2xl border border-bridal-beige bg-white p-5 shadow-sm">
          <p className="font-bridal text-[11px] font-semibold uppercase tracking-wider text-bridal-gold-dark mb-3">
            Step 1: Select Event Jurisdiction
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: "punjab", label: "Punjab (Lahore, Rwp, Fsd)", note: "Strict One-Dish Rule" },
              { id: "ict", label: "Islamabad (ICT)", note: "DC ICT Enforced" },
              { id: "sindh", label: "Sindh (Karachi, Hyd)", note: "10 PM Curfew Focus" },
              { id: "kpk", label: "KPK (Peshawar)", note: "Customary Policy" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvince(p.id as Province)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  province === p.id
                    ? "border-bridal-gold bg-bridal-cream/60 ring-2 ring-bridal-gold/30"
                    : "border-bridal-beige/80 bg-bridal-cream/20 hover:border-bridal-gold/50"
                }`}
              >
                <p className="font-bridal text-[13px] font-semibold text-bridal-charcoal">{p.label}</p>
                <p className="font-bridal text-[11px] text-bridal-text-soft mt-0.5">{p.note}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Verdict Banner */}
        <div className={`mb-6 rounded-2xl border-2 p-6 shadow-md transition-all ${verdict.color}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/90 shadow-sm">
                {verdict.compliant ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </span>
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${verdict.badgeColor}`}>
                  {verdict.status}
                </span>
                <p className="mt-2 font-bridal text-[14.5px] font-medium leading-relaxed">
                  {verdict.message}
                </p>
                <p className="mt-1 font-bridal text-[12.5px] opacity-85">
                  <strong>Legal Risk Assessment:</strong> {verdict.risk}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-full border border-bridal-charcoal/20 bg-white px-4 py-2 text-[12.5px] font-semibold text-bridal-charcoal shadow-sm hover:bg-bridal-cream transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Share Verdict"}
            </button>
          </div>
        </div>

        {/* Current Menu Table & Editor */}
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] mb-8">
          {/* Dishes List */}
          <div className="rounded-2xl border border-bridal-beige bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-bridal-beige">
              <div>
                <h3 className="font-display italic text-[18px] text-bridal-charcoal">
                  Your Event Menu ({dishes.length} Items)
                </h3>
                <p className="font-bridal text-[11.5px] text-bridal-text-soft">
                  Salan: {counts.salan} | Rice: {counts.rice} | Sweet: {counts.sweet} | Extra: {counts.extra}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center justify-between rounded-xl border border-bridal-beige/70 bg-bridal-cream/20 px-3.5 py-2.5 transition-all hover:bg-bridal-cream/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bridal text-[13.5px] font-semibold text-bridal-charcoal truncate">
                      {dish.name}
                    </p>
                    <span className="font-bridal text-[11px] uppercase tracking-wider text-bridal-text-label">
                      {dish.category === "salan"
                        ? "Main Salan (Counted)"
                        : dish.category === "sweet"
                        ? "Sweet Dish (Counted)"
                        : dish.category === "extra"
                        ? "Extra Counter (Illegal in Punjab)"
                        : dish.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDish(dish.id)}
                    className="p-1.5 text-bridal-text-soft hover:text-red-600 transition-colors"
                    aria-label={`Remove ${dish.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Dish Box */}
          <div className="rounded-2xl border border-bridal-beige bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-display italic text-[18px] text-bridal-charcoal mb-3">
                Add Menu Item
              </h3>
              <form onSubmit={handleAddDish} className="space-y-3.5">
                <div>
                  <label className="font-bridal text-[11px] uppercase tracking-wider font-semibold text-bridal-text-label block mb-1">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    placeholder="e.g. Mutton Kunna or Live BBQ"
                    className="w-full rounded-xl border border-bridal-beige bg-bridal-cream/20 px-3.5 py-2 font-bridal text-[13.5px] focus:border-bridal-gold focus:outline-none focus:ring-1 focus:ring-bridal-gold"
                  />
                </div>

                <div>
                  <label className="font-bridal text-[11px] uppercase tracking-wider font-semibold text-bridal-text-label block mb-1">
                    Rule Category
                  </label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value as DishItem["category"])}
                    className="w-full rounded-xl border border-bridal-beige bg-bridal-cream/20 px-3 py-2 font-bridal text-[13px] focus:border-bridal-gold focus:outline-none focus:ring-1 focus:ring-bridal-gold"
                  >
                    <option value="salan">Main Meat Salan (Capped at 1)</option>
                    <option value="sweet">Sweet Dish / Dessert (Capped at 1)</option>
                    <option value="rice">Rice (Biryani / Pulao)</option>
                    <option value="bread">Bread (Roti / Naan)</option>
                    <option value="salad">Salad / Raita</option>
                    <option value="drink">Beverage (Cold / Hot)</option>
                    <option value="extra">Live BBQ / Sajji / Extra Counter</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-bridal-gold py-2.5 font-bridal text-[13px] font-semibold text-white shadow-sm hover:bg-bridal-gold-dark transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add to Menu
                </button>
              </form>
            </div>

            {/* Help callout */}
            <div className="mt-5 rounded-xl border border-bridal-gold/30 bg-bridal-cream/60 p-3 text-center">
              <p className="font-bridal text-[11.5px] text-bridal-charcoal leading-relaxed">
                Need help coordinating a 100% legal catering package?
              </p>
              <a
                href="https://wa.me/923274811220?text=Hi%20Wedding%20Wala%2C%20I%20need%20help%20with%20One-Dish%20catering%20compliance"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 font-bridal text-[12px] font-bold text-emerald-800 hover:underline"
              >
                <Phone className="h-3 w-3" />
                Contact Booking Concierge (+92 327 4811220)
              </a>
            </div>
          </div>
        </div>

        {/* Law FAQ & Legal Benchmarks */}
        <div className="rounded-2xl border border-bridal-beige bg-white p-6 shadow-sm">
          <h2 className="font-display italic text-[22px] text-bridal-charcoal mb-4">
            Punjab Marriage Functions Act 2016 Essentials
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <div className="rounded-xl border border-bridal-beige/80 bg-bridal-cream/20 p-4">
              <p className="font-bridal text-[12.5px] font-bold text-bridal-charcoal">
                1 Meat + 1 Rice + 1 Sweet
              </p>
              <p className="mt-1.5 font-bridal text-[12px] text-bridal-text-soft leading-normal">
                Section 4 explicitly limits the feast to one main salan, one rice preparation, and one sweet dish. Roti, naan, salad, raita, and drinks are unconstrained.
              </p>
            </div>

            <div className="rounded-xl border border-bridal-beige/80 bg-bridal-cream/20 p-4">
              <p className="font-bridal text-[12.5px] font-bold text-bridal-charcoal">
                10:00 PM Sharp Curfew
              </p>
              <p className="mt-1.5 font-bridal text-[12px] text-bridal-text-soft leading-normal">
                Section 3 mandates all marriage functions must conclude by 10:00 PM. Venue staff are instructed to turn off main lights and generator ACs promptly.
              </p>
            </div>

            <div className="rounded-xl border border-bridal-beige/80 bg-bridal-cream/20 p-4">
              <p className="font-bridal text-[12.5px] font-bold text-bridal-charcoal">
                Heavy Penalties (Section 8)
              </p>
              <p className="mt-1.5 font-bridal text-[12px] text-bridal-text-soft leading-normal">
                Violators face fines up to PKR 2,000,000, temporary venue sealing, and seizure of non-compliant food items by municipal food authorities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
