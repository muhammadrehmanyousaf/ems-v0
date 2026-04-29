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
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Review Your Booking
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Confirm everything looks right before submitting
        </p>
      </motion.div>

      <motion.div
        variants={item}
        className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden"
      >
        {/* Contact */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-bold text-neutral-700">Contact</span>
          </div>
          <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">Name</p>
              <p className="text-sm font-medium text-neutral-800 break-words">
                {formData.username}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">Email</p>
              <p className="text-sm font-medium text-neutral-800 break-all">
                {formData.email}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">Phone</p>
              <p className="text-sm font-medium text-neutral-800 break-words">
                {formData.phoneNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Event */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-bold text-neutral-700">Event</span>
          </div>
          <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">Date</p>
              <p className="text-sm font-medium text-neutral-800 break-words">
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
              <p className="text-xs text-neutral-400">Time</p>
              <p className="text-sm font-medium text-neutral-800 break-words">
                {getTimeSlotDisplay(formData.timeSlot)}
              </p>
            </div>
            {["Wedding venue", "Catering", "Decorator"].includes(venue?.vendor?.vendorType ?? "") && !isBridalWear && !isWeddingStationery && (
              <div className="min-w-0">
                <p className="text-xs text-neutral-400">Guests</p>
                <p className="text-sm font-medium text-neutral-800 break-words">
                  {formData.guestCount}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Breakdown */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-bold text-neutral-700">
              Cost Breakdown
            </span>
          </div>
          <div className="ml-6 space-y-2">
            {invoiceLines.map((line, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-neutral-700">{line.label}</span>
                  <span className="ml-2 text-[10px] text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded">
                    {line.type}
                  </span>
                </div>
                <span className="text-neutral-800 font-medium shrink-0 ml-3">
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
        className="rounded-xl bg-purple-50 border border-purple-100 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <span className="text-lg font-bold text-neutral-900">Total</span>
          </div>
          <span className="text-2xl font-bold text-purple-600">
            {formatPKR(computedTotal)}
          </span>
        </div>

        {/* Payment Timeline */}
        {downPayment > 0 && (
          <div className="border-t border-purple-200/50 pt-3">
            <p className="text-xs font-semibold text-purple-700 mb-2">
              Payment Schedule
            </p>
            <div className="flex items-center gap-3">
              {/* Step 1: Down Payment */}
              <div className="flex-1 relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    1
                  </div>
                  <span className="text-xs font-medium text-purple-800">
                    Down Payment
                  </span>
                </div>
                <p className="ml-8 text-sm font-bold text-purple-700">
                  {formatPKR(downPayment)}
                </p>
                <p className="ml-8 text-[10px] text-purple-500">
                  Due at booking
                </p>
              </div>
              {/* Connector */}
              <div className="w-8 h-0.5 bg-purple-200 shrink-0 mt-[-8px]" />
              {/* Step 2: Remaining */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-purple-200 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                    2
                  </div>
                  <span className="text-xs font-medium text-purple-600">
                    Remaining
                  </span>
                </div>
                <p className="ml-8 text-sm font-bold text-purple-600">
                  {formatPKR(remaining)}
                </p>
                <p className="ml-8 text-[10px] text-purple-400">Before event</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Cancellation Policy */}
      {policies.length > 0 && (
        <motion.div
          variants={item}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-800">
                Cancellation Policy
              </p>
              {policies.map((p, i) => (
                <div key={i}>
                  {policies.length > 1 && (
                    <p className="text-xs font-medium text-amber-700">
                      {p.name}
                    </p>
                  )}
                  <p className="text-xs text-amber-700">{p.policy}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
