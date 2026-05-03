"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Expand } from "lucide-react";
import { format, isBefore, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Calendar18 from "@/components/calendar-18";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Star,
  MapPin,
  Users,
  Car,
  Clock,
  Share2,
  CalendarCheck,
  Heart,
  MessageCircle,
  Award,
  Shield,
  CheckCircle,
  Camera,
  Palette,
  Utensils,
  Flower,
  Crown,
  Sparkles,
  DollarSign,
  Package,
  Gift,
  ArrowLeft,
} from "lucide-react";
import type { Vendor, Review, Package as PkgType } from "@/lib/types";
import Image from "next/image";
import { BACKEND_URL } from "@/lib/backend-url";
import { VendorAPI } from "@/lib/api/vendors";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useFavorites } from "@/hooks/use-favorites";
import { ChatDrawer } from "@/components/chat/chat-drawer";
import { toast as sonnerToast } from "sonner";

interface VendorDetailsProps {
  vendor: Vendor;
}

// ── Helper: pill section card with corner brackets (bridal motif) ──
function BridalSectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`relative overflow-hidden border border-bridal-beige bg-bridal-cream rounded-md shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] ${className}`}>
      {children}
    </Card>
  );
}

function FeatureGroup({ label, items }: { label: string; items: string[] }) {
  const [expanded, setExpanded] = React.useState(false);
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
  pkg: PkgType;
  formatPrice: (n: number) => string;
  onBook: () => void;
  pricingLabel?: string;
}) {
  const toStr = (v: any): string => {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") {
      if (v.carName && v.quantity) return `${v.carName} ×${v.quantity}`;
      return Object.values(v).filter(Boolean).join(" · ");
    }
    return String(v);
  };
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
            <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold-dark font-medium mb-1.5">
              Package
            </p>
            <h3 className="font-display italic text-[22px] sm:text-[24px] text-bridal-charcoal leading-tight">
              {pkg.name}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display italic text-[26px] sm:text-[28px] text-bridal-gold-dark leading-none">
              {formatPrice(pkg.price)}
            </p>
            <p className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-text-soft mt-1">
              {pricingLabel}
            </p>
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

interface LiveReview {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
  user?: { id: number; fullName: string };
  booking?: { id: number; bookingDate: string; bookingTime: string };
}

export default function VendorDetails({ vendor }: VendorDetailsProps) {
  const lowestPackagePrice =
    vendor.packages?.length > 0
      ? Math.min(...vendor.packages.map((p) => p.price).filter((p) => p > 0))
      : null;
  const startingPrice = vendor.minimumPrice || lowestPackagePrice || vendor.price || null;
  const { isFavorited, toggleFavorite, isLoading: favLoading } = useFavorites();
  const isFavorite = isFavorited(vendor.id);
  const router = useRouter();

  const handleFavoriteClick = async () => {
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

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxSwiperRef = useRef<any>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDateAvailable, setIsDateAvailable] = useState<boolean | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [availability, setAvailability] = useState<Record<string, {
    availableSlots: string[];
    bookedSlots: string[];
    isBlocked?: boolean;
    blockReason?: string;
  }>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [isStickyHeader, setIsStickyHeader] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  // ── Live Reviews ──
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userBookingId, setUserBookingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const { toast } = useToast();
  const { isAuthenticated, user } = useUser();
  const isLoggedIn =
    typeof window !== "undefined" &&
    localStorage.getItem("user_id") &&
    localStorage.getItem("auth_token");

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

  const primaryImage = useMemo(
    () => vendor.images?.[0] || "/placeholder.jpg",
    [vendor.images],
  );

  const typeToPathMap: { [key: string]: string } = {
    Photographer: "photographers",
    "Makeup artist": "makeup-artists",
    Decorator: "decor",
    Catering: "catering",
    "Wedding venue": "venues",
    "Bridal wearing": "bridal-wear",
    "Car rental": "car-rental",
    "Henna artist": "henna-artists",
    "Wedding Invitations and Stationery": "wedding-stationery",
  };
  const vendorTypePath = typeToPathMap[vendor.type] || "vendors";

  useEffect(() => {
    const handleScroll = () => setIsStickyHeader(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const galleryImages = useMemo(
    () => (vendor.images?.length ? vendor.images : ["/placeholder.jpg"]),
    [vendor.images],
  );

  const scrollThumbIntoView = (index: number) => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    const thumb = strip.children[0]?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
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

  const handleBookNow = () => {
    if (isLoggedIn) router.push(`/${vendor.id}/booking`);
    else router.push("/login");
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
        toast({ title: "Link copied!", description: "Vendor link copied to clipboard." });
      }
    } catch {
      // share cancelled
    }
  };

  const formatPrice = (price: number) =>
    `Rs. ${new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)}`;

  const getVendorIcon = (type: string) => {
    const iconMap: { [key: string]: any } = {
      Photographer: Camera,
      "Makeup artist": Palette,
      Decorator: Flower,
      Catering: Utensils,
      "Wedding venue": Crown,
      "Bridal wearing": Sparkles,
      "Car rental": Car,
      "Henna artist": Palette,
      "Wedding Invitations and Stationery": Gift,
    };
    return iconMap[type] || Package;
  };
  const VendorIcon = getVendorIcon(vendor.type);

  const getVendorSpecificDetails = (): { label: string; value: string }[] => {
    const details: { label: string; value: string }[] = [];
    const type = vendor.type;

    if (["Wedding venue", "Catering", "Decorator"].includes(type) && (vendor.minCapacity || vendor.maxCapacity)) {
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
    if (vendor.travelToClientHome != null)
      details.push({ label: "Travel to Client Location", value: vendor.travelToClientHome ? "Available" : "Not Available" });

    const subType = Array.isArray(vendor.subBusinessType) ? vendor.subBusinessType[0] : vendor.subBusinessType;
    if (subType) {
      const subLabel =
        type === "Makeup artist" ? "Studio Type"
        : type === "Car rental" ? "Vehicle Type"
        : type === "Bridal wearing" ? "Store Type"
        : type === "Wedding Invitations and Stationery" ? "Stationery Type"
        : "Business Type";
      details.push({ label: subLabel, value: subType });
    }
    return details;
  };
  const vendorSpecificDetails = getVendorSpecificDetails();

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

  const getFeatureBadges = (pkg: PkgType): { label: string; values: string[] }[] => {
    if (!pkg.features || Array.isArray(pkg.features)) return [];
    const obj = pkg.features as Record<string, string[]>;
    return Object.entries(obj)
      .filter(([, vals]) => Array.isArray(vals) && vals.length > 0)
      .map(([key, vals]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        values: vals,
      }));
  };

  const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const fetchAvailability = useCallback(async (monthDate: Date) => {
    if (!vendor.id) return;
    const yyyy = monthDate.getFullYear();
    const mm = String(monthDate.getMonth() + 1).padStart(2, "0");
    try {
      const data = await VendorAPI.getMonthAvailability([Number(vendor.id)], `${yyyy}-${mm}`);
      setAvailability(data[Number(vendor.id)] || {});
    } catch {}
  }, [vendor.id]);

  useEffect(() => { fetchAvailability(calendarMonth); }, [calendarMonth, fetchAvailability]);

  useEffect(() => {
    if (!vendor.id) return;
    setReviewsLoading(true);
    fetch(`${BACKEND_URL}api/v1/reviews/${vendor.id}`)
      .then(r => r.json())
      .then(data => {
        const rows: LiveReview[] = data?.data?.reviews ?? [];
        setLiveReviews(rows);
        setAvgRating(data?.data?.averageRating ?? null);
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [vendor.id]);

  useEffect(() => {
    if (!isAuthenticated || !vendor.id) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;
    fetch(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const bookings: any[] = data?.data ?? [];
        const match = bookings.find((b: any) =>
          b.status === "Completed" &&
          b.bookingDetails?.some((d: any) => Number(d.businessId) === Number(vendor.id))
        );
        if (match) {
          setUserBookingId(match.id);
          const alreadyDone = liveReviews.some(r => r.booking?.id === match.id);
          setAlreadyReviewed(alreadyDone);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, vendor.id, liveReviews]);

  const handleReviewSubmit = async () => {
    if (!userBookingId || reviewRating === 0) return;
    setReviewSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${BACKEND_URL}api/v1/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessId: vendor.id,
          bookingId: userBookingId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (data.status) {
        toast({ title: "Review submitted!", description: "Thank you for your feedback." });
        setReviewRating(0);
        setReviewComment("");
        setAlreadyReviewed(true);
        fetch(`${BACKEND_URL}api/v1/reviews/${vendor.id}`)
          .then(r => r.json())
          .then(d => {
            setLiveReviews(d?.data?.reviews ?? []);
            setAvgRating(d?.data?.averageRating ?? null);
          })
          .catch(() => {});
      } else {
        toast({ title: "Failed", description: data.message || "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const isDateDisabled = (d: Date) => {
    const today = startOfToday();
    if (isBefore(d, today)) return true;
    const avail = availability[toDateKey(d)];
    if (avail && (avail.isBlocked || avail.availableSlots.length === 0)) return true;
    return false;
  };

  const fullyBookedDates: Date[] = [];
  const vendorBlockedDates: Date[] = [];
  Object.entries(availability).forEach(([dateStr, avail]) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (avail.isBlocked) vendorBlockedDates.push(dateObj);
    else if (avail.availableSlots.length === 0) fullyBookedDates.push(dateObj);
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const avail = availability[toDateKey(date)];
      const blocked = avail?.isBlocked;
      const booked = !blocked && avail && avail.availableSlots.length === 0;
      const available = !blocked && !booked;
      setIsDateAvailable(available);

      if (blocked) {
        toast({
          title: "Vendor Unavailable",
          description: avail?.blockReason
            ? `${avail.blockReason} — please choose a different date.`
            : `${format(date, "MMMM dd, yyyy")} — the vendor is not available this day.`,
          variant: "destructive",
        });
      } else if (booked) {
        toast({
          title: "Fully Booked",
          description: `${format(date, "MMMM dd, yyyy")} is fully booked. Please select another date.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Date Available!", description: `${format(date, "MMMM dd, yyyy")} is available for booking.` });
      }
    } else {
      setIsDateAvailable(null);
    }
  };

  const ratingValue = avgRating !== null ? avgRating : Number(vendor.rating || 0);
  const reviewsCount = liveReviews.length || 0;

  return (
    <div className="min-h-screen bg-bridal-ivory">
      {/* ===== Mobile Sticky Header ===== */}
      <div
        className={`lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isStickyHeader
            ? "bg-bridal-cream/95 backdrop-blur-md shadow-[0_4px_20px_-12px_rgba(176,125,84,0.45)] border-b border-bridal-beige"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className={`w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors ${
              isStickyHeader
                ? "bg-bridal-cream border border-bridal-beige text-bridal-charcoal hover:border-bridal-gold/55"
                : "bg-bridal-charcoal/40 backdrop-blur-sm text-bridal-ivory"
            }`}
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors ${
                isStickyHeader
                  ? "bg-bridal-cream border border-bridal-beige hover:border-bridal-gold/55"
                  : "bg-bridal-charcoal/40 backdrop-blur-sm"
              }`}
            >
              <Heart
                className={`w-4.5 h-4.5 ${
                  isFavorite ? "fill-bridal-coral text-bridal-coral" : isStickyHeader ? "text-bridal-charcoal" : "text-bridal-ivory"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className={`w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors ${
                isStickyHeader
                  ? "bg-bridal-cream border border-bridal-beige hover:border-bridal-gold/55"
                  : "bg-bridal-charcoal/40 backdrop-blur-sm"
              }`}
            >
              <Share2 className={`w-4.5 h-4.5 ${isStickyHeader ? "text-bridal-charcoal" : "text-bridal-ivory"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Editorial Hero ===== */}
      <section className="relative h-[68vh] sm:h-[75vh] min-h-[520px] max-h-[720px] overflow-hidden">
        <Image
          src={primaryImage}
          alt={`${vendor.name} hero image`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Bridal vignette: charcoal base + gold highlight + blush wash */}
        <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/85 via-bridal-charcoal/35 to-bridal-charcoal/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-bridal-charcoal/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-mughal-jaal opacity-[0.08] pointer-events-none" />

        {/* Hero copy — anchored to bottom-left for editorial framing */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-end pb-14 sm:pb-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bridal-gold/95 text-bridal-charcoal">
                <VendorIcon className="w-4.5 h-4.5" />
              </div>
              <span className="font-bridal text-[11px] sm:text-[12px] uppercase tracking-[0.4em] text-bridal-ivory/90">
                {vendor.type}
              </span>
              {vendor.sponsored && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bridal-gold/95 text-bridal-charcoal text-[10px] font-bridal font-medium uppercase tracking-[0.22em] backdrop-blur-sm">
                  <Crown className="w-3 h-3" />
                  Featured
                </span>
              )}
            </div>

            <h1 className="font-display italic text-[40px] sm:text-[58px] lg:text-[78px] leading-[0.98] text-bridal-ivory mb-5 drop-shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
              {vendor.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-7 font-bridal text-bridal-ivory/95">
              <span className="inline-flex items-center gap-2 text-[14px] sm:text-[15px]">
                <MapPin className="w-4 h-4 text-bridal-gold" />
                {vendor.location || vendor.city}
              </span>
              <span className="inline-flex items-center gap-2 text-[14px] sm:text-[15px]">
                <Star className="w-4 h-4 fill-bridal-gold text-bridal-gold" />
                <span className="font-display italic text-[18px] not-italic">{ratingValue.toFixed(1)}</span>
                <span className="text-bridal-ivory/70 text-[12px]">({reviewsCount} reviews)</span>
              </span>
              <span className="inline-flex items-center gap-2 text-[14px] sm:text-[15px]">
                <Shield className="w-4 h-4 text-bridal-sage" />
                Verified Vendor
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleBookNow}
                className="inline-flex items-center gap-2 h-12 px-7 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_14px_30px_-12px_rgba(176,125,84,0.65)] hover:shadow-[0_18px_36px_-12px_rgba(176,125,84,0.8)] transition-all duration-300"
              >
                <CalendarCheck className="w-4 h-4" />
                Book this vendor
              </button>
              <button
                type="button"
                onClick={handleFavoriteClick}
                disabled={favLoading}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-[4px] bg-bridal-cream/15 hover:bg-bridal-cream/25 border border-bridal-ivory/40 hover:border-bridal-gold/55 text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium backdrop-blur-sm transition-all duration-300 disabled:opacity-60"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-bridal-coral text-bridal-coral" : ""}`} />
                {isFavorite ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="hidden sm:inline-flex items-center gap-2 h-12 px-5 rounded-[4px] bg-bridal-cream/10 hover:bg-bridal-cream/20 border border-bridal-ivory/30 hover:border-bridal-gold/55 text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium backdrop-blur-sm transition-all duration-300"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Main Content ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-14">
        {/* Breadcrumbs */}
        <div className="mb-6 sm:mb-8">
          <Breadcrumb>
            <BreadcrumbList className="font-bridal text-[12px] uppercase tracking-[0.18em] text-bridal-text-soft">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:text-bridal-gold-dark transition-colors">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-bridal-gold/55" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${vendorTypePath}`} className="hover:text-bridal-gold-dark transition-colors">{vendor.type}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-bridal-gold/55" />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[140px] sm:max-w-none normal-case font-display italic text-[15px] tracking-normal text-bridal-charcoal">
                  {vendor.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            {/* ── Vendor Info Card ── */}
            <BridalSectionCard>
              <CardContent className="p-5 sm:p-7 lg:p-8">
                <div className="space-y-6">
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                      <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark mb-2">
                        Vendor profile
                      </p>
                      <h2 className="font-display italic text-[28px] sm:text-[34px] lg:text-[40px] leading-[1.05] text-bridal-charcoal">
                        {vendor.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 font-bridal text-bridal-text-soft">
                        <span className="inline-flex items-center gap-1.5 text-[13px]">
                          <MapPin className="w-4 h-4 text-bridal-gold" />
                          {vendor.location || vendor.city}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[13px]">
                          <Star className="w-4 h-4 fill-bridal-gold text-bridal-gold" />
                          <span className="font-display italic text-[16px] text-bridal-charcoal">{ratingValue.toFixed(1)}</span>
                          ({reviewsCount} reviews)
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[13px]">
                          <Shield className="w-4 h-4 text-bridal-sage" />
                          Verified
                        </span>
                      </div>
                    </div>

                    {startingPrice ? (
                      <div className="text-left sm:text-right">
                        <p className="font-bridal text-[10px] uppercase tracking-[0.25em] text-bridal-text-label">
                          Starting from
                        </p>
                        <p className="font-display italic text-[28px] sm:text-[32px] text-bridal-gold-dark leading-none mt-1">
                          {formatPrice(startingPrice)}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Stat tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6 border-t border-bridal-beige/70">
                    <StatTile
                      icon={<VendorIcon className="w-4 h-4" />}
                      iconBg="bg-bridal-gold/15"
                      iconColor="text-bridal-gold-dark"
                      label="Type"
                      value={vendor.type}
                    />
                    {["Wedding venue", "Catering", "Decorator"].includes(vendor.type) &&
                      (vendor.minCapacity || vendor.maxCapacity || vendor.capacity) && (
                        <StatTile
                          icon={<Users className="w-4 h-4" />}
                          iconBg="bg-bridal-rose/30"
                          iconColor="text-bridal-mauve"
                          label="Capacity"
                          value={`${
                            vendor.minCapacity && vendor.maxCapacity
                              ? `${vendor.minCapacity}–${vendor.maxCapacity}`
                              : vendor.maxCapacity ?? vendor.minCapacity ?? vendor.capacity
                          } guests`}
                        />
                      )}
                    {(vendor.cancelationPolicy || vendor.cancellationPolicy) && (
                      <StatTile
                        icon={<Clock className="w-4 h-4" />}
                        iconBg="bg-bridal-sage/25"
                        iconColor="text-[#3F6B43]"
                        label="Cancellation"
                        value={vendor.cancelationPolicy || vendor.cancellationPolicy}
                      />
                    )}
                    <StatTile
                      icon={<DollarSign className="w-4 h-4" />}
                      iconBg="bg-bridal-blush"
                      iconColor="text-bridal-mauve"
                      label="Price"
                      value={startingPrice ? formatPrice(startingPrice) : "On request"}
                    />
                    {vendor.downPayment ? (
                      <StatTile
                        icon={<DollarSign className="w-4 h-4" />}
                        iconBg="bg-bridal-coral/20"
                        iconColor="text-bridal-coral"
                        label="Advance"
                        value={
                          vendor.downPaymentType === "Percentage"
                            ? `${vendor.downPayment}%`
                            : formatPrice(vendor.downPayment)
                        }
                      />
                    ) : (
                      <StatTile
                        icon={<CalendarCheck className="w-4 h-4" />}
                        iconBg="bg-bridal-gold/15"
                        iconColor="text-bridal-gold-dark"
                        label="Availability"
                        value="Check calendar"
                      />
                    )}
                  </div>

                  {/* Action row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-bridal-beige/70">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center justify-center gap-2 h-12 rounded-[4px] border border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:text-bridal-gold-dark text-bridal-charcoal font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("availability")}
                      className="inline-flex items-center justify-center gap-2 h-12 rounded-[4px] border border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:text-bridal-gold-dark text-bridal-charcoal font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
                    >
                      <CalendarCheck className="w-4 h-4" />
                      Check availability
                    </button>
                    <button
                      type="button"
                      onClick={handleBookNow}
                      className="inline-flex items-center justify-center gap-2 h-12 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_14px_30px_-12px_rgba(176,125,84,0.7)] transition-all duration-300"
                    >
                      <CalendarCheck className="w-4 h-4" />
                      Book now
                    </button>
                  </div>
                </div>
              </CardContent>
            </BridalSectionCard>

            {/* ── Tabs Card ── */}
            <BridalSectionCard>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="h-auto p-0 bg-transparent border-b border-bridal-beige rounded-none w-full grid grid-cols-4 gap-0">
                    {[
                      { v: "overview", l: "Overview" },
                      { v: "gallery", l: "Gallery" },
                      { v: "pricing", l: "Pricing" },
                      { v: "reviews", l: "Reviews" },
                    ].map(t => (
                      <TabsTrigger
                        key={t.v}
                        value={t.v}
                        className="relative h-14 sm:h-16 rounded-none border-0 bg-transparent font-bridal text-[11px] sm:text-[12px] uppercase tracking-[0.25em] font-medium text-bridal-text-soft data-[state=active]:text-bridal-gold-dark data-[state=active]:shadow-none data-[state=active]:bg-bridal-cream transition-colors after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-0 data-[state=active]:after:w-12 after:bg-bridal-gold after:transition-all after:duration-300"
                      >
                        {t.l}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* ── OVERVIEW ── */}
                  <TabsContent value="overview" className="p-5 sm:p-7 lg:p-8 mt-0">
                    <div className="space-y-7">
                      {vendor.description && (
                        <SectionBlock title="About">
                          <p className="font-bridal text-[14px] sm:text-[15px] text-bridal-charcoal/85 leading-[1.75]">
                            {vendor.description}
                          </p>
                        </SectionBlock>
                      )}

                      {Array.isArray(vendor.expertise) && vendor.expertise.length > 0 && (
                        <SectionBlock title="Expertise">
                          <div className="flex flex-wrap gap-2">
                            {vendor.expertise.map((item, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bridal-blush border border-bridal-rose/45 text-bridal-mauve font-bridal text-[12px] font-medium"
                              >
                                <Sparkles className="w-3 h-3" />
                                {item}
                              </span>
                            ))}
                          </div>
                        </SectionBlock>
                      )}

                      {vendorSpecificDetails.length > 0 && (
                        <SectionBlock title="Services & Features">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {vendorSpecificDetails.map((detail, i) => (
                              <div key={i} className="flex items-start gap-3 p-3.5 bg-bridal-ivory rounded-md border border-bridal-beige">
                                <div className="w-8 h-8 rounded-full bg-bridal-gold/15 inline-flex items-center justify-center shrink-0">
                                  <CheckCircle className="w-4 h-4 text-bridal-gold-dark" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">{detail.label}</p>
                                  <p className="font-bridal text-[13.5px] font-medium text-bridal-charcoal mt-0.5">{detail.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </SectionBlock>
                      )}

                      {Array.isArray(vendor.amenities) && vendor.amenities.length > 0 && (
                        <SectionBlock title="Amenities">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {vendor.amenities.map((amenity, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-bridal-ivory rounded-md border border-bridal-beige/70">
                                <div className="w-1.5 h-1.5 rounded-full bg-bridal-gold shrink-0" />
                                <span className="font-bridal text-[13.5px] text-bridal-charcoal/85">{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </SectionBlock>
                      )}

                      {Array.isArray(vendor.cityCovered) && vendor.cityCovered.length > 0 && (
                        <SectionBlock title="Cities Covered">
                          <div className="flex flex-wrap gap-2">
                            {vendor.cityCovered.map((city, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bridal-ivory border border-bridal-beige text-bridal-charcoal font-bridal text-[12px] font-medium"
                              >
                                <MapPin className="w-3 h-3 text-bridal-gold" />
                                {city}
                              </span>
                            ))}
                          </div>
                        </SectionBlock>
                      )}

                      {vendor.additionalInfo && (
                        <SectionBlock title="Additional Information">
                          <p className="font-bridal text-[14px] text-bridal-charcoal/85 leading-[1.75]">
                            {vendor.additionalInfo}
                          </p>
                        </SectionBlock>
                      )}

                      {vendor.instruction && (
                        <SectionBlock title={vendor.type === "Bridal wearing" ? "Order Lead Time" : "Special Instructions"}>
                          <p className="font-bridal text-[14px] text-bridal-charcoal/85 leading-[1.75]">
                            {vendor.instruction}
                          </p>
                        </SectionBlock>
                      )}

                      {vendor.type === "Bridal wearing" && Array.isArray(vendor.serviceProvided) && vendor.serviceProvided.length > 0 && (
                        <SectionBlock title="Fabrics Available">
                          <div className="flex flex-wrap gap-2">
                            {vendor.serviceProvided.map((fabric, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-bridal-cream border border-bridal-gold/45 text-bridal-gold-dark font-bridal text-[12px] font-medium"
                              >
                                {fabric}
                              </span>
                            ))}
                          </div>
                        </SectionBlock>
                      )}

                      {enabledBridalServices.length > 0 && (
                        <SectionBlock title="Services Offered">
                          <div className="flex flex-wrap gap-2">
                            {enabledBridalServices.map((s, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bridal-sage/20 border border-bridal-sage/40 text-[#3F6B43] font-bridal text-[12px] font-medium"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {s.label}
                              </span>
                            ))}
                          </div>
                        </SectionBlock>
                      )}
                    </div>
                  </TabsContent>

                  {/* ── GALLERY ── */}
                  <TabsContent value="gallery" className="p-5 sm:p-7 lg:p-8 mt-0">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display italic text-[22px] text-bridal-charcoal">Gallery</h3>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bridal-blush border border-bridal-rose/45 text-bridal-mauve font-bridal text-[11px] uppercase tracking-[0.22em] font-medium">
                        <Camera className="w-3.5 h-3.5" />
                        {galleryImages.length} photos
                      </span>
                    </div>

                    {galleryImages.length >= 3 ? (
                      <div className="grid grid-cols-3 gap-2 rounded-md overflow-hidden">
                        <div
                          className="col-span-2 relative cursor-pointer group"
                          style={{ aspectRatio: "4/3" }}
                          onClick={() => openLightbox(0)}
                        >
                          <Image src={galleryImages[0]} alt={`${vendor.name} - 1`} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="66vw" priority />
                          <div className="absolute inset-0 bg-bridal-charcoal/0 group-hover:bg-bridal-charcoal/30 transition-colors duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-bridal-cream/95 rounded-full p-3">
                              <Expand className="w-5 h-5 text-bridal-charcoal" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-rows-2 gap-2">
                          <div className="relative cursor-pointer group overflow-hidden" style={{ aspectRatio: "4/3" }} onClick={() => openLightbox(1)}>
                            <Image src={galleryImages[1]} alt={`${vendor.name} - 2`} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="33vw" />
                            <div className="absolute inset-0 bg-bridal-charcoal/0 group-hover:bg-bridal-charcoal/35 transition-colors flex items-center justify-center">
                              <Expand className="w-4 h-4 text-bridal-ivory opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <div className="relative cursor-pointer group overflow-hidden" style={{ aspectRatio: "4/3" }} onClick={() => openLightbox(2)}>
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
                              <div className="absolute inset-0 bg-bridal-charcoal/0 group-hover:bg-bridal-charcoal/35 transition-colors flex items-center justify-center">
                                <Expand className="w-4 h-4 text-bridal-ivory opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 rounded-md overflow-hidden">
                        {galleryImages.map((img, i) => (
                          <div key={i} className="relative cursor-pointer group overflow-hidden rounded-md aspect-[4/3]" onClick={() => openLightbox(i)}>
                            <Image src={img} alt={`${vendor.name} - ${i + 1}`} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="50vw" />
                            <div className="absolute inset-0 bg-bridal-charcoal/0 group-hover:bg-bridal-charcoal/30 transition-colors flex items-center justify-center">
                              <Expand className="w-5 h-5 text-bridal-ivory opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {galleryImages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => openLightbox(0)}
                        className="w-full mt-4 py-3 rounded-[4px] border border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream font-bridal text-[12px] uppercase tracking-[0.22em] font-medium text-bridal-charcoal hover:text-bridal-gold-dark transition-all flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        View all {galleryImages.length} photos
                      </button>
                    )}
                  </TabsContent>

                  {/* ── PRICING ── */}
                  <TabsContent value="pricing" className="p-5 sm:p-7 lg:p-8 mt-0">
                    <div className="space-y-7">
                      {/* Bridal Wear — Outfit Listings */}
                      {vendor.type === "Bridal wearing" && (
                        <div className="space-y-4">
                          <h3 className="font-display italic text-[22px] text-bridal-charcoal">Outfit Listings</h3>
                          {(vendor.packages || []).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {(vendor.packages || []).map((pkg, index) => {
                                const imgs = (pkg.images ?? []).map(resolveImg);
                                const badges = getFeatureBadges(pkg);
                                return (
                                  <div key={index} className="border border-bridal-beige bg-bridal-cream rounded-md overflow-hidden hover:shadow-[0_18px_36px_-26px_rgba(176,125,84,0.5)] hover:border-bridal-gold/55 transition-all duration-500 group">
                                    <div className="relative aspect-[4/3] bg-bridal-ivory overflow-hidden">
                                      {imgs.length > 0 ? (
                                        <>
                                          <Image src={imgs[0]} alt={pkg.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                          {imgs.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-bridal-charcoal/70 backdrop-blur-sm text-bridal-ivory text-[10px] font-bridal uppercase tracking-[0.2em] px-2.5 py-1 rounded-full">
                                              +{imgs.length - 1} photos
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <Sparkles className="w-10 h-10 text-bridal-gold/40" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-4 space-y-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">{pkg.name}</h4>
                                        <span className="shrink-0 font-display italic text-[18px] text-bridal-gold-dark">
                                          {formatPrice(pkg.price)}
                                        </span>
                                      </div>
                                      {badges.map((group, gi) => (
                                        <div key={gi} className="flex flex-wrap gap-1.5">
                                          {group.values.map((val, vi) => (
                                            <span key={vi} className="inline-block bg-bridal-ivory text-bridal-charcoal/80 text-[11px] px-2 py-0.5 rounded-full border border-bridal-beige font-bridal">
                                              {val}
                                            </span>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="font-bridal text-[13px] text-bridal-text-soft text-center py-6">
                              No outfit listings yet. Contact the store for details.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Car Rental — Cars + Packages */}
                      {vendor.type === "Car rental" && (() => {
                        const allPkgs = vendor.packages || [];
                        const carPkgs = allPkgs.filter(pkg => {
                          const f = !Array.isArray(pkg.features) ? (pkg.features as Record<string, string[]>) : {};
                          return !!f.vehicleType?.[0];
                        });
                        const servicePkgs = allPkgs.filter(pkg => {
                          const f = !Array.isArray(pkg.features) ? (pkg.features as Record<string, string[]>) : {};
                          return !f.vehicleType?.[0];
                        });
                        return (
                          <>
                            <div className="space-y-4">
                              <h3 className="font-display italic text-[22px] text-bridal-charcoal flex items-center gap-2">
                                <Car className="w-5 h-5 text-bridal-gold" />
                                Cars
                              </h3>
                              {carPkgs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {carPkgs.map((pkg, index) => {
                                    const imgs = (pkg.images ?? []).map(resolveImg);
                                    const f = !Array.isArray(pkg.features) ? (pkg.features as Record<string, string[]>) : {};
                                    const vehicleType = f.vehicleType?.[0];
                                    const year = f.year?.[0];
                                    const color = f.color?.[0];
                                    const seats = f.seatingCapacity?.[0];
                                    const units = f.unitsAvailable?.[0];
                                    const withDriver = f.driver?.[0] === "Yes";
                                    const hasAC = f.ac?.[0] === "Yes";
                                    const hasDecor = f.decoration?.[0] === "Available";
                                    return (
                                      <div key={index} className="border border-bridal-beige bg-bridal-cream rounded-md overflow-hidden hover:shadow-[0_18px_36px_-26px_rgba(176,125,84,0.5)] hover:border-bridal-gold/55 transition-all duration-500">
                                        <div className="relative aspect-video bg-bridal-ivory">
                                          {imgs.length > 0 ? (
                                            <Image src={imgs[0]} alt={pkg.name} fill className="object-cover" />
                                          ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <Car className="w-10 h-10 text-bridal-gold/40" />
                                            </div>
                                          )}
                                          {vehicleType && (
                                            <span className="absolute top-2 left-2 font-bridal text-[10px] uppercase tracking-[0.22em] bg-bridal-gold/95 text-bridal-charcoal px-2.5 py-1 rounded-full">
                                              {vehicleType}
                                            </span>
                                          )}
                                        </div>
                                        <div className="p-4 space-y-3">
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <h4 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">{pkg.name}</h4>
                                              <p className="font-bridal text-[11px] text-bridal-text-soft mt-0.5">{[year, color].filter(Boolean).join(" · ")}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                              <p className="font-display italic text-[20px] text-bridal-gold-dark leading-none">{formatPrice(pkg.price)}</p>
                                              <p className="font-bridal text-[10px] uppercase tracking-[0.2em] text-bridal-text-soft mt-1">per event</p>
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap gap-1.5">
                                            {seats && (
                                              <span className="inline-flex items-center gap-1 text-[11px] bg-bridal-ivory text-bridal-charcoal px-2 py-0.5 rounded-full border border-bridal-beige font-bridal">
                                                <Users className="w-3 h-3" /> {seats} seats
                                              </span>
                                            )}
                                            {units && (
                                              <span className="inline-flex items-center gap-1 text-[11px] bg-bridal-sage/20 text-[#3F6B43] px-2 py-0.5 rounded-full border border-bridal-sage/40 font-bridal">
                                                {units} available
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-bridal-beige/70">
                                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-bridal ${withDriver ? "bg-bridal-blush text-bridal-mauve border-bridal-rose/45" : "bg-bridal-ivory text-bridal-text-soft border-bridal-beige"}`}>
                                              Driver {withDriver ? "Included" : "Not Included"}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-bridal ${hasAC ? "bg-bridal-cream text-bridal-gold-dark border-bridal-gold/45" : "bg-bridal-ivory text-bridal-text-soft border-bridal-beige"}`}>
                                              {hasAC ? "AC" : "No AC"}
                                            </span>
                                            {hasDecor && (
                                              <span className="inline-flex items-center gap-1 text-[11px] bg-bridal-coral/15 text-bridal-coral px-2 py-0.5 rounded-full border border-bridal-coral/30 font-bridal">
                                                Decoration
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="font-bridal text-[13px] text-bridal-text-soft text-center py-6">
                                  No cars listed yet. Contact the vendor for availability.
                                </p>
                              )}
                            </div>

                            {servicePkgs.length > 0 && (
                              <div className="space-y-4">
                                <h3 className="font-display italic text-[22px] text-bridal-charcoal">Packages</h3>
                                {servicePkgs.map((pkg, index) => (
                                  <PackageCard key={index} pkg={pkg} formatPrice={formatPrice} onBook={handleBookNow} pricingLabel="per event" />
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {/* Generic Packages */}
                      {vendor.type !== "Bridal wearing" && vendor.type !== "Car rental" && (
                        <div className="space-y-4">
                          <h3 className="font-display italic text-[22px] text-bridal-charcoal">Packages</h3>
                          {(vendor.packages || []).length > 0 ? (
                            (vendor.packages || []).map((pkg, index) => (
                              <PackageCard
                                key={index}
                                pkg={pkg}
                                formatPrice={formatPrice}
                                onBook={handleBookNow}
                                pricingLabel={
                                  vendor.type === "Catering" ? "per head"
                                  : vendor.type === "Makeup artist" || vendor.type === "Henna artist" ? "per session"
                                  : "per event"
                                }
                              />
                            ))
                          ) : (
                            <p className="font-bridal text-[13px] text-bridal-text-soft text-center py-6">
                              No packages available yet. Contact the vendor for pricing.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Menus */}
                      {Array.isArray(vendor.menus) && vendor.menus.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-display italic text-[22px] text-bridal-charcoal flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-bridal-gold" />
                            Menus
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {vendor.menus.map((menu, index) => {
                              const menuItems = Array.isArray(menu.data?.items) ? menu.data!.items : [];
                              return (
                                <div key={menu.id ?? index} className="border border-bridal-beige bg-bridal-cream rounded-md p-5">
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <h4 className="font-display italic text-[18px] text-bridal-charcoal capitalize leading-tight">{menu.title}</h4>
                                    <span className="font-display italic text-[16px] text-bridal-gold-dark shrink-0">
                                      Rs. {menu.price?.toLocaleString()}<span className="font-bridal text-[10px] uppercase tracking-[0.2em] text-bridal-text-soft ml-1">/head</span>
                                    </span>
                                  </div>
                                  {menuItems.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-bridal-beige/70">
                                      {menuItems.map((item, i) => (
                                        <span key={i} className="inline-block px-2.5 py-1 rounded-full bg-bridal-ivory border border-bridal-beige font-bridal text-[11.5px] text-bridal-charcoal/80">
                                          {String(item)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ── REVIEWS ── */}
                  <TabsContent value="reviews" className="p-5 sm:p-7 lg:p-8 mt-0">
                    <div className="space-y-6">
                      {/* Summary band */}
                      {liveReviews.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-md border border-bridal-gold/40 bg-bridal-cream">
                          <div className="text-center min-w-[110px]">
                            <p className="font-display italic text-[44px] text-bridal-gold-dark leading-none">
                              {avgRating?.toFixed(1) ?? "—"}
                            </p>
                            <div className="flex items-center justify-center gap-0.5 mt-2">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  className={`w-4 h-4 ${s <= Math.round(avgRating ?? 0) ? "fill-bridal-gold text-bridal-gold" : "text-bridal-beige"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-bridal text-[12px] uppercase tracking-[0.25em] font-medium text-bridal-text-label mb-1">
                              Verified guest reviews
                            </p>
                            <p className="font-bridal text-[14px] text-bridal-charcoal/85">
                              Based on <span className="font-display italic text-bridal-charcoal text-[16px]">{liveReviews.length}</span> {liveReviews.length === 1 ? "review" : "reviews"} from real bookings.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Write a review */}
                      {isAuthenticated && userBookingId && !alreadyReviewed && (
                        <div className="border border-bridal-gold/35 bg-bridal-cream rounded-md p-5 sm:p-6 space-y-4">
                          <h4 className="font-display italic text-[20px] text-bridal-charcoal">Write a review</h4>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setReviewRating(s)}
                                onMouseEnter={() => setReviewHover(s)}
                                onMouseLeave={() => setReviewHover(0)}
                                className="p-0.5"
                              >
                                <Star className={`w-7 h-7 transition-colors ${s <= (reviewHover || reviewRating) ? "fill-bridal-gold text-bridal-gold" : "text-bridal-beige"}`} />
                              </button>
                            ))}
                            {reviewRating > 0 && (
                              <span className="ml-3 font-bridal text-[12px] uppercase tracking-[0.22em] text-bridal-gold-dark">
                                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewRating]}
                              </span>
                            )}
                          </div>
                          <textarea
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            placeholder="Share your experience with this vendor…"
                            rows={3}
                            className="w-full font-bridal text-[14px] border border-bridal-beige rounded-[4px] p-4 focus:outline-none focus:ring-1 focus:ring-bridal-gold focus:border-bridal-gold/55 resize-none bg-bridal-ivory text-bridal-charcoal placeholder:text-bridal-text-soft"
                          />
                          <button
                            type="button"
                            onClick={handleReviewSubmit}
                            disabled={reviewRating === 0 || reviewSubmitting}
                            className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {reviewSubmitting ? "Submitting…" : "Submit review"}
                          </button>
                        </div>
                      )}

                      {isAuthenticated && alreadyReviewed && (
                        <div className="flex items-center gap-2 font-bridal text-[13px] text-[#3F6B43] bg-bridal-sage/15 border border-bridal-sage/40 rounded-md px-4 py-3">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          You've already reviewed this vendor. Thank you!
                        </div>
                      )}

                      {!isAuthenticated && (
                        <p className="font-bridal text-[13px] text-bridal-text-soft text-center py-2">
                          <button onClick={() => router.push("/login")} className="font-medium text-bridal-gold-dark hover:text-bridal-mauve underline-offset-4 hover:underline">
                            Log in
                          </button>{" "}
                          to leave a review after your booking.
                        </p>
                      )}

                      {reviewsLoading && (
                        <div className="flex justify-center py-10">
                          <div className="w-6 h-6 border-2 border-bridal-gold border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}

                      {!reviewsLoading && liveReviews.length === 0 && (
                        <p className="font-bridal text-[13px] text-bridal-text-soft text-center py-10">
                          No reviews yet. Be the first to book and leave a review!
                        </p>
                      )}

                      {liveReviews.map((review) => (
                        <div key={review.id} className="border border-bridal-beige bg-bridal-ivory rounded-md p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-display italic text-[17px] text-bridal-charcoal">
                                {review.user?.fullName || "Anonymous"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-bridal-gold text-bridal-gold" : "text-bridal-beige"}`} />
                                  ))}
                                </div>
                                <span className="font-bridal text-[11px] text-bridal-text-soft">
                                  {new Date(review.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="font-bridal text-[14px] text-bridal-charcoal/85 leading-[1.7]">{review.comment}</p>
                          )}
                          {review.reply && (
                            <div className="mt-2 pl-4 border-l-2 border-bridal-gold/45 text-bridal-charcoal/85 bg-bridal-cream rounded-r-md py-3 pr-3">
                              <span className="font-bridal text-[10px] uppercase tracking-[0.25em] font-medium text-bridal-gold-dark mr-2">
                                Vendor reply
                              </span>
                              <span className="font-bridal text-[13.5px]">{review.reply}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </BridalSectionCard>
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Availability Calendar */}
              <BridalSectionCard>
                <CardHeader className="border-b border-bridal-beige bg-bridal-ivory rounded-t-md">
                  <CardTitle className="font-display italic text-[20px] text-bridal-charcoal flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-bridal-gold" />
                    Check availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <Calendar18
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={isDateDisabled}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    modifiers={{
                      fullyBooked: fullyBookedDates,
                      vendorBlocked: vendorBlockedDates,
                    }}
                    modifiersClassNames={{
                      fullyBooked: "bg-bridal-coral/15 text-bridal-coral line-through",
                      vendorBlocked: "bg-bridal-beige/60 text-bridal-text-soft line-through opacity-60",
                    }}
                  />

                  <div className="flex flex-wrap gap-3 mt-4 font-bridal text-[10.5px] uppercase tracking-[0.18em] text-bridal-text-soft">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-bridal-cream border-2 border-bridal-gold/60" />
                      Available
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-bridal-coral/20 border border-bridal-coral/45" />
                      Fully booked
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-bridal-beige border border-bridal-beige" />
                      Unavailable
                    </span>
                  </div>

                  {selectedDate && (
                    <div
                      className={`mt-4 p-3.5 rounded-md border ${
                        availability[toDateKey(selectedDate)]?.isBlocked
                          ? "bg-bridal-beige/40 border-bridal-beige"
                          : isDateAvailable
                          ? "bg-bridal-sage/15 border-bridal-sage/40"
                          : "bg-bridal-coral/15 border-bridal-coral/40"
                      }`}
                    >
                      <p className="font-display italic text-[16px] text-bridal-charcoal">
                        {format(selectedDate, "MMMM dd, yyyy")}
                      </p>
                      <p
                        className={`font-bridal text-[12px] uppercase tracking-[0.22em] font-medium mt-1 ${
                          availability[toDateKey(selectedDate)]?.isBlocked
                            ? "text-bridal-text-soft"
                            : isDateAvailable
                            ? "text-[#3F6B43]"
                            : "text-bridal-coral"
                        }`}
                      >
                        {availability[toDateKey(selectedDate)]?.isBlocked
                          ? availability[toDateKey(selectedDate)]?.blockReason || "Vendor not available"
                          : isDateAvailable
                          ? "Available for booking"
                          : "Fully booked"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </BridalSectionCard>

              {/* Get in Touch */}
              <BridalSectionCard>
                <CardHeader className="border-b border-bridal-beige bg-bridal-ivory rounded-t-md">
                  <CardTitle className="font-display italic text-[20px] text-bridal-charcoal flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-bridal-gold" />
                    Get in touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
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
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_12px_28px_-12px_rgba(176,125,84,0.7)] transition-all duration-300"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Book &amp; get details
                  </button>
                </CardContent>
              </BridalSectionCard>

              {/* Booking Terms */}
              {(vendor.downPayment || vendor.cancelationPolicy || vendor.cancellationPolicy) && (
                <BridalSectionCard>
                  <CardHeader className="border-b border-bridal-beige bg-bridal-ivory rounded-t-md">
                    <CardTitle className="font-display italic text-[20px] text-bridal-charcoal flex items-center gap-2">
                      <Award className="w-5 h-5 text-bridal-gold" />
                      Booking terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    {vendor.downPayment ? (
                      <div className="flex items-start gap-3 p-3 bg-bridal-ivory rounded-md border border-bridal-beige/70">
                        <DollarSign className="w-4 h-4 text-bridal-gold-dark mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Advance Payment</p>
                          <p className="font-bridal text-[13.5px] font-medium text-bridal-charcoal mt-0.5">
                            {vendor.downPaymentType === "Percentage"
                              ? `${vendor.downPayment}% of total`
                              : formatPrice(vendor.downPayment)}
                          </p>
                        </div>
                      </div>
                    ) : null}
                    {(vendor.cancelationPolicy || vendor.cancellationPolicy) && (
                      <div className="flex items-start gap-3 p-3 bg-bridal-ivory rounded-md border border-bridal-beige/70">
                        <Clock className="w-4 h-4 text-bridal-gold-dark mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Cancellation Policy</p>
                          <p className="font-bridal text-[13.5px] font-medium text-bridal-charcoal mt-0.5">
                            {vendor.cancelationPolicy || vendor.cancellationPolicy}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </BridalSectionCard>
              )}
            </div>
          </aside>
        </div>
      </div>

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

      {/* ===== Lightbox ===== */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 bg-bridal-charcoal border-0 rounded-none overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Gallery — {vendor.name}</DialogTitle>

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

          <div className="flex-1 min-h-0">
            <Swiper
              modules={[Navigation]}
              navigation
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
                    <Image src={img} alt={`${vendor.name} — ${i + 1}`} fill className="object-contain" sizes="100vw" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

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
                    <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Reusable section block (consistent typographic rhythm in Overview tab) ──
function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <span className="h-[1px] w-8 bg-bridal-gold/55" />
        <h3 className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

// ── Stat tile in vendor info card ──
function StatTile({
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
    <div className="flex items-center gap-3 p-3.5 bg-bridal-ivory rounded-md border border-bridal-beige/70 hover:border-bridal-gold/45 transition-colors">
      <div className={`w-10 h-10 rounded-full ${iconBg} ${iconColor} inline-flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label truncate">
          {label}
        </p>
        <p className="font-bridal text-[13px] font-medium text-bridal-charcoal mt-0.5 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
