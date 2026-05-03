"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectFade, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Star,
  MapPin,
  Users,
  Clock,
  Share2,
  CalendarCheck,
  Heart,
  MessageCircle,
  Shield,
  CheckCircle,
  Camera,
  Palette,
  Utensils,
  Crown,
  Sparkles,
  Car,
  Gift,
  Package as PackageIcon,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  X,
  Expand,
} from "lucide-react";
import type { Vendor, Review, AvailabilityDay, VendorMenu, Package } from "@/lib/types";
import { getVendorTypeConfig } from "@/lib/vendor-type-config";
import Image from "next/image";
import { BACKEND_URL } from "@/lib/backend-url";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion-wrapper";
import { useUser } from "@/context/UserContext";
import { useFavorites } from "@/hooks/use-favorites";
import { ChatDrawer } from "@/components/chat/chat-drawer";
import { toast as sonnerToast } from "sonner";
import { VendorAPI } from "@/lib/api/vendors";

interface VendorDetailsMobileProps {
  vendor: Vendor;
}

// Scroll-spy section IDs (menus conditionally added at render time)
const BASE_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "gallery", label: "Gallery" },
  { id: "packages", label: "Packages" },
  { id: "menus", label: "Menus" },
  { id: "reviews", label: "Reviews" },
  { id: "availability", label: "Availability" },
] as const;

// Bridal stat tile — used in vendor info chips grid
function BridalStatTile({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-bridal-ivory border border-bridal-beige rounded-md px-4 py-3.5 hover:border-bridal-gold/45 transition-colors">
      <div className={`w-10 h-10 rounded-full ${iconBg} ${iconColor} inline-flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">{label}</p>
        <p className="font-bridal text-[13px] font-medium text-bridal-charcoal truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// Animated review bar component
function AnimatedBar({
  percentage,
  color,
  label,
  count,
}: {
  percentage: number;
  color: string;
  label: string;
  count: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="flex items-center gap-3">
      <span className="font-display italic text-[15px] text-bridal-charcoal w-8 flex items-center gap-1">
        {label}
        <Star className="w-3 h-3 fill-bridal-gold text-bridal-gold" />
      </span>
      <div className="flex-1 h-2 bg-bridal-beige rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        />
      </div>
      <span className="font-bridal text-[11px] tabular-nums text-bridal-text-soft w-6 text-right">{count}</span>
    </div>
  );
}

// Circular SVG rating component
function CircularRating({
  rating,
  size = 100,
}: {
  rating: number;
  size?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const circumference = 2 * Math.PI * 40;
  const progress = (rating / 5) * circumference;
  const offset = circumference - progress;

  const ratingColor = "text-bridal-gold-dark";
  const strokeColor = "#C9956A"; // bridal gold
  const ratingLabel =
    rating >= 4.5
      ? "Exceptional"
      : rating >= 4
        ? "Excellent"
        : rating >= 3
          ? "Very Good"
          : "Good";

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="-rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#EDD9C3"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={
              isInView
                ? { strokeDashoffset: offset }
                : { strokeDashoffset: circumference }
            }
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display italic text-[28px] text-bridal-charcoal">
            {rating.toFixed(1)}
          </span>
          <span className="font-bridal text-[10px] uppercase tracking-[0.2em] text-bridal-text-soft">/5</span>
        </div>
      </div>
      <span className="font-bridal text-[11px] uppercase tracking-[0.25em] font-medium text-bridal-gold-dark">
        {ratingLabel}
      </span>
    </div>
  );
}

// ─── Package Card ────────────────────────────────────────────

/** One collapsible group row inside a package card */
function FeatureGroup({ label, items }: { label: string; items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const VISIBLE = 5;
  const visible = expanded ? items : items.slice(0, VISIBLE);
  const overflow = items.length - VISIBLE;

  return (
    <div className="space-y-2">
      <p className="font-bridal text-[10.5px] font-medium uppercase tracking-[0.25em] text-bridal-text-label">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-bridal-ivory text-bridal-charcoal text-[11.5px] font-medium px-2.5 py-1 rounded-full border border-bridal-beige"
          >
            <CheckCircle className="w-3 h-3 shrink-0 text-bridal-gold" />
            {item}
          </span>
        ))}
        {!expanded && overflow > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center bg-bridal-cream hover:bg-bridal-blush text-bridal-gold-dark hover:text-bridal-mauve text-[11.5px] font-medium px-2.5 py-1 rounded-full border border-bridal-gold/45 transition-colors"
          >
            +{overflow} more
          </button>
        )}
        {expanded && overflow > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center bg-bridal-cream hover:bg-bridal-blush text-bridal-gold-dark hover:text-bridal-mauve text-[11.5px] font-medium px-2.5 py-1 rounded-full border border-bridal-gold/45 transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

function PackageCard({
  pkg,
  formatPrice,
  onBook,
  pricingLabel = "per event",
}: {
  pkg: Package;
  formatPrice: (n: number) => string;
  onBook: () => void;
  pricingLabel?: string;
}) {
  const toStr = (v: any): string => {
    if (v === null || v === undefined) return ""
    if (typeof v === "object") {
      if (v.carName && v.quantity) return `${v.carName} ×${v.quantity}`
      return Object.values(v).filter(Boolean).join(" · ")
    }
    return String(v)
  }
  const isGrouped = pkg.features && !Array.isArray(pkg.features);
  const groups: { label: string; items: string[] }[] = isGrouped
    ? Object.entries(pkg.features as Record<string, any[]>)
        .filter(([, vals]) => Array.isArray(vals) && vals.length > 0)
        .map(([key, vals]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
          items: vals.map(toStr).filter(Boolean),
        }))
    : Array.isArray(pkg.features) && (pkg.features as any[]).filter(Boolean).length > 0
      ? [{ label: "Included", items: (pkg.features as any[]).map(toStr).filter(Boolean) }]
      : [];

  return (
    <div className="group relative overflow-hidden rounded-md border border-bridal-beige bg-bridal-cream shadow-[0_18px_44px_-32px_rgba(176,125,84,0.4)] hover:shadow-[0_28px_52px_-30px_rgba(176,125,84,0.55)] hover:border-bridal-gold/55 transition-all duration-500">
      {/* Gold accent strip */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />

      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-3.5 h-3.5 border-l border-t border-bridal-gold/45 pointer-events-none" />
      <div className="absolute top-3 right-3 w-3.5 h-3.5 border-r border-t border-bridal-gold/45 pointer-events-none" />

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold-dark font-medium mb-1.5">Package</p>
            <h3 className="font-display italic text-[22px] sm:text-[24px] text-bridal-charcoal leading-tight">{pkg.name}</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display italic text-[26px] sm:text-[28px] text-bridal-gold-dark leading-none">{formatPrice(pkg.price)}</p>
            <p className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-text-soft mt-1">{pricingLabel}</p>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="space-y-4 mb-5 pt-5 border-t border-bridal-beige/70">
            {groups.map((g, gi) => (
              <FeatureGroup key={gi} label={g.label} items={g.items} />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onBook}
          className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_14px_30px_-12px_rgba(176,125,84,0.7)] transition-all duration-300"
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          Select package
        </button>
      </div>
    </div>
  );
}

export default function VendorDetailsMobile({
  vendor,
}: VendorDetailsMobileProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const isFavorite = isFavorited(vendor.id);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthAvailability, setMonthAvailability] = useState<Record<string, {
    availableSlots: string[];
    bookedSlots: string[];
    isBlocked?: boolean;
    blockReason?: string;
  }>>({});
  const [activeSection, setActiveSection] = useState("overview");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxSwiperRef = useRef<any>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useUser();

  // ── Live Reviews ──
  const [liveReviews, setLiveReviews] = useState<any[]>([])
  const [liveAvgRating, setLiveAvgRating] = useState<number | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [userBookingId, setUserBookingId] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  const handleMessageVendor = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!vendor.userId) {
      sonnerToast.error("Unable to message this vendor at the moment.");
      return;
    }
    setChatDrawerOpen(true);
  };

  // Refs for scroll-spy sections
  const heroRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLDivElement>(null);
  const menusRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const availabilityRef = useRef<HTMLDivElement>(null);
  const scrollSpyNavRef = useRef<HTMLDivElement>(null);

  // Parallax for hero
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Whether this vendor has menus to display
  const hasMenus = Array.isArray(vendor.menus) && vendor.menus.length > 0;

  // Filter sections based on vendor data
  const SECTIONS = useMemo(
    () => BASE_SECTIONS.filter((s) => s.id !== "menus" || hasMenus),
    [hasMenus],
  );

  // Section refs map for scroll-spy
  const sectionRefs = useMemo(
    () => ({
      overview: overviewRef,
      gallery: galleryRef,
      packages: packagesRef,
      ...(hasMenus ? { menus: menusRef } : {}),
      reviews: reviewsRef,
      availability: availabilityRef,
    }),
    [hasMenus],
  );

  // Scroll-spy IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const entries = Object.entries(sectionRefs) as [
      string,
      React.RefObject<HTMLDivElement | null>,
    ][];

    entries.forEach(([id, ref]) => {
      if (!ref.current) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
      );
      observer.observe(ref.current);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sectionRefs]);

  const handleFavoriteToggle = async () => {
    const isLoggedIn =
      typeof window !== "undefined" &&
      localStorage.getItem("user_id") &&
      localStorage.getItem("auth_token");
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    await toggleFavorite(vendor.id);
  };

  const primaryImage = useMemo(
    () => vendor.images?.[0] || "/placeholder.jpg",
    [vendor.images],
  );
  const galleryImages = useMemo(
    () => (vendor.images?.length ? vendor.images : ["/placeholder.jpg"]),
    [vendor.images],
  );

  // Check if a date is in the past
  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Check if the date has open slots (not blocked, not fully booked, not past)
  const isDateSelectable = (date: Date): boolean => {
    if (isDateInPast(date)) return false;
    const avail = monthAvailability[toDateKey(date)];
    if (!avail) return true; // no data = assume available
    if (avail.isBlocked) return false;
    if (avail.availableSlots.length === 0) return false;
    return true;
  };

  // Get slot availability info for a date
  const getDateAvailInfo = (date: Date) => {
    return monthAvailability[toDateKey(date)] ?? null;
  };

  const handleDateSelect = (date: Date) => {
    if (isDateInPast(date)) return;
    setSelectedDate(date);
    const avail = getDateAvailInfo(date);
    if (avail?.isBlocked) {
      toast({
        title: "Vendor Unavailable",
        description: avail.blockReason || "The vendor is not available on this day. Please choose another date.",
        variant: "destructive",
      });
    } else if (avail && avail.availableSlots.length === 0) {
      toast({
        title: "Fully Booked",
        description: `${format(date, "MMMM dd, yyyy")} is fully booked. Please select another date.`,
        variant: "destructive",
      });
    }
  };

  const handleBookNow = () => {
    const isLoggedIn =
      typeof window !== "undefined" && localStorage.getItem("user_id");
    if (isLoggedIn) {
      router.push(`/${vendor.id}/booking`);
    } else {
      router.push("/login");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: vendor.name,
          text: `Check out ${vendor.name} - ${vendor.type}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Vendor link has been copied to clipboard",
        });
      }
    } catch (error) {
      // share failed silently
    }
  };

  const formatPrice = (price: number) => {
    return `Rs. ${new Intl.NumberFormat("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)}`;
  };

  const getVendorIcon = (type: string | undefined) => {
    if (!type) return PackageIcon;
    const iconMap: { [key: string]: any } = {
      Photographer: Camera,
      "Makeup artist": Palette,
      Decorator: Sparkles,
      Catering: Utensils,
      "Wedding venue": Crown,
      "Bridal wearing": Sparkles,
      "Car rental": Car,
      "Henna artist": Palette,
      "Wedding Invitations and Stationery": Gift,
    };
    return iconMap[type] || PackageIcon;
  };

  const VendorIcon = getVendorIcon(vendor.type);

  const getVendorSpecificDetails = (): { label: string; value: string }[] => {
    const details: { label: string; value: string }[] = [];
    const type = vendor.type;

    // Capacity — only meaningful for venue, catering, and decorator
    const capacityTypes = ["Wedding venue", "Catering", "Decorator"];
    if (capacityTypes.includes(type ?? "") && (vendor.minCapacity || vendor.maxCapacity)) {
      const cap =
        vendor.minCapacity && vendor.maxCapacity
          ? `${vendor.minCapacity} – ${vendor.maxCapacity}`
          : `${vendor.maxCapacity ?? vendor.minCapacity}`;
      details.push({ label: "Guest Capacity", value: `${cap} guests` });
    }

    if (type === "Wedding venue") {
      if (vendor.catering != null)
        details.push({ label: "In-house Catering", value: vendor.catering ? "Available" : "Not Available" });
      if (vendor.parking != null) {
        const parkVal = vendor.parking
          ? vendor.carParkingCapacity
            ? `Available (${vendor.carParkingCapacity} cars)`
            : "Available"
          : "Not Available";
        details.push({ label: "Parking", value: parkVal });
      }
    }

    if (type === "Catering") {
      if (vendor.provideFoodTesting != null)
        details.push({ label: "Food Tasting", value: vendor.provideFoodTesting ? "Available" : "Not Available" });
      if (vendor.provideWaiter != null)
        details.push({ label: "Waiter Service", value: vendor.provideWaiter ? "Included" : "Not Included" });
      if (vendor.providePlate != null)
        details.push({ label: "Crockery & Plates", value: vendor.providePlate ? "Provided" : "Not Provided" });
      if (vendor.provideSeatingArrangement != null)
        details.push({ label: "Seating Arrangement", value: vendor.provideSeatingArrangement ? "Provided" : "Not Provided" });
      if (vendor.provideSoundSystem != null)
        details.push({ label: "Sound System", value: vendor.provideSoundSystem ? "Available" : "Not Available" });
    }

    if (type === "Henna artist") {
      if (vendor.sellMehndi != null)
        details.push({ label: "Sells Mehndi Products", value: vendor.sellMehndi ? "Yes" : "No" });
      if (vendor.hasTeam != null)
        details.push({ label: "Has a Team", value: vendor.hasTeam ? "Yes" : "No" });
    }

    if (type === "Decorator") {
      if (vendor.provideDecorationItem != null)
        details.push({ label: "Provides Decoration Items", value: vendor.provideDecorationItem ? "Yes" : "No" });
    }

    if (type === "Wedding Invitations and Stationery") {
      if (vendor.instruction) details.push({ label: "Production Turnaround", value: vendor.instruction });
      if (vendor.minCapacity) details.push({ label: "Min. Order Qty", value: `${vendor.minCapacity} pieces` });
      if (vendor.travelToClientHome != null) details.push({ label: "Home / Courier Delivery", value: vendor.travelToClientHome ? "Available" : "Not Available" });
      if (vendor.sellMehndi != null) details.push({ label: "Customisation", value: vendor.sellMehndi ? "Available" : "Not Available" });
      if (vendor.hasTeam != null) details.push({ label: "Digital Invitations", value: vendor.hasTeam ? "Available" : "Not Available" });
      if (vendor.provideDecorationItem != null) details.push({ label: "Wax Seal / Stamp", value: vendor.provideDecorationItem ? "Available" : "Not Available" });
      if (vendor.provideFoodTesting != null) details.push({ label: "Calligraphy", value: vendor.provideFoodTesting ? "Available" : "Not Available" });
      if (vendor.provideWaiter != null) details.push({ label: "Envelope Included", value: vendor.provideWaiter ? "Yes" : "No" });
      if (vendor.provideSoundSystem != null) details.push({ label: "Rush Orders", value: vendor.provideSoundSystem ? "Accepted" : "Not Available" });
      if (vendor.provideSeatingArrangement != null) details.push({ label: "Bilingual Printing", value: vendor.provideSeatingArrangement ? "Available" : "Not Available" });
      if (vendor.providePlate != null) details.push({ label: "Acrylic Cards", value: vendor.providePlate ? "Available" : "Not Available" });
      if (vendor.parking != null) details.push({ label: "Nationwide Delivery", value: vendor.parking ? "Available" : "Not Available" });
    }

    // Travel field — excluded for types that show it as a dedicated services pill section
    const travelExcludedTypes = ["Wedding Invitations and Stationery", "Bridal wearing", "Photographer", "Decorator", "Henna artist", "Makeup artist"];
    if (vendor.travelToClientHome != null && !travelExcludedTypes.includes(type ?? ""))
      details.push({ label: "Travel to Client Location", value: vendor.travelToClientHome ? "Available" : "Not Available" });

    // subBusinessType — only show in detail grid for single-select types; multi-select types use a dedicated tags section
    const singleSelectSubTypes: Record<string, string> = {
      "Car rental": "Vehicle Type",
      "Bridal wearing": "Store Type",
      "Wedding Invitations and Stationery": "Stationery Type",
    };
    const subTypeLabel = singleSelectSubTypes[type ?? ""];
    if (subTypeLabel) {
      const subVal = Array.isArray(vendor.subBusinessType)
        ? vendor.subBusinessType[0]
        : vendor.subBusinessType;
      if (subVal) details.push({ label: subTypeLabel, value: subVal });
    }

    return details;
  };

  const vendorSpecificDetails = getVendorSpecificDetails();
  const cancellationPolicy = vendor.cancelationPolicy || vendor.cancellationPolicy;

  const BACKEND_BASE = BACKEND_URL.replace(/\/$/, "");
  const resolveImg = (url: string) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `${BACKEND_BASE}${url}`;
  };

  const BRIDAL_SERVICES: { key: keyof Vendor; label: string }[] = [
    { key: "travelToClientHome", label: "Home Delivery" },
    { key: "sellMehndi", label: "Rental Available" },
    { key: "hasTeam", label: "Bridesmaid Outfits" },
    { key: "provideDecorationItem", label: "Design Consultation" },
    { key: "provideFoodTesting", label: "Trial / Fitting" },
    { key: "provideWaiter", label: "Alteration Service" },
    { key: "provideSoundSystem", label: "Accessory Matching" },
    { key: "provideSeatingArrangement", label: "Dupatta Styling" },
    { key: "providePlate", label: "Groom Wear Available" },
    { key: "parking", label: "Rush Orders Accepted" },
  ];
  const enabledBridalServices =
    vendor.type === "Bridal wearing"
      ? BRIDAL_SERVICES.filter((s) => vendor[s.key] === true)
      : [];

  const isStationery = vendor.type === "Wedding Invitations and Stationery";
  const vendorConfig = getVendorTypeConfig(vendor.type);

  // Dynamic labels from config
  const amenitiesLabel = vendorConfig?.typeSpecificFields.find((f) => f.key === "amenities")?.label ?? "Amenities";
  const expertiseLabel = vendorConfig?.typeSpecificFields.find((f) => f.key === "expertise")?.label ?? "Expertise";
  const serviceProvidedLabel = vendorConfig?.typeSpecificFields.find((f) => f.key === "serviceProvided")?.label ?? null;

  // subBusinessType field — multi-select types get a dedicated tags section
  const subBizTypeField = vendorConfig?.typeSpecificFields.find((f) => f.key === "subBusinessType");
  const isSubBizTypeMulti = subBizTypeField?.type === "multi-select";
  const subBizTypeLabel = subBizTypeField?.label ?? "Type";
  const subBizTypeValues: string[] = isSubBizTypeMulti
    ? Array.isArray(vendor.subBusinessType) ? vendor.subBusinessType : vendor.subBusinessType ? [vendor.subBusinessType] : []
    : [];

  // Grouped expertise (stationery only)
  const expertiseGroups = vendorConfig?.typeSpecificFields.find((f) => f.key === "expertise")?.groups ?? [];

  // Per-type boolean services for visual "Services Offered" pill sections
  const TYPE_SERVICES: Record<string, { key: keyof Vendor; label: string }[]> = {
    "Photographer": [
      { key: "travelToClientHome", label: "Travel to Client" },
    ],
    "Decorator": [
      { key: "provideDecorationItem", label: "Provides Decoration Items" },
      { key: "travelToClientHome", label: "Travel to Venue" },
    ],
    "Henna artist": [
      { key: "travelToClientHome", label: "Travel to Client" },
      { key: "sellMehndi", label: "Sells Mehndi Products" },
      { key: "hasTeam", label: "Has a Team" },
    ],
    "Makeup artist": [
      { key: "travelToClientHome", label: "Travel to Client" },
    ],
  };
  const enabledTypeServices = TYPE_SERVICES[vendor.type ?? ""]?.filter((s) => vendor[s.key] === true) ?? [];

  const getFeatureBadges = (pkg: Package): { label: string; values: string[] }[] => {
    if (!pkg.features) return [];
    if (Array.isArray(pkg.features)) return [];
    const obj = pkg.features as Record<string, string[]>;
    return Object.entries(obj)
      .filter(([, vals]) => Array.isArray(vals) && vals.length > 0)
      .map(([key, vals]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        values: vals,
      }));
  };

  const lowestPackagePrice =
    vendor.packages?.length > 0
      ? Math.min(...vendor.packages.map((p) => p.price).filter((p) => p > 0))
      : null;
  const startingPrice = vendor.minimumPrice || lowestPackagePrice || vendor.price || null;

  // Calendar functions
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatMonthYear = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const goToPreviousMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  const goToNextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  const goToToday = () => setCurrentDate(new Date());

  const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Fetch real availability (bookings + vendor-blocked) for displayed month
  const fetchMonthAvailability = useCallback(async (monthDate: Date) => {
    if (!vendor.id) return;
    const yyyy = monthDate.getFullYear();
    const mm = String(monthDate.getMonth() + 1).padStart(2, "0");
    try {
      const data = await VendorAPI.getMonthAvailability([Number(vendor.id)], `${yyyy}-${mm}`);
      setMonthAvailability(data[Number(vendor.id)] || {});
    } catch {
      // silently fail
    }
  }, [vendor.id]);

  useEffect(() => {
    fetchMonthAvailability(currentDate);
  }, [currentDate, fetchMonthAvailability]);

  // ── Fetch live reviews ──
  const fetchLiveReviews = useCallback(() => {
    if (!vendor.id) return
    setReviewsLoading(true)
    fetch(`${BACKEND_URL}api/v1/reviews/${vendor.id}`)
      .then(r => r.json())
      .then(data => {
        setLiveReviews(data?.data?.reviews ?? [])
        setLiveAvgRating(data?.data?.averageRating ?? null)
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [vendor.id])

  useEffect(() => { fetchLiveReviews() }, [fetchLiveReviews])

  // ── Fetch user's COMPLETED booking for this vendor ──
  useEffect(() => {
    if (!isAuthenticated || !vendor.id) return
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (!token) return
    fetch(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const bookings: any[] = data?.data ?? []
        const match = bookings.find((b: any) =>
          b.status === "Completed" &&
          b.bookingDetails?.some((d: any) => Number(d.businessId) === Number(vendor.id))
        )
        if (match) {
          setUserBookingId(match.id)
          setAlreadyReviewed(liveReviews.some(r => r.booking?.id === match.id))
        }
      })
      .catch(() => {})
  }, [isAuthenticated, vendor.id, liveReviews])

  const handleReviewSubmit = async () => {
    if (!userBookingId || reviewRating === 0) return
    setReviewSubmitting(true)
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch(`${BACKEND_URL}api/v1/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessId: vendor.id,
          bookingId: userBookingId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      })
      const data = await res.json()
      if (data.status) {
        toast({ title: "Review submitted!", description: "Thank you for your feedback." })
        setReviewRating(0)
        setReviewComment("")
        setAlreadyReviewed(true)
        fetchLiveReviews()
      } else {
        toast({ title: "Failed", description: data.message || "Please try again.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Failed", description: "Please try again.", variant: "destructive" })
    } finally {
      setReviewSubmitting(false)
    }
  }

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
      if (ref?.current) {
        const yOffset = -80;
        const y =
          ref.current.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    },
    [sectionRefs],
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    // Swiper will receive initialSlide on mount; after open we navigate imperatively
    setTimeout(() => {
      lightboxSwiperRef.current?.slideTo(index, 0);
      scrollThumbIntoView(index);
    }, 50);
  };

  const goToLightboxSlide = (index: number) => {
    setLightboxIndex(index);
    lightboxSwiperRef.current?.slideTo(index);
    scrollThumbIntoView(index);
  };

  const scrollThumbIntoView = (index: number) => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    const thumb = strip.children[0]?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  // Review stats — use live API data
  const allReviews = liveReviews;
  const avgRating = liveAvgRating ?? (liveReviews.length > 0
    ? liveReviews.reduce((s, r) => s + r.rating, 0) / liveReviews.length
    : 0);
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
    percentage: allReviews.length > 0
      ? (allReviews.filter((r) => r.rating === star).length / allReviews.length) * 100
      : 0,
  }));

  return (
    <div className="min-h-screen bg-bridal-ivory">
      {/* ===== PARALLAX HERO SECTION ===== */}
      <div
        ref={heroRef}
        className="relative h-[55vh] sm:h-[65vh] lg:h-[75vh] overflow-hidden"
      >
        {/* Swiper Carousel with Ken Burns */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={galleryImages.length > 1}
            className="h-full w-full"
          >
            {galleryImages.slice(0, 5).map((img, i) => (
              <SwiperSlide key={i}>
                <div className="relative h-full w-full">
                  <Image
                    src={img}
                    alt={`${vendor.name} - ${i + 1}`}
                    fill
                    priority={i === 0}
                    className="object-cover animate-ken-burns"
                    sizes="100vw"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        {/* Bridal multi-layer vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/85 via-bridal-charcoal/40 to-bridal-charcoal/55 z-10" />
        <div className="absolute inset-0 bg-mughal-jaal opacity-[0.08] pointer-events-none z-10" />

        {/* Top navigation bar */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2.5 rounded-full bg-bridal-charcoal/40 backdrop-blur-md border border-bridal-ivory/15 text-bridal-ivory hover:bg-bridal-charcoal/60 hover:text-bridal-ivory"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteToggle}
              className="p-2.5 rounded-full bg-bridal-charcoal/40 backdrop-blur-md border border-bridal-ivory/15 text-bridal-ivory hover:bg-bridal-charcoal/60 hover:text-bridal-ivory"
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? "fill-bridal-coral text-bridal-coral" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2.5 rounded-full bg-bridal-charcoal/40 backdrop-blur-md border border-bridal-ivory/15 text-bridal-ivory hover:bg-bridal-charcoal/60 hover:text-bridal-ivory"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8 lg:p-12"
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bridal-gold/95 text-bridal-charcoal">
                  <VendorIcon className="w-4 h-4" />
                </div>
                <span className="font-bridal text-[11px] sm:text-[12px] uppercase tracking-[0.4em] text-bridal-ivory/95">
                  {vendor.type || "Vendor"}
                </span>
                {vendor.sponsored && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bridal-gold/95 text-bridal-charcoal text-[10px] font-bridal font-medium uppercase tracking-[0.22em]">
                    <Crown className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>
              <h1 className="font-display italic text-[40px] sm:text-[54px] lg:text-[68px] leading-[0.98] text-bridal-ivory mb-5 drop-shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
                {vendor.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 font-bridal text-bridal-ivory/95">
                <span className="flex items-center gap-2 text-[14px]">
                  <MapPin className="w-4 h-4 text-bridal-gold" />
                  {vendor.location || vendor.city}
                </span>
                <span className="flex items-center gap-2 text-[14px]">
                  <Star className="w-4 h-4 text-bridal-gold fill-bridal-gold" />
                  <span className="font-display italic text-[18px]">{(liveAvgRating ?? vendor.rating)?.toFixed(1)}</span>
                  <span className="text-bridal-ivory/70 text-[12px]">({allReviews.length} reviews)</span>
                </span>
                <span className="flex items-center gap-2 text-[14px]">
                  <Shield className="w-4 h-4 text-bridal-sage" />
                  Verified
                </span>
              </div>

              {/* Price + CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="text-bridal-ivory">
                  <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold">
                    Starting from
                  </span>
                  <p className="font-display italic text-[28px] sm:text-[32px] text-bridal-ivory leading-none mt-1">
                    {startingPrice ? formatPrice(startingPrice) : "See Packages"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBookNow}
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_14px_30px_-12px_rgba(176,125,84,0.65)] hover:shadow-[0_18px_36px_-12px_rgba(176,125,84,0.8)] transition-all duration-300"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Book this vendor
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Image counter badge */}
        <div className="absolute bottom-6 right-6 z-20">
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-bridal-charcoal/40 backdrop-blur-md rounded-full text-bridal-ivory font-bridal text-[11px] uppercase tracking-[0.22em] font-medium border border-bridal-ivory/15 hover:bg-bridal-charcoal/60 hover:border-bridal-gold/55 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            {galleryImages.length} Photos
          </button>
        </div>
      </div>

      {/* ===== SCROLL-SPY NAVIGATION ===== */}
      <div
        ref={scrollSpyNavRef}
        className="sticky top-0 z-30 bg-bridal-cream/95 backdrop-blur-xl border-b border-bridal-beige shadow-[0_4px_20px_-16px_rgba(176,125,84,0.45)]"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-4 py-2.5">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={`relative px-4 py-2 font-bridal text-[11px] uppercase tracking-[0.22em] font-medium rounded-full whitespace-nowrap transition-all duration-300 ${
                  activeSection === section.id
                    ? "text-bridal-gold-dark bg-bridal-cream"
                    : "text-bridal-text-soft hover:text-bridal-gold-dark hover:bg-bridal-blush"
                }`}
              >
                {section.label}
                {activeSection === section.id && (
                  <motion.div
                    layoutId="scrollspy-indicator"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-bridal-gold rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6 min-w-0 overflow-hidden">
            {/* ===== OVERVIEW SECTION ===== */}
            <section ref={overviewRef} id="overview">
              <ScrollReveal>
                <div className="space-y-5">
                  {/* Key facts chips — bridal stat tiles */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <BridalStatTile
                      icon={<VendorIcon className="w-4 h-4" />}
                      iconBg="bg-bridal-gold/15"
                      iconColor="text-bridal-gold-dark"
                      label="Type"
                      value={vendor.type || "Vendor"}
                    />
                    <BridalStatTile
                      icon={<span className="font-bridal font-medium text-[11px]">Rs</span>}
                      iconBg="bg-bridal-blush"
                      iconColor="text-bridal-mauve"
                      label="Starting"
                      value={startingPrice ? formatPrice(startingPrice) : "See Packages"}
                    />
                    {["Wedding venue", "Catering", "Decorator"].includes(vendor.type ?? "") && (vendor.minCapacity || vendor.maxCapacity || vendor.capacity) && (
                      <BridalStatTile
                        icon={<Users className="w-4 h-4" />}
                        iconBg="bg-bridal-rose/30"
                        iconColor="text-bridal-mauve"
                        label="Capacity"
                        value={`${vendor.minCapacity && vendor.maxCapacity
                          ? `${vendor.minCapacity}–${vendor.maxCapacity}`
                          : vendor.maxCapacity ?? vendor.minCapacity ?? vendor.capacity} Guests`}
                      />
                    )}
                    {isStationery && vendor.minCapacity && (
                      <BridalStatTile
                        icon={<PackageIcon className="w-4 h-4" />}
                        iconBg="bg-bridal-rose/30"
                        iconColor="text-bridal-mauve"
                        label="Min. Order"
                        value={`${vendor.minCapacity} pcs`}
                      />
                    )}
                    {vendor.downPayment && (
                      <BridalStatTile
                        icon={<span className="font-bridal font-medium text-[11px]">Rs</span>}
                        iconBg="bg-bridal-coral/20"
                        iconColor="text-bridal-coral"
                        label="Advance"
                        value={vendor.downPaymentType === "Percentage" ? `${vendor.downPayment}%` : formatPrice(vendor.downPayment)}
                      />
                    )}
                    {cancellationPolicy && (
                      <BridalStatTile
                        icon={<Clock className="w-4 h-4" />}
                        iconBg="bg-bridal-sage/25"
                        iconColor="text-[#3F6B43]"
                        label="Cancellation"
                        value={cancellationPolicy}
                      />
                    )}
                  </div>

                  {/* Description */}
                  {vendor.description ? (
                    <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-5">
                      <h2 className="font-display italic text-[20px] text-bridal-charcoal mb-3">About</h2>
                      <p className="text-sm text-bridal-charcoal/85 leading-relaxed break-words">
                        {vendor.description}
                      </p>
                    </div>
                  ) : null}

                  {/* subBusinessType — multi-select types (Photographer, Decorator, Henna, Makeup) */}
                  {isSubBizTypeMulti && subBizTypeValues.length > 0 && (
                    <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-5">
                      <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
                        {subBizTypeLabel}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {subBizTypeValues.map((val, i) => (
                          <Badge key={i} variant="secondary" className="text-sm px-3 py-1 bg-bridal-blush text-bridal-mauve border-bridal-rose/45">
                            {val}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expertise / Specializations */}
                  {Array.isArray(vendor.expertise) && vendor.expertise.length > 0 && (
                    <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-5">
                      <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
                        {expertiseLabel}
                      </h3>
                      {expertiseGroups.length > 0 ? (
                        <div className="space-y-3">
                          {expertiseGroups.map(({ group, emoji, items }) => {
                            const picked = items.filter((i) => vendor.expertise!.includes(i));
                            if (!picked.length) return null;
                            return (
                              <div key={group} className="border border-bridal-beige rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-bridal-ivory border-b border-bridal-beige">
                                  <span className="text-sm">{emoji}</span>
                                  <p className="text-xs font-semibold text-bridal-charcoal/85">{group}</p>
                                  <span className="ml-auto text-xs text-bridal-text-soft">{picked.length}</span>
                                </div>
                                <div className="px-3 py-2 flex flex-wrap gap-1.5">
                                  {picked.map((v, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-bridal-cream text-bridal-gold-dark border border-bridal-gold/45">
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {vendor.expertise.map((item, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-sm px-3 py-1 bg-bridal-blush text-bridal-mauve border-bridal-rose/45"
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Type-specific service details */}
                  {vendorSpecificDetails.length > 0 && (
                    <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-5">
                      <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-4">
                        Services & Features
                      </h3>
                      <StaggerContainer
                        staggerDelay={0.05}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                      >
                        {vendorSpecificDetails.map((detail, i) => (
                          <StaggerItem key={i}>
                            <div className="flex items-center gap-3 p-3 bg-bridal-ivory rounded-xl border border-bridal-beige hover:border-bridal-gold/45 hover:shadow-sm transition-all duration-200">
                              <CheckCircle className="w-4 h-4 text-bridal-gold flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs text-bridal-text-soft">{detail.label}</p>
                                <p className="text-sm font-medium text-bridal-charcoal truncate">{detail.value}</p>
                              </div>
                            </div>
                          </StaggerItem>
                        ))}
                      </StaggerContainer>
                    </div>
                  )}

                  {/* Amenities + serviceProvided */}
                  {(vendor.amenities?.length > 0 || (serviceProvidedLabel && Array.isArray(vendor.serviceProvided) && vendor.serviceProvided.length > 0)) && (
                    <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-5 space-y-5">
                      {vendor.amenities?.length > 0 && (
                        <div>
                          <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
                            {amenitiesLabel}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {vendor.amenities.map((amenity, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-sm px-3 py-1 border-bridal-gold/45 text-bridal-gold-dark"
                              >
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {serviceProvidedLabel && Array.isArray(vendor.serviceProvided) && vendor.serviceProvided.length > 0 && (
                        <div>
                          <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
                            {serviceProvidedLabel}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {vendor.serviceProvided.map((val, i) => (
                              <Badge key={i} variant="outline" className="text-sm px-3 py-1 border-bridal-gold/45 text-bridal-gold-dark">
                                {val}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cities Covered */}
                  {Array.isArray(vendor.cityCovered) && vendor.cityCovered.length > 0 && (
                    <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-5">
                      <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
                        Cities Covered
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {vendor.cityCovered.map((city, i) => (
                          <Badge key={i} variant="outline" className="text-sm px-3 py-1 gap-1">
                            <MapPin className="w-3 h-3" />
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booking Terms */}
                  {(vendor.downPayment || cancellationPolicy) && (
                    <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-5">
                      <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-4">
                        Booking Terms
                      </h3>
                      <div className="space-y-2.5">
                        {vendor.downPayment ? (
                          <div className="flex items-center gap-3 p-3 bg-bridal-ivory rounded-md border border-bridal-beige">
                            <DollarSign className="w-4 h-4 text-bridal-gold-dark flex-shrink-0" />
                            <div>
                              <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Advance Payment Required</p>
                              <p className="font-bridal text-[13px] font-medium text-bridal-charcoal mt-0.5">
                                {vendor.downPaymentType === "Percentage"
                                  ? `${vendor.downPayment}% of total amount`
                                  : formatPrice(vendor.downPayment)}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        {cancellationPolicy && (
                          <div className="flex items-center gap-3 p-3 bg-bridal-ivory rounded-md border border-bridal-beige">
                            <Clock className="w-4 h-4 text-[#3F6B43] flex-shrink-0" />
                            <div>
                              <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Cancellation Policy</p>
                              <p className="font-bridal text-[13px] font-medium text-bridal-charcoal mt-0.5">{cancellationPolicy}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Information + Instruction */}
                  {(vendor.additionalInfo || (vendor.instruction && !isStationery)) && (
                    <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-5 space-y-4">
                      {vendor.additionalInfo && (
                        <div>
                          <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-2">
                            Additional Information
                          </h3>
                          <p className="text-sm text-bridal-charcoal/85 leading-relaxed">{vendor.additionalInfo}</p>
                        </div>
                      )}
                      {vendor.instruction && !isStationery && (
                        <div>
                          <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-2">
                            {vendor.type === "Bridal wearing" ? "Order Lead Time" : "Special Instructions"}
                          </h3>
                          <p className="text-sm text-bridal-charcoal/85 leading-relaxed">{vendor.instruction}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Services Offered — bridal + photographer/decorator/henna/makeup boolean pills */}
                  {(enabledBridalServices.length > 0 || enabledTypeServices.length > 0) && (
                    <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-5">
                      <h3 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
                        Services Offered
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {[...enabledBridalServices, ...enabledTypeServices].map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 bg-bridal-sage/20 border border-bridal-sage/40 text-[#3F6B43] rounded-full px-3 py-1 font-bridal text-[12px] font-medium"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {s.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </section>

            {/* ===== GALLERY SECTION ===== */}
            <section ref={galleryRef} id="gallery">
              <div className="bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] p-4">
                <ScrollReveal>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display italic text-[22px] text-bridal-charcoal">Gallery</h2>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-bridal-gold-dark bg-bridal-cream border border-bridal-gold/45 px-3 py-1 rounded-full">
                      <Camera className="w-3.5 h-3.5" />
                      {galleryImages.length} photos
                    </span>
                  </div>
                </ScrollReveal>

              {galleryImages.length > 0 && (
                <>
                  {/* Featured hero layout: big left + 2 stacked right */}
                  {galleryImages.length >= 3 ? (
                    <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden mb-2">
                      {/* Hero image — spans 2 rows on the left */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="col-span-2 row-span-2 relative cursor-pointer group"
                        style={{ aspectRatio: "4/3" }}
                        onClick={() => openLightbox(0)}
                      >
                        <Image
                          src={galleryImages[0]}
                          alt={`${vendor.name} - 1`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="66vw"
                          priority
                        />
                        <div className="absolute inset-0 bg-bridal-charcoal/0 group-hover:bg-bridal-charcoal/30 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-bridal-cream/95 rounded-full p-3">
                            <Expand className="w-5 h-5 text-bridal-charcoal" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Top-right image */}
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="relative cursor-pointer group overflow-hidden"
                        style={{ aspectRatio: "4/3" }}
                        onClick={() => openLightbox(1)}
                      >
                        <Image
                          src={galleryImages[1]}
                          alt={`${vendor.name} - 2`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="33vw"
                        />
                        <div className="absolute inset-0 bg-bridal-charcoal/0 group-hover:bg-bridal-charcoal/35 transition-colors duration-300 flex items-center justify-center">
                          <Expand className="w-4 h-4 text-bridal-ivory opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </motion.div>

                      {/* Bottom-right image — shows count badge if more exist */}
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="relative cursor-pointer group overflow-hidden"
                        style={{ aspectRatio: "4/3" }}
                        onClick={() => openLightbox(galleryImages.length > 3 ? 2 : 2)}
                      >
                        <Image
                          src={galleryImages[2]}
                          alt={`${vendor.name} - 3`}
                          fill
                          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${galleryImages.length > 3 ? "brightness-50" : ""}`}
                          sizes="33vw"
                        />
                        {galleryImages.length > 3 ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-display italic text-bridal-ivory text-[24px] leading-none">+{galleryImages.length - 3}</span>
                            <span className="font-bridal text-bridal-ivory/80 text-[10px] uppercase tracking-[0.22em] mt-1">more</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-bridal-charcoal/0 group-hover:bg-bridal-charcoal/35 transition-colors duration-300 flex items-center justify-center">
                            <Expand className="w-4 h-4 text-bridal-ivory opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}
                      </motion.div>
                    </div>
                  ) : (
                    /* Fallback: simple grid for < 3 images */
                    <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden mb-2">
                      {galleryImages.map((img, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className="relative cursor-pointer group overflow-hidden rounded-xl aspect-[4/3]"
                          onClick={() => openLightbox(i)}
                        >
                          <Image
                            src={img}
                            alt={`${vendor.name} - ${i + 1}`}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="50vw"
                          />
                          <div className="absolute inset-0 bg-bridal-charcoal/0 group-hover:bg-bridal-charcoal/35 transition-colors duration-300 flex items-center justify-center">
                            <Expand className="w-5 h-5 text-bridal-ivory opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* View all button */}
                  {galleryImages.length > 1 && (
                    <button
                      onClick={() => openLightbox(0)}
                      className="w-full mt-2 py-2.5 rounded-xl border border-bridal-beige text-sm font-medium text-bridal-charcoal/85 hover:border-bridal-gold/55 hover:text-bridal-gold-dark hover:bg-bridal-blush transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      View all {galleryImages.length} photos
                    </button>
                  )}
                </>
              )}
              </div>
            </section>

            {/* ===== PACKAGES SECTION ===== */}
            <section ref={packagesRef} id="packages">
              <ScrollReveal>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display italic text-[22px] text-bridal-charcoal">
                    {vendor.type === "Bridal wearing"
                      ? "Outfit Listings"
                      : vendor.type === "Car rental"
                        ? "Cars & Packages"
                        : isStationery
                          ? "Products"
                          : "Packages & Pricing"}
                  </h2>
                  <span className="text-xs font-medium text-bridal-gold-dark bg-bridal-cream border border-bridal-gold/45 px-3 py-1 rounded-full">
                    {(vendor.packages || []).length} listed
                  </span>
                </div>
              </ScrollReveal>

              {/* Bridal Wear — Outfit cards with images */}
              {vendor.type === "Bridal wearing" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(vendor.packages || []).length > 0 ? (
                    (vendor.packages || []).map((pkg, index) => {
                      const imgs = (pkg.images ?? []).map(resolveImg);
                      const badges = getFeatureBadges(pkg);
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-30px" }}
                          transition={{ duration: 0.4, delay: index * 0.08 }}
                          className="border border-bridal-beige bg-bridal-cream rounded-md overflow-hidden hover:shadow-[0_18px_36px_-26px_rgba(176,125,84,0.5)] hover:border-bridal-gold/55 transition-all duration-500"
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] bg-bridal-ivory">
                            {imgs.length > 0 ? (
                              <>
                                <Image
                                  src={imgs[0]}
                                  alt={pkg.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 100vw, 50vw"
                                />
                                {imgs.length > 1 && (
                                  <div className="absolute bottom-2 right-2 bg-bridal-charcoal/70 backdrop-blur-sm text-bridal-ivory font-bridal text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full">
                                    +{imgs.length - 1} photos
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-bridal-cream">
                                <Sparkles className="w-10 h-10 text-bridal-gold/40" />
                              </div>
                            )}
                          </div>
                          {/* Body */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">
                                {pkg.name}
                              </h3>
                              <span className="shrink-0 font-display italic text-[20px] text-bridal-gold-dark">
                                {formatPrice(pkg.price)}
                              </span>
                            </div>
                            {badges.map((group, gi) => (
                              <div key={gi} className="flex flex-wrap gap-1.5">
                                {group.values.map((val, vi) => (
                                  <span
                                    key={vi}
                                    className="inline-block bg-bridal-ivory text-bridal-charcoal/85 text-xs px-2 py-0.5 rounded-full border border-bridal-beige"
                                  >
                                    {val}
                                  </span>
                                ))}
                              </div>
                            ))}
                            <Button
                              onClick={handleBookNow}
                              size="sm"
                              className="w-full inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[11px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300 mt-1"
                            >
                              Book Now
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-bridal-text-soft col-span-2 text-center py-6">
                      No outfit listings yet. Contact the store for details.
                    </p>
                  )}
                </div>
              )}

              {/* Car Rental — Cars + Packages (two separate sections) */}
              {vendor.type === "Car rental" && (() => {
                const allPkgs = vendor.packages || [];
                const carPkgs = allPkgs.filter((pkg: any) => {
                  const f = !Array.isArray(pkg.features) ? (pkg.features as Record<string, string[]>) : {};
                  return !!f.vehicleType?.[0];
                });
                const servicePkgs = allPkgs.filter((pkg: any) => {
                  const f = !Array.isArray(pkg.features) ? (pkg.features as Record<string, string[]>) : {};
                  return !f.vehicleType?.[0];
                });
                return (
                  <div className="space-y-8">
                    {/* Cars section */}
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold text-bridal-charcoal flex items-center gap-2">
                        <Car className="w-4 h-4 text-bridal-gold" /> Cars
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {carPkgs.length > 0 ? carPkgs.map((pkg: any, index: number) => {
                          const imgs = (pkg.images ?? []).map(resolveImg);
                          const features = !Array.isArray(pkg.features)
                            ? (pkg.features as Record<string, string[]>)
                            : {};
                          const vehicleType = features.vehicleType?.[0];
                          const year = features.year?.[0];
                          const color = features.color?.[0];
                          const seats = features.seatingCapacity?.[0];
                          const units = features.unitsAvailable?.[0];
                          const withDriver = features.driver?.[0] === "Yes";
                          const hasAC = features.ac?.[0] === "Yes";
                          const hasDecor = features.decoration?.[0] === "Available";
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-30px" }}
                              transition={{ duration: 0.4, delay: index * 0.08 }}
                              className="border border-bridal-beige bg-bridal-cream rounded-md overflow-hidden hover:shadow-[0_18px_36px_-26px_rgba(176,125,84,0.5)] hover:border-bridal-gold/55 transition-all duration-500"
                            >
                              <div className="relative aspect-video bg-bridal-ivory">
                                {imgs.length > 0 ? (
                                  <Image
                                    src={imgs[0]}
                                    alt={pkg.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-bridal-cream">
                                    <Car className="w-10 h-10 text-bridal-gold/40" />
                                  </div>
                                )}
                                {vehicleType && (
                                  <span className="absolute top-2 left-2 bg-bridal-gold/95 text-bridal-charcoal font-bridal text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 rounded-full">
                                    {vehicleType}
                                  </span>
                                )}
                              </div>
                              <div className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-display italic text-[18px] text-bridal-charcoal">{pkg.name}</h3>
                                    {(year || color) && (
                                      <p className="text-xs text-bridal-text-soft mt-0.5">
                                        {[year, color].filter(Boolean).join(" · ")}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-display italic text-[20px] text-bridal-gold-dark">{formatPrice(pkg.price)}</span>
                                    <p className="text-[10px] text-bridal-text-soft">per event</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {seats && (
                                    <span className="inline-flex items-center gap-1 bg-bridal-ivory text-bridal-charcoal/85 text-xs px-2 py-0.5 rounded-full border border-bridal-beige">
                                      👥 {seats} seats
                                    </span>
                                  )}
                                  {units && (
                                    <span className="inline-flex items-center gap-1 bg-bridal-sage/20 text-[#3F6B43] text-xs px-2 py-0.5 rounded-full border border-bridal-sage/40">
                                      🚗 {units} available
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-bridal-beige">
                                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${withDriver ? "bg-bridal-blush text-bridal-mauve border-bridal-rose/45" : "bg-bridal-ivory text-bridal-text-soft border-bridal-beige"}`}>
                                    🧑 Driver {withDriver ? "Included" : "Not Included"}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${hasAC ? "bg-bridal-cream text-bridal-mauve border-bridal-rose/45" : "bg-bridal-ivory text-bridal-text-soft border-bridal-beige"}`}>
                                    ❄️ {hasAC ? "AC" : "No AC"}
                                  </span>
                                  {hasDecor && (
                                    <span className="inline-flex items-center gap-1 text-[11px] bg-bridal-coral/15 text-bridal-coral px-2 py-0.5 rounded-full border border-bridal-coral/30">
                                      🌸 Decoration
                                    </span>
                                  )}
                                </div>
                                {pkg.description && (
                                  <p className="text-xs text-bridal-text-soft leading-relaxed pt-1 border-t border-bridal-beige">
                                    {pkg.description}
                                  </p>
                                )}
                                <Button
                                  onClick={handleBookNow}
                                  size="sm"
                                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[11px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300 mt-1"
                                >
                                  Book Now
                                </Button>
                              </div>
                            </motion.div>
                          );
                        }) : (
                          <p className="text-sm text-bridal-text-soft col-span-2 text-center py-6">
                            No cars listed yet. Contact the vendor for availability.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Packages section */}
                    {servicePkgs.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-bridal-charcoal">Packages</h3>
                        <StaggerContainer staggerDelay={0.1} className="space-y-4">
                          {servicePkgs.map((pkg: any, index: number) => (
                            <StaggerItem key={index}>
                              <PackageCard
                                pkg={pkg}
                                formatPrice={formatPrice}
                                onBook={handleBookNow}
                                pricingLabel="per event"
                              />
                            </StaggerItem>
                          ))}
                        </StaggerContainer>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Wedding Stationery — Product cards with image + product type + event badges */}
              {isStationery && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(vendor.packages || []).length > 0 ? (
                    (vendor.packages || []).map((pkg, index) => {
                      const imgs = (pkg.images ?? []).map(resolveImg);
                      const features = !Array.isArray(pkg.features) ? (pkg.features as Record<string, string[]>) : {};
                      const productTypes: string[] = Array.isArray(features.productType) ? features.productType : [];
                      const events: string[] = Array.isArray(features.event) ? features.event : [];
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-30px" }}
                          transition={{ duration: 0.4, delay: index * 0.08 }}
                          className="border border-bridal-beige bg-bridal-cream rounded-md overflow-hidden hover:shadow-[0_18px_36px_-26px_rgba(176,125,84,0.5)] hover:border-bridal-gold/55 transition-all duration-500"
                        >
                          <div className="relative aspect-[4/3] bg-bridal-ivory">
                            {imgs.length > 0 ? (
                              <>
                                <Image
                                  src={imgs[0]}
                                  alt={pkg.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 100vw, 50vw"
                                />
                                {imgs.length > 1 && (
                                  <div className="absolute bottom-2 right-2 bg-bridal-charcoal/70 backdrop-blur-sm text-bridal-ivory font-bridal text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full">
                                    +{imgs.length - 1} photos
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-bridal-cream">
                                <Gift className="w-10 h-10 text-bridal-gold/40" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">{pkg.name}</h3>
                              <span className="shrink-0 font-display italic text-[20px] text-bridal-gold-dark">{formatPrice(pkg.price)}</span>
                            </div>
                            {productTypes.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {productTypes.map((pt, i) => (
                                  <span key={i} className="inline-block bg-bridal-blush text-bridal-mauve text-xs px-2 py-0.5 rounded-full border border-bridal-gold/45">{pt}</span>
                                ))}
                              </div>
                            )}
                            {events.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {events.map((ev, i) => (
                                  <span key={i} className="inline-block bg-bridal-cream text-bridal-gold-dark text-xs px-2 py-0.5 rounded-full border border-bridal-gold/45">{ev}</span>
                                ))}
                              </div>
                            )}
                            <Button
                              onClick={handleBookNow}
                              size="sm"
                              className="w-full inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[11px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300 mt-1"
                            >
                              Order Now
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-bridal-text-soft col-span-2 text-center py-6">
                      No products listed yet. Contact the vendor for details.
                    </p>
                  )}
                </div>
              )}

              {/* Generic — all other vendor types */}
              {vendor.type !== "Bridal wearing" && vendor.type !== "Car rental" && !isStationery && (
                <StaggerContainer staggerDelay={0.1} className="space-y-4">
                  {(vendor.packages || []).length > 0 ? (
                    vendor.packages.map((pkg, index) => (
                      <StaggerItem key={index}>
                        <PackageCard
                          pkg={pkg}
                          formatPrice={formatPrice}
                          onBook={handleBookNow}
                          pricingLabel={
                            vendor.type === "Catering" ? "per head"
                            : vendor.type === "Makeup artist" || vendor.type === "Henna artist" ? "per session"
                            : "per event"
                          }
                        />
                      </StaggerItem>
                    ))
                  ) : (
                    <p className="text-sm text-bridal-text-soft text-center py-6">
                      No packages available yet. Contact the vendor for pricing.
                    </p>
                  )}
                </StaggerContainer>
              )}
            </section>

            {/* ===== MENUS SECTION ===== */}
            {hasMenus && (
              <section ref={menusRef} id="menus">
                <ScrollReveal>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display italic text-[22px] text-bridal-charcoal flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-bridal-gold" />
                      Menus
                    </h2>
                    <span className="text-xs font-medium text-bridal-gold-dark bg-bridal-cream border border-bridal-gold/45 px-3 py-1 rounded-full">
                      {vendor.menus!.length} options
                    </span>
                  </div>
                </ScrollReveal>
                <StaggerContainer
                  staggerDelay={0.1}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {vendor.menus!.map((menu, index) => {
                    const menuItems = Array.isArray(menu.data?.items)
                      ? menu.data!.items
                      : [];
                    return (
                      <StaggerItem key={menu.id ?? index}>
                        <Card className="border-bridal-beige hover:border-bridal-gold/45 hover:shadow-lg transition-all duration-300 h-full">
                          <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <h3 className="text-lg font-semibold text-bridal-charcoal capitalize">
                                {menu.title}
                              </h3>
                              <Badge className="bg-bridal-gold/20 text-bridal-gold-dark border-bridal-gold/45 shrink-0">
                                Rs. {menu.price?.toLocaleString()}
                                <span className="text-[10px] font-normal ml-0.5">
                                  / head
                                </span>
                              </Badge>
                            </div>
                            {menuItems.length > 0 && (
                              <div className="flex-1">
                                <p className="text-xs font-medium text-bridal-text-soft uppercase tracking-wider mb-2">
                                  Includes
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {menuItems.map((item, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs font-normal bg-bridal-ivory"
                                    >
                                      {String(item)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Button
                              onClick={handleBookNow}
                              className="w-full mt-4 bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory rounded-xl"
                            >
                              Select Menu
                            </Button>
                          </CardContent>
                        </Card>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </section>
            )}

            {/* ===== REVIEWS SECTION ===== */}
            <section ref={reviewsRef} id="reviews">
              <ScrollReveal>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display italic text-[22px] text-bridal-charcoal">Reviews &amp; Ratings</h2>
                  {allReviews.length > 0 && (
                    <span className="font-bridal text-[11px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark bg-bridal-cream border border-bridal-gold/45 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Star className="w-3 h-3 fill-bridal-gold text-bridal-gold" />
                      {avgRating.toFixed(1)} · {allReviews.length}
                    </span>
                  )}
                </div>
              </ScrollReveal>

              {/* Review summary */}
              <ScrollReveal>
                <Card className="border-bridal-beige mb-6">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <CircularRating rating={avgRating} size={120} />
                      <div className="flex-1 w-full space-y-2">
                        {ratingDistribution.map((item) => (
                          <AnimatedBar
                            key={item.star}
                            label={`${item.star}`}
                            percentage={item.percentage}
                            count={item.count}
                            color={
                              item.star >= 4
                                ? "bg-bridal-gold"
                                : item.star === 3
                                  ? "bg-bridal-gold/70"
                                  : "bg-bridal-coral/70"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>

              {/* Write a review */}
              {isAuthenticated && userBookingId && !alreadyReviewed && (
                <ScrollReveal>
                  <Card className="border border-bridal-gold/35 bg-bridal-cream rounded-md shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] mb-4">
                    <CardContent className="p-5 space-y-4">
                      <h4 className="font-semibold text-bridal-charcoal">Write a Review</h4>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} type="button"
                            onClick={() => setReviewRating(s)}
                            onMouseEnter={() => setReviewHover(s)}
                            onMouseLeave={() => setReviewHover(0)}
                            className="p-0.5"
                          >
                            <Star className={`w-8 h-8 transition-colors ${s <= (reviewHover || reviewRating) ? "fill-bridal-gold text-bridal-gold" : "text-bridal-beige"}`} />
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="ml-2 text-sm text-bridal-text-soft">
                            {["","Poor","Fair","Good","Very Good","Excellent"][reviewRating]}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this vendor..."
                        rows={3}
                        className="w-full font-bridal text-[14px] border border-bridal-beige rounded-[4px] p-4 focus:outline-none focus:ring-1 focus:ring-bridal-gold focus:border-bridal-gold/55 resize-none bg-bridal-ivory text-bridal-charcoal placeholder:text-bridal-text-soft"
                      />
                      <Button
                        onClick={handleReviewSubmit}
                        disabled={reviewRating === 0 || reviewSubmitting}
                        className="w-full bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory"
                      >
                        {reviewSubmitting ? "Submitting…" : "Submit Review"}
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}

              {isAuthenticated && alreadyReviewed && (
                <div className="flex items-center gap-2 font-bridal text-[13px] text-[#3F6B43] bg-bridal-sage/15 border border-bridal-sage/40 rounded-md px-4 py-3 mb-4">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  You've already reviewed this vendor. Thank you!
                </div>
              )}

              {!isAuthenticated && (
                <p className="text-sm text-bridal-text-soft text-center py-2 mb-4">
                  <button onClick={() => router.push("/login")} className="text-bridal-gold-dark font-medium hover:underline">Log in</button> to leave a review after completing a booking.
                </p>
              )}

              {isAuthenticated && !userBookingId && !alreadyReviewed && (
                <p className="text-sm text-bridal-text-soft text-center py-2 mb-4">
                  Complete a booking with this vendor to leave a review.
                </p>
              )}

              {/* Individual reviews */}
              {reviewsLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-bridal-gold border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!reviewsLoading && allReviews.length === 0 && (
                <p className="text-sm text-bridal-text-soft text-center py-8">
                  No reviews yet. Be the first to book and leave a review!
                </p>
              )}
              <StaggerContainer staggerDelay={0.1} className="space-y-4">
                {allReviews.map((review) => (
                  <StaggerItem key={review.id}>
                    <Card className="border-bridal-beige bg-bridal-ivory hover:shadow-[0_18px_36px_-30px_rgba(176,125,84,0.45)] transition-shadow duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-bridal-cream border border-bridal-gold/55 flex items-center justify-center text-bridal-gold-dark font-display italic text-[18px]">
                              {(review.user?.fullName || review.userName || "A").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-display italic text-[16px] text-bridal-charcoal">
                                {review.user?.fullName || review.userName || "Anonymous"}
                              </h4>
                              <p className="font-bridal text-[11px] text-bridal-text-soft mt-0.5">
                                {new Date(review.createdAt || review.date).toLocaleDateString("en-PK", { year:"numeric", month:"short", day:"numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? "fill-bridal-gold text-bridal-gold" : "text-bridal-beige"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="font-bridal text-[13.5px] text-bridal-charcoal/85 leading-[1.7]">{review.comment}</p>
                        )}
                        {review.vendorReply && (
                          <div className="mt-3 pl-4 border-l-2 border-bridal-gold/45 bg-bridal-cream rounded-r-md py-2 pr-3">
                            <span className="font-bridal text-[10px] uppercase tracking-[0.25em] font-medium text-bridal-gold-dark mr-2">Vendor reply</span>
                            <span className="font-bridal text-[13px] text-bridal-charcoal/85">{review.vendorReply}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>

            {/* ===== AVAILABILITY SECTION ===== */}
            <section ref={availabilityRef} id="availability">
              <ScrollReveal>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display italic text-[22px] text-bridal-charcoal">Check Availability</h2>
                  <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#3F6B43] bg-bridal-sage/15 border border-bridal-sage/40 px-3 py-1 rounded-full">
                    Live Calendar
                  </span>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <Card className="border-bridal-beige">
                  <CardContent className="p-5 sm:p-6">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goToPreviousMonth}
                          className="p-2 rounded-full hover:bg-bridal-cream"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h4 className="text-base font-semibold text-bridal-charcoal">
                          {formatMonthYear(currentDate)}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goToNextMonth}
                          className="p-2 rounded-full hover:bg-bridal-cream"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="text-xs border-bridal-gold/55 text-bridal-gold-dark hover:bg-bridal-cream"
                      >
                        Today
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="text-center text-xs font-medium text-bridal-text-soft py-2"
                          >
                            {day}
                          </div>
                        ),
                      )}
                      {(() => {
                        const daysInMonth = getDaysInMonth(currentDate);
                        const firstDayOfMonth = getFirstDayOfMonth(currentDate);
                        const today = new Date();
                        const isCurrentMonth =
                          currentDate.getMonth() === today.getMonth() &&
                          currentDate.getFullYear() === today.getFullYear();
                        const calendarDays = [];

                        for (let i = 0; i < firstDayOfMonth; i++) {
                          calendarDays.push(
                            <div key={`empty-${i}`} className="py-2" />,
                          );
                        }

                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(
                            currentDate.getFullYear(),
                            currentDate.getMonth(),
                            day,
                          );
                          const avail = getDateAvailInfo(date);
                          const isBlocked = avail?.isBlocked ?? false;
                          const isFullyBooked = !isBlocked && avail !== null && avail.availableSlots.length === 0;
                          const selectable = isDateSelectable(date);
                          const isToday =
                            isCurrentMonth && day === today.getDate();
                          const isPast = isDateInPast(date);
                          const isSelected =
                            selectedDate &&
                            format(selectedDate, "yyyy-MM-dd") ===
                              format(date, "yyyy-MM-dd");

                          calendarDays.push(
                            <div
                              key={day}
                              onClick={() => !isPast && handleDateSelect(date)}
                              title={
                                isBlocked
                                  ? avail?.blockReason || "Vendor not available this day"
                                  : isFullyBooked
                                  ? "Fully booked"
                                  : undefined
                              }
                              className={`text-center font-bridal text-[12px] sm:text-[13px] py-2 rounded-md transition-all duration-200 relative ${
                                isSelected
                                  ? "bg-bridal-gold text-bridal-charcoal font-medium shadow-[0_6px_18px_-10px_rgba(176,125,84,0.55)]"
                                  : isToday
                                    ? "bg-bridal-cream text-bridal-gold-dark font-medium border border-bridal-gold/55"
                                    : isBlocked
                                    ? "bg-bridal-beige/50 text-bridal-text-soft line-through cursor-not-allowed"
                                    : isFullyBooked
                                    ? "bg-bridal-coral/15 text-bridal-coral line-through cursor-not-allowed"
                                    : selectable
                                      ? "hover:bg-bridal-blush text-bridal-charcoal cursor-pointer"
                                      : "text-bridal-text-soft/60 cursor-not-allowed"
                              }`}
                            >
                              {day}
                              {selectable && !isSelected && !isPast && (
                                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-bridal-sage rounded-full" />
                              )}
                            </div>,
                          );
                        }
                        return calendarDays;
                      })()}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-3 font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-text-soft flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-bridal-cream border border-bridal-gold/55 rounded-full" />
                        Today
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-bridal-gold rounded-full" />
                        Selected
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-bridal-sage rounded-full" />
                        Available
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-bridal-coral/20 border border-bridal-coral/45 rounded-full" />
                        Fully booked
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-bridal-beige border border-bridal-beige rounded-full" />
                        Unavailable
                      </span>
                    </div>

                    {/* Selected date details */}
                    {selectedDate && (() => {
                      const avail = getDateAvailInfo(selectedDate);
                      const isBlocked = avail?.isBlocked;
                      const isFullyBooked = !isBlocked && avail && avail.availableSlots.length === 0;
                      const isAvailable = !isBlocked && !isFullyBooked;

                      return (
                        <div className={`mt-5 p-4 rounded-md border ${
                          isBlocked
                            ? "bg-bridal-beige/40 border-bridal-beige"
                            : isFullyBooked
                            ? "bg-bridal-coral/15 border-bridal-coral/40"
                            : "bg-bridal-sage/15 border-bridal-sage/40"
                        }`}>
                          <div className="flex items-start gap-3">
                            <CalendarCheck className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                              isBlocked ? "text-bridal-text-soft" : isFullyBooked ? "text-bridal-coral" : "text-[#3F6B43]"
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-display italic text-[18px] text-bridal-charcoal mb-1">
                                {format(selectedDate, "EEEE, MMMM dd, yyyy")}
                              </h4>
                              {isBlocked ? (
                                <p className="font-bridal text-[12px] uppercase tracking-[0.2em] font-medium text-bridal-text-soft">
                                  {avail?.blockReason || "Vendor not available this day"}
                                </p>
                              ) : isFullyBooked ? (
                                <p className="font-bridal text-[12px] uppercase tracking-[0.2em] font-medium text-bridal-coral">All time slots are fully booked</p>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium px-2.5 py-1 rounded-full bg-bridal-sage/25 text-[#3F6B43] border border-bridal-sage/40">
                                      {avail ? `${avail.availableSlots.length} slot${avail.availableSlots.length !== 1 ? "s" : ""} available` : "Available"}
                                    </span>
                                  </div>
                                  {avail && avail.availableSlots.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {avail.availableSlots.map((slot, i) => {
                                        const [h, m] = slot.split(":").map(Number);
                                        const time = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
                                        return (
                                          <span key={i} className="inline-block font-bridal text-[11px] tabular-nums px-2.5 py-1 rounded-full bg-bridal-cream border border-bridal-beige text-bridal-charcoal">{time}</span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </ScrollReveal>
            </section>
          </div>

          {/* ===== STICKY SIDEBAR (Desktop) ===== */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {/* Booking card */}
              <Card className="border border-bridal-beige bg-bridal-cream rounded-md shadow-[0_18px_40px_-32px_rgba(176,125,84,0.4)]">
                <CardContent className="p-6">
                  <div className="text-center mb-5 pb-5 border-b border-bridal-beige/70">
                    <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-text-label">
                      Starting from
                    </span>
                    <p className="font-display italic text-[34px] text-bridal-gold-dark leading-none mt-2">
                      {startingPrice ? formatPrice(startingPrice) : "See Packages"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBookNow}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_14px_30px_-12px_rgba(176,125,84,0.7)] transition-all duration-300 mb-3"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Book now
                  </button>
                  <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[4px] border border-bridal-gold/45 bg-bridal-cream hover:bg-bridal-blush hover:border-bridal-mauve text-bridal-gold-dark hover:text-bridal-mauve font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? "fill-bridal-coral text-bridal-coral" : ""}`} />
                    {isFavorite ? "Saved" : "Save to favorites"}
                  </button>
                </CardContent>
              </Card>

              {/* Location & Contact card */}
              <Card className="border border-bridal-beige bg-bridal-cream rounded-md shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)]">
                <CardHeader className="pb-3 border-b border-bridal-beige bg-bridal-ivory rounded-t-md">
                  <CardTitle className="font-display italic text-[20px] text-bridal-charcoal flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-bridal-gold" />
                    Get in touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-3 font-bridal text-[13px] text-bridal-charcoal/85">
                    <MapPin className="w-4 h-4 text-bridal-gold" />
                    <span>{vendor.location || vendor.city}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleMessageVendor}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[4px] border border-bridal-gold/45 bg-bridal-cream hover:bg-bridal-blush hover:border-bridal-mauve text-bridal-gold-dark hover:text-bridal-mauve font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message vendor
                  </button>
                  <button
                    type="button"
                    onClick={handleBookNow}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Book &amp; get details
                  </button>
                </CardContent>
              </Card>

              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[4px] border border-bridal-beige bg-bridal-cream hover:border-bridal-gold/55 hover:text-bridal-gold-dark text-bridal-charcoal font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share this vendor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FIXED BOTTOM BAR (Mobile) ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bridal-cream/95 backdrop-blur-xl border-t border-bridal-beige px-4 py-3 shadow-[0_-8px_30px_-16px_rgba(176,125,84,0.45)]">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <span className="font-bridal text-[9.5px] uppercase tracking-[0.25em] font-medium text-bridal-text-label">
              From
            </span>
            <p className="font-display italic text-[20px] text-bridal-gold-dark leading-tight">
              {formatPrice(vendor.minimumPrice || vendor.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleFavoriteToggle}
            className="w-11 h-11 inline-flex items-center justify-center rounded-[4px] border border-bridal-gold/45 bg-bridal-cream hover:border-bridal-mauve transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-bridal-coral text-bridal-coral" : "text-bridal-gold"}`} />
          </button>
          <button
            type="button"
            onClick={handleMessageVendor}
            className="w-11 h-11 inline-flex items-center justify-center rounded-[4px] border border-bridal-gold/45 bg-bridal-cream hover:border-bridal-mauve transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-bridal-gold" />
          </button>
          <button
            type="button"
            onClick={handleBookNow}
            className="inline-flex items-center justify-center h-11 px-6 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[11px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
          >
            Book now
          </button>
        </div>
      </div>

      {/* Bottom spacer for fixed bar */}
      <div className="lg:hidden h-20" />

      {/* ===== LIGHTBOX DIALOG ===== */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 bg-bridal-charcoal border-0 rounded-none overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Gallery — {vendor.name}</DialogTitle>

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-bridal-charcoal/85 backdrop-blur-sm z-50 shrink-0 border-b border-bridal-ivory/10">
            <div>
              <p className="font-display italic text-bridal-ivory text-[18px] leading-tight">{vendor.name}</p>
              <p className="font-bridal text-bridal-ivory/55 text-[11px] uppercase tracking-[0.25em] mt-0.5">Gallery</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bridal text-bridal-ivory/70 text-[12px] uppercase tracking-[0.25em] tabular-nums">
                {lightboxIndex + 1} / {galleryImages.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close gallery"
                className="w-9 h-9 rounded-full bg-bridal-ivory/10 hover:bg-bridal-gold hover:text-bridal-charcoal flex items-center justify-center text-bridal-ivory transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main image swiper */}
          <div className="flex-1 min-h-0">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={false}
              initialSlide={lightboxIndex}
              onSwiper={(swiper) => { lightboxSwiperRef.current = swiper; }}
              onSlideChange={(swiper) => {
                setLightboxIndex(swiper.activeIndex);
                scrollThumbIntoView(swiper.activeIndex);
              }}
              className="h-full w-full lightbox-swiper"
            >
              {galleryImages.map((img, i) => (
                <SwiperSlide key={i} className="flex items-center justify-center bg-bridal-charcoal">
                  <div className="relative w-full h-full">
                    <Image
                      src={img}
                      alt={`${vendor.name} — ${i + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Thumbnail strip */}
          {galleryImages.length > 1 && (
            <div ref={thumbStripRef} className="shrink-0 bg-bridal-charcoal/85 backdrop-blur-sm py-3 px-4 overflow-x-auto scrollbar-none border-t border-bridal-ivory/10">
              <div className="flex gap-2 w-max mx-auto">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToLightboxSlide(i)}
                    className={`relative w-16 h-16 rounded-md overflow-hidden shrink-0 transition-all duration-200 ${
                      i === lightboxIndex
                        ? "ring-2 ring-bridal-gold ring-offset-2 ring-offset-bridal-charcoal opacity-100 scale-105"
                        : "opacity-45 hover:opacity-80"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Drawer */}
      {vendor.userId && (
        <ChatDrawer
          open={chatDrawerOpen}
          onOpenChange={setChatDrawerOpen}
          vendorUserId={vendor.userId}
          vendorName={vendor.name}
          vendorImage={vendor.images?.[0]}
        />
      )}
    </div>
  );
}
