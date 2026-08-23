import type { ApiResponse, Branch, BranchFormData, PaginatedResponse } from '@/types';
import client from './client';

export const branchApi = {
  list: (params?: Record<string, unknown>) =>
    client.get<PaginatedResponse<Branch>>('/branches', { params }),

  get: (id: number) =>
    client.get<ApiResponse<Branch>>(`/branches/${id}`),

  create: (data: BranchFormData) =>
    client.post<ApiResponse<Branch>>('/branches', data),

  update: (id: number, data: Partial<BranchFormData>) =>
    client.put<ApiResponse<Branch>>(`/branches/${id}`, data),

  delete: (id: number) =>
    client.delete<ApiResponse<null>>(`/branches/${id}`),
};
