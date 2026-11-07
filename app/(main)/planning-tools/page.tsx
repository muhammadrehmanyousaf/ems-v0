"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Calculator,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  UtensilsCrossed,
  Coins,
  FileText,
  MessageCircle,
  Music,
  Palette,
  Car,
  HeartHandshake,
  Globe2,
  ShieldCheck,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface PlanningTool {
  title: string;
  category: "Core" | "Finance & Legal" | "Food & Logistics" | "Culture & Diaspora";
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  gradient: string;
  href: string;
  badge?: string;
  features: string[];
}

const ALL_TOOLS: PlanningTool[] = [
  // Core Legacy Suite
  {
    title: "12-Month Wedding Checklist",
    category: "Core",
    description: "Desi wedding planning roadmap organized across Baat Pakki, Mehndi, Baraat & Walima.",
    icon: CalendarDays,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    gradient: "from-amber-500 to-amber-700",
    href: "/planning-tools/checklist",
    badge: "Essential",
    features: ["Milestone tracking", "Desi custom events", "Printable export"],
  },
  {
    title: "Wedding Budget Calculator",
    category: "Core",
    description: "Track total spend, allocate funds across vendors, and prevent unexpected overruns.",
    icon: Calculator,
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    gradient: "from-rose-500 to-rose-700",
    href: "/planning-tools/budget",
    badge: "Popular",
    features: ["PKR budget allocation", "Vendor breakdown", "Real-time surplus/deficit"],
  },
  {
    title: "Guest List & RSVP Manager",
    category: "Core",
    description: "Manage Ladkewale vs Ladkiwale guest quotas, track RSVPs, and seatings.",
    icon: Users,
    color: "text-amber-800",
    bgColor: "bg-amber-50",
    gradient: "from-amber-600 to-amber-800",
    href: "/planning-tools/guest-list",
    features: ["Side separation", "WhatsApp RSVP links", "Headcount tally"],
  },
  {
    title: "Day-of Event Timeline Creator",
    category: "Core",
    description: "Minute-by-minute timeline for Baraat arrival, Rukhsati, stage photos, and dinner buffet.",
    icon: Clock,
    color: "text-bridal-gold-dark",
    bgColor: "bg-bridal-cream",
    gradient: "from-bridal-gold to-bridal-gold-dark",
    href: "/planning-tools/timeline",
    features: ["One-Dish cut-off alerts", "Photographer coordination", "Rukhsati sync"],
  },

  // Finance & Legal
  {
    title: "Haq Mehr & Gold Rate Calculator",
    category: "Finance & Legal",
    description: "Calculate Haq Mehr value based on live 2026 24K gold tola prices with Islamic jurisprudence guidance.",
    icon: Coins,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    gradient: "from-amber-400 to-amber-600",
    href: "/planning-tools/haq-mehr-gold-calculator-pakistan",
    badge: "Live 2026 Tola",
    features: ["24K/22K Tola conversion", "Mu'ajjal vs Mu'wajjal split", "Haq Mehr Shara'ee guidance"],
  },
  {
    title: "Marquee Hidden Cost & AC/Gen Calculator",
    category: "Finance & Legal",
    description: "Expose hidden charges: AC generator diesel fuel, venue tax (PRA/SRB), stage electricity & corkage.",
    icon: FileText,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    gradient: "from-emerald-500 to-emerald-700",
    href: "/planning-tools/marquee-hidden-cost-calculator-pakistan",
    badge: "Saves PKR 100K+",
    features: ["AC Genset fuel per hour", "PRA / SRB / FBR Tax (5-16%)", "Stage extra DJ/Lighting load"],
  },
  {
    title: "Salami & Bari Trousseau Tracker",
    category: "Finance & Legal",
    description: "Record cash envelopes (Salami) by relative & catalog bride/groom Bari and Jahez trousseau.",
    icon: HeartHandshake,
    color: "text-pink-700",
    bgColor: "bg-pink-50",
    gradient: "from-pink-500 to-pink-700",
    href: "/planning-tools/salami-bari-trousseau-tracker-pakistan",
    badge: "Desi Classic",
    features: ["Side filter (Bride/Groom)", "Salami balance ledger", "WhatsApp acknowledgement"],
  },
  {
    title: "Nikkah Nama Clauses & NADRA Checklist",
    category: "Finance & Legal",
    description: "Understand Columns 13-22 (Column 18 Right of Divorce, Column 17 Maintenance) & NADRA MRC prep.",
    icon: ShieldCheck,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    gradient: "from-emerald-600 to-emerald-800",
    href: "/planning-tools/nikkah-nama-clauses-nadra-checklist-pakistan",
    badge: "Legal Guide",
    features: ["Column 18 Tafweez-e-Talaq", "Witness CNIC reminder via WhatsApp", "NADRA MRC paperwork"],
  },

  // Food & Logistics
  {
    title: "Degh & Catering Food Calculator",
    category: "Food & Logistics",
    description: "Calculate exact number of 12kg Biryani/Qorma deghs, naan, and dessert trays for your guest count.",
    icon: UtensilsCrossed,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    gradient: "from-orange-500 to-orange-700",
    href: "/planning-tools/degh-catering-calculator-pakistan",
    badge: "Zero Food Waste",
    features: ["Mutton / Beef / Chicken deghs", "Punjab 10 PM One-Dish rule", "Instant Per-Head food cost"],
  },
  {
    title: "Wedding Stage & Floral Decor Calculator",
    category: "Food & Logistics",
    description: "Estimate costs for artificial vs imported fresh floral stages, entry walkways, and mood lighting.",
    icon: Palette,
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    gradient: "from-rose-500 to-rose-700",
    href: "/planning-tools/wedding-stage-decor-cost-calculator-pakistan",
    badge: "Visual Costing",
    features: ["Fresh vs artificial flowers", "Shahi Entry tunnel setup", "Sound & Truss lighting packages"],
  },
  {
    title: "Baraat Car Rental & Fleet Calculator",
    category: "Food & Logistics",
    description: "Cost Audi, Prado, Fortuner, Limousine bride/groom cars plus HiAce coasters for guests.",
    icon: Car,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    gradient: "from-amber-500 to-amber-700",
    href: "/planning-tools/baraat-car-rental-fleet-calculator-pakistan",
    features: ["Luxury car daily rates", "Fuel & driver overtime", "Floral car ribbon decor"],
  },
  {
    title: "Bridal Makeup & Salon Cost Calculator",
    category: "Food & Logistics",
    description: "Compare Top-Tier vs Signature vs Standard bridal makeup artist rates with sister/mother packages.",
    icon: Sparkles,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    gradient: "from-rose-400 to-rose-600",
    href: "/planning-tools/bridal-makeup-salon-cost-calculator-pakistan",
    features: ["Signature vs Master artist", "Party makeup add-ons", "Home service travel surcharge"],
  },

  // Culture & Diaspora
  {
    title: "WhatsApp Digital Wedding Card Maker",
    category: "Culture & Diaspora",
    description: "Generate stylish, mobile-ready digital invites with venue Google Maps & 1-tap WhatsApp forwarding.",
    icon: MessageCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    gradient: "from-emerald-500 to-emerald-700",
    href: "/planning-tools/whatsapp-wedding-card-maker-pakistan",
    badge: "1-Click Send",
    features: ["Bismillah & Islamic calligraphy", "Google Maps location link", "Custom Urdu/English text"],
  },
  {
    title: "Mehndi Songs & Dholki Tappay Generator",
    category: "Culture & Diaspora",
    description: "Curated Pakistani wedding playlists (Groom entry, Bridal walk, Tappay & Boliyan lyrics).",
    icon: Music,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    gradient: "from-amber-500 to-amber-700",
    href: "/planning-tools/pakistani-mehndi-songs-dholki-tappay-generator",
    features: ["Full Urdu lyrics & audio", "Curated Spotify/YouTube playlists", "Sass-Bahu witty Tappay"],
  },
  {
    title: "Segregated & Islamic Wedding Planner",
    category: "Culture & Diaspora",
    description: "Specialized planning for Parda partition setups, female photography crews, and Islamic etiquette.",
    icon: ShieldCheck,
    color: "text-bridal-gold-dark",
    bgColor: "bg-bridal-cream",
    gradient: "from-bridal-gold to-bridal-gold-dark",
    href: "/planning-tools/segregated-islamic-wedding-planner-pakistan",
    badge: "Parda Friendly",
    features: ["Soundproof / visual partitions", "All-female camera & waitstaff", "Separate dining logistics"],
  },
  {
    title: "Overseas Pakistani Wedding Planner",
    category: "Culture & Diaspora",
    description: "Coordinate your Pakistan wedding from UK, USA, Canada, UAE, or Saudi Arabia with zero stress.",
    icon: Globe2,
    color: "text-amber-800",
    bgColor: "bg-amber-50",
    gradient: "from-amber-600 to-amber-800",
    href: "/planning-tools/overseas-pakistani-wedding-planner-calculator",
    badge: "Diaspora Suite",
    features: ["Multi-currency conversion (USD/GBP/AED)", "14-day trip countdown", "NADRA NICOP compliance"],
  },
];

const CATEGORIES = ["All", "Core", "Finance & Legal", "Food & Logistics", "Culture & Diaspora"] as const;

export default function PlanningToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen py-6 sm:py-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-12 px-4 max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Pakistan&apos;s #1 Free Interactive Wedding Planning Suite (16 Tools)
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
          Everything You Need to Plan Your Desi Wedding
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          No signups, no hidden costs. Calculated for 2026 Pakistani wedding rates, One-Dish rules,
          degh portions, gold tolas, and NADRA requirements.
        </p>

        {/* Search & Category Filter */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools (e.g. Degh, Haq Mehr, AC Diesel, Makeup, Salami)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat}
              {cat === "All" && ` (${ALL_TOOLS.length})`}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4 max-w-7xl mx-auto">
        {filteredTools.map((tool) => (
          <div key={tool.title}>
            <Link href={tool.href} className="block h-full group">
              <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200 bg-white flex flex-col h-full relative overflow-hidden rounded-2xl">
                <CardHeader className="p-5 flex-1 relative z-10 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={`w-12 h-12 ${tool.bgColor} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
                    >
                      <tool.icon className={`w-6 h-6 ${tool.color}`} />
                    </div>
                    {tool.badge && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 leading-snug group-hover:text-emerald-700 transition-colors">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-3">
                    {tool.description}
                  </CardDescription>

                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    {tool.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 mt-auto relative z-10">
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                    <span>Open Free Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* Bottom SEO & Venue Cross-Link Section */}
      <div className="mt-14 max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Explore 2026 Pakistani Wedding Venue Rates & Real Per-Head Pricing
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Planning your budget with our calculators? Compare actual per-head catering and hall
              booking costs across top Pakistani cities with verified prices and direct vendor contact.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <Link
              href="/wedding-venue-cost-in-lahore"
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors text-center block"
            >
              Lahore Venues Rate Hub
            </Link>
            <Link
              href="/wedding-venues/karachi"
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors text-center block"
            >
              Karachi Banquet Halls
            </Link>
            <Link
              href="/wedding-venues/islamabad"
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors text-center block"
            >
              Islamabad Marquees
            </Link>
            <Link
              href="/wedding-venues/rawalpindi"
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors text-center block"
            >
              Rawalpindi Halls
            </Link>
            <Link
              href="/wedding-venues/faisalabad"
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors text-center block"
            >
              Faisalabad Venues
            </Link>
            <Link
              href="/wedding-venues/multan"
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-500 font-semibold text-slate-800 hover:text-emerald-700 transition-colors text-center block"
            >
              Multan Venues
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
