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

export class NotificationAPI {
  static async getNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false
  ): Promise<NotificationListResponse> {
    try {
      const response = await axiosInstance.get(
        `${BACKEND_URL}api/v1/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`
      );
      return response.data.data;
    } catch (error) {
      // notification fetch failed
      return { notifications: [], total: 0, page: 1, totalPages: 0, hasMore: false };
    }
  }

  static async getUnreadCount(): Promise<number> {
    try {
      const response = await axiosInstance.get(
        `${BACKEND_URL}api/v1/notifications/unread-count`
      );
      return response.data.data?.count || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }

  static async markAsRead(notificationId: number): Promise<boolean> {
    try {
      await axiosInstance.patch(
        `${BACKEND_URL}api/v1/notifications/${notificationId}/read`
      );
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  static async markAllAsRead(): Promise<boolean> {
    try {
      await axiosInstance.patch(
        `${BACKEND_URL}api/v1/notifications/read-all`
      );
      return true;
    } catch (error) {
      console.error("Error marking all as read:", error);
      return false;
    }
  }

  static async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      await axiosInstance.delete(
        `${BACKEND_URL}api/v1/notifications/${notificationId}`
      );
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }
}
