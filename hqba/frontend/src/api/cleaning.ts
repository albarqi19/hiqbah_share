import type { ApiResponse } from '@/types';
import client from './client';

export const cleaningApi = {
  listSchedules: (params?: Record<string, unknown>) =>
    client.get<ApiResponse<any[]>>('/cleaning/schedules', { params }),

  createSchedule: (data: Record<string, unknown>) =>
    client.post<ApiResponse<any>>('/cleaning/schedules', data),

  todayTasks: (params?: Record<string, unknown>) =>
    client.get<ApiResponse<any[]>>('/cleaning/tasks/today', { params }),

  startTask: (taskId: number) =>
    client.put<ApiResponse<any>>(`/cleaning/tasks/${taskId}/start`),

  completeTask: (taskId: number, data?: Record<string, unknown>) =>
    client.put<ApiResponse<any>>(`/cleaning/tasks/${taskId}/complete`, data),

  reviewTask: (taskId: number, data: { review_status: string }) =>
    client.put<ApiResponse<any>>(`/cleaning/tasks/${taskId}/review`, data),

  score: (params?: Record<string, unknown>) =>
    client.get<ApiResponse<any>>('/cleaning/score', { params }),
};
