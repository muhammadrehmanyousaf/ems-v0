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
  ChatAPI,
  type ConversationItem,
  type ChatMessageItem,
} from "@/lib/api/chat";

const BACKEND_WS_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface OnlineStatuses {
  [userId: number]: boolean;
}

interface ChatContextType {
  conversations: ConversationItem[];
  activeConversationId: number | null;
  messages: ChatMessageItem[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  totalUnread: number;
  onlineStatuses: OnlineStatuses;
  typingUsers: Record<number, string>; // conversationId -> userName
  setActiveConversation: (id: number | null) => void;
  sendMessage: (content: string, tempId?: string) => void;
  loadMoreMessages: () => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  refreshConversations: () => Promise<void>;
  createConversation: (otherUserId: number, bookingId?: number) => Promise<ConversationItem | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useUser();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [onlineStatuses, setOnlineStatuses] = useState<OnlineStatuses>({});
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Get or reuse the socket from NotificationContext (same server)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConversations([]);
      setMessages([]);
      setTotalUnread(0);
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

    // === CHAT EVENTS ===

    socket.on("chat:new-message", (message: ChatMessageItem) => {
      // Skip own messages — they're handled by chat:message-sent
      if (message.senderId === Number(user?.id)) return;

      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("chat:message-sent", (data: { tempId?: string; message: ChatMessageItem }) => {
      // Replace optimistic message with real one
      if (data.tempId) {
        setMessages((prev) =>
          prev.map((m) =>
            (m as any).tempId === data.tempId ? data.message : m
          )
        );
      }
    });

    socket.on(
      "chat:conversation-updated",
      (data: {
        conversationId: number;
        lastMessageText: string;
        lastMessageAt: string;
        lastMessageSenderId: number;
        senderName: string;
        unreadCount: number;
      }) => {
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === data.conversationId
              ? {
                  ...c,
                  lastMessageText: data.lastMessageText,
                  lastMessageAt: data.lastMessageAt,
                  lastMessageSenderId: data.lastMessageSenderId,
                  unreadCount: data.unreadCount,
                }
              : c
          );
          // Sort by lastMessageAt
          return updated.sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bTime - aTime;
          });
        });

        // Update total unread
        ChatAPI.getTotalUnread().then(setTotalUnread);
      }
    );

    socket.on(
      "chat:user-typing",
      (data: { conversationId: number; userId: number; userName: string; isTyping: boolean }) => {
        if (data.isTyping) {
          setTypingUsers((prev) => ({ ...prev, [data.conversationId]: data.userName }));
          // Auto-clear after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = { ...prev };
              delete next[data.conversationId];
              return next;
            });
          }, 3000);
        } else {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[data.conversationId];
            return next;
          });
        }
      }
    );

    socket.on(
      "chat:messages-read",
      (data: { conversationId: number; readBy: number; readAt: string }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.conversationId === data.conversationId && m.senderId !== data.readBy
              ? { ...m, isRead: true, readAt: data.readAt }
              : m
          )
        );
      }
    );

    socket.on("chat:user-online", (data: { userId: number }) => {
      setOnlineStatuses((prev) => ({ ...prev, [data.userId]: true }));
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUser.id === data.userId
            ? { ...c, otherUser: { ...c.otherUser, isOnline: true } }
            : c
        )
      );
    });

    socket.on("chat:user-offline", (data: { userId: number }) => {
      setOnlineStatuses((prev) => ({ ...prev, [data.userId]: false }));
      setConversations((prev) =>
        prev.map((c) =>
          c.otherUser.id === data.userId
            ? { ...c, otherUser: { ...c.otherUser, isOnline: false } }
            : c
        )
      );
    });

    socket.on("chat:online-status", (statuses: OnlineStatuses) => {
      setOnlineStatuses((prev) => ({ ...prev, ...statuses }));
    });

    // Load initial data
    loadConversations();
    ChatAPI.getTotalUnread().then(setTotalUnread);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const convos = await ChatAPI.getConversations();
      setConversations(convos);

      // Check online status of all conversation partners
      const userIds = convos.map((c) => c.otherUser.id);
      if (userIds.length > 0 && socketRef.current?.connected) {
        socketRef.current.emit("chat:check-online", { userIds });
      }
    } catch (err) {
      console.error("[Chat] Failed to load conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const setActiveConversation = useCallback(
    async (id: number | null) => {
      // Leave previous conversation room
      if (activeConversationId && socketRef.current?.connected) {
        socketRef.current.emit("chat:leave", {
          conversationId: activeConversationId,
        });
      }

      setActiveConversationIdState(id);
      setMessages([]);
      setHasMoreMessages(false);

      if (!id) return;

      // Join new conversation room
      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:join", { conversationId: id });
      }

      // Load messages
      setIsLoadingMessages(true);
      try {
        const result = await ChatAPI.getMessages(id);
        setMessages(result.messages);
        setHasMoreMessages(result.hasMore);

        // Reset unread for this conversation locally
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
        );
        ChatAPI.getTotalUnread().then(setTotalUnread);
      } catch (err) {
        console.error("[Chat] Failed to load messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [activeConversationId]
  );

  const sendMessage = useCallback(
    (content: string, tempId?: string) => {
      if (!activeConversationId || !content.trim()) return;

      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:send-message", {
          conversationId: activeConversationId,
          content: content.trim(),
          messageType: "text",
          tempId,
        });

        // Optimistic update
        const optimisticMessage: any = {
          id: Date.now(),
          tempId,
          conversationId: activeConversationId,
          senderId: Number(user?.id),
          content: content.trim(),
          messageType: "text",
          isRead: false,
          readAt: null,
          isEdited: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
          sender: {
            id: Number(user?.id),
            fullName: user?.fullName || "",
            brandLogo: null,
          },
          _optimistic: true,
        };

        setMessages((prev) => [...prev, optimisticMessage]);
      }

      // Stop typing indicator
      if (isTypingRef.current) {
        stopTyping();
      }
    },
    [activeConversationId, user]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationId || isLoadingMessages || !hasMoreMessages) return;

    const firstMessage = messages[0];
    if (!firstMessage) return;

    setIsLoadingMessages(true);
    try {
      const result = await ChatAPI.getMessages(activeConversationId, firstMessage.id);
      setMessages((prev) => [...result.messages, ...prev]);
      setHasMoreMessages(result.hasMore);
    } catch (err) {
      console.error("[Chat] Failed to load more messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeConversationId, isLoadingMessages, hasMoreMessages, messages]);

  const startTyping = useCallback(() => {
    if (!activeConversationId || isTypingRef.current) return;
    isTypingRef.current = true;
    socketRef.current?.emit("chat:typing", {
      conversationId: activeConversationId,
      isTyping: true,
    });

    // Auto-stop after 2s
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [activeConversationId]);

  const stopTyping = useCallback(() => {
    if (!activeConversationId) return;
    isTypingRef.current = false;
    socketRef.current?.emit("chat:typing", {
      conversationId: activeConversationId,
      isTyping: false,
    });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [activeConversationId]);

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, []);

  const createConversation = useCallback(
    async (otherUserId: number, bookingId?: number) => {
      const convo = await ChatAPI.createOrGetConversation(otherUserId, bookingId);
      if (convo) {
        await loadConversations();
      }
      return convo;
    },
    []
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        hasMoreMessages,
        totalUnread,
        onlineStatuses,
        typingUsers,
        setActiveConversation,
        sendMessage,
        loadMoreMessages,
        startTyping,
        stopTyping,
        refreshConversations,
        createConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
