import type { ApiResponse, PaginatedResponse } from '@/types';
import client from './client';

export const qualityApi = {
  warnings: () =>
    client.get<ApiResponse<any[]>>('/quality/warnings'),

  qualityDashboard: () =>
    client.get<ApiResponse<any>>('/dashboard/quality'),

  // Market Feedback
  feedback: {
    list: (params?: Record<string, unknown>) =>
      client.get<PaginatedResponse<any>>('/market-feedback', { params }),
    create: (data: Record<string, unknown>) =>
      client.post<ApiResponse<any>>('/market-feedback', data),
    summary: () =>
      client.get<ApiResponse<any>>('/market-feedback/summary'),
  },

  // Complaints
  complaints: {
    correctiveAction: (id: number, data: { corrective_action: string }) =>
      client.put<ApiResponse<any>>(`/complaints/${id}/corrective-action`, data),
  },
};
