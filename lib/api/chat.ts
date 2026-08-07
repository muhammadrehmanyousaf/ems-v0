import axiosInstance from "../axiosConfig";
import { BACKEND_URL } from "../backend-url";

export interface ChatUser {
  id: number;
  fullName: string;
  email: string;
  profileImage: string | null;
  isVendor: boolean;
  vendorType: string | null;
  isOnline?: boolean;
  contactType?: "customer" | "vendor";
}

export interface ConversationItem {
  id: number;
  otherUser: ChatUser;
  bookingId: number | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: number | null;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessageItem {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: "text" | "image" | "file" | "system";
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  readAt: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: {
    id: number;
    fullName: string;
    profileImage: string | null;
  };
}

/**
 * WWL-019 — every read here used to answer with an empty result on failure, so
 * a broken conversation load looked exactly like "you have no messages" and the
 * `catch` blocks already written in ChatContext were unreachable. Reads now
 * throw; the callers' existing handling shows the failure.
 *
 * `getTotalUnread` is the one exception: it is fired-and-forgotten from four
 * places as a badge count, so it keeps returning 0 rather than producing an
 * unhandled rejection. It logs instead of failing silently.
 */
export class ChatAPI {
  static async getConversations(): Promise<ConversationItem[]> {
    const response = await axiosInstance.get(
      `${BACKEND_URL}api/v1/chat/conversations`
    );
    return response.data?.data || [];
  }

  static async createOrGetConversation(
    otherUserId: number,
    bookingId?: number
  ): Promise<ConversationItem | null> {
    const response = await axiosInstance.post(
      `${BACKEND_URL}api/v1/chat/conversations`,
      { otherUserId, bookingId }
    );
    return response.data?.data ?? null;
  }

  static async getMessages(
    conversationId: number,
    before?: number
  ): Promise<{ messages: ChatMessageItem[]; hasMore: boolean }> {
    let url = `${BACKEND_URL}api/v1/chat/conversations/${conversationId}/messages?limit=50`;
    if (before) url += `&before=${before}`;
    const response = await axiosInstance.get(url);
    const payload = response.data?.data;
    if (!payload || !Array.isArray(payload.messages)) {
      throw new Error("Message list response was malformed");
    }
    return payload;
  }

  static async getTotalUnread(): Promise<number> {
    try {
      const response = await axiosInstance.get(
        `${BACKEND_URL}api/v1/chat/unread-total`
      );
      return response.data.data?.count || 0;
    } catch (error) {
      // Badge count only — never worth breaking a screen for.
      console.error("Error fetching unread chat total:", error);
      return 0;
    }
  }

  static async getContacts(): Promise<ChatUser[]> {
    const response = await axiosInstance.get(
      `${BACKEND_URL}api/v1/chat/contacts`
    );
    return response.data?.data || [];
  }

  /**
   * Phase 0 #1 — REST send-message companion to the existing
   * Socket.io path. Used by ChatContext when the live socket is not
   * connected (mobile network, corporate firewall, etc.) so vendors
   * never see a "send" button that silently does nothing.
   *
   * Backend persists the message + broadcasts to receivers via
   * Socket.io. Sender sees their own message echoed back in the
   * returned `message` payload (canonical from the DB, replacing
   * any tempId placeholder the FE may have rendered optimistically).
   */
  static async sendMessage(
    conversationId: number,
    content: string,
    messageType: "text" | "image" | "file" = "text",
  ): Promise<ChatMessageItem | null> {
    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}api/v1/chat/conversations/${conversationId}/messages`,
        { content, messageType },
      );
      return response.data?.data?.message ?? null;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
}
