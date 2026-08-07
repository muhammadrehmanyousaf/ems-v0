import axiosInstance from "../axiosConfig";
import { BACKEND_URL } from "../backend-url";

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * WWL-019 / WWL-390 / WWL-400 — every method here used to swallow its error and
 * answer with an empty list, a zero, or `false`. NotificationContext already
 * wraps each call in try/catch and reverts its optimistic update on failure —
 * that revert was unreachable, so a lost "mark read" stayed read on screen and
 * came back on the next load, forever, with nothing shown to the user.
 *
 * These now throw. The callers' existing error handling does the rest.
 */
export class NotificationAPI {
  static async getNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false
  ): Promise<NotificationListResponse> {
    const response = await axiosInstance.get(
      `${BACKEND_URL}api/v1/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`
    );
    const payload = response.data?.data;
    if (!payload || !Array.isArray(payload.notifications)) {
      throw new Error("Notification list response was malformed");
    }
    return payload;
  }

  static async getUnreadCount(): Promise<number> {
    const response = await axiosInstance.get(
      `${BACKEND_URL}api/v1/notifications/unread-count`
    );
    return response.data?.data?.count || 0;
  }

  static async markAsRead(notificationId: number): Promise<boolean> {
    await axiosInstance.patch(
      `${BACKEND_URL}api/v1/notifications/${notificationId}/read`
    );
    return true;
  }

  static async markAllAsRead(): Promise<boolean> {
    await axiosInstance.patch(`${BACKEND_URL}api/v1/notifications/read-all`);
    return true;
  }

  static async deleteNotification(notificationId: number): Promise<boolean> {
    await axiosInstance.delete(
      `${BACKEND_URL}api/v1/notifications/${notificationId}`
    );
    return true;
  }
}
