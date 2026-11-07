"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, Share2, Plus, Trash2, ArrowRight, CheckCircle2, Gift } from "lucide-react";

interface SalamiEntry {
  id: string;
  name: string;
  side: "Nankay" | "Dadkay" | "In-Laws" | "Friends & Office";
  receivedPkr: number;
  previousPkr: number;
}

interface BariCategory {
  title: string;
  items: { name: string; checked: boolean }[];
}

export function SalamiBariTrackerClient() {
  const [activeTab, setActiveTab] = useState<"salami" | "bari">("salami");

  // Mode 1: Salami Ledger State
  const [entries, setEntries] = useState<SalamiEntry[]>([
    { id: "1", name: "Mamoo Aslam (Karachi)", side: "Nankay", receivedPkr: 25000, previousPkr: 20000 },
    { id: "2", name: "Chacha Tariq (Lahore)", side: "Dadkay", receivedPkr: 50000, previousPkr: 35000 },
    { id: "3", name: "Phuppo Shazia (Islamabad)", side: "Dadkay", receivedPkr: 30000, previousPkr: 25000 },
    { id: "4", name: "Khala Nasreen (Multan)", side: "Nankay", receivedPkr: 20000, previousPkr: 15000 },
  ]);

  const [newName, setNewName] = useState("");
  const [newSide, setNewSide] = useState<SalamiEntry["side"]>("Nankay");
  const [newReceived, setNewReceived] = useState<number>(10000);
  const [newPrevious, setNewPrevious] = useState<number>(10000);

  // Mode 2: Bari Checklist State
  const [bariCategories, setBariCategories] = useState<BariCategory[]>([
    {
      title: "Bridal Outfits & Heavy Formals",
      items: [
        { name: "1x Reception / Walima Bridal Outfit", checked: true },
        { name: "3x Heavy Zardozi / Chiffon Formal Suits", checked: true },
        { name: "5x Semi-Formal Georgette / Silk Suits", checked: false },
        { name: "7x Daily-Wear Lawn / Cotton Stitched Suits", checked: false },
        { name: "1x Velvet Shawl / Embroidered Chaddar", checked: true },
      ],
    },
    {
      title: "Footwear & Accessories",
      items: [
        { name: "2x Traditional Bridal Khussas", checked: true },
        { name: "3x Formal Party Heels / Wedges", checked: false },
        { name: "2x Luxury Clutches / Potli Bags", checked: true },
        { name: "1x Everyday Leather Handbag", checked: false },
      ],
    },
    {
      title: "Vanity, Perfumes & Gift Boxes",
      items: [
        { name: "Bridal Perfume & Oud Hamper", checked: true },
        { name: "Complete Makeup Box / Vanity Case", checked: false },
        { name: "Acrylic Packing Trays & Net Ribbon Wraps", checked: true },
        { name: "Gift Suits for Bride's Parents & Siblings", checked: false },
      ],
    },
  ]);

  const addSalamiEntry = () => {
    if (!newName.trim()) return;
    const newEntry: SalamiEntry = {
      id: Date.now().toString(),
      name: newName,
      side: newSide,
      receivedPkr: Number(newReceived) || 0,
      previousPkr: Number(newPrevious) || 0,
    };
    setEntries([...entries, newEntry]);
    setNewName("");
    setNewReceived(10000);
    setNewPrevious(10000);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const toggleBariItem = (catIdx: number, itemIdx: number) => {
    const updated = [...bariCategories];
    updated[catIdx].items[itemIdx].checked = !updated[catIdx].items[itemIdx].checked;
    setBariCategories(updated);
  };

  // Calculations
  const totalSalamiReceived = entries.reduce((acc, curr) => acc + curr.receivedPkr, 0);
  const totalSalamiSuggestedReturn = entries.reduce(
    (acc, curr) => acc + Math.round(curr.receivedPkr * 1.25),
    0
  );

  const totalBariItems = bariCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedBariItems = bariCategories.reduce(
    (acc, cat) => acc + cat.items.filter((i) => i.checked).length,
    0
  );

  const shareText =
    activeTab === "salami"
      ? `Shaadi Salami (Neundra) Register Summary:
Total Cash Envelopes Recorded: ${entries.length} relatives
Total Salami Cash Collected: PKR ${totalSalamiReceived.toLocaleString()}
Recommended Next-Wedding Return Reserve (+25% Inflation): PKR ${totalSalamiSuggestedReturn.toLocaleString()}

Track your family's Salami on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/salami-bari-trousseau-tracker-pakistan`
      : `Bridal Bari Checklist Progress:
Completed Items: ${checkedBariItems} of ${totalBariItems} (${Math.round((checkedBariItems / totalBariItems) * 100)}%)
Outfits, Khussas & Vanity Hampers checked!

Plan your Bridal Bari packing on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/salami-bari-trousseau-tracker-pakistan`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Salami & Bari Tracker</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-bridal-cream px-3 py-1 text-xs font-semibold text-bridal-gold-dark mb-3">
          <Sparkles className="h-4 w-4" /> Traditional Pakistani Family Customs
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Digital Salami (Neundra) & Bridal Bari Tracker
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Digitize your family&apos;s cash envelope register so you never forget who gave what, and track your bridal Bari trousseau packing checklist.
        </p>

        {/* Tab Switcher */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1">
            <button
              onClick={() => setActiveTab("salami")}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                activeTab === "salami"
                  ? "bg-white text-bridal-charcoal shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              ✉️ Digital Salami Register
            </button>
            <button
              onClick={() => setActiveTab("bari")}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                activeTab === "bari"
                  ? "bg-white text-bridal-charcoal shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              🎁 Bridal Bari Packing Checklist
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SALAMI LEDGER */}
      {activeTab === "salami" && (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Salami Table */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-8 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal">
                <BookOpen className="h-5 w-5 text-bridal-gold" /> Relatives Cash Envelope Register
              </h2>
              <span className="text-xs text-neutral-500">{entries.length} Entries Recorded</span>
            </div>

            {/* Quick Add Row */}
            <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 block mb-2">
                + Add Cash Envelope
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <input
                  type="text"
                  placeholder="Relative Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border border-neutral-300 p-2 text-xs focus:border-bridal-gold focus:outline-none"
                />
                <select
                  value={newSide}
                  onChange={(e) => setNewSide(e.target.value as any)}
                  className="rounded-xl border border-neutral-300 p-2 text-xs focus:border-bridal-gold focus:outline-none"
                >
                  <option value="Nankay">Nankay (Maternal)</option>
                  <option value="Dadkay">Dadkay (Paternal)</option>
                  <option value="In-Laws">In-Laws Side</option>
                  <option value="Friends & Office">Friends & Office</option>
                </select>
                <input
                  type="number"
                  placeholder="Received PKR"
                  value={newReceived}
                  onChange={(e) => setNewReceived(Number(e.target.value))}
                  className="rounded-xl border border-neutral-300 p-2 text-xs focus:border-bridal-gold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSalamiEntry}
                  className="flex items-center justify-center gap-1 rounded-xl bg-bridal-gold py-2 text-xs font-semibold text-white hover:bg-bridal-gold-dark"
                >
                  <Plus className="h-4 w-4" /> Add Row
                </button>
              </div>
            </div>

            {/* Entries Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="bg-neutral-100/70 uppercase text-[10px] tracking-wider text-neutral-500">
                  <tr>
                    <th className="p-3">Relative</th>
                    <th className="p-3">Side</th>
                    <th className="p-3">Received Salami</th>
                    <th className="p-3">Suggested Return (+25%)</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {entries.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="p-3 font-semibold text-neutral-800">{item.name}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-neutral-200/70 px-2 py-0.5 text-[10px] text-neutral-700">
                          {item.side}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-700">PKR {item.receivedPkr.toLocaleString()}</td>
                      <td className="p-3 font-medium text-neutral-600">
                        PKR {Math.round(item.receivedPkr * 1.25).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeEntry(item.id)}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Salami Summary Sidebar */}
          <div className="flex flex-col justify-between rounded-3xl border border-bridal-gold/30 bg-gradient-to-br from-bridal-cream/60 via-white to-bridal-blush/30 p-6 shadow-md lg:col-span-4 sm:p-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-bridal-gold-dark">
                Total Salami Collected
              </span>
              <h3 className="font-display text-3xl font-bold text-bridal-charcoal mt-1 mb-6">
                PKR {totalSalamiReceived.toLocaleString()}
              </h3>

              <div className="space-y-4 mb-6">
                <div className="rounded-2xl bg-white p-4 border border-neutral-200/80">
                  <span className="text-xs text-neutral-500">Return Envelope Reserve (+25%)</span>
                  <p className="font-display text-xl font-bold text-bridal-gold-dark mt-1">
                    PKR {totalSalamiSuggestedReturn.toLocaleString()}
                  </p>
                  <span className="text-[11px] text-neutral-400">Budget needed for returning cash gifts</span>
                </div>
                <div className="rounded-2xl bg-white p-4 border border-neutral-200/80">
                  <span className="text-xs text-neutral-500">Why +25% Inflation Rule?</span>
                  <p className="text-xs text-neutral-600 mt-1">
                    In Pakistani tradition, returning the exact same amount years later is considered ungenerous. Standard custom is returning +20% to +30%.
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
                <Share2 className="h-4 w-4" /> Share Register on WhatsApp
              </a>
              <Link
                href="/wedding-mithai/lahore"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-bridal-gold-dark"
              >
                Order Custom Bid & Mithai Boxes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BARI CHECKLIST */}
      {activeTab === "bari" && (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Checklist Categories */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-8 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal">
                <Gift className="h-5 w-5 text-bridal-gold" /> Traditional Bridal Bari Checklist
              </h2>
              <span className="rounded-full bg-bridal-gold/10 px-3 py-1 text-xs font-bold text-bridal-gold-dark">
                {checkedBariItems} / {totalBariItems} Ready
              </span>
            </div>

            <div className="space-y-6">
              {bariCategories.map((cat, catIdx) => (
                <div key={cat.title} className="rounded-2xl border border-neutral-200 p-5">
                  <h3 className="font-display text-base font-bold text-bridal-charcoal mb-3">
                    {cat.title}
                  </h3>
                  <div className="space-y-2">
                    {cat.items.map((item, itemIdx) => (
                      <label
                        key={item.name}
                        className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-neutral-50 text-sm text-neutral-700"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleBariItem(catIdx, itemIdx)}
                          className="h-4 w-4 rounded border-neutral-300 text-bridal-gold accent-bridal-gold"
                        />
                        <span className={item.checked ? "line-through text-neutral-400" : ""}>
                          {item.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bari Progress Sidebar */}
          <div className="flex flex-col justify-between rounded-3xl border border-bridal-gold/30 bg-gradient-to-br from-bridal-cream/60 via-white to-bridal-blush/30 p-6 shadow-md lg:col-span-4 sm:p-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-bridal-gold-dark">
                Bari Packing Progress
              </span>
              <h3 className="font-display text-3xl font-bold text-bridal-charcoal mt-1 mb-2">
                {Math.round((checkedBariItems / totalBariItems) * 100)}% Complete
              </h3>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 mb-6">
                <div
                  className="h-full bg-bridal-gold transition-all duration-300"
                  style={{ width: `${(checkedBariItems / totalBariItems) * 100}%` }}
                />
              </div>

              <div className="rounded-2xl bg-white p-4 border border-neutral-200/80 mb-6">
                <h4 className="text-xs font-bold uppercase text-neutral-600 mb-2">Pakistani Bari Etiquette</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Traditional Bari from the groom’s family includes odd-numbered suits (7, 11, or 21), presented in glass or acrylic trays with net ribbons and artificial flower adornments.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
              >
                <Share2 className="h-4 w-4" /> Share Bari Progress on WhatsApp
              </a>
              <Link
                href="/bridal-wear/lahore"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-bridal-gold-dark"
              >
                Shop Bridal Outfits & Lehengas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
