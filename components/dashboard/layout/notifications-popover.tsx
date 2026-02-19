"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationContext";
import type { Notification } from "@/lib/api/notifications";

const NOTIFICATION_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  booking_created: { icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50" },
  booking_approved: { icon: CalendarCheck, color: "text-green-600", bg: "bg-green-50" },
  booking_rejected: { icon: CalendarX, color: "text-red-600", bg: "bg-red-50" },
  booking_cancelled: { icon: CalendarX, color: "text-orange-600", bg: "bg-orange-50" },
  payment_received: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
  payment_failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  payment_refunded: { icon: RefreshCcw, color: "text-amber-600", bg: "bg-amber-50" },
  payout_processed: { icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
  new_review: { icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
  welcome: { icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50" },
  system: { icon: Info, color: "text-gray-600", bg: "bg-gray-50" },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system;
  const Icon = config.icon;

  return (
    <DropdownMenuItem
      className={`flex items-start gap-3 py-3 px-3 cursor-pointer focus:bg-muted/50 ${
        !notification.isRead ? "bg-purple-50/40 dark:bg-purple-950/10" : ""
      }`}
      onSelect={(e) => {
        e.preventDefault();
        if (!notification.isRead) onRead(notification.id);
      }}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bg}`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-[13px] leading-tight truncate ${
              !notification.isRead
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground"
            }`}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-purple-500" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
          {timeAgo(notification.createdAt)}
        </span>
      </div>
      <button
        type="button"
        title="Delete notification"
        aria-label="Delete notification"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="mt-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500 text-muted-foreground transition-opacity p-1 rounded-md hover:bg-red-50"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </DropdownMenuItem>
  );
}

const NotificationsPopover = () => {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        forceMount
        className="w-80 max-h-[480px] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                {unreadCount} new
              </span>
            )}
          </DropdownMenuLabel>
          <div className="flex items-center gap-1">
            {/* Connection indicator */}
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? "bg-green-500" : "bg-gray-300"
              }`}
              title={isConnected ? "Real-time connected" : "Connecting..."}
            />
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-[11px] text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-purple-50 transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                Read all
              </button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="my-0" />

        {/* Notification list */}
        <div className="overflow-y-auto max-h-[380px] flex-1">
          {notifications.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                You&apos;ll see booking updates, payment alerts, and more here
              </p>
            </div>
          ) : (
            <>
              {notifications.map((n, i) => (
                <React.Fragment key={n.id}>
                  <NotificationItem
                    notification={n}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                  {i < notifications.length - 1 && (
                    <DropdownMenuSeparator className="my-0" />
                  )}
                </React.Fragment>
              ))}
              {hasMore && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadMore();
                  }}
                  disabled={isLoading}
                  className="w-full py-2.5 text-center text-[12px] font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Load more"
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsPopover;
