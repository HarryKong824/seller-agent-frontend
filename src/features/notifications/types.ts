/** Notification-related TypeScript types matching backend API responses (线A·P3-3). */

export interface Notification {
  id: number;
  recipientId: number;
  type: string;
  title: string;
  body: string;
  refType: string | null;
  refId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

export type NotificationTab = 'all' | 'unread' | 'read';
