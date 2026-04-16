"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
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
  Camera as CameraIcon,
  ArrowLeft,
} from "lucide-react";
import type { Vendor, Review, Package } from "@/lib/types";
import Image from "next/image";
import { BACKEND_URL } from "@/lib/backend-url";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { ChatDrawer } from "@/components/chat/chat-drawer";
import { toast as sonnerToast } from "sonner";

interface VendorDetailsProps {
  vendor: Vendor;
}

function FeatureGroup({ label, items }: { label: string; items: string[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const VISIBLE = 5;
  const visible = expanded ? items : items.slice(0, VISIBLE);
  const overflow = items.length - VISIBLE;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">{label}</p>
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
  const isGrouped = pkg.features && !Array.isArray(pkg.features);
  const groups: { label: string; items: string[] }[] = isGrouped
    ? Object.entries(pkg.features as Record<string, string[]>)
        .filter(([, vals]) => Array.isArray(vals) && vals.length > 0)
        .map(([key, vals]) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          items: vals.filter(Boolean),
        }))
    : Array.isArray(pkg.features) && (pkg.features as string[]).filter(Boolean).length > 0
      ? [{ label: "Included", items: (pkg.features as string[]).filter(Boolean) }]
      : [];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="h-1 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-700" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h3 className="text-xl font-bold text-neutral-900 leading-tight">{pkg.name}</h3>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold text-purple-700">{formatPrice(pkg.price)}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{pricingLabel}</p>
          </div>
        </div>
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

export default function VendorDetails({ vendor }: VendorDetailsProps) {
  const reviews = vendor.reviews || [];
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const lightboxSwiperRef = useRef<any>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDateAvailable, setIsDateAvailable] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isStickyHeader, setIsStickyHeader] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useUser();
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
    "Hena artist": "henna-artists",
    "Wedding Invitations and Stationery": "wedding-stationery",
  };

  const vendorTypePath = typeToPathMap[vendor.type] || "vendors";

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsStickyHeader(window.scrollY > 100);
    };
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
    if (isLoggedIn) {
      router.push(`/${vendor.id}/booking`);
    } else {
      router.push("/login");
    }
  };

  const handleGetQuote = () => {
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

  const getVendorIcon = (type: string) => {
    const iconMap: { [key: string]: any } = {
      Photographer: Camera,
      "Makeup artist": Palette,
      Decorator: Flower,
      Catering: Utensils,
      "Wedding venue": Crown,
      "Bridal wearing": Sparkles,
      "Car rental": Car,
      "Hena artist": Palette,
      "Wedding Invitations and Stationery": Gift,
    };
    return iconMap[type] || Package;
  };

  const VendorIcon = getVendorIcon(vendor.type);

  const getVendorSpecificDetails = (): { label: string; value: string }[] => {
    const details: { label: string; value: string }[] = [];
    const type = vendor.type;

    // Capacity range
    if (vendor.minCapacity || vendor.maxCapacity) {
      const cap =
        vendor.minCapacity && vendor.maxCapacity
          ? `${vendor.minCapacity} – ${vendor.maxCapacity}`
          : `${vendor.maxCapacity ?? vendor.minCapacity}`;
      details.push({ label: "Guest Capacity", value: `${cap} guests` });
    }

    // Venue-specific
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

    // Catering-specific
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

    // Henna artist
    if (type === "Hena artist") {
      if (vendor.sellMehndi != null)
        details.push({ label: "Sells Mehndi Products", value: vendor.sellMehndi ? "Yes" : "No" });
      if (vendor.hasTeam != null)
        details.push({ label: "Has a Team", value: vendor.hasTeam ? "Yes" : "No" });
    }

    // Decorator
    if (type === "Decorator") {
      if (vendor.provideDecorationItem != null)
        details.push({ label: "Provides Decoration Items", value: vendor.provideDecorationItem ? "Yes" : "No" });
    }

    // Travel to client
    if (vendor.travelToClientHome != null)
      details.push({ label: "Travel to Client Location", value: vendor.travelToClientHome ? "Available" : "Not Available" });

    // Sub-business type (salon type, vehicle type, store type)
    const subType = Array.isArray(vendor.subBusinessType)
      ? vendor.subBusinessType[0]
      : vendor.subBusinessType;
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

  // Resolve relative image URLs to the backend base
  const BACKEND_BASE = BACKEND_URL.replace(/\/$/, "");
  const resolveImg = (url: string) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `${BACKEND_BASE}${url}`;
  };

  // Bridal wear service toggles
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

  // Parse package features object into flat badge groups (bridal wear / car rental)
  const getFeatureBadges = (pkg: Package): { label: string; values: string[] }[] => {
    if (!pkg.features || Array.isArray(pkg.features)) return [];
    const obj = pkg.features as Record<string, string[]>;
    return Object.entries(obj)
      .filter(([, vals]) => Array.isArray(vals) && vals.length > 0)
      .map(([key, vals]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        values: vals,
      }));
  };

  // Flatten features to a simple string list (generic packages)
  const getFlatFeatures = (pkg: Package): string[] => {
    if (!pkg.features) return [];
    if (Array.isArray(pkg.features)) return pkg.features.map(String).filter(Boolean);
    const obj = pkg.features as Record<string, string[]>;
    return Object.values(obj).flat().filter(Boolean);
  };

  // Mock function to check date availability
  const checkDateAvailability = (date: Date) => {
    const today = startOfToday();
    const isPast = isBefore(date, today);

    if (isPast) {
      return false;
    }

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const day = date.getDate();
    const month = date.getMonth();

    const unavailableDates = [
      new Date(2024, 11, 25),
      new Date(2024, 11, 31),
      new Date(2025, 0, 1),
    ];

    const isUnavailableDate = unavailableDates.some(
      (unavailableDate) =>
        unavailableDate.getDate() === day &&
        unavailableDate.getMonth() === month,
    );

    return !isWeekend && !isUnavailableDate;
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const isAvailable = checkDateAvailability(date);
      setIsDateAvailable(isAvailable);

      if (isAvailable) {
        toast({
          title: "Date Available!",
          description: `${format(date, "MMMM dd, yyyy")} is available for booking.`,
        });
      } else {
        toast({
          title: "Date Unavailable",
          description: `${format(date, "MMMM dd, yyyy")} is not available. Please select another date.`,
          variant: "destructive",
        });
      }
    } else {
      setIsDateAvailable(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-purple-50/30">
      {/* Mobile Sticky Header */}
      <div
        className={`lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isStickyHeader
            ? "bg-white/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
            >
              <Share2 className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section - Mobile Optimized */}
      <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden">
        <Image
          src={primaryImage}
          alt={`${vendor.name} hero image`}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/80 via-purple-900/70 to-purple-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        {/* Mobile Hero Content */}
        <div className="relative h-full flex items-end justify-center pb-20 sm:pb-32">
          <div className="text-center text-white max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <VendorIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300" />
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs sm:text-sm"
              >
                {vendor.type}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">
              {vendor.name}
            </h1>
            <p className="text-sm sm:text-xl md:text-2xl opacity-90 mb-6 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-purple-300" />
              {vendor.location || vendor.city}
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-1 sm:gap-2">
                <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
                <span className="text-sm sm:text-xl font-semibold">
                  {vendor.rating}
                </span>
                <span className="text-xs sm:text-lg opacity-80">
                  ({reviews.length})
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Award className="w-4 h-4 sm:w-6 sm:h-6 text-purple-300" />
                <span className="text-xs sm:text-lg opacity-80">Verified</span>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={handleBookNow}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Book Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsFavorite(!isFavorite)}
                className="w-full sm:w-auto border-purple-200 text-purple-600 hover:bg-purple-600 hover:text-white backdrop-blur-sm px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200"
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                />
                {isFavorite ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8 -mt-16 sm:-mt-20 relative z-10">
        {/* Mobile Breadcrumbs */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb>
            <BreadcrumbList className="text-xs sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${vendorTypePath}`}>{vendor.type}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[120px] sm:max-w-none">
                  {vendor.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Mobile-First Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Vendor Info Card - Mobile Optimized */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-4 sm:space-y-6">
                  {/* Vendor Header */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">
                            {vendor.name}
                          </h2>
                          {vendor.sponsored && (
                            <Badge className="w-fit bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                              <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center text-neutral-600">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-500 flex-shrink-0" />
                          <p className="text-sm sm:text-lg truncate">
                            {vendor.location || vendor.city}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
                            <span className="ml-1 sm:ml-2 text-sm sm:text-xl font-semibold">
                              {vendor.rating}
                            </span>
                            <span className="ml-1 sm:ml-2 text-xs sm:text-base text-neutral-600">
                              ({reviews.length} reviews)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            <span className="text-xs sm:text-base text-neutral-600">
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats - Mobile Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-neutral-200">
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-50/80 rounded-xl">
                        <VendorIcon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                            Type
                          </p>
                          <p className="text-xs sm:text-sm text-neutral-600 truncate">
                            {vendor.type}
                          </p>
                        </div>
                      </div>
                      {(vendor.minCapacity || vendor.maxCapacity || vendor.capacity) && (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                          <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                              Capacity
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-600 truncate">
                              {vendor.minCapacity && vendor.maxCapacity
                                ? `${vendor.minCapacity}–${vendor.maxCapacity}`
                                : vendor.maxCapacity ?? vendor.minCapacity ?? vendor.capacity}{" "}
                              Guests
                            </p>
                          </div>
                        </div>
                      )}
                      {(vendor.cancelationPolicy || vendor.cancellationPolicy) && (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                          <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                              Cancellation
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-600 truncate">
                              {vendor.cancelationPolicy || vendor.cancellationPolicy}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                        <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                            Starting Price
                          </p>
                          <p className="text-xs sm:text-sm text-neutral-600 truncate">
                            {formatPrice(vendor.minimumPrice || vendor.price)}
                          </p>
                        </div>
                      </div>
                      {vendor.downPayment ? (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl col-span-2 sm:col-span-1">
                          <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                              Advance
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-600 truncate">
                              {vendor.downPaymentType === "Percentage"
                                ? `${vendor.downPayment}%`
                                : formatPrice(vendor.downPayment)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl col-span-2 sm:col-span-1">
                          <CalendarCheck className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                              Availability
                            </p>
                            <p className="text-xs sm:text-sm text-neutral-600 truncate">
                              Check Calendar
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-neutral-200">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleShare}
                      className="flex items-center justify-center gap-2 border-neutral-200 hover:border-purple-500 hover:text-purple-600 transition-all duration-200 h-12"
                    >
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setActiveTab("availability")}
                      className="flex items-center justify-center gap-2 border-neutral-200 hover:border-purple-500 hover:text-purple-600 transition-all duration-200 h-12"
                    >
                      <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">
                        Check Availability
                      </span>
                    </Button>
                    <Button
                      onClick={handleBookNow}
                      size="lg"
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 h-12"
                    >
                      <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                      Book Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Tabs */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-0">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-4 h-12 sm:h-14 bg-neutral-100 p-1">
                    <TabsTrigger
                      value="overview"
                      className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-purple-600"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="gallery"
                      className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-purple-600"
                    >
                      Gallery
                    </TabsTrigger>
                    <TabsTrigger
                      value="pricing"
                      className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-purple-600"
                    >
                      Pricing
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-purple-600"
                    >
                      Reviews
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="p-4 sm:p-6">
                    <div className="space-y-6 sm:space-y-8">
                      {/* Description */}
                      {vendor.description ? (
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-3">About</h3>
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            {vendor.description}
                          </p>
                        </div>
                      ) : null}

                      {/* Expertise / Specializations */}
                      {Array.isArray(vendor.expertise) && vendor.expertise.length > 0 && (
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-3">Expertise</h3>
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
                        </div>
                      )}

                      {/* Type-specific service details */}
                      {vendorSpecificDetails.length > 0 && (
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-3">Services & Features</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {vendorSpecificDetails.map((detail, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100"
                              >
                                <CheckCircle className="w-4 h-4 text-purple-500 shrink-0" />
                                <div>
                                  <p className="text-xs text-neutral-500">{detail.label}</p>
                                  <p className="text-sm font-medium text-neutral-800">{detail.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {Array.isArray(vendor.amenities) && vendor.amenities.length > 0 && (
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-3">Amenities</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {vendor.amenities.map((amenity, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg"
                              >
                                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                                <span className="text-sm sm:text-base text-gray-600">{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cities Covered */}
                      {Array.isArray(vendor.cityCovered) && vendor.cityCovered.length > 0 && (
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-3">Cities Covered</h3>
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

                      {/* Additional Info */}
                      {vendor.additionalInfo && (
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-3">Additional Information</h3>
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            {vendor.additionalInfo}
                          </p>
                        </div>
                      )}

                      {/* Instruction — label changes per vendor type */}
                      {vendor.instruction && (
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-3">
                            {vendor.type === "Bridal wearing"
                              ? "Order Lead Time"
                              : "Special Instructions"}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            {vendor.instruction}
                          </p>
                        </div>
                      )}

                      {/* Bridal Wear — Fabrics Available */}
                      {vendor.type === "Bridal wearing" &&
                        Array.isArray(vendor.serviceProvided) &&
                        vendor.serviceProvided.length > 0 && (
                          <div>
                            <h3 className="text-lg sm:text-xl font-semibold mb-3">
                              Fabrics Available
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {vendor.serviceProvided.map((fabric, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-sm px-3 py-1 border-purple-200 text-purple-700"
                                >
                                  {fabric}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Bridal Wear — Services Offered */}
                      {enabledBridalServices.length > 0 && (
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-3">
                            Services Offered
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {enabledBridalServices.map((s, i) => (
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
                  </TabsContent>

                  <TabsContent value="gallery" className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-semibold text-neutral-900">Gallery</h3>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
                        <Camera className="w-3.5 h-3.5" />
                        {galleryImages.length} photos
                      </span>
                    </div>

                    {/* Featured hero layout */}
                    {galleryImages.length >= 3 ? (
                      <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden mb-2">
                        <div
                          className="col-span-2 relative cursor-pointer group"
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
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <Expand className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-rows-2 gap-2">
                          <div
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
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                              <Expand className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <div
                            className="relative cursor-pointer group overflow-hidden"
                            style={{ aspectRatio: "4/3" }}
                            onClick={() => openLightbox(2)}
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
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                <Expand className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden mb-2">
                        {galleryImages.map((img, i) => (
                          <div
                            key={i}
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
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                              <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {galleryImages.length > 1 && (
                      <button
                        onClick={() => openLightbox(0)}
                        className="w-full mt-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        View all {galleryImages.length} photos
                      </button>
                    )}
                  </TabsContent>

                  <TabsContent value="pricing" className="p-4 sm:p-6">
                    <div className="space-y-6">
                      {/* Bridal Wear — Outfit Listings */}
                      {vendor.type === "Bridal wearing" && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">
                            Outfit Listings
                          </h3>
                          {(vendor.packages || []).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {(vendor.packages || []).map((pkg, index) => {
                                const imgs = (pkg.images ?? []).map(resolveImg);
                                const badges = getFeatureBadges(pkg);
                                return (
                                  <div
                                    key={index}
                                    className="border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                                  >
                                    {/* Image section */}
                                    <div className="relative aspect-[4/3] bg-neutral-100">
                                      {imgs.length > 0 ? (
                                        <>
                                          <Image
                                            src={imgs[0]}
                                            alt={pkg.name}
                                            fill
                                            className="object-cover"
                                          />
                                          {imgs.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                                              +{imgs.length - 1} photos
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <Sparkles className="w-10 h-10 text-neutral-300" />
                                        </div>
                                      )}
                                    </div>
                                    {/* Card body */}
                                    <div className="p-4 space-y-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-neutral-900 text-base leading-tight">
                                          {pkg.name}
                                        </h4>
                                        <Badge className="shrink-0 bg-purple-100 text-purple-700 border-purple-200 text-sm">
                                          {formatPrice(pkg.price)}
                                        </Badge>
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
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-neutral-500 text-center py-4">
                              No outfit listings yet. Contact the store for
                              details.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Car Rental — Fleet Cards */}
                      {vendor.type === "Car rental" && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Fleet</h3>
                          {(vendor.packages || []).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {(vendor.packages || []).map((pkg, index) => {
                                const imgs = (pkg.images ?? []).map(resolveImg);
                                const features = !Array.isArray(pkg.features)
                                  ? (pkg.features as Record<string, string[]>)
                                  : {};
                                const carType = features.carType?.[0];
                                const year = features.year?.[0];
                                const units = features.unitsAvailable?.[0];
                                return (
                                  <div
                                    key={index}
                                    className="border border-neutral-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                                  >
                                    <div className="relative aspect-video bg-neutral-100">
                                      {imgs.length > 0 ? (
                                        <Image
                                          src={imgs[0]}
                                          alt={pkg.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <Car className="w-10 h-10 text-neutral-300" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-4 space-y-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-neutral-900 text-base">
                                          {pkg.name}
                                        </h4>
                                        <Badge className="shrink-0 bg-purple-100 text-purple-700 border-purple-200 text-sm">
                                          {formatPrice(pkg.price)}
                                        </Badge>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {carType && (
                                          <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">
                                            {carType}
                                          </span>
                                        )}
                                        {year && (
                                          <span className="inline-block bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full border border-neutral-200">
                                            {year}
                                          </span>
                                        )}
                                        {units && (
                                          <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                                            {units}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-neutral-500 text-center py-4">
                              No fleet listed yet. Contact the vendor for
                              availability.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Generic Packages — all other vendor types */}
                      {vendor.type !== "Bridal wearing" &&
                        vendor.type !== "Car rental" && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Packages</h3>
                          {(vendor.packages || []).length > 0 ? (
                            (vendor.packages || []).map((pkg, index) => (
                              <PackageCard
                                key={index}
                                pkg={pkg}
                                formatPrice={formatPrice}
                                onBook={handleBookNow}
                                pricingLabel={
                                  vendor.type === "Catering" ? "per head"
                                  : vendor.type === "Makeup artist" || vendor.type === "Hena artist" ? "per session"
                                  : "per event"
                                }
                              />
                            ))
                          ) : (
                            <p className="text-sm text-neutral-500 text-center py-4">
                              No packages available yet. Contact the vendor for
                              pricing.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Menus */}
                      {Array.isArray(vendor.menus) &&
                        vendor.menus.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Utensils className="w-5 h-5 text-purple-500" />
                              Menus
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {vendor.menus.map((menu, index) => {
                                const menuItems = Array.isArray(
                                  menu.data?.items,
                                )
                                  ? menu.data!.items
                                  : [];
                                return (
                                  <div
                                    key={menu.id ?? index}
                                    className="border border-neutral-200 rounded-xl p-4 sm:p-6"
                                  >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                      <h4 className="text-base sm:text-lg font-semibold capitalize">
                                        {menu.title}
                                      </h4>
                                      <Badge className="w-fit bg-purple-100 text-purple-700 border-purple-200 shrink-0">
                                        Rs. {menu.price?.toLocaleString()}/head
                                      </Badge>
                                    </div>
                                    {menuItems.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
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
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      {reviews.length === 0 && (
                        <p className="text-sm text-neutral-500 text-center py-8">
                          No reviews yet. Be the first to book and leave a
                          review!
                        </p>
                      )}
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border border-neutral-200 rounded-xl p-4 sm:p-6"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-sm sm:text-base">
                                {review.userName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                        i < review.rating
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs sm:text-sm text-gray-500">
                                  {review.date}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Hidden on Mobile, Visible on Desktop */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            {/* Availability Calendar */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-purple-500" />
                  Check Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar18
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => !checkDateAvailability(date)}
                />
                {selectedDate && (
                  <div className="mt-4 p-3 rounded-lg bg-neutral-50">
                    <p className="text-sm font-medium">
                      {format(selectedDate, "MMMM dd, yyyy")}
                    </p>
                    <p
                      className={`text-sm ${isDateAvailable ? "text-green-600" : "text-red-600"}`}
                    >
                      {isDateAvailable
                        ? "Available for booking"
                        : "Not available"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact / Location */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-500" />
                  Get in Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <span className="text-sm">
                    {vendor.location || vendor.city}
                  </span>
                </div>
                <Button
                  onClick={handleMessageVendor}
                  variant="outline"
                  className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Vendor
                </Button>
                <Button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Book & Get Contact Details
                </Button>
              </CardContent>
            </Card>

            {/* Booking Terms */}
            {(vendor.downPayment || vendor.cancelationPolicy || vendor.cancellationPolicy) && (
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-500" />
                    Booking Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {vendor.downPayment ? (
                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                      <DollarSign className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-500">Advance Payment Required</p>
                        <p className="text-sm font-semibold text-neutral-800">
                          {vendor.downPaymentType === "Percentage"
                            ? `${vendor.downPayment}% of total amount`
                            : formatPrice(vendor.downPayment)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {(vendor.cancelationPolicy || vendor.cancellationPolicy) && (
                    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                      <Clock className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-500">Cancellation Policy</p>
                        <p className="text-sm font-semibold text-neutral-800">
                          {vendor.cancelationPolicy || vendor.cancellationPolicy}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
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

      {/* ===== LIGHTBOX DIALOG ===== */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-screen max-h-screen w-screen h-screen p-0 bg-black border-0 rounded-none overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Gallery — {vendor.name}</DialogTitle>

          {/* Top bar */}
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
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main swiper */}
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
    </div>
  );
}
