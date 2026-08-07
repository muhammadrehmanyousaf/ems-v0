"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import type { Notification } from "@/lib/api/notifications";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CalendarCheck,
  CalendarX,
  CreditCard,
  AlertCircle,
  RefreshCcw,
  Wallet,
  Star,
  Sparkles,
  Info,
  CheckCheck,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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

import {
  PageContainer,
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/user-dashboard";

const NOTIFICATION_CONFIG: Record<
  string,
  { icon: React.ElementType; tone: string; label: string }
> = {
  /**
   * WWL-407 — `booking_created` read "Booking" while its three siblings read
   * "Approved", "Rejected", "Cancelled": three participles and a noun in one
   * family, so the odd one out looked like a different kind of thing.
   */
  booking_created: {
    icon: CalendarCheck,
    tone: "bg-bridal-cream text-bridal-gold-dark",
    label: "New booking",
  },
  booking_approved: {
    icon: CalendarCheck,
    tone: "bg-bridal-sage/15 text-[#3F6B43]",
    label: "Approved",
  },
  booking_rejected: {
    icon: CalendarX,
    tone: "bg-bridal-coral/12 text-bridal-coral",
    label: "Rejected",
  },
  booking_cancelled: {
    icon: CalendarX,
    tone: "bg-bridal-gold/12 text-bridal-gold-dark",
    label: "Cancelled",
  },
  payment_received: {
    icon: CreditCard,
    tone: "bg-bridal-sage/15 text-[#3F6B43]",
    label: "Payment",
  },
  payment_failed: {
    icon: AlertCircle,
    tone: "bg-bridal-coral/12 text-bridal-coral",
    label: "Failed",
  },
  payment_refunded: {
    icon: RefreshCcw,
    tone: "bg-bridal-gold/12 text-bridal-gold-dark",
    label: "Refund",
  },
  payout_processed: {
    icon: Wallet,
    tone: "bg-bridal-sage/15 text-[#3F6B43]",
    label: "Payout",
  },
  new_review: {
    icon: Star,
    tone: "bg-bridal-gold/12 text-bridal-gold-dark",
    label: "Review",
  },
  welcome: {
    icon: Sparkles,
    tone: "bg-bridal-blush text-bridal-mauve",
    label: "Welcome",
  },
  /**
   * WWL-399 — none of the lead types had an entry here, so all three fell
   * through to `system` and wore a grey SYSTEM pill. 49 of the 61 rows in the
   * live feed were lead notifications mislabelled as system messages, on a page
   * where leads are the overwhelming majority of what arrives.
   */
  // Checked against the live table rather than guessed: the type is `new_lead`,
  // which does NOT share the `lead_` prefix its two siblings use.
  new_lead: {
    icon: Sparkles,
    tone: "bg-bridal-blush text-bridal-mauve",
    label: "New lead",
  },
  lead_stale_48h: {
    icon: AlertCircle,
    tone: "bg-bridal-coral/12 text-bridal-coral",
    label: "Lead going cold",
  },
  lead_followup_due: {
    icon: Bell,
    tone: "bg-bridal-gold/12 text-bridal-gold-dark",
    label: "Follow-up due",
  },
  system: {
    icon: Info,
    tone: "bg-muted text-muted-foreground",
    label: "System",
  },
};

/**
 * WWL-399 — the five tabs covered `booking_*`, `payment_*` + `payout_processed`
 * and `new_review`. The three LEAD types, `welcome` and `system` matched none of
 * them, so 52 of 61 notifications — 85% of the feed — were reachable only under
 * All. There was no Leads tab on a page where leads are the overwhelming
 * majority of what arrives.
 */
type FilterType = "all" | "unread" | "lead" | "booking" | "payment" | "review" | "other";

// `new_lead` breaks the `lead_` prefix its siblings share, so a prefix test
// alone would have missed it. Verified against the live type census.
const isLead = (t: string) => t.startsWith("lead_") || t === "new_lead";
const isBooking = (t: string) => t.startsWith("booking_");
const isPayment = (t: string) => t.startsWith("payment_") || t === "payout_processed";
const isReview = (t: string) => t === "new_review";
const isOther = (t: string) => !isLead(t) && !isBooking(t) && !isPayment(t) && !isReview(t);

/**
 * WWL-404 — rows showed a relative string only, with no `title` and no absolute
 * date anywhere in the UI, so the exact moment a notification arrived was
 * unavailable. The value was also computed at render and never refreshed, so a
 * row that said "1 min ago" still said so an hour later.
 *
 * A `createdAt` in the future — clock skew between Railway and the browser —
 * produced a negative diff, fell into the `minutes < 1` branch and rendered
 * "Just now" for something that had not happened yet.
 */
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  // Clock skew: never describe a future timestamp as though it just happened.
  if (diff < -60000) return "Scheduled";
  const minutes = Math.floor(Math.max(0, diff) / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/** The exact moment, in the vendor's own timezone. Shown on hover and to AT. */
function absoluteDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * WWL-393 — every row was `cursor: pointer` with an `onClick` that marked it
 * read and navigated NOWHERE: zero anchors in any row, and the URL unchanged
 * after clicking. The destination was in the payload the whole time —
 * `data.leadId`, `data.bookingId` and friends — and `Notification.data` was
 * read by nothing in this component. A vendor told twenty-seven times to follow
 * up with a named couple had to find each one by hand in the Lead inbox.
 */
function destinationOf(n: Notification): string | null {
  const d = n.data || {};
  const num = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

  const leadId = num(d.leadId);
  if (leadId) return `/dashboard/leads?leadId=${leadId}`;

  const bookingId = num(d.bookingId);
  if (bookingId) return `/dashboard/bookings/${bookingId}`;

  const reviewId = num(d.reviewId);
  if (reviewId) return `/dashboard/reviews`;

  const disputeId = num(d.disputeId);
  if (disputeId) return `/dashboard/disputes`;

  if (n.type.startsWith("payment_") || n.type === "payout_processed") {
    return "/dashboard/payments";
  }
  return null;
}

function NotificationRow({
  notification,
  onRead,
  onDelete,
  router,
}: {
  notification: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  router: { push: (href: string) => void };
}) {
  const config =
    NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;
  const Icon = config.icon;

  const href = destinationOf(notification);

  /**
   * WWL-394 / WWL-405 — the page's primary interaction was a bare `div` with a
   * click handler: no role, no tabindex, no key handler, not focusable. There
   * was no keyboard path to it at all, and the unread state was carried by a
   * colour, a font weight and an `aria-hidden` bar — so a screen-reader user
   * could neither tell an unread notification from a read one nor mark one read.
   */
  const activate = () => {
    if (!notification.isRead) onRead(notification.id);
    if (href) router.push(href);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${notification.isRead ? "Read" : "Unread"}: ${notification.title}. ${notification.message} — ${absoluteDate(notification.createdAt)}${href ? ". Opens the related record." : ""}`}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
      className={cn(
        "group relative flex items-start gap-4 px-5 py-4 transition-colors",
        "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        href ? "cursor-pointer" : "cursor-default",
        !notification.isRead && "bg-bridal-blush/30",
      )}
    >
      {!notification.isRead ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-bridal-gold"
        />
      ) : null}

      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border",
          config.tone,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={cn(
                  "text-[13.5px] leading-tight",
                  !notification.isRead
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {notification.title}
              </h3>
              {!notification.isRead ? (
                <span className="size-1.5 rounded-full bg-bridal-gold" />
              ) : null}
            </div>
            <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
              {notification.message}
            </p>
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <time
                dateTime={notification.createdAt}
                title={absoluteDate(notification.createdAt)}
                className="text-[10.5px] text-muted-foreground/80 tabular-nums"
              >
                {formatDate(notification.createdAt)}
              </time>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-[0.18em] font-medium px-2 py-0.5 rounded-full",
                  config.tone,
                )}
              >
                {config.label}
              </span>
            </div>
          </div>

          {/**
            * WWL-396 — one click on an invisible icon permanently destroyed a
            * row. The model is not `paranoid`, so `destroy()` is a hard delete,
            * and NO toast fires anywhere in this module: no dialog, no
            * acknowledgement, nothing to undo. WWL-405 — the button's only
            * accessible name was a `title`, and it was `opacity-0` until hover,
            * so a keyboard user could focus something invisible.
            */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            aria-label={`Delete notification: ${notification.title}`}
            className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-bridal-coral/10 hover:text-bridal-coral focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const {
    notifications,
    totalCount,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    isConnected,
  } = useNotifications();

  /**
   * WWL-396 — NO toast fires anywhere in this module: verified across every
   * driven action. One click on an invisible icon permanently destroyed a row —
   * the model is not `paranoid`, so `destroy()` is a hard delete — with no
   * dialog and no acknowledgement. Every other module in the sweep uses sonner.
   */
  const [confirmDelete, setConfirmDelete] = React.useState<Notification | null>(null);

  const doDelete = async (n: Notification) => {
    setConfirmDelete(null);
    await deleteNotification(n.id);
    toast.success("Notification deleted");
  };

  const doMarkAllRead = async () => {
    await markAllAsRead();
    toast.success("All notifications marked read");
  };

  /**
   * WWL-401 — `refreshNotifications` was defined in the context, typed in its
   * interface and exposed on the provider value, and had no consumer anywhere
   * in the frontend. The provider mounts in the root layout, so the list loaded
   * once and thereafter only grew by socket: a tab left open all day showed
   * whatever the socket happened to deliver. Now there is a control.
   */
  const [refreshing, setRefreshing] = React.useState(false);
  const doRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * WWL-398 — switching tabs never touched the URL, so a reload always returned
   * to All, the back button did not walk the tab history, and a filtered view
   * could not be linked or bookmarked. A 61-row feed a vendor had narrowed down
   * was one refresh from gone.
   */
  const router = useRouter();
  const searchParams = useSearchParams();
  const VALID: FilterType[] = ["all", "unread", "lead", "booking", "payment", "review", "other"];
  const urlTab = (searchParams?.get("tab") ?? null) as FilterType | null;
  const filter: FilterType = urlTab && VALID.includes(urlTab) ? urlTab : "all";
  const setFilter = (next: FilterType) => {
    const params = new URLSearchParams(Array.from(searchParams?.entries() ?? []));
    if (next === "all") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "lead") return isLead(n.type);
    if (filter === "booking") return isBooking(n.type);
    if (filter === "payment") return isPayment(n.type);
    if (filter === "review") return isReview(n.type);
    if (filter === "other") return isOther(n.type);
    return true;
  });

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "All", count: totalCount },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "lead", label: "Leads", count: notifications.filter((n) => isLead(n.type)).length },
    { key: "booking", label: "Bookings", count: notifications.filter((n) => isBooking(n.type)).length },
    { key: "payment", label: "Payments", count: notifications.filter((n) => isPayment(n.type)).length },
    { key: "review", label: "Reviews", count: notifications.filter((n) => isReview(n.type)).length },
    { key: "other", label: "Other", count: notifications.filter((n) => isOther(n.type)).length },
  ];

  const eyebrow = (
    <>
      <span>Console</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Notifications</span>
    </>
  );

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button onClick={doRefresh} variant="ghost" size="sm" className="gap-1.5" disabled={refreshing}>
        <RefreshCcw className={cn("size-3.5", refreshing && "animate-spin")} />
        Refresh
      </Button>
      {unreadCount > 0 ? (
        <Button onClick={doMarkAllRead} variant="outline" size="sm" className="gap-1.5">
          <CheckCheck className="size-3.5" />
          Mark all read
        </Button>
      ) : null}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title="Notifications"
        description={
          <span className="inline-flex items-center gap-2">
            Stay updated on bookings, payments and reviews.
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.18em] font-medium",
                isConnected ? "text-[#3F6B43]" : "text-muted-foreground",
              )}
              title={isConnected ? "Live updates active" : "Connecting…"}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isConnected
                    ? "bg-bridal-sage animate-pulse"
                    : "bg-muted-foreground/40",
                )}
              />
              {isConnected ? "Live" : "Offline"}
            </span>
          </span>
        }
        actions={headerActions}
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="h-auto bg-muted/50 p-1 flex flex-wrap gap-1 justify-start">
          {filters.map((f) => (
            <TabsTrigger
              key={f.key}
              value={f.key}
              className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm text-[12.5px]"
            >
              {f.label}
              {typeof f.count === "number" && f.count > 0 ? (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                    filter === f.key
                      ? "bg-bridal-cream text-bridal-gold-dark"
                      : "bg-muted-foreground/10 text-muted-foreground",
                  )}
                >
                  {f.count}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SectionCard flush>
        {filteredNotifications.length === 0 && !isLoading ? (
          <div className="px-5 py-12">
            <EmptyState
              icon={<Bell className="size-6" />}
              title={filter === "all" ? "No notifications yet" : "Nothing here"}
              description={
                filter === "all"
                  ? "When you receive booking updates, payment confirmations or reviews, they'll appear here."
                  : "No notifications match this filter."
              }
              className="border-0 bg-transparent py-0"
            />
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredNotifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onRead={markAsRead}
                onDelete={(id) => {
                  const target = notifications.find((x) => x.id === id) ?? null;
                  setConfirmDelete(target);
                }}
                router={router}
              />
            ))}
          </div>
        )}

        {hasMore ? (
          <div className="flex justify-center border-t border-border/60 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={isLoading}
              className="gap-1.5"
            >
              {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Load more
            </Button>
          </div>
        ) : null}

        {isLoading && notifications.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-5 animate-spin text-bridal-gold" />
          </div>
        ) : null}
      </SectionCard>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this notification?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">{confirmDelete?.title}</p>
                <p>{confirmDelete?.message}</p>
                <p className="text-xs">
                  Notifications are not recoverable — this one is removed for good. The booking,
                  lead or payment it refers to is untouched.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && void doDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
