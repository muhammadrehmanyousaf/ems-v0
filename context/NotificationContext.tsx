"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "./UserContext";
import {
  NotificationAPI,
  type Notification,
} from "@/lib/api/notifications";

/** WWL-402 — the server caps `limit` at 50; asking for 20 doubled the trips. */
const PAGE_SIZE = 50;

const BACKEND_WS_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface NotificationContextType {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  hasMore: boolean;
  /**
   * WWL-400 — the load used to fail silently and render as "you have no
   * notifications". A failed load is now distinguishable from an empty inbox.
   */
  loadError: string | null;
  /** WWL-390 — set when a mark-read / delete was reverted, so the UI can say so. */
  actionError: string | null;
  clearActionError: () => void;
  loadMore: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const clearActionError = useCallback(() => setActionError(null), []);

  // Connect socket when user authenticates
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      setNotifications([]);
      setTotalCount(0);
      setUnreadCount(0);
      return;
    }

    const token =
      localStorage.getItem("auth_token") ||
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

    if (!token) return;

    const socket = io(BACKEND_WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Notifications] Socket connected");
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Notifications] Socket disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[Notifications] Connection error:", err.message);
      setIsConnected(false);
    });

    // Handle new notification from server
    socket.on("notification:new", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setTotalCount((c) => c + 1);
      // Play notification sound
      playNotificationSound();
    });

    // Handle unread count updates from server
    socket.on("notification:unread-count", ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    // Load initial notifications
    loadInitialNotifications();

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, user?.id]);

  /**
   * WWL-397 — this ran on every `notification:new` and requested
   * `/sounds/notification.mp3`, which returns 404 text/html: `public/sounds/`
   * does not exist in the repository. The empty `.catch` hid it, so every
   * incoming notification fired a failing request forever. There was also no
   * mute and no preference, so a vendor with the portal open during a function
   * would have got audio if the file HAD existed.
   *
   * Synthesised with the Web Audio API instead of shipping a binary: no asset
   * to 404, no download, and it can be silenced. Muting is remembered, and the
   * whole thing is skipped when the browser has not granted audio yet — an
   * AudioContext created without a user gesture just stays suspended.
   */
  const playNotificationSound = () => {
    try {
      if (typeof window === "undefined") return;
      if (localStorage.getItem("ww-notification-sound") === "off") return;

      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      if (ctx.state === "suspended") {
        // No user gesture yet — a browser will not play this, so don't try.
        void ctx.close();
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      osc.onended = () => void ctx.close();
    } catch {
      // Audio is a courtesy, never a requirement.
    }
  };

  const loadInitialNotifications = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // WWL-402 — the server accepts `limit` up to 50 (verified: ?limit=999
      // returns 50) and the client always sent 20, so 61 rows took four round
      // trips instead of two.
      const result = await NotificationAPI.getNotifications(1, PAGE_SIZE);
      setNotifications(result.notifications);
      setTotalCount(result.total);
      setHasMore(result.hasMore);
      setPage(1);

      const count = await NotificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("[Notifications] Failed to load:", err);
      // WWL-400 — an empty list and a failed load must not look the same.
      setLoadError("Couldn't load your notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const result = await NotificationAPI.getNotifications(nextPage, PAGE_SIZE);
      setNotifications((prev) => [...prev, ...result.notifications]);
      setTotalCount(result.total);
      setHasMore(result.hasMore);
      setPage(nextPage);
      setLoadError(null);
    } catch (err) {
      console.error("[Notifications] Failed to load more:", err);
      setLoadError("Couldn't load more notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  const markAsRead = useCallback(
    async (id: number) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        // Also emit via socket for immediate server-side processing
        if (socketRef.current?.connected) {
          socketRef.current.emit("notification:mark-read", { notificationId: id });
        } else {
          await NotificationAPI.markAsRead(id);
        }
      } catch {
        // Revert optimistic update on failure. WWL-390 — this branch was
        // unreachable until NotificationAPI stopped swallowing its errors.
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
        setActionError("Couldn't mark that as read — it's still unread.");
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    const prevNotifications = notifications;
    const prevCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("notification:mark-all-read");
      } else {
        await NotificationAPI.markAllAsRead();
      }
    } catch {
      // Revert on failure
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
      setActionError("Couldn't mark everything as read — nothing was changed.");
    }
  }, [notifications, unreadCount]);

  /**
   * WWL-403 — the row left the list immediately while `totalCount` decremented
   * only inside the success path, so for the duration of the request the header
   * said 61 and the list showed 19 of 20. And on failure the row was restored
   * from a closure captured at call time — clobbering anything the socket had
   * delivered meanwhile — while the count had never moved at all.
   *
   * The row and the count now move together, and the revert is a functional
   * update that re-inserts one row rather than replacing the whole list.
   */
  const deleteNotification = useCallback(async (id: number) => {
    let removed: Notification | undefined;
    let removedIndex = -1;
    setNotifications((curr) => {
      removedIndex = curr.findIndex((n) => n.id === id);
      removed = removedIndex >= 0 ? curr[removedIndex] : undefined;
      return curr.filter((n) => n.id !== id);
    });
    const wasUnread = removed ? !removed.isRead : false;
    setTotalCount((c) => Math.max(0, c - 1));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await NotificationAPI.deleteNotification(id);
    } catch {
      setNotifications((curr) => {
        if (!removed || curr.some((n) => n.id === id)) return curr;
        const next = [...curr];
        next.splice(removedIndex >= 0 ? removedIndex : next.length, 0, removed);
        return next;
      });
      setTotalCount((c) => c + 1);
      if (wasUnread) setUnreadCount((c) => c + 1);
      setActionError("Couldn't delete that notification — it's still here.");
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await loadInitialNotifications();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        totalCount,
        unreadCount,
        isConnected,
        isLoading,
        hasMore,
        loadError,
        actionError,
        clearActionError,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
