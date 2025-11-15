import { apiClient } from './client';

export interface NotificationMeta {
  link?: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  meta?: NotificationMeta;
}

export async function fetchNotifications(limit = 20): Promise<{ items: NotificationItem[]; unread: number }> {
  const { data } = await apiClient.get('/api/notifications', { params: { limit } });
  return data;
}

export async function markNotificationRead(id: string): Promise<{ success: boolean; unread: number }> {
  const { data } = await apiClient.post(`/api/notifications/mark-read/${id}`);
  return data;
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; unread: number }> {
  const { data } = await apiClient.post(`/api/notifications/mark-all-read`);
  return data;
}

export async function deleteNotification(id: string): Promise<{ success: boolean; unread: number }> {
  const { data } = await apiClient.delete(`/api/notifications/${id}`);
  return data;
}


