"use client";

import React, { useState } from "react";
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
  booking_created: {
    icon: CalendarCheck,
    tone: "bg-bridal-cream text-bridal-gold-dark",
    label: "Booking",
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
  system: {
    icon: Info,
    tone: "bg-muted text-muted-foreground",
    label: "System",
  },
};

type FilterType = "all" | "unread" | "booking" | "payment" | "review";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function NotificationRow({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const config =
    NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;
  const Icon = config.icon;

  return (
    <div
      onClick={() => {
        if (!notification.isRead) onRead(notification.id);
      }}
      className={cn(
        "group relative flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors",
        "hover:bg-muted/30",
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
              <span className="text-[10.5px] text-muted-foreground/80 tabular-nums">
                {formatDate(notification.createdAt)}
              </span>
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

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-bridal-coral hover:bg-bridal-coral/10 transition-all"
            title="Delete notification"
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
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isConnected,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "booking") return n.type.startsWith("booking_");
    if (filter === "payment")
      return n.type.startsWith("payment_") || n.type === "payout_processed";
    if (filter === "review") return n.type === "new_review";
    return true;
  });

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    {
      key: "booking",
      label: "Bookings",
      count: notifications.filter((n) => n.type.startsWith("booking_")).length,
    },
    {
      key: "payment",
      label: "Payments",
      count: notifications.filter(
        (n) => n.type.startsWith("payment_") || n.type === "payout_processed",
      ).length,
    },
    {
      key: "review",
      label: "Reviews",
      count: notifications.filter((n) => n.type === "new_review").length,
    },
  ];

  const eyebrow = (
    <>
      <span>Console</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Notifications</span>
    </>
  );

  const headerActions =
    unreadCount > 0 ? (
      <Button onClick={markAllAsRead} variant="outline" size="sm" className="gap-1.5">
        <CheckCheck className="size-3.5" />
        Mark all read
      </Button>
    ) : null;

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
                onDelete={deleteNotification}
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
    </PageContainer>
  );
}
