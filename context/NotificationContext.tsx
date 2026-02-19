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

const BACKEND_WS_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  hasMore: boolean;
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const socketRef = useRef<Socket | null>(null);

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

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {
      // No audio file available, silently ignore
    }
  };

  const loadInitialNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await NotificationAPI.getNotifications(1, 20);
      setNotifications(result.notifications);
      setHasMore(result.hasMore);
      setPage(1);

      const count = await NotificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("[Notifications] Failed to load:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const result = await NotificationAPI.getNotifications(nextPage, 20);
      setNotifications((prev) => [...prev, ...result.notifications]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error("[Notifications] Failed to load more:", err);
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
        // Revert optimistic update on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
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
    }
  }, [notifications, unreadCount]);

  const deleteNotification = useCallback(async (id: number) => {
    const prev = notifications;
    setNotifications((curr) => curr.filter((n) => n.id !== id));
    try {
      await NotificationAPI.deleteNotification(id);
      const count = await NotificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Revert optimistic delete on failure
      setNotifications(prev);
    }
  }, [notifications]);

  const refreshNotifications = useCallback(async () => {
    await loadInitialNotifications();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        isLoading,
        hasMore,
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
