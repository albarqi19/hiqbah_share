import type { ApiResponse } from '@/types';
import client from './client';

export const auditApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<ApiResponse<any[]>>('/audits', { params }),

  get: (id: number) =>
    client.get<ApiResponse<any>>(`/audits/${id}`),

  create: (data: { branch_id: number; audit_type: string }) =>
    client.post<ApiResponse<any>>('/audits', data),

  countItem: (auditId: number, itemId: number, data: { actual_quantity: number; notes?: string }) =>
    client.put<ApiResponse<any>>(`/audits/${auditId}/items/${itemId}`, data),

  approve: (auditId: number) =>
    client.put<ApiResponse<any>>(`/audits/${auditId}/approve`),

  close: (auditId: number) =>
    client.put<ApiResponse<any>>(`/audits/${auditId}/close`),
};
