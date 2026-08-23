import type { ApiResponse } from '@/types';
import client from './client';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  title_ar: string;
  body: string | null;
  body_ar: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export const notificationApi = {
  list: () =>
    client.get<ApiResponse<{ notifications: AppNotification[]; unread_count: number }>>('/notifications'),

  markRead: (id: number) =>
    client.patch<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllRead: () =>
    client.post<ApiResponse<null>>('/notifications/mark-all-read'),
};
