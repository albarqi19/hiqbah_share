import type { ApiResponse, PaginatedResponse, RoastBatch } from '@/types';
import client from './client';

export const roastingApi = {
  queue: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<RoastBatch>>('/roasting/queue', { params }),

  get: (id: number) =>
    client.get<ApiResponse<RoastBatch>>(`/roasting/batches/${id}`),

  create: (data: Record<string, unknown>) =>
    client.post<ApiResponse<RoastBatch>>('/roasting/batches', data),

  start: (id: number) =>
    client.put<ApiResponse<RoastBatch>>(`/roasting/batches/${id}/start`),

  complete: (id: number, data: Record<string, unknown>) =>
    client.put<ApiResponse<RoastBatch>>(`/roasting/batches/${id}/complete`, data),

  reorder: (batchIds: number[]) =>
    client.post<ApiResponse<null>>('/roasting/batches/reorder', { batch_ids: batchIds }),
};
