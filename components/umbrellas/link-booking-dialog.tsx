"use client";

/**
 * BK-100.2 Layer 2a — Link-existing-booking-to-umbrella dialog.
 *
 * Loads the customer's existing bookings (via the existing
 * simple-user-bookings endpoint) and lets them pick one to link.
 * Bookings already linked to ANOTHER umbrella are filtered out;
 * bookings linked to THIS umbrella are marked "already linked".
 *
 * Backend reciprocally enforces the customer authz (the caller must
 * be both the umbrella owner AND the booking's customer), so this
 * dialog only ever lists this customer's own bookings.
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, CalendarDays, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";
import { WeddingUmbrellasAPI } from "@/lib/api/weddingUmbrellas";

interface SimpleBooking {
  id: number;
  bookingDate: string;
  bookingTime: string;
  status: string;
  paymentStatus: string;
  eventCity?: string | null;
  // The backend extends Booking row reads with `umbrellaId` (BK-100.2)
  // so we can filter / mark "already linked" without an extra call.
  umbrellaId?: number | null;
  bookingDetails?: Array<{
    business?: { id: number; name: string } | null;
  }>;
}

interface LinkBookingDialogProps {
  umbrellaId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked?: () => void;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
}

export function LinkBookingDialog({
  umbrellaId,
  open,
  onOpenChange,
  onLinked,
}: LinkBookingDialogProps) {
  const [bookings, setBookings] = React.useState<SimpleBooking[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [linkingId, setLinkingId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `${BACKEND_URL}api/v1/bookings/simple-user-bookings`,
      );
      const raw = res.data?.data;
      const list: SimpleBooking[] = Array.isArray(raw) ? raw : raw?.data || raw?.bookings || [];
      setBookings(list);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't load your bookings";
      toast({ title: "Couldn't load", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleLink = async (b: SimpleBooking) => {
    setLinkingId(b.id);
    try {
      await WeddingUmbrellasAPI.linkBooking(umbrellaId, b.id);
      toast({ title: "Booking linked to umbrella" });
      onLinked?.();
      onOpenChange(false);
    } catch (e) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      const msg =
        data?.message === "BOOKING_LINKED_ELSEWHERE"
          ? "This booking is already part of a different umbrella."
          : data?.message || (e as Error)?.message || "Couldn't link booking";
      toast({ title: "Couldn't link", description: msg, variant: "destructive" });
    } finally {
      setLinkingId(null);
    }
  };

  // Bookings linked to a DIFFERENT umbrella are hidden — the customer
  // must unlink them from the other umbrella first.
  const visible = bookings.filter(
    (b) => b.umbrellaId == null || b.umbrellaId === umbrellaId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-bridal-gold" />
            Link a booking to this umbrella
          </DialogTitle>
          <DialogDescription>
            Pick an existing booking to add to your wedding-week umbrella. The booking itself stays unchanged — only the umbrella context is added.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {loading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your bookings…
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm text-neutral-500 italic py-6 text-center">
              No bookings available to link. Bookings already in another umbrella are filtered out.
            </p>
          ) : (
            visible.map((b) => {
              const alreadyLinked = b.umbrellaId === umbrellaId;
              const linking = linkingId === b.id;
              return (
                <div
                  key={b.id}
                  className={cn(
                    "rounded-md border p-3",
                    alreadyLinked
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-neutral-200 bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-neutral-900">
                          Booking #{b.id}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {b.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {fmtDate(b.bookingDate)}
                        </span>
                        {b.bookingTime && <span>· {b.bookingTime}</span>}
                        {b.eventCity && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {b.eventCity}
                          </span>
                        )}
                      </div>
                      {b.bookingDetails && b.bookingDetails.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {b.bookingDetails.slice(0, 3).map((d, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {d.business?.name || "Vendor"}
                            </Badge>
                          ))}
                          {b.bookingDetails.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{b.bookingDetails.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {alreadyLinked ? (
                      <Badge className="shrink-0 gap-1 text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        <CheckCircle2 className="h-3 w-3" />
                        Linked
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleLink(b)}
                        disabled={linking || linkingId !== null}
                        className="shrink-0"
                      >
                        {linking ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Link"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LinkBookingDialog;
