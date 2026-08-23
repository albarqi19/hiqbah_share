import type { ApiResponse, PaginatedResponse, Customer } from '@/types';
import client from './client';

export const customerApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Customer>>('/customers', { params }),
  get: (id: number) =>
    client.get<ApiResponse<Customer>>(`/customers/${id}`),
  create: (data: Record<string, unknown>) =>
    client.post<ApiResponse<Customer>>('/customers', data),
  update: (id: number, data: Record<string, unknown>) =>
    client.put<ApiResponse<Customer>>(`/customers/${id}`, data),
  delete: (id: number) =>
    client.delete<ApiResponse<null>>(`/customers/${id}`),
  syncBranches: () =>
    client.post<ApiResponse<null>>('/customers/sync-branches'),
};
