"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Share2, Mail, CheckCircle2, ArrowRight, Heart } from "lucide-react";

export function WhatsappCardMakerClient() {
  const [theme, setTheme] = useState<"gold" | "rose" | "marigold" | "nikkah">("gold");
  const [parentsInviting, setParentsInviting] = useState("Mr. & Mrs. Tariq Mahmood");
  const [brideName, setBrideName] = useState("Ayesha");
  const [groomName, setGroomName] = useState("Hamza");
  const [eventFunction, setEventFunction] = useState("Baraat Ceremony");
  const [eventDate, setEventDate] = useState("Sunday, 22nd November 2026");
  const [eventTime, setEventTime] = useState("7:30 PM (Dinner strictly at 8:30 PM)");
  const [venueName, setVenueName] = useState("Royal Palm Golf & Country Club, Lahore");
  const [rsvpContact, setRsvpContact] = useState("0321-1234567 / 0300-7654321");
  const [noBoxedGifts, setNoBoxedGifts] = useState(true);
  const [femaleOnlyPhoto, setFemaleOnlyPhoto] = useState(true);
  const [oneDishTiming, setOneDishTiming] = useState(true);

  // Theme styling definitions
  const themeStyles = {
    gold: {
      bg: "bg-gradient-to-b from-[#2A2318] via-[#1E1911] to-[#120F0A]",
      border: "border-amber-400/50",
      accent: "text-amber-300",
      titleColor: "text-amber-100",
      textColor: "text-amber-200/90",
      headerUrdu: "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ",
    },
    rose: {
      bg: "bg-gradient-to-b from-[#331C24] via-[#241319] to-[#140A0D]",
      border: "border-rose-300/40",
      accent: "text-rose-300",
      titleColor: "text-rose-100",
      textColor: "text-rose-200/90",
      headerUrdu: "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ",
    },
    marigold: {
      bg: "bg-gradient-to-b from-[#2E200B] via-[#1F1506] to-[#100B02]",
      border: "border-yellow-400/60",
      accent: "text-yellow-300",
      titleColor: "text-yellow-100",
      textColor: "text-yellow-200/90",
      headerUrdu: "شادی مبارک",
    },
    nikkah: {
      bg: "bg-gradient-to-b from-[#10241E] via-[#0A1713] to-[#040A08]",
      border: "border-emerald-400/50",
      accent: "text-emerald-300",
      titleColor: "text-emerald-100",
      textColor: "text-emerald-200/90",
      headerUrdu: "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ",
    },
  };

  const currentTheme = themeStyles[theme];

  const shareText = `✨ *Wedding Invitation* ✨
بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ

${parentsInviting}
cordially invite you and your family to celebrate the ${eventFunction} of their beloved daughter & son:

💍 *${brideName} & ${groomName}* 💍

📅 *Date:* ${eventDate}
⏰ *Time:* ${eventTime}
📍 *Venue:* ${venueName}
📞 *R.S.V.P:* ${rsvpContact}

${noBoxedGifts ? "🚫 *No Boxed Gifts* — Only your heartfelt prayers.\n" : ""}${femaleOnlyPhoto ? "📵 *Female-Only Photography* strictly observed inside ladies hall.\n" : ""}${oneDishTiming ? "🕰️ *Dinner will be served promptly at 8:30 PM* per One-Dish regulations.\n" : ""}
We look forward to welcoming you!

Design your free Pakistani wedding card on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/whatsapp-wedding-card-maker-pakistan`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">WhatsApp Wedding Card Maker</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-bridal-cream px-3 py-1 text-xs font-semibold text-bridal-gold-dark mb-3">
          <Sparkles className="h-4 w-4" /> 100% Free Instant E-Invite
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Pakistani WhatsApp Wedding Card Maker
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Create elegant digital wedding invitations for Nikkah, Mehndi, Baraat & Walima with Bismillah calligraphy, One-Dish timings, and instant WhatsApp sharing.
        </p>

        {/* Theme Picker */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setTheme("gold")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              theme === "gold" ? "bg-amber-600 text-white shadow-xs" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            👑 Royal Mughal Gold
          </button>
          <button
            onClick={() => setTheme("rose")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              theme === "rose" ? "bg-rose-700 text-white shadow-xs" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            🌸 Pastel Rose (Walima)
          </button>
          <button
            onClick={() => setTheme("marigold")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              theme === "marigold" ? "bg-yellow-600 text-white shadow-xs" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            🌼 Vibrant Marigold (Mehndi)
          </button>
          <button
            onClick={() => setTheme("nikkah")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              theme === "nikkah" ? "bg-emerald-700 text-white shadow-xs" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            🌙 Emerald Minimalist (Nikkah)
          </button>
        </div>
      </div>

      {/* Builder Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Form */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-bridal-charcoal mb-6">
            <Mail className="h-5 w-5 text-bridal-gold" /> Invitation Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Host / Parents Inviting</label>
              <input
                type="text"
                value={parentsInviting}
                onChange={(e) => setParentsInviting(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Bride&apos;s Name</label>
                <input
                  type="text"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Groom&apos;s Name</label>
                <input
                  type="text"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Wedding Event</label>
              <select
                value={eventFunction}
                onChange={(e) => setEventFunction(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              >
                <option value="Baraat Ceremony">Baraat Ceremony & Dinner</option>
                <option value="Walima Reception">Walima Reception</option>
                <option value="Nikkah Ceremony">Nikkah Ceremony</option>
                <option value="Mehndi & Mayun Night">Mehndi & Sangeet Night</option>
                <option value="Baat Pakki / Engagement">Baat Pakki / Engagement</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Date</label>
                <input
                  type="text"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Time & Dinner</label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Venue & City</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">RSVP Contact</label>
              <input
                type="text"
                value={rsvpContact}
                onChange={(e) => setRsvpContact(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
              />
            </div>

            {/* Desi Etiquette Toggles */}
            <div className="border-t border-neutral-100 pt-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                Polite Pakistani Etiquette Badges
              </span>
              <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noBoxedGifts}
                  onChange={(e) => setNoBoxedGifts(e.target.checked)}
                  className="rounded text-bridal-gold accent-bridal-gold"
                />
                <span>🚫 No Boxed Gifts (Prayers Only)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={femaleOnlyPhoto}
                  onChange={(e) => setFemaleOnlyPhoto(e.target.checked)}
                  className="rounded text-bridal-gold accent-bridal-gold"
                />
                <span>📵 Female-Only Photography Inside Ladies Hall</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oneDishTiming}
                  onChange={(e) => setOneDishTiming(e.target.checked)}
                  className="rounded text-bridal-gold accent-bridal-gold"
                />
                <span>🕰️ Dinner Served Promptly at 8:30 PM (One-Dish Timings)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Live Card Preview */}
        <div className="flex flex-col justify-between lg:col-span-6">
          <div
            className={`rounded-3xl border-2 p-8 shadow-2xl transition-all ${currentTheme.bg} ${currentTheme.border} text-center flex flex-col justify-between min-h-[500px]`}
          >
            <div>
              <p className={`font-serif text-lg tracking-widest ${currentTheme.accent} mb-4`}>
                {currentTheme.headerUrdu}
              </p>
              <p className={`text-xs uppercase tracking-widest ${currentTheme.textColor} mb-3`}>
                {parentsInviting}
              </p>
              <p className="text-[11px] text-neutral-400 italic mb-4">
                cordially request the honor of your company to celebrate the {eventFunction} of
              </p>
              <h3 className={`font-display text-3xl font-extrabold sm:text-4xl ${currentTheme.titleColor} mb-4`}>
                {brideName} <span className={currentTheme.accent}>&amp;</span> {groomName}
              </h3>
              <div className="my-4 h-px w-24 mx-auto bg-neutral-600/50" />
              <p className={`text-xs font-semibold ${currentTheme.titleColor}`}>{eventDate}</p>
              <p className={`text-[11px] ${currentTheme.textColor} mt-1`}>{eventTime}</p>
              <p className={`text-xs font-medium ${currentTheme.titleColor} mt-3`}>{venueName}</p>
            </div>

            <div className="pt-6 border-t border-neutral-700/40 mt-6">
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {noBoxedGifts && (
                  <span className="rounded-full bg-black/40 border border-neutral-700 px-2.5 py-0.5 text-[10px] text-neutral-300">
                    🚫 No Boxed Gifts
                  </span>
                )}
                {femaleOnlyPhoto && (
                  <span className="rounded-full bg-black/40 border border-neutral-700 px-2.5 py-0.5 text-[10px] text-neutral-300">
                    📵 Female-Only Photo
                  </span>
                )}
                {oneDishTiming && (
                  <span className="rounded-full bg-black/40 border border-neutral-700 px-2.5 py-0.5 text-[10px] text-neutral-300">
                    🕰️ 8:30 PM Dinner
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                R.S.V.P: {rsvpContact}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
            >
              <Share2 className="h-4 w-4" /> Share Invitation Card on WhatsApp
            </a>
            <Link
              href="/wedding-stationery/lahore"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-bridal-gold-dark"
            >
              Order Luxury Printed Cards & Nikkah Frames <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
