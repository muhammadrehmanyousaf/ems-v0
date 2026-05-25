"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Loader2,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import type { Notification } from "@/lib/api/notifications";
import { groupNotificationsByDate } from "@/lib/notificationGroups";

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
  welcome: { icon: Sparkles, color: "text-bridal-gold-dark", bg: "bg-bridal-cream", label: "Welcome" },
  system: { icon: Info, color: "text-gray-600", bg: "bg-gray-50", label: "System" },
};

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationItem({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigate: () => void;
}) {
  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-bridal-cream/60 dark:hover:bg-neutral-800/60 ${
        !notification.isRead ? "bg-bridal-cream/40 dark:bg-neutral-800/40" : ""
      }`}
      onClick={() => {
        if (!notification.isRead) onRead(notification.id);
        onNavigate();
      }}
    >
      {/* Unread indicator line */}
      {!notification.isRead && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-bridal-gold" />
      )}

      {/* Icon */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg} mt-0.5`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[13px] leading-snug line-clamp-2 ${
          !notification.isRead ? "font-semibold text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400"
          }`}>
            {notification.title}
          </p>
          <span className="text-[11px] text-neutral-400 whitespace-nowrap mt-0.5">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>
      <p className="text-[12px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">
          {notification.message}
        </p>
        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-1.5 ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Delete on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-150"
        title="Remove"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

interface NotificationDropdownProps {
  notificationsPageUrl: string;
}

export default function NotificationDropdown({ notificationsPageUrl }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Show latest 8 in dropdown
  const displayedNotifications = notifications.slice(0, 8);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="hidden sm:flex relative h-9 w-9 items-center justify-center rounded-xl hover:bg-bridal-cream text-neutral-400 hover:text-bridal-gold-dark transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-bridal-gold px-1 text-[10px] font-bold text-white animate-in fade-in zoom-in duration-200">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {/* Pulse ring for new notifications */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-bridal-gold/55 animate-ping opacity-30" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 rounded-2xl shadow-2xl border-neutral-200/80 dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-bridal-gold to-bridal-gold-dark">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-bold text-white">
                {unreadCount}
              </span>
            )}
            <span
              className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-300" : "bg-neutral-400"}`}
              title={isConnected ? "Live" : "Connecting..."}
            />
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="flex items-center gap-1 text-[11px] font-medium text-bridal-cream hover:text-white transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[420px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-bridal-gold/70 mb-2" />
              <p className="text-xs text-neutral-400">Loading notifications...</p>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="h-14 w-14 rounded-2xl bg-bridal-cream flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-bridal-gold" />
              </div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">All caught up!</p>
              <p className="text-xs text-neutral-400 mt-1 text-center">
                No new notifications right now. We&apos;ll notify you when something happens.
              </p>
            </div>
          ) : (
          <div>
              <AnimatePresence initial={false}>
                {groupNotificationsByDate(displayedNotifications).map((group) => (
                  <div key={group.key}>
                    <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                      {group.label}
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {group.items.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onRead={markAsRead}
                          onDelete={deleteNotification}
                          onNavigate={() => setOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80">
          <Link
            href={notificationsPageUrl}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-bridal-gold-dark dark:text-bridal-gold/70 hover:text-bridal-gold-dark dark:hover:text-bridal-gold hover:bg-bridal-cream dark:hover:bg-neutral-800 transition-all duration-200"
          >
            View all notifications
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
