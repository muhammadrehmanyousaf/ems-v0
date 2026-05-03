"use client";

import { format } from "date-fns";
import type { BookingFormData, Vendor, EventVenue } from "@/lib/types";
import {
  User,
  CalendarDays,
  Package,
  Utensils,
  Users,
  CreditCard,
  Receipt,
  Info,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

interface PreviewStepProps {
  formData: BookingFormData;
  selectedMenuObj: any;
  selectedPackageObj: any;
  vendorDetails?: Vendor[];
  venue?: EventVenue | null;
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function PreviewStep({
  formData,
  selectedPackageObj,
  selectedMenuObj,
  vendorDetails = [],
  venue,
}: PreviewStepProps) {
  const selectedVendors = (formData.selectedVendors || [])
    .map((vendorId) =>
      vendorDetails.find((v) => String(v.id) === String(vendorId)),
    )
    .filter(Boolean);

  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
  const vehicleQty = (isCarRental || isBridalWear || isWeddingStationery)
    ? (formData.vehicleQuantity || 1) : 1

  const selectedVendorPackages = (formData.selectedVendorPackages || [])
    .map((packageId) => {
      // First try external vendorDetails
      const ownerVendor = vendorDetails.find((v) =>
        (v as any).packages?.some(
          (p: any) => String(p.id) === String(packageId),
        ),
      );
      if (ownerVendor) {
        const pkg = (ownerVendor as any).packages.find(
          (p: any) => String(p.id) === String(packageId),
        );
        return pkg ? { ...pkg, vendorName: ownerVendor.name || "" } : null;
      }
      // Fallback: service packages on the venue itself (e.g. car rental service packages)
      const venuePkg = (venue?.packages || []).find(
        (p: any) => String(p.id) === String(packageId),
      );
      if (venuePkg) return { ...venuePkg, vendorName: venue?.name || "" };
      return null;
    })
    .filter(Boolean);

  // Build line-item invoice
  const invoiceLines: { label: string; type: string; amount: number }[] = [];
  const vendorIdsWithPackages = new Set<string>();

  if (selectedPackageObj) {
    const unitPrice = Number(selectedPackageObj.price) || 0
    const pkgType = isCarRental ? "Vehicle" : isBridalWear ? "Outfit" : isWeddingStationery ? "Product" : "Package"
    invoiceLines.push({
      label: vehicleQty > 1
        ? `${venue?.name || "Vendor"} — ${selectedPackageObj.name} ×${vehicleQty}`
        : `${venue?.name || "Vendor"} — ${selectedPackageObj.name}`,
      type: pkgType,
      amount: unitPrice * vehicleQty,
    });
  }
  if (selectedMenuObj) {
    invoiceLines.push({
      label: `${venue?.name || "Venue"} — ${selectedMenuObj.title || selectedMenuObj.name}`,
      type: "Menu",
      amount: Number(selectedMenuObj.price) || 0,
    });
  }
  if (!selectedPackageObj && !selectedMenuObj && venue) {
    invoiceLines.push({
      label: venue.name,
      type: "Base Price",
      amount: Number(venue.minimumPrice) || 0,
    });
  }

  selectedVendorPackages.forEach((p: any) => {
    invoiceLines.push({
      label: `${p?.vendorName} — ${p?.name}`,
      type: isCarRental ? "Service Pkg" : "Vendor Pkg",
      amount: Number(p?.price || 0),
    });
    if (p?.vendorName) {
      const ownerVendor = vendorDetails.find((v) => v.name === p.vendorName);
      if (ownerVendor) vendorIdsWithPackages.add(String(ownerVendor.id));
    }
  });

  selectedVendors.forEach((v: any) => {
    if (vendorIdsWithPackages.has(String(v?.id))) return;
    if (venue && String(v?.id) === String(venue.id)) return;
    invoiceLines.push({
      label: v?.name || "Vendor",
      type: "Vendor",
      amount: Number((v as any)?.minimumPrice || (v as any)?.price || 0),
    });
  });

  const subtotal = invoiceLines.reduce((sum, l) => sum + l.amount, 0);
  const computedTotal =
    subtotal > 0 ? subtotal : Number(formData.totalPrice) || 0;

  // Down payment calc
  let downPayment = 0;
  if (venue) {
    const dpType = (venue.downPaymentType || "").toLowerCase();
    const dpValue = Number(venue.downPayment) || 0;
    if (dpType === "percentage" || dpType === "percent") {
      downPayment = Math.round(computedTotal * (dpValue / 100));
    } else {
      downPayment = dpValue;
    }
  }
  const remaining = computedTotal - downPayment;

  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(n);

  const getTimeSlotDisplay = (timeSlot: string) => {
    switch (timeSlot) {
      case "09:00":
        return "Morning (9 AM - 12 PM)";
      case "14:00":
        return "Afternoon (2 PM - 6 PM)";
      case "18:00":
        return "Evening (6 PM - 11 PM)";
      default:
        return timeSlot || "Not selected";
    }
  };

  // Cancellation policies
  const policies: { name: string; policy: string }[] = [];
  if (venue?.cancelationPolicy) {
    policies.push({ name: venue.name, policy: venue.cancelationPolicy });
  }
  vendorDetails.forEach((v) => {
    const pol = v.cancellationPolicy || (v as any).cancelationPolicy;
    if (pol && !policies.some((p) => p.policy === pol)) {
      policies.push({ name: v.name, policy: pol });
    }
  });

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={item}>
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark mb-2">
          Final step · Review
        </p>
        <h2 className="font-display italic text-[28px] sm:text-[32px] text-bridal-charcoal leading-tight">
          Review your booking
        </h2>
        <p className="mt-2 font-bridal text-[14px] text-bridal-text-soft">
          Confirm everything looks right before submitting.
        </p>
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-md border border-bridal-beige bg-bridal-cream divide-y divide-bridal-beige/70 overflow-hidden shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)]"
      >
        {/* Contact */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 rounded-full bg-bridal-blush/60 inline-flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-bridal-mauve" />
            </span>
            <span className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark">Contact</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div className="min-w-0">
              <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Name</p>
              <p className="font-display italic text-[16px] text-bridal-charcoal break-words mt-1">
                {formData.username}
              </p>
            </div>
            <div className="min-w-0">
              <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Email</p>
              <p className="font-bridal text-[14px] text-bridal-charcoal break-all mt-1">
                {formData.email}
              </p>
            </div>
            <div className="min-w-0">
              <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Phone</p>
              <p className="font-bridal text-[14px] text-bridal-charcoal break-words mt-1">
                {formData.phoneNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Event */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 rounded-full bg-bridal-gold/15 inline-flex items-center justify-center">
              <CalendarDays className="h-3.5 w-3.5 text-bridal-gold-dark" />
            </span>
            <span className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark">Event</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div className="min-w-0">
              <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Date</p>
              <p className="font-display italic text-[16px] text-bridal-charcoal break-words mt-1">
                {formData.bookingDate
                  ? format(
                      typeof formData.bookingDate === "string"
                        ? new Date(formData.bookingDate)
                        : formData.bookingDate,
                      "MMM d, yyyy",
                    )
                  : "Not selected"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Time</p>
              <p className="font-bridal text-[14px] text-bridal-charcoal break-words mt-1">
                {getTimeSlotDisplay(formData.timeSlot)}
              </p>
            </div>
            {["Wedding venue", "Catering", "Decorator"].includes(venue?.vendor?.vendorType ?? "") && !isBridalWear && !isWeddingStationery && (
              <div className="min-w-0">
                <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Guests</p>
                <p className="font-display italic text-[18px] text-bridal-charcoal break-words mt-1">
                  {formData.guestCount}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Breakdown */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 rounded-full bg-bridal-rose/30 inline-flex items-center justify-center">
              <Receipt className="h-3.5 w-3.5 text-bridal-mauve" />
            </span>
            <span className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark">
              Cost breakdown
            </span>
          </div>
          <div className="space-y-3">
            {invoiceLines.map((line, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bridal text-[13.5px] text-bridal-charcoal">{line.label}</p>
                  <span className="inline-block mt-1 font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-gold-dark bg-bridal-ivory border border-bridal-beige px-2 py-0.5 rounded-full">
                    {line.type}
                  </span>
                </div>
                <span className="font-display italic text-[16px] text-bridal-charcoal shrink-0">
                  {formatPKR(line.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Total + Payment Schedule */}
      <motion.div
        variants={item}
        className="relative rounded-md bg-bridal-cream border border-bridal-gold/45 overflow-hidden shadow-[0_18px_40px_-32px_rgba(176,125,84,0.45)]"
      >
        {/* Gold accent strip */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-bridal-gold/15 border border-bridal-gold/45 inline-flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-bridal-gold-dark" />
              </span>
              <div>
                <p className="font-bridal text-[10px] uppercase tracking-[0.32em] font-medium text-bridal-text-label">Booking total</p>
                <p className="font-display italic text-[18px] text-bridal-charcoal leading-none mt-1">All inclusive</p>
              </div>
            </div>
            <span className="font-display italic text-[34px] sm:text-[38px] text-bridal-gold-dark leading-none">
              {formatPKR(computedTotal)}
            </span>
          </div>

          {/* Payment Timeline */}
          {downPayment > 0 && (
            <div className="border-t border-bridal-beige/70 pt-4">
              <p className="font-bridal text-[10px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-3">
                Payment schedule
              </p>
              <div className="flex items-center gap-3">
                {/* Step 1: Down Payment */}
                <div className="flex-1 rounded-md border border-bridal-gold/45 bg-bridal-ivory p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-bridal-gold border border-bridal-gold-dark text-bridal-charcoal flex items-center justify-center font-display italic text-[13px] shrink-0">
                      1
                    </div>
                    <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
                      Down payment
                    </span>
                  </div>
                  <p className="font-display italic text-[20px] text-bridal-charcoal leading-none">
                    {formatPKR(downPayment)}
                  </p>
                  <p className="font-bridal text-[11px] text-bridal-text-soft mt-1.5">
                    Due at booking
                  </p>
                </div>
                {/* Connector */}
                <span aria-hidden className="hidden sm:block w-8 h-px bg-gradient-to-r from-bridal-gold to-bridal-beige shrink-0" />
                {/* Step 2: Remaining */}
                <div className="flex-1 rounded-md border border-bridal-beige bg-bridal-ivory p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-bridal-cream border border-bridal-beige text-bridal-text-soft flex items-center justify-center font-display italic text-[13px] shrink-0">
                      2
                    </div>
                    <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">
                      Remaining
                    </span>
                  </div>
                  <p className="font-display italic text-[20px] text-bridal-charcoal/85 leading-none">
                    {formatPKR(remaining)}
                  </p>
                  <p className="font-bridal text-[11px] text-bridal-text-soft mt-1.5">
                    Before event
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Cancellation Policy */}
      {policies.length > 0 && (
        <motion.div
          variants={item}
          className="rounded-md border border-bridal-gold/45 bg-bridal-cream p-5"
        >
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-bridal-gold/15 inline-flex items-center justify-center flex-shrink-0">
              <Info className="h-3.5 w-3.5 text-bridal-gold-dark" />
            </span>
            <div className="space-y-2.5 flex-1">
              <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark">
                Cancellation policy
              </p>
              {policies.map((p, i) => (
                <div key={i}>
                  {policies.length > 1 && (
                    <p className="font-display italic text-[14px] text-bridal-charcoal mb-0.5">
                      {p.name}
                    </p>
                  )}
                  <p className="font-bridal text-[12.5px] text-bridal-charcoal/85 leading-relaxed">{p.policy}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
