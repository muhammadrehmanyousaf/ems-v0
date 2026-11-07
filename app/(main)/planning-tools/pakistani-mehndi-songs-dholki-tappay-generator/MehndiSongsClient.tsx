"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Music2, Sparkles, Share2, Play, Users, ArrowRight, Heart, Volume2 } from "lucide-react";

interface Song {
  title: string;
  artist: string;
  category: "Bridal Entry" | "Groom Entry" | "Cousins Dance" | "Couple Dance" | "Qawwali Night";
  tempo: string;
}

export function MehndiSongsClient() {
  const [activeTab, setActiveTab] = useState<"playlist" | "tappay">("playlist");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Tappay personalization
  const [brideName, setBrideName] = useState("Ayesha");
  const [groomName, setGroomName] = useState("Hamza");
  const [khalaName, setKhalaName] = useState("Nasreen Khala");
  const [phuppoName, setPhuppoName] = useState("Shazia Phuppo");

  const songs: Song[] = [
    { title: "Din Shagna Da (Royal Acoustic)", artist: "Jasleen Royal", category: "Bridal Entry", tempo: "Slow & Emotional" },
    { title: "Afreen Afreen (Coke Studio)", artist: "Rahat Fateh Ali Khan & Momina", category: "Bridal Entry", tempo: "Sufi Romantic" },
    { title: "Kala Shah Kala (Fusion Mix)", artist: "Annam & Folk Studio", category: "Bridal Entry", tempo: "Traditional Folk" },
    { title: "Dhol Jageero Da (High-Voltage Entry)", artist: "Panjabi MC", category: "Groom Entry", tempo: "Fast Bhangra" },
    { title: "Mundian To Bach Ke (Dhol Edit)", artist: "Panjabi MC", category: "Groom Entry", tempo: "High Energy" },
    { title: "Billori Akh (Baraat Mix)", artist: "Aima Baig", category: "Groom Entry", tempo: "Peppy Punjabi" },
    { title: "Ballay Ballay (Shaadi Anthem)", artist: "Shiraz Uppal & Harshdeep", category: "Cousins Dance", tempo: "Bhangra Beat" },
    { title: "Shakar Wandaan Re", artist: "Asrar", category: "Cousins Dance", tempo: "Upbeat Folk" },
    { title: "Guddi Wangoo", artist: "Ali Sethi", category: "Cousins Dance", tempo: "Groovy Dance" },
    { title: "Peechay Hutt", artist: "Hasan Raheem & Talal", category: "Cousins Dance", tempo: "Modern Desi Hip-hop" },
    { title: "Kahani Suno (Wedding Acoustic)", artist: "Kaifi Khalil", category: "Couple Dance", tempo: "Emotional Waltz" },
    { title: "Tu Jhoom", artist: "Abida Parveen & Naseebo Lal", category: "Couple Dance", tempo: "Soulful Classic" },
    { title: "Chaap Tilak Sab Cheeni", artist: "Nusrat Fateh Ali Khan", category: "Qawwali Night", tempo: "Ecstatic Sufi" },
    { title: "Tajdar-e-Haram", artist: "Sabri Brothers / Atif Aslam", category: "Qawwali Night", tempo: "Spiritual Classic" },
  ];

  const filteredSongs = selectedCategory === "All"
    ? songs
    : songs.filter((s) => s.category === selectedCategory);

  const shareText = activeTab === "playlist"
    ? `2026 Pakistani Mehndi & Wedding Playlist Curated:
Category: ${selectedCategory}
Top Tracks: ${filteredSongs.slice(0, 4).map((s) => `\n🎵 ${s.title} (${s.artist})`).join("")}

Check out the full 2026 Shaadi playlist on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/pakistani-mehndi-songs-dholki-tappay-generator`
    : `Dholki Tappay for ${brideName} & ${groomName}'s Shaadi:
Bari barsi khatan gaya si, khat ke leyandi thaali...
${groomName} saday kol aave, te ${brideName} baddi nakhray wali!

Generate customized Dholki lyrics on WeddingWala.pk:
https://www.weddingwala.pk/planning-tools/pakistani-mehndi-songs-dholki-tappay-generator`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center space-x-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-bridal-gold-dark">Home</Link>
        <span>/</span>
        <Link href="/planning-tools" className="hover:text-bridal-gold-dark">Planning Tools</Link>
        <span>/</span>
        <span className="text-neutral-800 font-medium">Mehndi Songs & Dholki Tappay</span>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 mb-3">
          <Sparkles className="h-4 w-4 text-amber-600" /> 2026 Sangeet & Dholki Night Specials
        </div>
        <h1 className="font-display text-3xl font-bold text-bridal-charcoal sm:text-4xl lg:text-5xl">
          Pakistani Mehndi Songs &amp; Dholki Tappay
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-neutral-600">
          Curated 2026 dance tracks for Bridal Entry, Groom Dhol, and Cousins group choreography, plus a personalized Dholki Tappay songbook generator!
        </p>

        {/* Tab Switcher */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1">
            <button
              onClick={() => setActiveTab("playlist")}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                activeTab === "playlist"
                  ? "bg-white text-bridal-charcoal shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              🎵 2026 Dance Playlist
            </button>
            <button
              onClick={() => setActiveTab("tappay")}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                activeTab === "tappay"
                  ? "bg-white text-bridal-charcoal shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              🪘 Personalized Dholki Tappay
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: PLAYLIST */}
      {activeTab === "playlist" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {["All", "Bridal Entry", "Groom Entry", "Cousins Dance", "Couple Dance", "Qawwali Night"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-bridal-gold text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Songs List */}
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredSongs.map((song) => (
              <div
                key={song.title}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 hover:border-bridal-gold/60 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bridal-cream text-bridal-gold-dark">
                    <Music2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">{song.title}</h3>
                    <p className="text-xs text-neutral-500">{song.artist}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-medium text-neutral-600">
                    {song.tempo}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700 text-sm"
            >
              <Share2 className="h-4 w-4" /> Share 2026 Playlist on WhatsApp
            </a>
            <Link
              href="/wedding-djs/lahore"
              className="flex items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm hover:bg-bridal-gold-dark text-sm"
            >
              Book Wedding DJs &amp; Sound Systems <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: TAPPAY GENERATOR */}
      {activeTab === "tappay" && (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Form */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm lg:col-span-5 sm:p-8">
            <h2 className="font-display text-xl font-bold text-bridal-charcoal mb-4">
              Customize Family Rhymes
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Enter bride, groom and family names to dynamically personalize classic Pakistani wedding tappay for your home dholki night!
            </p>

            <div className="space-y-4">
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

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Khala&apos;s Name (Maternal)</label>
                <input
                  type="text"
                  value={khalaName}
                  onChange={(e) => setKhalaName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Phuppo&apos;s Name (Paternal)</label>
                <input
                  type="text"
                  value={phuppoName}
                  onChange={(e) => setPhuppoName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:border-bridal-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Rhyme Output */}
          <div className="flex flex-col justify-between rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 p-6 shadow-md lg:col-span-7 sm:p-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Custom Dholki Songbook
                </span>
                <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-0.5 text-xs font-bold">
                  {brideName} &amp; {groomName}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="rounded-2xl bg-white p-4 border border-amber-200/80">
                  <p className="font-display text-base font-bold text-amber-900 mb-1">Bari Barsi — Groom &amp; Bride</p>
                  <p className="text-sm font-medium text-neutral-800 leading-relaxed italic">
                    &ldquo;Bari barsi khatan gaya si, khat ke leyandi thaali...<br />
                    {groomName} saaday kol aave, te {brideName} baddi nakhray wali!&rdquo;
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-amber-200/80">
                  <p className="font-display text-base font-bold text-amber-900 mb-1">Bari Barsi — Khala Tease</p>
                  <p className="text-sm font-medium text-neutral-800 leading-relaxed italic">
                    &ldquo;Bari barsi khatan gaya si, khat ke leyanda paan...<br />
                    Saadi {khalaName} aayi ae, wadd ke jivein toofan!&rdquo;
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-amber-200/80">
                  <p className="font-display text-base font-bold text-amber-900 mb-1">Bari Barsi — Phuppo Love</p>
                  <p className="text-sm font-medium text-neutral-800 leading-relaxed italic">
                    &ldquo;Bari barsi khatan gaya si, khat ke leyandi suit...<br />
                    Saadi {phuppoName} nachdi ae, lagdi baddi cute!&rdquo;
                  </p>
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
                <Share2 className="h-4 w-4" /> Share Personalized Tappay on WhatsApp
              </a>
              <Link
                href="/wedding-decorators/lahore"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-semibold text-white shadow-sm hover:bg-bridal-gold-dark text-sm"
              >
                Hire Home Dholki &amp; Mehndi Decorators <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
