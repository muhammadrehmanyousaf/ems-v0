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
  messageType: ChatMessageType;
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
/** What a chat message can be. "video" plays inline; "file" is a download row. */
export type ChatMessageType = "text" | "image" | "video" | "file" | "system";

/**
 * Upload a chat attachment, then send it as a message.
 *
 * Two steps on purpose: an upload that fails leaves no half-message in the
 * thread, and a slow 50 MB clip does not hold the conversation open while it
 * transfers. The SERVER decides whether this is an image or a video from the
 * real mimetype — a client mislabelling a clip as an image would render a
 * broken <img> for everyone in the thread.
 */
export async function uploadChatAttachment(file: File): Promise<{
  attachmentUrl: string; attachmentName: string; messageType: ChatMessageType;
}> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await axiosInstance.post(`${BACKEND_URL}api/v1/chat/attachments`, fd);
  return data?.data;
}

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
  /**
   * WW-MEDIA — an attachment rides alongside the text.
   *
   * `content` becomes the caption and may be empty for a media message; the
   * server requires content OR an attachmentUrl, not both.
   */
  static async sendMessage(
    conversationId: number,
    content: string,
    messageType: ChatMessageType = "text",
    attachment?: { attachmentUrl: string; attachmentName?: string },
  ): Promise<ChatMessageItem | null> {
    try {
      const response = await axiosInstance.post(
        `${BACKEND_URL}api/v1/chat/conversations/${conversationId}/messages`,
        { content, messageType, ...(attachment || {}) },
      );
      return response.data?.data?.message ?? null;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
}
