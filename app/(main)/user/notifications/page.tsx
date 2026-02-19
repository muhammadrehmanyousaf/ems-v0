"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationContext";
import type { Notification } from "@/lib/api/notifications";
import { Button } from "@/components/ui/button";
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
  Filter,
  ExternalLink,
} from "lucide-react";

const NOTIFICATION_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  booking_created: { icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50", label: "Booking" },
  booking_approved: { icon: CalendarCheck, color: "text-green-600", bg: "bg-green-50", label: "Approved" },
  booking_rejected: { icon: CalendarX, color: "text-red-600", bg: "bg-red-50", label: "Rejected" },
  booking_cancelled: { icon: CalendarX, color: "text-orange-600", bg: "bg-orange-50", label: "Cancelled" },
  payment_received: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50", label: "Payment" },
  payment_failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", label: "Failed" },
  payment_refunded: { icon: RefreshCcw, color: "text-amber-600", bg: "bg-amber-50", label: "Refund" },
  payout_processed: { icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50", label: "Payout" },
  new_review: { icon: Star, color: "text-yellow-600", bg: "bg-yellow-50", label: "Review" },
  welcome: { icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50", label: "Welcome" },
  system: { icon: Info, color: "text-gray-600", bg: "bg-gray-50", label: "System" },
};

function getNotificationLink(notification: Notification): string | null {
  const data = notification.data;
  const bookingId = data?.bookingId || data?.booking_id;

  if (notification.type.startsWith("booking_") && bookingId) {
    return `/user/bookings/${bookingId}`;
  }
  if (
    (notification.type.startsWith("payment_") || notification.type === "payout_processed") &&
    bookingId
  ) {
    return `/user/payments`;
  }
  if (notification.type === "new_review") {
    return `/user/bookings`;
  }
  return null;
}

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

function NotificationCard({
  notification,
  onRead,
  onDeleteRequest,
}: {
  notification: Notification;
  onRead: (id: number) => void;
  onDeleteRequest: (id: number) => void;
}) {
  const router = useRouter();
  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;
  const Icon = config.icon;
  const link = getNotificationLink(notification);

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id);
    if (link) router.push(link);
  };

  return (
    <div
      className={`group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm ${
        !notification.isRead
          ? "bg-purple-50/50 border-purple-100"
          : "bg-white border-gray-100 hover:border-gray-200"
      }`}
      onClick={handleClick}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg}`}
      >
        <Icon className={`h-5 w-5 ${config.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm leading-tight ${
                  !notification.isRead ? "font-semibold" : "font-medium text-muted-foreground"
                }`}
              >
                {notification.title}
              </h3>
              {!notification.isRead && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-purple-500" />
              )}
            </div>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              {notification.message}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-muted-foreground/60">
                {formatDate(notification.createdAt)}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
              >
                {config.label}
              </span>
              {link && (
                <span className="text-[10px] text-purple-500 flex items-center gap-0.5">
                  <ExternalLink className="h-3 w-3" /> View
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(notification.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserNotificationsPage() {
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
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "booking") return n.type.startsWith("booking_");
    if (filter === "payment")
      return n.type.startsWith("payment_") || n.type === "payout_processed";
    if (filter === "review") return n.type === "new_review";
    return true;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "booking", label: "Bookings" },
    { key: "payment", label: "Payments" },
    { key: "review", label: "Reviews" },
  ];

  const handleConfirmDelete = () => {
    if (deleteTarget !== null) {
      deleteNotification(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stay updated on your bookings, payments, and more
              <span
                className={`ml-2 inline-block h-2 w-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-gray-300"
                }`}
                title={isConnected ? "Live updates active" : "Connecting..."}
              />
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`text-[13px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Bell className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">
                {filter === "all" ? "No notifications yet" : "Nothing here"}
              </h3>
              <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm">
                {filter === "all"
                  ? "When you receive booking updates, payment confirmations, or reviews, they'll appear here."
                  : "No notifications match this filter. Try a different one."}
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  onDeleteRequest={setDeleteTarget}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={isLoading}
                    className="text-purple-600"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : null}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}

          {isLoading && notifications.length === 0 && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
