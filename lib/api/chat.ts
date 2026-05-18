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

export class ChatAPI {
  static async getConversations(): Promise<ConversationItem[]> {
    try {
      const response = await axiosInstance.get(
        `${BACKEND_URL}api/v1/chat/conversations`
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }

  static async createOrGetConversation(
    otherUserId: number,
    bookingId?: number
  ): Promise<ConversationItem | null> {
    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}api/v1/chat/conversations`,
        { otherUserId, bookingId }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  }

  static async getMessages(
    conversationId: number,
    before?: number
  ): Promise<{ messages: ChatMessageItem[]; hasMore: boolean }> {
    try {
      let url = `${BACKEND_URL}api/v1/chat/conversations/${conversationId}/messages?limit=50`;
      if (before) url += `&before=${before}`;
      const response = await axiosInstance.get(url);
      return response.data.data || { messages: [], hasMore: false };
    } catch (error) {
      console.error("Error fetching messages:", error);
      return { messages: [], hasMore: false };
    }
  }

  static async getTotalUnread(): Promise<number> {
    try {
      const response = await axiosInstance.get(
        `${BACKEND_URL}api/v1/chat/unread-total`
      );
      return response.data.data?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  static async getContacts(): Promise<ChatUser[]> {
    try {
      const response = await axiosInstance.get(
        `${BACKEND_URL}api/v1/chat/contacts`
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching contacts:", error);
      return [];
    }
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
