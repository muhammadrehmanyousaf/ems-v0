"use client";

/**
 * BK-100.2 Layer 2a — Customer-facing umbrella detail page.
 *
 * Renders an umbrella with all its child bookings + edit / delete /
 * link / unlink controls. Layer 2b will add umbrella-level
 * cancellation cascade + bundle discount auto-compute.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Pencil,
  Trash2,
  Loader2,
  Link as LinkIcon,
  Unlink,
  AlertTriangle,
  Sparkles,
  Building2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/user-dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/context/UserContext";
import {
  WeddingUmbrellasAPI,
  type WeddingUmbrella,
} from "@/lib/api/weddingUmbrellas";
import { LinkBookingDialog } from "@/components/umbrellas/link-booking-dialog";

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

function umbrellaTitle(u: WeddingUmbrella): string {
  if (u.title?.trim()) return u.title;
  if (u.brideName && u.groomName) return `${u.brideName} & ${u.groomName}`;
  return "Your Wedding";
}

export default function UmbrellaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUser();
  const umbrellaId = Number(params?.id);
  const [umbrella, setUmbrella] = React.useState<WeddingUmbrella | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [unlinkingBooking, setUnlinkingBooking] = React.useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/user/umbrellas/${umbrellaId}`);
    }
  }, [isAuthenticated, isLoading, router, umbrellaId]);

  const load = React.useCallback(async () => {
    if (!user || !Number.isFinite(umbrellaId)) return;
    setLoading(true);
    try {
      const u = await WeddingUmbrellasAPI.get(umbrellaId);
      setUmbrella(u);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't load umbrella";
      toast({
        title: "Couldn't load",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, umbrellaId]);

  React.useEffect(() => {
    if (user) load();
  }, [user, load]);

  const handleUnlink = async (bookingId: number) => {
    if (!umbrella) return;
    if (!confirm("Remove this booking from your umbrella? The booking itself stays untouched.")) return;
    setUnlinkingBooking(bookingId);
    try {
      await WeddingUmbrellasAPI.unlinkBooking(umbrella.id, bookingId);
      toast({ title: "Booking unlinked" });
      await load();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't unlink";
      toast({ title: "Couldn't unlink", description: msg, variant: "destructive" });
    } finally {
      setUnlinkingBooking(null);
    }
  };

  const handleDelete = async () => {
    if (!umbrella) return;
    setDeleting(true);
    try {
      await WeddingUmbrellasAPI.remove(umbrella.id);
      toast({
        title: "Umbrella removed",
        description: "Your bookings are unchanged — only the umbrella grouping was removed.",
      });
      router.push("/user/umbrellas");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        "Couldn't delete";
      toast({ title: "Couldn't delete", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (!umbrella) {
    return (
      <PageContainer>
        <PageHeader title="Umbrella not found" />
        <Button variant="outline" onClick={() => router.push("/user/umbrellas")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back to umbrellas
        </Button>
      </PageContainer>
    );
  }

  const children = umbrella.bookings || [];

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <Link
            href="/user/umbrellas"
            className="inline-flex items-center gap-1 text-bridal-gold-dark hover:text-bridal-charcoal"
          >
            <ArrowLeft className="h-3 w-3" />
            All umbrellas
          </Link>
        }
        title={umbrellaTitle(umbrella)}
        description={
          umbrella.brideName && umbrella.groomName && umbrella.title
            ? `${umbrella.brideName} & ${umbrella.groomName}`
            : undefined
        }
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setLinkOpen(true)}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Link booking
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-bridal-coral hover:text-bridal-coral border-bridal-coral/30"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard
            title={`Bookings in this umbrella (${children.length})`}
            description="Each child booking keeps its own date, vendor, payments and dispute window. Removing one from the umbrella never cancels the booking itself."
          >
            {children.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-bridal-cream/50 p-6 text-center">
                <Sparkles className="h-6 w-6 text-bridal-gold mx-auto mb-2" />
                <p className="text-sm font-medium text-bridal-charcoal">
                  No bookings linked yet
                </p>
                <p className="text-xs text-bridal-text-soft mt-1 max-w-sm mx-auto">
                  Already booked some vendors? Link them here to roll them up into one wedding-week view. You can also create new bookings and link them later.
                </p>
                <Button
                  size="sm"
                  className="mt-4 gap-1.5"
                  onClick={() => setLinkOpen(true)}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Link an existing booking
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {children.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-md border border-border bg-white p-3 flex items-start justify-between gap-3"
                  >
                    <Link
                      href={`/user/bookings/${b.id}`}
                      className="min-w-0 flex-1 group"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-bridal-charcoal group-hover:text-bridal-gold-dark transition-colors">
                          Booking #{b.id}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {b.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {b.paymentStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-bridal-text-soft mt-1">
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
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {b.bookingDetails.map((d) => (
                            <Badge
                              key={d.id}
                              variant="secondary"
                              className="text-[10px] gap-1"
                            >
                              <Building2 className="h-2.5 w-2.5" />
                              {d.business?.name || `Vendor #${d.businessId}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnlink(b.id)}
                      disabled={unlinkingBooking === b.id}
                      className="shrink-0 text-neutral-500 hover:text-bridal-coral"
                      aria-label="Unlink booking"
                    >
                      {unlinkingBooking === b.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Unlink className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {umbrella.notes && (
            <SectionCard title="Notes">
              <p className="text-sm text-bridal-charcoal/85 leading-relaxed whitespace-pre-wrap">
                {umbrella.notes}
              </p>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SectionCard title="Details">
            <dl className="space-y-2.5 text-sm">
              {umbrella.weddingDate && (
                <div className="flex justify-between gap-2">
                  <dt className="text-bridal-text-soft">Wedding date</dt>
                  <dd className="font-medium text-bridal-charcoal">
                    {fmtDate(umbrella.weddingDate)}
                  </dd>
                </div>
              )}
              {umbrella.primaryCity && (
                <div className="flex justify-between gap-2">
                  <dt className="text-bridal-text-soft">Primary city</dt>
                  <dd className="font-medium text-bridal-charcoal">
                    {umbrella.primaryCity}
                  </dd>
                </div>
              )}
              {umbrella.estimatedGuests ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-bridal-text-soft">Estimated guests</dt>
                  <dd className="font-medium text-bridal-charcoal">
                    ~{umbrella.estimatedGuests}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt className="text-bridal-text-soft">Status</dt>
                <dd>
                  <Badge variant="outline" className="text-[10px]">
                    {umbrella.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard
            title="What umbrellas do"
            description="Tomorrow you'll see bundle discounts and a shared timeline auto-generated 7 days before the wedding."
          >
            <ul className="space-y-2 text-xs text-bridal-text-soft">
              <li className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-bridal-gold" />
                One view of every wedding-week vendor.
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-bridal-gold" />
                Removing a booking from the umbrella never cancels it.
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                Cancellation cascade + bundle discount ship in the next release.
              </li>
            </ul>
          </SectionCard>
        </div>
      </div>

      <LinkBookingDialog
        umbrellaId={umbrella.id}
        open={linkOpen}
        onOpenChange={setLinkOpen}
        onLinked={load}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this umbrella?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes the wedding-week grouping. Your individual bookings are NOT cancelled — they simply lose their umbrella context. You can recreate the umbrella any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-bridal-coral hover:bg-bridal-coral/90 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Deleting…
                </>
              ) : (
                "Delete umbrella"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
