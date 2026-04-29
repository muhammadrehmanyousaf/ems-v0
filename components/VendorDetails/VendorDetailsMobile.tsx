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
      <span className="text-sm font-medium text-neutral-600 w-8">{label}</span>
      <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs text-neutral-500 w-6 text-right">{count}</span>
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

  const ratingColor =
    rating >= 4.5
      ? "text-emerald-500"
      : rating >= 4
        ? "text-purple-500"
        : rating >= 3
          ? "text-gold-500"
          : "text-neutral-400";
  const strokeColor =
    rating >= 4.5
      ? "#10b981"
      : rating >= 4
        ? "#8b5cf6"
        : rating >= 3
          ? "#D4AF37"
          : "#9ca3af";
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
            stroke="#f3f4f6"
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
          <span className={`text-2xl font-bold ${ratingColor}`}>
            {rating.toFixed(1)}
          </span>
          <span className="text-[10px] text-neutral-400">/5</span>
        </div>
      </div>
      <span className={`text-sm font-semibold ${ratingColor}`}>
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
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full border border-purple-100"
          >
            <CheckCircle className="w-3 h-3 shrink-0" />
            {item}
          </span>
        ))}
        {!expanded && overflow > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="inline-flex items-center bg-neutral-100 hover:bg-purple-50 text-neutral-500 hover:text-purple-600 text-xs font-medium px-2.5 py-1 rounded-full border border-neutral-200 transition-colors"
          >
            +{overflow} more
          </button>
        )}
        {expanded && overflow > 0 && (
          <button
            onClick={() => setExpanded(false)}
            className="inline-flex items-center bg-neutral-100 hover:bg-purple-50 text-neutral-500 hover:text-purple-600 text-xs font-medium px-2.5 py-1 rounded-full border border-neutral-200 transition-colors"
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
    <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-700" />
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <h3 className="text-xl font-bold text-neutral-900 leading-tight">{pkg.name}</h3>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold text-purple-700">{formatPrice(pkg.price)}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{pricingLabel}</p>
          </div>
        </div>

        {/* Feature groups */}
        {groups.length > 0 && (
          <div className="space-y-4 mb-5 pt-4 border-t border-neutral-100">
            {groups.map((g, gi) => (
              <FeatureGroup key={gi} label={g.label} items={g.items} />
            ))}
          </div>
        )}

        <Button
          onClick={onBook}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold shadow-sm shadow-purple-200/50"
        >
          Select Package
        </Button>
      </div>
    </div>
  );
}

export default function VendorDetailsMobile({
  vendor,
}: VendorDetailsMobileProps) {
  const [isFavorite, setIsFavorite] = useState(false);
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

  // Load favorite status from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites);
      setIsFavorite(favorites.includes(vendor.id));
    }
  }, [vendor.id]);

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

  // Save favorite status to localStorage
  const handleFavoriteToggle = () => {
    const newFavoriteStatus = !isFavorite;
    setIsFavorite(newFavoriteStatus);

    const savedFavorites = localStorage.getItem("favorites");
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : [];

    if (newFavoriteStatus) {
      if (!favorites.includes(vendor.id)) {
        favorites.push(vendor.id);
      }
    } else {
      favorites = favorites.filter((id: string) => id !== vendor.id);
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
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
    <div className="min-h-screen bg-gray-50">
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

        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/60 via-purple-900/40 to-purple-950/80 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 via-transparent to-purple-950/30 z-10" />

        {/* Top navigation bar */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteToggle}
              className="p-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 hover:text-white"
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 hover:text-white"
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
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-md text-xs px-3 py-1">
                  <VendorIcon className="w-3.5 h-3.5 mr-1.5" />
                  {vendor.type || "Vendor"}
                </Badge>
                {vendor.sponsored && (
                  <Badge className="bg-gold-500/90 text-white border-0 text-xs px-3 py-1">
                    <Crown className="w-3.5 h-3.5 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-3 leading-tight">
                {vendor.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 mb-5">
                <span className="flex items-center gap-1.5 text-sm sm:text-base">
                  <MapPin className="w-4 h-4 text-purple-300" />
                  {vendor.location || vendor.city}
                </span>
                <span className="flex items-center gap-1.5 text-sm sm:text-base">
                  <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                  {(liveAvgRating ?? vendor.rating)?.toFixed(1)} ({allReviews.length} reviews)
                </span>
                <span className="flex items-center gap-1.5 text-sm sm:text-base">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Verified
                </span>
              </div>

              {/* Price + CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="text-white">
                  <span className="text-xs text-white/60 uppercase tracking-wider">
                    Starting from
                  </span>
                  <p className="text-2xl sm:text-3xl font-bold text-gold-300">
                    {startingPrice ? formatPrice(startingPrice) : "See Packages"}
                  </p>
                </div>
                <Button
                  onClick={handleBookNow}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 text-base font-semibold rounded-xl shadow-lg shadow-purple-900/30 hover:shadow-xl transition-all duration-300"
                >
                  <CalendarCheck className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Image counter badge */}
        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={() => openLightbox(0)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-xs border border-white/10 hover:bg-black/50 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            {galleryImages.length} Photos
          </button>
        </div>
      </div>

      {/* ===== SCROLL-SPY NAVIGATION ===== */}
      <div
        ref={scrollSpyNavRef}
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-purple-100/50 shadow-sm"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-4 py-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`relative px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 ${
                  activeSection === section.id
                    ? "text-purple-700 bg-purple-50"
                    : "text-neutral-500 hover:text-purple-600 hover:bg-purple-50/50"
                }`}
              >
                {section.label}
                {activeSection === section.id && (
                  <motion.div
                    layoutId="scrollspy-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-purple-600 rounded-full"
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
                  {/* Key facts chips */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Type */}
                    <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <VendorIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-purple-400 uppercase tracking-widest font-semibold">Type</p>
                        <p className="text-sm font-bold text-purple-900 truncate">{vendor.type || "Vendor"}</p>
                      </div>
                    </div>

                    {/* Starting Price */}
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white font-extrabold text-xs">Rs</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-emerald-500 uppercase tracking-widest font-semibold">Starting</p>
                        <p className="text-sm font-bold text-emerald-900 truncate">{startingPrice ? formatPrice(startingPrice) : "See Packages"}</p>
                      </div>
                    </div>

                    {/* Capacity */}
                    {["Wedding venue", "Catering", "Decorator"].includes(vendor.type ?? "") && (vendor.minCapacity || vendor.maxCapacity || vendor.capacity) && (
                      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-blue-400 uppercase tracking-widest font-semibold">Capacity</p>
                          <p className="text-sm font-bold text-blue-900 truncate">
                            {vendor.minCapacity && vendor.maxCapacity
                              ? `${vendor.minCapacity}–${vendor.maxCapacity}`
                              : vendor.maxCapacity ?? vendor.minCapacity ?? vendor.capacity} Guests
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Min. Order (Stationery) */}
                    {isStationery && vendor.minCapacity && (
                      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <PackageIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-blue-400 uppercase tracking-widest font-semibold">Min. Order</p>
                          <p className="text-sm font-bold text-blue-900">{vendor.minCapacity} pcs</p>
                        </div>
                      </div>
                    )}

                    {/* Advance */}
                    {vendor.downPayment && (
                      <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-extrabold text-xs">Rs</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-amber-500 uppercase tracking-widest font-semibold">Advance</p>
                          <p className="text-sm font-bold text-amber-900 truncate">
                            {vendor.downPaymentType === "Percentage" ? `${vendor.downPayment}%` : formatPrice(vendor.downPayment)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Cancellation */}
                    {cancellationPolicy && (
                      <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-teal-500 uppercase tracking-widest font-semibold">Cancellation</p>
                          <p className="text-sm font-bold text-teal-900 truncate">{cancellationPolicy}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {vendor.description ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h2 className="text-base font-bold text-gray-900 mb-3">About</h2>
                      <p className="text-sm text-gray-600 leading-relaxed break-words">
                        {vendor.description}
                      </p>
                    </div>
                  ) : null}

                  {/* subBusinessType — multi-select types (Photographer, Decorator, Henna, Makeup) */}
                  {isSubBizTypeMulti && subBizTypeValues.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        {subBizTypeLabel}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {subBizTypeValues.map((val, i) => (
                          <Badge key={i} variant="secondary" className="text-sm px-3 py-1 bg-purple-50 text-purple-700 border-purple-200">
                            {val}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expertise / Specializations */}
                  {Array.isArray(vendor.expertise) && vendor.expertise.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        {expertiseLabel}
                      </h3>
                      {expertiseGroups.length > 0 ? (
                        <div className="space-y-3">
                          {expertiseGroups.map(({ group, emoji, items }) => {
                            const picked = items.filter((i) => vendor.expertise!.includes(i));
                            if (!picked.length) return null;
                            return (
                              <div key={group} className="border border-neutral-200 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border-b border-neutral-200">
                                  <span className="text-sm">{emoji}</span>
                                  <p className="text-xs font-semibold text-neutral-700">{group}</p>
                                  <span className="ml-auto text-xs text-neutral-400">{picked.length}</span>
                                </div>
                                <div className="px-3 py-2 flex flex-wrap gap-1.5">
                                  {picked.map((v, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
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
                              className="text-sm px-3 py-1 bg-purple-50 text-purple-700 border-purple-200"
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-base font-bold text-gray-900 mb-4">
                        Services & Features
                      </h3>
                      <StaggerContainer
                        staggerDelay={0.05}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                      >
                        {vendorSpecificDetails.map((detail, i) => (
                          <StaggerItem key={i}>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
                              <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs text-neutral-400">{detail.label}</p>
                                <p className="text-sm font-medium text-neutral-800 truncate">{detail.value}</p>
                              </div>
                            </div>
                          </StaggerItem>
                        ))}
                      </StaggerContainer>
                    </div>
                  )}

                  {/* Amenities + serviceProvided */}
                  {(vendor.amenities?.length > 0 || (serviceProvidedLabel && Array.isArray(vendor.serviceProvided) && vendor.serviceProvided.length > 0)) && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
                      {vendor.amenities?.length > 0 && (
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-3">
                            {amenitiesLabel}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {vendor.amenities.map((amenity, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-sm px-3 py-1 border-purple-200 text-purple-700"
                              >
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {serviceProvidedLabel && Array.isArray(vendor.serviceProvided) && vendor.serviceProvided.length > 0 && (
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-3">
                            {serviceProvidedLabel}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {vendor.serviceProvided.map((val, i) => (
                              <Badge key={i} variant="outline" className="text-sm px-3 py-1 border-purple-200 text-purple-700">
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-base font-bold text-gray-900 mb-3">
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-base font-bold text-gray-900 mb-4">
                        Booking Terms
                      </h3>
                      <div className="space-y-2.5">
                        {vendor.downPayment ? (
                          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <DollarSign className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-neutral-400">Advance Payment Required</p>
                              <p className="text-sm font-medium text-neutral-800">
                                {vendor.downPaymentType === "Percentage"
                                  ? `${vendor.downPayment}% of total amount`
                                  : formatPrice(vendor.downPayment)}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        {cancellationPolicy && (
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                            <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-neutral-400">Cancellation Policy</p>
                              <p className="text-sm font-medium text-neutral-800">{cancellationPolicy}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Information + Instruction */}
                  {(vendor.additionalInfo || (vendor.instruction && !isStationery)) && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                      {vendor.additionalInfo && (
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-2">
                            Additional Information
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">{vendor.additionalInfo}</p>
                        </div>
                      )}
                      {vendor.instruction && !isStationery && (
                        <div>
                          <h3 className="text-base font-bold text-gray-900 mb-2">
                            {vendor.type === "Bridal wearing" ? "Order Lead Time" : "Special Instructions"}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">{vendor.instruction}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Services Offered — bridal + photographer/decorator/henna/makeup boolean pills */}
                  {(enabledBridalServices.length > 0 || enabledTypeServices.length > 0) && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-base font-bold text-gray-900 mb-3">
                        Services Offered
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {[...enabledBridalServices, ...enabledTypeServices].map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1 text-sm font-medium"
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <ScrollReveal>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Gallery</h2>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
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
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Expand className="w-5 h-5 text-white" />
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
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                          <Expand className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                            <span className="text-white text-xl font-bold leading-none">+{galleryImages.length - 3}</span>
                            <span className="text-white/80 text-xs mt-0.5">more</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                            <Expand className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                            <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* View all button */}
                  {galleryImages.length > 1 && (
                    <button
                      onClick={() => openLightbox(0)}
                      className="w-full mt-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center gap-2"
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
                  <h2 className="text-lg font-bold text-gray-900">
                    {vendor.type === "Bridal wearing"
                      ? "Outfit Listings"
                      : vendor.type === "Car rental"
                        ? "Cars & Packages"
                        : isStationery
                          ? "Products"
                          : "Packages & Pricing"}
                  </h2>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
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
                          className="border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] bg-neutral-100">
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
                                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                                    +{imgs.length - 1} photos
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-purple-50">
                                <Sparkles className="w-10 h-10 text-purple-200" />
                              </div>
                            )}
                          </div>
                          {/* Body */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-neutral-900 text-base leading-tight">
                                {pkg.name}
                              </h3>
                              <span className="shrink-0 text-lg font-bold text-purple-700">
                                {formatPrice(pkg.price)}
                              </span>
                            </div>
                            {badges.map((group, gi) => (
                              <div key={gi} className="flex flex-wrap gap-1.5">
                                {group.values.map((val, vi) => (
                                  <span
                                    key={vi}
                                    className="inline-block bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full border border-neutral-200"
                                  >
                                    {val}
                                  </span>
                                ))}
                              </div>
                            ))}
                            <Button
                              onClick={handleBookNow}
                              size="sm"
                              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl mt-1"
                            >
                              Book Now
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-neutral-500 col-span-2 text-center py-6">
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
                      <h3 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
                        <Car className="w-4 h-4 text-blue-500" /> Cars
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
                              className="border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
                            >
                              <div className="relative aspect-video bg-neutral-100">
                                {imgs.length > 0 ? (
                                  <Image
                                    src={imgs[0]}
                                    alt={pkg.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-blue-50">
                                    <Car className="w-10 h-10 text-blue-200" />
                                  </div>
                                )}
                                {vehicleType && (
                                  <span className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    {vehicleType}
                                  </span>
                                )}
                              </div>
                              <div className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-semibold text-neutral-900 text-base">{pkg.name}</h3>
                                    {(year || color) && (
                                      <p className="text-xs text-neutral-400 mt-0.5">
                                        {[year, color].filter(Boolean).join(" · ")}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-lg font-bold text-purple-700">{formatPrice(pkg.price)}</span>
                                    <p className="text-[10px] text-neutral-400">per event</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {seats && (
                                    <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full border border-neutral-200">
                                      👥 {seats} seats
                                    </span>
                                  )}
                                  {units && (
                                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                                      🚗 {units} available
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-neutral-100">
                                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${withDriver ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-neutral-50 text-neutral-400 border-neutral-200"}`}>
                                    🧑 Driver {withDriver ? "Included" : "Not Included"}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${hasAC ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-neutral-50 text-neutral-400 border-neutral-200"}`}>
                                    ❄️ {hasAC ? "AC" : "No AC"}
                                  </span>
                                  {hasDecor && (
                                    <span className="inline-flex items-center gap-1 text-[11px] bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200">
                                      🌸 Decoration
                                    </span>
                                  )}
                                </div>
                                {pkg.description && (
                                  <p className="text-xs text-neutral-500 leading-relaxed pt-1 border-t border-neutral-100">
                                    {pkg.description}
                                  </p>
                                )}
                                <Button
                                  onClick={handleBookNow}
                                  size="sm"
                                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl mt-1"
                                >
                                  Book Now
                                </Button>
                              </div>
                            </motion.div>
                          );
                        }) : (
                          <p className="text-sm text-neutral-500 col-span-2 text-center py-6">
                            No cars listed yet. Contact the vendor for availability.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Packages section */}
                    {servicePkgs.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold text-neutral-800">Packages</h3>
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
                          className="border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                          <div className="relative aspect-[4/3] bg-neutral-100">
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
                                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                                    +{imgs.length - 1} photos
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-purple-50">
                                <Gift className="w-10 h-10 text-purple-200" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-neutral-900 text-base leading-tight">{pkg.name}</h3>
                              <span className="shrink-0 text-lg font-bold text-purple-700">{formatPrice(pkg.price)}</span>
                            </div>
                            {productTypes.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {productTypes.map((pt, i) => (
                                  <span key={i} className="inline-block bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full border border-purple-100">{pt}</span>
                                ))}
                              </div>
                            )}
                            {events.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {events.map((ev, i) => (
                                  <span key={i} className="inline-block bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-100">{ev}</span>
                                ))}
                              </div>
                            )}
                            <Button
                              onClick={handleBookNow}
                              size="sm"
                              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl mt-1"
                            >
                              Order Now
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-neutral-500 col-span-2 text-center py-6">
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
                    <p className="text-sm text-neutral-500 text-center py-6">
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
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-purple-500" />
                      Menus
                    </h2>
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
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
                        <Card className="border-neutral-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 h-full">
                          <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <h3 className="text-lg font-semibold text-neutral-900 capitalize">
                                {menu.title}
                              </h3>
                              <Badge className="bg-purple-100 text-purple-700 border-purple-200 shrink-0">
                                Rs. {menu.price?.toLocaleString()}
                                <span className="text-[10px] font-normal ml-0.5">
                                  / head
                                </span>
                              </Badge>
                            </div>
                            {menuItems.length > 0 && (
                              <div className="flex-1">
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                                  Includes
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {menuItems.map((item, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs font-normal bg-neutral-50"
                                    >
                                      {String(item)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Button
                              onClick={handleBookNow}
                              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl"
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
                  <h2 className="text-lg font-bold text-gray-900">Reviews & Ratings</h2>
                  {allReviews.length > 0 && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {avgRating.toFixed(1)} · {allReviews.length}
                    </span>
                  )}
                </div>
              </ScrollReveal>

              {/* Review summary */}
              <ScrollReveal>
                <Card className="border-neutral-100 mb-6">
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
                                ? "bg-emerald-500"
                                : item.star === 3
                                  ? "bg-gold-500"
                                  : "bg-orange-400"
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
                  <Card className="border-purple-100 bg-purple-50/40 mb-4">
                    <CardContent className="p-5 space-y-4">
                      <h4 className="font-semibold text-neutral-800">Write a Review</h4>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} type="button"
                            onClick={() => setReviewRating(s)}
                            onMouseEnter={() => setReviewHover(s)}
                            onMouseLeave={() => setReviewHover(0)}
                            className="p-0.5"
                          >
                            <Star className={`w-8 h-8 transition-colors ${s <= (reviewHover || reviewRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="ml-2 text-sm text-neutral-500">
                            {["","Poor","Fair","Good","Very Good","Excellent"][reviewRating]}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this vendor..."
                        rows={3}
                        className="w-full text-sm border border-purple-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-400 resize-none bg-white"
                      />
                      <Button
                        onClick={handleReviewSubmit}
                        disabled={reviewRating === 0 || reviewSubmitting}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                      >
                        {reviewSubmitting ? "Submitting…" : "Submit Review"}
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )}

              {isAuthenticated && alreadyReviewed && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  You've already reviewed this vendor. Thank you!
                </div>
              )}

              {!isAuthenticated && (
                <p className="text-sm text-neutral-500 text-center py-2 mb-4">
                  <button onClick={() => router.push("/login")} className="text-purple-600 font-medium hover:underline">Log in</button> to leave a review after completing a booking.
                </p>
              )}

              {isAuthenticated && !userBookingId && !alreadyReviewed && (
                <p className="text-sm text-neutral-400 text-center py-2 mb-4">
                  Complete a booking with this vendor to leave a review.
                </p>
              )}

              {/* Individual reviews */}
              {reviewsLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!reviewsLoading && allReviews.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-8">
                  No reviews yet. Be the first to book and leave a review!
                </p>
              )}
              <StaggerContainer staggerDelay={0.1} className="space-y-4">
                {allReviews.map((review) => (
                  <StaggerItem key={review.id}>
                    <Card className="border-neutral-100 hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold text-sm">
                              {(review.user?.fullName || review.userName || "A").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-neutral-900">
                                {review.user?.fullName || review.userName || "Anonymous"}
                              </h4>
                              <p className="text-xs text-neutral-400">
                                {new Date(review.createdAt || review.date).toLocaleDateString("en-PK", { year:"numeric", month:"short", day:"numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-200"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
                        )}
                        {review.vendorReply && (
                          <div className="mt-3 pl-3 border-l-2 border-purple-200 text-sm text-neutral-600 bg-purple-50/40 rounded-r-lg py-2 pr-3">
                            <span className="font-semibold text-purple-700 text-xs uppercase tracking-wide">Vendor reply: </span>
                            {review.vendorReply}
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
                  <h2 className="text-lg font-bold text-gray-900">Check Availability</h2>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                    Live Calendar
                  </span>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <Card className="border-neutral-100">
                  <CardContent className="p-5 sm:p-6">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goToPreviousMonth}
                          className="p-2 rounded-full hover:bg-purple-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h4 className="text-base font-semibold text-neutral-900">
                          {formatMonthYear(currentDate)}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goToNextMonth}
                          className="p-2 rounded-full hover:bg-purple-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
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
                            className="text-center text-xs font-medium text-neutral-500 py-2"
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
                              className={`text-center text-xs sm:text-sm py-2 rounded-lg transition-all duration-200 relative ${
                                isSelected
                                  ? "bg-purple-600 text-white font-semibold shadow-lg"
                                  : isToday
                                    ? "bg-purple-100 text-purple-700 font-semibold"
                                    : isBlocked
                                    ? "bg-orange-50 text-orange-300 line-through cursor-not-allowed"
                                    : isFullyBooked
                                    ? "bg-red-50 text-red-300 line-through cursor-not-allowed"
                                    : selectable
                                      ? "hover:bg-purple-50 text-neutral-900 cursor-pointer"
                                      : "text-neutral-300 cursor-not-allowed"
                              }`}
                            >
                              {day}
                              {selectable && !isSelected && !isPast && (
                                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              )}
                            </div>,
                          );
                        }
                        return calendarDays;
                      })()}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-3 text-xs text-neutral-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-purple-100 rounded-full" />
                        Today
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-purple-600 rounded-full" />
                        Selected
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        Available
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded-full" />
                        Fully booked
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-orange-100 border border-orange-300 rounded-full" />
                        Vendor unavailable
                      </span>
                    </div>

                    {/* Selected date details */}
                    {selectedDate && (() => {
                      const avail = getDateAvailInfo(selectedDate);
                      const isBlocked = avail?.isBlocked;
                      const isFullyBooked = !isBlocked && avail && avail.availableSlots.length === 0;
                      const isAvailable = !isBlocked && !isFullyBooked;

                      return (
                        <div className={`mt-5 p-4 rounded-xl border ${
                          isBlocked
                            ? "bg-orange-50 border-orange-200"
                            : isFullyBooked
                            ? "bg-red-50 border-red-200"
                            : "bg-emerald-50 border-emerald-200"
                        }`}>
                          <div className="flex items-start gap-3">
                            <CalendarCheck className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                              isBlocked ? "text-orange-500" : isFullyBooked ? "text-red-400" : "text-emerald-600"
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-semibold text-neutral-900 mb-1">
                                {format(selectedDate, "EEEE, MMMM dd, yyyy")}
                              </h4>
                              {isBlocked ? (
                                <p className="text-sm text-orange-600">
                                  {avail?.blockReason || "Vendor not available this day"}
                                </p>
                              ) : isFullyBooked ? (
                                <p className="text-sm text-red-500">All time slots are fully booked</p>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {avail ? (
                                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                                        {avail.availableSlots.length} slot{avail.availableSlots.length !== 1 ? "s" : ""} available
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                                        Available
                                      </Badge>
                                    )}
                                  </div>
                                  {avail && avail.availableSlots.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {avail.availableSlots.map((slot, i) => {
                                        const [h, m] = slot.split(":").map(Number);
                                        const time = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
                                        return (
                                          <Badge key={i} variant="outline" className="text-xs">{time}</Badge>
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
            <div className="sticky top-20 space-y-5">
              {/* Booking card */}
              <Card className="border-purple-100 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center mb-5">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">
                      Starting from
                    </span>
                    <p className="text-3xl font-bold text-purple-700">
                      {startingPrice ? formatPrice(startingPrice) : "See Packages"}
                    </p>
                  </div>
                  <Button
                    onClick={handleBookNow}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl text-base font-semibold shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all duration-300 mb-3"
                  >
                    <CalendarCheck className="w-5 h-5 mr-2" />
                    Book Now
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleFavoriteToggle}
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl"
                  >
                    <Heart
                      className={`w-5 h-5 mr-2 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                    />
                    {isFavorite ? "Saved" : "Save to Favorites"}
                  </Button>
                </CardContent>
              </Card>

              {/* Location & Contact card */}
              <Card className="border-neutral-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-500" />
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span>{vendor.location || vendor.city}</span>
                  </div>
                  <Button
                    onClick={handleMessageVendor}
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl mt-2"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Vendor
                  </Button>
                  <Button
                    onClick={handleBookNow}
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl"
                  >
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    Book & Get Contact Details
                  </Button>
                </CardContent>
              </Card>

              {/* Share card */}
              <Button
                variant="outline"
                onClick={handleShare}
                className="w-full border-neutral-200 text-neutral-600 hover:text-purple-600 hover:border-purple-200"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share this vendor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FIXED BOTTOM BAR (Mobile) ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-purple-100/50 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
              From
            </span>
            <p className="text-lg font-bold text-purple-700">
              {formatPrice(vendor.minimumPrice || vendor.price)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFavoriteToggle}
            className="p-2.5 border-purple-200 rounded-xl"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-purple-500"}`}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMessageVendor}
            className="p-2.5 border-purple-200 rounded-xl"
          >
            <MessageCircle className="w-5 h-5 text-purple-500" />
          </Button>
          <Button
            onClick={handleBookNow}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 rounded-xl font-semibold shadow-lg shadow-purple-200/50"
          >
            Book Now
          </Button>
        </div>
      </div>

      {/* Bottom spacer for fixed bar */}
      <div className="lg:hidden h-20" />

      {/* ===== LIGHTBOX DIALOG ===== */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 bg-black border-0 rounded-none overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Gallery — {vendor.name}</DialogTitle>

          {/* Top bar: counter + vendor name + close */}
          <div className="flex items-center justify-between px-5 py-3 bg-black/60 backdrop-blur-sm z-50 shrink-0">
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{vendor.name}</p>
              <p className="text-white/50 text-xs mt-0.5">Gallery</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-sm font-medium tabular-nums">
                {lightboxIndex + 1} / {galleryImages.length}
              </span>
              <button
                onClick={() => setLightboxOpen(false)}
                aria-label="Close gallery"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
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
                <SwiperSlide key={i} className="flex items-center justify-center bg-black">
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
            <div ref={thumbStripRef} className="shrink-0 bg-black/80 backdrop-blur-sm py-3 px-4 overflow-x-auto scrollbar-none">
              <div className="flex gap-2 w-max mx-auto">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goToLightboxSlide(i)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-all duration-200 ${
                      i === lightboxIndex
                        ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-black opacity-100 scale-105"
                        : "opacity-40 hover:opacity-70"
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
