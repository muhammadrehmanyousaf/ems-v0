"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Share2, Camera, Building2, Music, Home, ArrowRight, CheckCircle2 } from "lucide-react";
import { CITIES } from "@/lib/seo/constants";

export function SegregatedWeddingClient() {
  const [selectedCity, setSelectedCity] = useState("lahore");
  const [reqFemalePhoto, setReqFemalePhoto] = useState(true);
  const [reqSegregatedHalls, setReqSegregatedHalls] = useState(true);
  const [reqMahramSafe, setReqMahramSafe] = useState(true);
  const [reqNoMusic, setReqNoMusic] = useState(false);
  const [reqHomeService, setReqHomeService] = useState(true);

  const cityName = CITIES.find((c) => c.slug === selectedCity)?.name || "Pakistan";

  const activeReqCount = [
    reqFemalePhoto,
    reqSegregatedHalls,
    reqMahramSafe,
    reqNoMusic,
    reqHomeService,
  ].filter(Boolean).length;

  const shareText = `Halal & Segregated Shaadi Checklist for ${cityName}:
✅ 100% Female Photography Team (Strict NDA): ${reqFemalePhoto ? "Yes" : "No"}
✅ Segregated Ladies & Gents Halls: ${reqSegregatedHalls ? "Yes" : "No"}
✅ Mahram-Safe Private Shoot: ${reqMahramSafe ? "Yes" : "No"}
✅ No-Music / Duff-Only Nikkah Setup: ${reqNoMusic ? "Yes" : "No"}
✅ Home-Service Bridal Makeup & Henna: ${reqHomeService ? "Yes" : "No"}

Find verified Halal & Segregated vendors on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/segregated-islamic-wedding-planner-pakistan`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Segregated & Halal Wedding Finder</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800 mb-3">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> 100% Privacy & Shariah-Conscious
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Segregated &amp; Female-Staff Wedding Finder
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Filter verified 100% female photography crews, separate ladies/gents banquet halls, and home-service bridal makeup for a dignified, Mahram-safe wedding in Pakistan.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Quiz Form */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-bridal-charcoal mb-4">
            Select Your Privacy &amp; Religious Requirements
          </h2>

          <div className="mb-5">
            <label className="text-xs font-semibold text-neutral-700 block mb-1">Target City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 p-3 text-sm focus:border-bridal-gold focus:outline-none"
            >
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {/* Req 1 */}
            <label
              onClick={() => setReqFemalePhoto(!reqFemalePhoto)}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                reqFemalePhoto ? "border-emerald-500 bg-emerald-50/40 shadow-xs" : "border-neutral-200"
              }`}
            >
              <input
                type="checkbox"
                checked={reqFemalePhoto}
                onChange={() => {}}
                className="mt-1 h-4 w-4 rounded text-emerald-600 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-800">100% Female Photography Team</p>
                <p className="text-xs text-neutral-500">
                  Female main shooters, female video editors, and a signed NDA ensuring zero photos are posted online.
                </p>
              </div>
            </label>

            {/* Req 2 */}
            <label
              onClick={() => setReqSegregatedHalls(!reqSegregatedHalls)}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                reqSegregatedHalls ? "border-emerald-500 bg-emerald-50/40 shadow-xs" : "border-neutral-200"
              }`}
            >
              <input
                type="checkbox"
                checked={reqSegregatedHalls}
                onChange={() => {}}
                className="mt-1 h-4 w-4 rounded text-emerald-600 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-800">Separated Gents &amp; Ladies Halls</p>
                <p className="text-xs text-neutral-500">
                  Dual entrances, soundproof partitions, and female waitresses inside the ladies section.
                </p>
              </div>
            </label>

            {/* Req 3 */}
            <label
              onClick={() => setReqMahramSafe(!reqMahramSafe)}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                reqMahramSafe ? "border-emerald-500 bg-emerald-50/40 shadow-xs" : "border-neutral-200"
              }`}
            >
              <input
                type="checkbox"
                checked={reqMahramSafe}
                onChange={() => {}}
                className="mt-1 h-4 w-4 rounded text-emerald-600 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-800">Mahram-Safe Private Couple Shoot</p>
                <p className="text-xs text-neutral-500">
                  Private enclosed studio or farmhouse suite with no public onlookers during bridal portraits.
                </p>
              </div>
            </label>

            {/* Req 4 */}
            <label
              onClick={() => setReqNoMusic(!reqNoMusic)}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                reqNoMusic ? "border-emerald-500 bg-emerald-50/40 shadow-xs" : "border-neutral-200"
              }`}
            >
              <input
                type="checkbox"
                checked={reqNoMusic}
                onChange={() => {}}
                className="mt-1 h-4 w-4 rounded text-emerald-600 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-800">No-Music / Duff &amp; Nasheed Setup</p>
                <p className="text-xs text-neutral-500">
                  Acoustic duff accompaniment, vocal hamd/naat performers, and solemn Islamic Nikkah atmosphere.
                </p>
              </div>
            </label>

            {/* Req 5 */}
            <label
              onClick={() => setReqHomeService(!reqHomeService)}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                reqHomeService ? "border-emerald-500 bg-emerald-50/40 shadow-xs" : "border-neutral-200"
              }`}
            >
              <input
                type="checkbox"
                checked={reqHomeService}
                onChange={() => {}}
                className="mt-1 h-4 w-4 rounded text-emerald-600 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-800">Home-Service Makeup &amp; Henna</p>
                <p className="text-xs text-neutral-500">
                  Senior stylists and henna artists travel directly to the bride&apos;s home for total privacy.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Right Output Recommendations */}
        <div className="flex flex-col justify-between rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-neutral-50 p-6 shadow-md lg:col-span-6 sm:p-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Verified Bundle for {cityName}
              </span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-0.5 text-xs font-bold">
                {activeReqCount} Privacy Filters Active
              </span>
            </div>

            <h3 className="font-display text-2xl font-bold text-bridal-charcoal mb-4">
              Recommended Halal Vendors in {cityName}
            </h3>

            <div className="space-y-3 mb-6">
              {reqFemalePhoto && (
                <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">Female Wedding Photographers</span>
                    <Link
                      href={`/wedding-photographers/${selectedCity}`}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Browse Teams &rarr;
                    </Link>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">Verified female lead shooters with confidentiality contracts.</p>
                </div>
              )}

              {reqSegregatedHalls && (
                <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">Segregated Wedding Marquees</span>
                    <Link
                      href={`/wedding-venues/${selectedCity}`}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      View Halls &rarr;
                    </Link>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">Venues offering solid partitions and separate female entrances.</p>
                </div>
              )}

              {reqHomeService && (
                <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">Home-Service Makeup &amp; Henna</span>
                    <Link
                      href={`/bridal-makeup-artists/${selectedCity}`}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Book Artists &rarr;
                    </Link>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">Avoid public salons on your Nikkah and Barat mornings.</p>
                </div>
              )}

              <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800">Licensed Nikkah Khwan</span>
                  <Link
                    href={`/nikah-khwan/${selectedCity}`}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Shortlist Khwan &rarr;
                  </Link>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Official Union Council registered scholars for home or masjid Nikkah.</p>
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
              <Share2 className="h-4 w-4" /> Share Halal Shaadi Checklist on WhatsApp
            </a>
            <Link
              href={`/wedding-venues/${selectedCity}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-bridal-gold-dark"
            >
              Explore {cityName} Venues with Segregation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
