"use client";

/**
 * Issue #3 — Super-admin profile review surface.
 *
 * The vendor listing's "Profile Approved" toggle let admins flip
 * reviewProfile without ever seeing what they were approving. This
 * dialog fixes that: clicking "View details" on a vendor row pulls
 * the full Business record (via the new admin-only
 * `/api/v1/businesses/admin/by-user/:userId` endpoint) and renders
 * every field a super admin needs to make a real review decision —
 * contact info, location, description, packages, photos, social
 * links, completeness, pricing, policies.
 *
 * The Approve / Reject controls live in this dialog too, so the
 * admin can decide right where they see the evidence. The existing
 * column-level switch still works for fast toggling once the admin
 * already knows the vendor.
 */

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Package as PackageIcon,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Star,
  Link as LinkIcon,
} from "lucide-react";
import { BusinessesAPI, VendorsAPI, type ApiBusiness } from "@/lib/api/dashboard";
import { Vendor } from "@/lib/dashboard-types";

interface VendorReviewDialogProps {
  vendor: Vendor | null;
  onClose: () => void;
  /** Called after the admin flips reviewProfile so the parent can refetch. */
  onReviewStatusChanged: () => void;
}

function Field({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <div className="text-sm text-foreground break-words">{children}</div>
    </div>
  );
}

const fmt = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
  return String(v);
};

export function VendorReviewDialog({
  vendor,
  onClose,
  onReviewStatusChanged,
}: VendorReviewDialogProps) {
  const [business, setBusiness] = useState<ApiBusiness | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [actioning, setActioning] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    if (!vendor) {
      setBusiness(null);
      setNotFound(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    BusinessesAPI.getAdminBusinessByUserId(vendor.id)
      .then((b) => {
        if (b) setBusiness(b);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [vendor]);

  const handleSetReview = async (approve: boolean) => {
    if (!vendor) return;
    setActioning(approve ? "approve" : "reject");
    try {
      await VendorsAPI.changeProfileStatus(Number(vendor.id), approve);
      toast.success(approve ? "Profile approved" : "Profile rejected");
      onReviewStatusChanged();
      onClose();
    } catch {
      toast.error("Failed to update review status");
    } finally {
      setActioning(null);
    }
  };

  const isApproved = vendor?.reviewProfile === true;

  return (
    <Dialog open={!!vendor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-lg flex items-center gap-2 flex-wrap">
                Profile review
                {vendor && (
                  <Badge
                    variant={isApproved ? "default" : "outline"}
                    className={
                      isApproved
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "border-amber-300 text-amber-700"
                    }
                  >
                    {isApproved ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approved
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Pending review
                      </>
                    )}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Every detail this vendor submitted. Use the Approve / Reject buttons below to flip review status.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-5 pb-5">
            {loading && (
              <div className="flex items-center gap-2 py-12 justify-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading business details…
              </div>
            )}

            {notFound && !loading && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">No business attached to this vendor account.</p>
                <p className="text-xs mt-1">
                  The vendor signed up but never completed the business
                  registration step. You can still approve or reject the user;
                  there&apos;s simply nothing to review here.
                </p>
              </div>
            )}

            {/* Vendor account info — always shown */}
            {vendor && !loading && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-bridal-gold" />
                  Vendor account
                </h3>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 rounded-md border border-neutral-200 bg-neutral-50/50 p-3">
                  <Field label="Full name">{fmt(vendor.fullName)}</Field>
                  <Field label="Vendor type">{fmt(vendor.vendorType)}</Field>
                  <Field label="Email" icon={<Mail className="w-3 h-3" />}>
                    <a href={`mailto:${vendor.email}`} className="text-blue-700 hover:underline">
                      {fmt(vendor.email)}
                    </a>
                  </Field>
                  <Field label="Phone" icon={<Phone className="w-3 h-3" />}>
                    {fmt(vendor.phoneNumber)}
                  </Field>
                  <Field label="Status">{fmt(vendor.status)}</Field>
                  <Field label="Registered on">
                    {vendor.createdAt
                      ? new Date(vendor.createdAt).toLocaleString()
                      : "—"}
                  </Field>
                </div>
              </section>
            )}

            {/* Business details */}
            {business && !loading && (
              <>
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-bridal-gold" />
                    Business
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 rounded-md border border-neutral-200 p-3">
                    <Field label="Name">{fmt(business.name)}</Field>
                    <Field label="Vendor type">{fmt((business as any).vendor?.vendorType)}</Field>
                    <Field label="City" icon={<MapPin className="w-3 h-3" />}>
                      {fmt(business.city)}
                    </Field>
                    <Field label="Sub-area">{fmt(business.subArea)}</Field>
                    <Field label="Max capacity">{fmt(business.maxCapacity)}</Field>
                    <Field label="Min capacity">{fmt(business.minCapacity)}</Field>
                    <Field label="Minimum price">
                      {business.minimumPrice != null
                        ? `Rs. ${Number(business.minimumPrice).toLocaleString()}`
                        : "—"}
                    </Field>
                    <Field label="Down payment">
                      {fmt((business as any).downPaymentType)} ·{" "}
                      {fmt((business as any).downPayment)}
                    </Field>
                    <Field label="Cancellation policy">
                      {fmt((business as any).cancelationPolicy)}
                    </Field>
                    <Field label="Created">
                      {(business as any).createdAt
                        ? new Date((business as any).createdAt).toLocaleString()
                        : "—"}
                    </Field>
                  </div>
                  <div className="rounded-md border border-neutral-200 p-3">
                    <Field label="Description">{fmt(business.description)}</Field>
                  </div>
                  {(business as any).additionalInfo && (
                    <div className="rounded-md border border-neutral-200 p-3">
                      <Field label="Additional info">
                        {fmt(business.additionalInfo)}
                      </Field>
                    </div>
                  )}
                </section>

                {/* Brand logo + gallery */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-bridal-gold" />
                    Photos
                  </h3>
                  <div className="rounded-md border border-neutral-200 p-3 space-y-3">
                    <Field label="Brand logo">
                      {business.brandLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={business.brandLogo}
                          alt="brand logo"
                          className="h-20 w-20 rounded-md object-cover border"
                        />
                      ) : (
                        "—"
                      )}
                    </Field>
                    <Field label={`Gallery (${business.images?.length ?? 0})`}>
                      {business.images && business.images.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {business.images.map((src, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={src}
                              alt={`gallery ${i + 1}`}
                              className="h-16 w-16 rounded object-cover border"
                            />
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </Field>
                  </div>
                </section>

                {/* Packages */}
                {Array.isArray(business.packages) && business.packages.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <PackageIcon className="w-4 h-4 text-bridal-gold" />
                      Packages ({business.packages.length})
                    </h3>
                    <div className="space-y-2">
                      {business.packages.map((p: any) => (
                        <div
                          key={p.id}
                          className="rounded-md border border-neutral-200 p-3 grid sm:grid-cols-3 gap-x-4 gap-y-1.5 text-sm"
                        >
                          <Field label="Name">{fmt(p.name)}</Field>
                          <Field label="Price">
                            {p.price != null
                              ? `Rs. ${Number(p.price).toLocaleString()}`
                              : "—"}
                          </Field>
                          <Field label="Features">
                            {p.features
                              ? typeof p.features === "string"
                                ? p.features
                                : JSON.stringify(p.features)
                              : "—"}
                          </Field>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Menus (catering / venue) */}
                {Array.isArray(business.menus) && business.menus.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">Menus ({business.menus.length})</h3>
                    <div className="space-y-2">
                      {business.menus.map((m: any) => (
                        <div
                          key={m.id}
                          className="rounded-md border border-neutral-200 p-3 grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm"
                        >
                          <Field label="Title">{fmt(m.title)}</Field>
                          <Field label="Price">
                            {m.price != null
                              ? `Rs. ${Number(m.price).toLocaleString()}`
                              : "—"}
                          </Field>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Social links + office */}
                {(business as any).vendor && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-bridal-gold" />
                      Contact &amp; presence
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 rounded-md border border-neutral-200 p-3">
                      <Field label="Office address">
                        {fmt((business as any).vendor.officeAddress)}
                      </Field>
                      <Field label="Office Google link">
                        {fmt((business as any).vendor.officeGoogleLink)}
                      </Field>
                      <Field label="Booking email">
                        {fmt((business as any).vendor.bookingEmail)}
                      </Field>
                      <Field label="Website">
                        {fmt((business as any).vendor.website)}
                      </Field>
                      <Field label="Social links">
                        {fmt((business as any).vendor.socialLinks)}
                      </Field>
                      <Field label="WhatsApp">
                        {fmt((business as any).vendor.whatsappNumber)}
                      </Field>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Decision footer */}
        <div className="border-t bg-neutral-50/50 px-6 py-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={!!actioning}
          >
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSetReview(false)}
            disabled={!!actioning}
            className="border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            {actioning === "reject" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
            )}
            Reject / unpublish
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSetReview(true)}
            disabled={!!actioning}
          >
            {actioning === "approve" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            Approve &amp; publish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
